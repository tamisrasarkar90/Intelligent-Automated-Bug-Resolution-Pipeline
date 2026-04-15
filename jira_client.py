"""
JIRA Client — Fetches bugs and test case details from Jira Cloud for CSFMD project.

Environment variables required:
  JIRA_API_TOKEN  – Jira Cloud API token (from id.atlassian.com)
"""

import os
import sys
import json
import re
from typing import Optional


import requests
from requests.auth import HTTPBasicAuth

JIRA_BASE_URL = "https://hyland.atlassian.net"
PROJECT_KEY = "CSFMD"
EMAIL = "tamisra.sarkar@hyland.com"
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")

_session: Optional[requests.Session] = None


def _get_session() -> requests.Session:
    global _session
    if _session is not None:
        return _session
    if not JIRA_API_TOKEN:
        print("ERROR: Set JIRA_API_TOKEN environment variable.")
        sys.exit(1)
    _session = requests.Session()
    _session.auth = HTTPBasicAuth(EMAIL, JIRA_API_TOKEN)
    _session.headers.update({"Accept": "application/json"})
    r = _session.get(f"{JIRA_BASE_URL}/rest/api/3/myself")
    if r.status_code != 200:
        print(f"ERROR: Auth failed ({r.status_code}). Check email/token.")
        sys.exit(1)
    print(f"  Authenticated as {r.json().get('displayName')}")
    return _session


# ── ADF (Atlassian Document Format) → plain text ───────────────────────────
def _adf_to_text(node) -> str:
    """Recursively extract plain text from an ADF node."""
    if node is None:
        return ""
    if isinstance(node, str):
        return node.strip()
    if isinstance(node, dict):
        ntype = node.get("type", "")
        if ntype == "text":
            return node.get("text", "")
        if ntype == "hardBreak":
            return "\n"
        if ntype == "mention":
            return node.get("attrs", {}).get("text", "")
        parts = []
        for child in node.get("content", []):
            parts.append(_adf_to_text(child))
        sep = "\n" if ntype in ("paragraph", "bulletList", "orderedList",
                                 "listItem", "heading", "tableRow") else ""
        return sep.join(parts)
    if isinstance(node, list):
        return "\n".join(_adf_to_text(item) for item in node)
    return str(node)


# ── Fetch single issue ─────────────────────────────────────────────────────
def fetch_issue(issue_key: str) -> dict:
    """Fetch full issue fields from Jira REST API."""
    s = _get_session()
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}"
    r = s.get(url, params={"expand": "names"})
    r.raise_for_status()
    return r.json()


def fetch_xray_test_steps(issue_key: str) -> list:
    """Fetch Xray test steps via Xray Cloud REST API (GraphQL endpoint).
    Falls back to the legacy REST endpoint if GraphQL is unavailable."""
    s = _get_session()

    # Try Xray REST v2 endpoint first (most common for Server/DC)
    url = f"{JIRA_BASE_URL}/rest/raven/2.0/api/test/{issue_key}/step"
    r = s.get(url)
    if r.status_code == 200:
        steps_raw = r.json()
        steps = []
        for step in steps_raw:
            steps.append({
                "index": step.get("index", step.get("rank", 0)),
                "action": _adf_to_text(step.get("action", step.get("step", ""))),
                "data": _adf_to_text(step.get("data", "")),
                "expected_result": _adf_to_text(step.get("result", step.get("expectedResult", ""))),
            })
        return steps

    # Try Xray REST v1 endpoint
    url_v1 = f"{JIRA_BASE_URL}/rest/raven/1.0/api/test/{issue_key}/step"
    r = s.get(url_v1)
    if r.status_code == 200:
        steps_raw = r.json()
        steps = []
        for step in steps_raw:
            steps.append({
                "index": step.get("index", step.get("rank", 0)),
                "action": _adf_to_text(step.get("action", step.get("step", ""))),
                "data": _adf_to_text(step.get("data", "")),
                "expected_result": _adf_to_text(step.get("result", step.get("expectedResult", ""))),
            })
        return steps

    # Fallback: try extracting steps from description or custom field
    print(f"  ⚠ Xray step endpoints unavailable for {issue_key} (status {r.status_code}). "
          f"Extracting from issue fields.")
    return []


