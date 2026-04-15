"""
CSFMD Bug Pipeline — Automated orchestrator that:

  1. Fetches NEW bugs from JIRA (CSFMD project)
  2. Deduplicates against existing bug_analysis.json
  3. Prioritizes (High → Medium → Low)
  4. Analyzes each against TFS source code
  5. Fixes valid/fixable bugs, flags invalid ones
  6. Pushes fixes and raises PRs
  7. Updates JIRA status (In Development / Code Review)

  
Usage:
  python pipeline.py                    # Full pipeline run
  python pipeline.py --dry-run          # Analyze only, no push/status changes
  python pipeline.py --status "New"     # Fetch bugs with a specific status
  python pipeline.py --limit 10         # Process at most N bugs
  python pipeline.py --bug CSFMD-10288  # Process a single bug

Environment variables:
  JIRA_API_TOKEN  – Required for JIRA access
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from jira_client import (
    fetch_new_bugs,
    deduplicate_bugs,
    transition_issue,
    add_comment,
    priority_sort_key,
)
from bug_analyzer import (
    load_analysis,
    save_analysis,
    analyze_bug,
)
from github_push import push_bug_fixes, create_pull_request

BUGS_FILE = Path("generated_tests/bugs.json")
ANALYSIS_FILE = Path("generated_tests/bug_analysis.json")
FIXES_DIR = Path("fixes")
LOG_FILE = Path("generated_tests/pipeline_log.json")


def _save_bugs(bugs: list[dict]):
    """Save fetched bugs list to disk."""
    BUGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    BUGS_FILE.write_text(json.dumps(bugs, indent=2, ensure_ascii=False), encoding="utf-8")


def _load_log() -> list[dict]:
    """Load pipeline run log."""
    if LOG_FILE.exists():
        return json.loads(LOG_FILE.read_text(encoding="utf-8"))
    return []


def _save_log(log: list[dict]):
    """Append to pipeline run log."""
    LOG_FILE.write_text(json.dumps(log, indent=2, ensure_ascii=False), encoding="utf-8")


def run_pipeline(
    status: str = "New",
    limit: int = 0,
    dry_run: bool = False,
    single_bug: str = "",
):
    """Execute the full bug pipeline.

    Args:
        status: JIRA status to filter bugs (default: "New")
        limit: Max bugs to process (0 = unlimited)
        dry_run: If True, analyze only — no push or JIRA updates
        single_bug: If set, process only this specific bug key
    """

    run_record = {
        "timestamp": datetime.now().isoformat(),
        "status_filter": status,
        "dry_run": dry_run,
        "bugs_fetched": 0,
        "bugs_new": 0,
        "bugs_analyzed": 0,
        "bugs_fixed": 0,
        "bugs_flagged": 0,
        "prs_created": [],
    }

    print("=" * 70)
    print("  CSFMD Bug Pipeline")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if dry_run:
        print("  MODE: DRY RUN (no push / no JIRA updates)")
    print("=" * 70)

    # ── Step 1: Fetch NEW bugs from JIRA ────────────────────────────────
    print(f"\n[1/6] Fetching bugs (status={status})...")
    if single_bug:
        from jira_client import fetch_issue, _adf_to_text
        raw = fetch_issue(single_bug)
        f = raw.get("fields", {})
        bugs = [{
            "key": single_bug,
            "summary": f.get("summary", ""),
            "status": (f.get("status") or {}).get("name", ""),
            "priority": (f.get("priority") or {}).get("name", "None"),
            "created": f.get("created", "")[:10],
            "assignee": (f.get("assignee") or {}).get("displayName", "Unassigned"),
            "reporter": (f.get("reporter") or {}).get("displayName", "Unknown"),
            "components": ", ".join(c.get("name", "") for c in f.get("components", [])),
            "labels": ", ".join(f.get("labels", [])),
            "description": _adf_to_text(f.get("description")),
        }]
    else:
        bugs = fetch_new_bugs(status=status)

    run_record["bugs_fetched"] = len(bugs)
    print(f"  Found {len(bugs)} bug(s)")

    if not bugs:
        print("  No bugs to process. Exiting.")
        return run_record

    _save_bugs(bugs)

    # ── Step 2: Deduplicate ─────────────────────────────────────────────
    print("\n[2/6] Deduplicating against existing analysis...")
    existing = load_analysis()
    fresh_bugs = deduplicate_bugs(bugs, existing)
    run_record["bugs_new"] = len(fresh_bugs)
    print(f"  {len(fresh_bugs)} new bug(s) to analyze")

    if not fresh_bugs:
        print("  All bugs already tracked. Exiting.")
        return run_record

    # ── Step 3: Prioritize ──────────────────────────────────────────────
    print("\n[3/6] Prioritizing (High → Medium → Low)...")
    fresh_bugs.sort(key=priority_sort_key)
    if limit > 0:
        fresh_bugs = fresh_bugs[:limit]
        print(f"  Limited to {limit} bug(s)")

    for b in fresh_bugs:
        print(f"  {b['priority']:>16} | {b['key']} | {b['summary'][:55]}")

    # ── Step 4: Analyze each bug ────────────────────────────────────────
    print("\n[4/6] Analyzing bugs against TFS source code...")
    analysis = dict(existing)
    fixed_bugs = []
    flagged_bugs = []

    for bug in fresh_bugs:
        key = bug["key"]
        result = analyze_bug(bug)
        analysis[key] = result
        run_record["bugs_analyzed"] += 1

        if result["status"] == "FLAGGED_INVALID":
            flagged_bugs.append(key)
            run_record["bugs_flagged"] += 1
            print(f"    ⚠ {key}: FLAGGED INVALID — {result['root_cause'][:60]}")

        elif result["status"] == "FIX_PENDING":
            fixed_bugs.append(key)
            run_record["bugs_fixed"] += 1
            print(f"    ✓ {key}: FIX AVAILABLE — {result['fix_description'][:60]}")

        else:
            print(f"    → {key}: {result['status']} — {result['root_cause'][:60]}")

    save_analysis(analysis)

    # ── Step 5: Push fixes and raise PRs ────────────────────────────────
    print("\n[5/6] Pushing fixes and raising PRs...")
    if dry_run:
        print("  SKIPPED (dry run)")
    else:
        for key in fixed_bugs:
            record = analysis[key]
            fix_dir = FIXES_DIR / key
            if not fix_dir.exists():
                fix_dir = FIXES_DIR  # Fall back to shared fixes dir

            fix_files = list(fix_dir.glob("*")) if fix_dir.exists() else []
            if not fix_files:
                # Check if there are fix files with the bug key prefix
                fix_files = list(FIXES_DIR.glob(f"{key}*"))

            if fix_files:
                try:
                    branch = push_bug_fixes(key, fix_files, record.get("fix_description", ""))
                    pr_url = create_pull_request(
                        branch,
                        f"fix({key}): {record.get('summary', '')[:60]}",
                        (
                            f"## Bug Fix: {key}\n\n"
                            f"**Summary:** {record.get('summary', '')}\n\n"
                            f"**Root Cause:** {record.get('root_cause', '')}\n\n"
                            f"**Fix:** {record.get('fix_description', '')}\n\n"
                            f"**Affected Files:**\n"
                            + "\n".join(f"- `{f}`" for f in record.get("affected_files", []))
                            + "\n\n*Generated by CSFMD Bug Agent*"
                        ),
                    )
                    record["status"] = "PR_CREATED"
                    record["pr_url"] = pr_url
                    record["branch"] = branch
                    run_record["prs_created"].append({"key": key, "pr_url": pr_url, "branch": branch})
                except Exception as e:
                    print(f"  ⚠ Push failed for {key}: {e}")
                    record["status"] = "FIX_PUSH_FAILED"
            else:
                print(f"  ⚠ No fix files found for {key}")

    # ── Step 6: Update JIRA status ──────────────────────────────────────
    print("\n[6/6] Updating JIRA statuses...")
    if dry_run:
        print("  SKIPPED (dry run)")
    else:
        for key in fixed_bugs:
            record = analysis[key]
            if record.get("status") == "PR_CREATED":
                transition_issue(key, "In Development")
                add_comment(key, (
                    f"[CSFMD Bug Agent] Fix pushed to branch: {record.get('branch', 'N/A')}\n"
                    f"PR: {record.get('pr_url', 'Pending')}\n"
                    f"Root cause: {record.get('root_cause', '')}"
                ))
                record["status"] = "IN_DEVELOPMENT"

        for key in flagged_bugs:
            add_comment(key, (
                f"[CSFMD Bug Agent] This bug has been flagged for review.\n"
                f"Reason: {analysis[key].get('root_cause', '')}\n"
                f"This may not be a valid application bug. Please review."
            ))

    save_analysis(analysis)

    # ── Summary ─────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  Pipeline Summary")
    print("=" * 70)
    print(f"  Bugs fetched:   {run_record['bugs_fetched']}")
    print(f"  New (untracked): {run_record['bugs_new']}")
    print(f"  Analyzed:        {run_record['bugs_analyzed']}")
    print(f"  Fixed (PR):      {run_record['bugs_fixed']}")
    print(f"  Flagged invalid: {run_record['bugs_flagged']}")
    if run_record["prs_created"]:
        print("  PRs created:")
        for pr in run_record["prs_created"]:
            print(f"    [{pr['key']}] {pr.get('pr_url', pr.get('branch', ''))}")
    print("=" * 70)

    # Log this run
    log = _load_log()
    log.append(run_record)
    _save_log(log)

    return run_record


def main():
    p = argparse.ArgumentParser(description="CSFMD Bug Pipeline")
    p.add_argument("--status", default="New", help="JIRA status filter (default: New)")
    p.add_argument("--limit", type=int, default=0, help="Max bugs to process (0=all)")
    p.add_argument("--dry-run", action="store_true", help="Analyze only, no push/status updates")
    p.add_argument("--bug", default="", help="Process a single bug key (e.g. CSFMD-10288)")
    args = p.parse_args()

    run_pipeline(
        status=args.status,
        limit=args.limit,
        dry_run=args.dry_run,
        single_bug=args.bug,
    )


if __name__ == "__main__":
    main()