def parse_test_case(issue_key: str) -> dict:
    """Parse a Jira issue into a structured test case dict."""
    print(f"\n  Fetching {issue_key}...")
    raw = fetch_issue(issue_key)
    fields = raw.get("fields", {})

    summary = fields.get("summary", issue_key)
    description = _adf_to_text(fields.get("description"))
    components = [c.get("name", "") for c in fields.get("components", [])]
    labels = fields.get("labels", [])
    priority = (fields.get("priority") or {}).get("name", "")

    # Fetch Xray test steps
    steps = fetch_xray_test_steps(issue_key)

    # If no Xray steps, try parsing structured steps from description
    if not steps and description:
        steps = _parse_steps_from_description(description)

    return {
        "key": issue_key,
        "summary": summary,
        "description": description,
        "components": components,
        "labels": labels,
        "priority": priority,
        "test_steps": steps,
    }


def _parse_steps_from_description(desc: str) -> list:
    """Best-effort parse of test steps from free-text description."""
    steps = []
    # Pattern: "Step N:" or "N." or "N)" at start of line
    pattern = re.compile(
        r"(?:^|\n)\s*(?:step\s*)?(\d+)[.):]\s*(.*?)(?=\n\s*(?:step\s*)?\d+[.):]\s|\Z)",
        re.IGNORECASE | re.DOTALL,
    )
    for m in pattern.finditer(desc):
        text = m.group(2).strip()
        # Try to split "action" and "expected" at common delimiters
        expected = ""
        for delim in ["expected result:", "expected:", "verify:", "validate:", "then "]:
            idx = text.lower().find(delim)
            if idx != -1:
                expected = text[idx + len(delim):].strip()
                text = text[:idx].strip()
                break
        steps.append({
            "index": int(m.group(1)),
            "action": text,
            "data": "",
            "expected_result": expected,
        })
    return steps


def fetch_multiple(jira_ids: list[str]) -> list[dict]:
    """Fetch and parse multiple JIRA IDs."""
    results = []
    for jid in jira_ids:
        jid = jid.strip().upper()
        if not jid:
            continue
        # Prepend project key if not present
        if not re.match(r"^[A-Z]+-\d+$", jid):
            jid = f"{PROJECT_KEY}-{jid}"
        try:
            tc = parse_test_case(jid)
            results.append(tc)
            print(f"  ✓ {jid}: {tc['summary']}")
            if tc["test_steps"]:
                print(f"    → {len(tc['test_steps'])} test steps found")
            else:
                print(f"    → No structured test steps (will use description)")
        except Exception as e:
            print(f"  ✗ {jid}: {e}")
    return results


# ── Priority ordering ───────────────────────────────────────────────────────
PRIORITY_ORDER = {
    "highest": 0, "high": 1, "medium": 2, "low": 3, "lowest": 4,
    "requires review": 2, "none": 5,
}


def priority_sort_key(bug: dict) -> int:
    """Return sort key for priority ordering (lower = higher priority)."""
    return PRIORITY_ORDER.get(bug.get("priority", "none").lower(), 5)


# ── Fetch NEW bugs via JQL ─────────────────────────────────────────────────
def fetch_new_bugs(status: str = "New") -> list[dict]:
    """Fetch all bugs in CSFMD project with given status using JQL search.
    Uses /rest/api/3/search/jql (new endpoint, replaces deprecated /search).
    Returns list of bug dicts sorted by priority (high → low).
    """
    s = _get_session()
    jql = (
        f'project = {PROJECT_KEY} AND issuetype = Bug '
        f'AND status = "{status}" ORDER BY priority ASC, created DESC'
    )
    url = f"{JIRA_BASE_URL}/rest/api/3/search/jql"
    fields = "summary,status,priority,created,assignee,reporter,components,labels,description"

    all_issues = []
    start = 0
    while True:
        r = s.get(url, params={
            "jql": jql, "startAt": start, "maxResults": 100, "fields": fields,
        })
        if r.status_code != 200:
            print(f"  ERROR fetching bugs: {r.status_code} - {r.text[:300]}")
            break
        data = r.json()
        issues = data.get("issues", [])
        all_issues.extend(issues)
        total = data.get("total", 0)
        print(f"  Fetched {len(all_issues)}/{total} bugs...")
        if len(all_issues) >= total or not issues:
            break
        start += len(issues)

    bugs = []
    for issue in all_issues:
        f = issue["fields"]
        bugs.append({
            "key": issue["key"],
            "summary": f.get("summary", ""),
            "status": (f.get("status") or {}).get("name", "Unknown"),
            "priority": (f.get("priority") or {}).get("name", "None"),
            "created": f.get("created", "")[:10],
            "assignee": (f.get("assignee") or {}).get("displayName", "Unassigned"),
            "reporter": (f.get("reporter") or {}).get("displayName", "Unknown"),
            "components": ", ".join(c.get("name", "") for c in f.get("components", [])),
            "labels": ", ".join(f.get("labels", [])),
            "description": _adf_to_text(f.get("description")),
        })

    bugs.sort(key=priority_sort_key)
    return bugs


def deduplicate_bugs(new_bugs: list[dict], existing_analysis: dict) -> list[dict]:
    """Remove bugs already tracked in bug_analysis.json."""
    existing_keys = set(existing_analysis.keys())
    fresh = [b for b in new_bugs if b["key"] not in existing_keys]
    skipped = len(new_bugs) - len(fresh)
    if skipped:
        print(f"  Skipped {skipped} already-tracked bug(s)")
    return fresh


def transition_issue(issue_key: str, target_status: str) -> bool:
    """Transition a JIRA issue to a new status.
    Finds the transition ID matching target_status, then executes it.
    Returns True on success.
    """
    s = _get_session()
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}/transitions"
    r = s.get(url)
    if r.status_code != 200:
        print(f"  ⚠ Cannot get transitions for {issue_key}: {r.status_code}")
        return False

    transitions = r.json().get("transitions", [])
    target = target_status.lower()
    tid = None
    for t in transitions:
        if t["name"].lower() == target or t["to"]["name"].lower() == target:
            tid = t["id"]
            break

    if tid is None:
        available = [t["name"] for t in transitions]
        print(f"  ⚠ No transition to '{target_status}' for {issue_key}. Available: {available}")
        return False

    r = s.post(url, json={"transition": {"id": tid}})
    if r.status_code in (200, 204):
        print(f"  ✓ {issue_key} transitioned to '{target_status}'")
        return True
    print(f"  ⚠ Transition failed for {issue_key}: {r.status_code}")
    return False


def add_comment(issue_key: str, comment_text: str) -> bool:
    """Add a comment to a JIRA issue using ADF format."""
    s = _get_session()
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}/comment"
    body = {
        "body": {
            "version": 1,
            "type": "doc",
            "content": [{
                "type": "paragraph",
                "content": [{"type": "text", "text": comment_text}],
            }],
        }
    }
    r = s.post(url, json=body)
    if r.status_code in (200, 201):
        print(f"  ✓ Comment added to {issue_key}")
        return True
    print(f"  ⚠ Failed to add comment to {issue_key}: {r.status_code}")
    return False


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser(description="Fetch JIRA test cases")
    p.add_argument("ids", nargs="+", help="JIRA IDs (e.g. CSFMD-10227 or 10227)")
    args = p.parse_args()

    cases = fetch_multiple(args.ids)
    print(json.dumps(cases, indent=2, ensure_ascii=False))
