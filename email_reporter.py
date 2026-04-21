"""
Email Reporter — Sends bug analysis summary to stakeholders via Outlook.

Uses the local Outlook desktop app (COM automation) — no passwords or
SMTP configuration needed. Outlook must be installed and signed in.

Usage:
  python email_reporter.py                     # Send report now
  python email_reporter.py --dry-run           # Preview without sending
  python email_reporter.py --to extra@co.com   # Add extra recipients
"""


import argparse
import json
import os
import tempfile
from collections import Counter
from datetime import datetime
from pathlib import Path

ANALYSIS_FILE = Path("generated_tests/bug_analysis.json")
BUGS_FILE = Path("generated_tests/bugs.json")

TO_LIST = ["Subhankar.Mukherjee@hyland.com"]
CC_LIST = ["tamisra.sarkar@hyland.com"]


def _load_analysis() -> dict:
    analysis = {}
    if ANALYSIS_FILE.exists():
        analysis = json.loads(ANALYSIS_FILE.read_text(encoding="utf-8"))
    # Enrich with summary/priority from bugs.json if missing
    if BUGS_FILE.exists():
        bugs = json.loads(BUGS_FILE.read_text(encoding="utf-8"))
        bug_map = {b["key"]: b for b in bugs}
        for key, rec in analysis.items():
            bug = bug_map.get(key, {})
            if not rec.get("summary") and bug.get("summary"):
                rec["summary"] = bug["summary"]
            if not rec.get("priority") and bug.get("priority"):
                rec["priority"] = bug["priority"]
    return analysis


def _build_summary(analysis: dict) -> dict:
    """Build statistics from the analysis data."""
    statuses = Counter(v.get("status", "UNKNOWN") for v in analysis.values())
    codebases = Counter(v.get("codebase", "Unknown") for v in analysis.values())
    priorities = Counter(v.get("priority", "None") for v in analysis.values())

    fix_pending = [k for k, v in analysis.items() if v.get("status") == "FIX_PENDING"]
    flagged = [k for k, v in analysis.items() if v.get("status") == "FLAGGED_INVALID"]
    pr_created = [k for k, v in analysis.items() if v.get("status") == "PR_CREATED"]
    in_dev = [k for k, v in analysis.items() if v.get("status") == "IN_DEVELOPMENT"]
    needs_review = [k for k, v in analysis.items() if v.get("status") == "NEEDS_MANUAL_REVIEW"]

    return {
        "total": len(analysis),
        "statuses": dict(statuses),
        "codebases": dict(codebases),
        "priorities": dict(priorities),
        "fix_pending": fix_pending,
        "flagged": flagged,
        "pr_created": pr_created,
        "in_development": in_dev,
        "needs_review": needs_review,
    }


def _status_color(status: str) -> str:
    colors = {
        "FIX_PENDING": "#28a745",
        "FIX CREATED": "#28a745",
        "PR_CREATED": "#0969da",
        "IN_DEVELOPMENT": "#0550ae",
        "FLAGGED_INVALID": "#cf222e",
        "NEEDS_MANUAL_REVIEW": "#bf8700",
    }
    return colors.get(status, "#57606a")


def _status_bg_color(status: str) -> str:
    colors = {
        "FIX_PENDING": "#dafbe1",
        "FIX CREATED": "#dafbe1",
        "PR_CREATED": "#ddf4ff",
        "IN_DEVELOPMENT": "#ddf4ff",
        "FLAGGED_INVALID": "#ffebe9",
        "NEEDS_MANUAL_REVIEW": "#fff8c5",
    }
    return colors.get(status, "#f6f8fa")


def _compute_confidence(rec: dict) -> int:
    """Compute a confidence score (0-100) for the proposed fix/root cause."""
    score = 0
    status = rec.get("status", "")
    root_cause = rec.get("root_cause", "")
    affected_files = rec.get("affected_files", [])
    fix_files = rec.get("fix_files", [])
    fix_desc = rec.get("fix_description", "")
    fixable = rec.get("fixable", False)

    # Root cause identified with detail
    if root_cause:
        score += 20
        if len(root_cause) > 80:
            score += 10  # Detailed root cause

    # Affected files in the analyzed TFS codebase (not "Unity Client" etc.)
    real_files = [f for f in affected_files if f.startswith("$/")]
    if real_files:
        score += 20
    elif affected_files:
        score += 5  # At least identified a codebase

    # Fix available
    if fix_files:
        score += 25
    elif fix_desc and fixable:
        score += 15
    elif fix_desc:
        score += 5

    # Status signals
    if status in ("FIX CREATED", "FIX_PENDING", "PR_CREATED", "IN_DEVELOPMENT"):
        score += 20
    elif "VALID BUG" in status:
        score += 10
    elif "ROOT CAUSE IDENTIFIED" in status:
        score += 15

    # Valid bug flag
    if rec.get("valid"):
        score += 5

    return min(score, 100)


def _confidence_label(score: int) -> tuple[str, str, str]:
    """Return (label, text_color, bg_color) for a confidence score."""
    if score >= 80:
        return "High", "#1a7f37", "#dafbe1"
    elif score >= 50:
        return "Medium", "#9a6700", "#fff8c5"
    else:
        return "Low", "#cf222e", "#ffebe9"


def _categorize_priority(rec: dict) -> tuple[str, str, str]:
    """Derive a High/Medium/Low category from severity/priority fields.
    Returns (category, text_color, bg_color)."""
    sev = (rec.get("severity", "") + " " + rec.get("priority", "")).lower()
    if any(k in sev for k in ["highest", "critical"]):
        return "Critical", "#fff", "#cf222e"
    if "high" in sev:
        return "High", "#fff", "#cf222e"
    if "medium" in sev:
        return "Medium", "#24292f", "#fff8c5"
    if any(k in sev for k in ["low", "lowest"]):
        return "Low", "#24292f", "#ddf4ff"
    if "requires review" in sev:
        return "Medium", "#24292f", "#fff8c5"
    return "Medium", "#24292f", "#f6f8fa"


def _build_html(analysis: dict, summary: dict) -> str:
    """Build an HTML email body with summary and bug table."""
    now = datetime.now().strftime("%B %d, %Y")

    # Reviewers — stakeholders from TO_LIST
    reviewers = ", ".join(TO_LIST)

    # ── Status Overview Cards ───────────────────────────────────────
    status_cards = ""
    status_configs = [
        ("FIX_PENDING", "Fix Pending", "#1a7f37", "#dafbe1", "#28a745"),
        ("FIX CREATED", "Fix Created", "#1a7f37", "#dafbe1", "#28a745"),
        ("PR_CREATED", "PR Created", "#0550ae", "#ddf4ff", "#0969da"),
        ("IN_DEVELOPMENT", "In Development", "#0550ae", "#ddf4ff", "#0969da"),
        ("NEEDS_MANUAL_REVIEW", "Needs Review", "#9a6700", "#fff8c5", "#bf8700"),
        ("FLAGGED_INVALID", "Flagged Invalid", "#cf222e", "#ffebe9", "#cf222e"),
    ]
    for status_key, label, text_color, bg_color, border_color in status_configs:
        count = summary["statuses"].get(status_key, 0)
        if count == 0:
            # Also check for statuses containing the key
            count = sum(v for k, v in summary["statuses"].items() if status_key in k)
        if count > 0:
            status_cards += (
                f'<td style="padding:0 6px;">'
                f'<div style="background:{bg_color};border-left:4px solid {border_color};'
                f'padding:10px 16px;border-radius:6px;min-width:120px;text-align:center;">'
                f'<div style="font-size:24px;font-weight:bold;color:{text_color};">{count}</div>'
                f'<div style="font-size:12px;color:{text_color};margin-top:2px;">{label}</div>'
                f'</div></td>'
            )

    # Also add a card for "Other" statuses
    known_keys = {cfg[0] for cfg in status_configs}
    other_count = sum(v for k, v in summary["statuses"].items()
                      if k not in known_keys and not any(kk in k for kk in known_keys))
    if other_count > 0:
        status_cards += (
            f'<td style="padding:0 6px;">'
            f'<div style="background:#f6f8fa;border-left:4px solid #57606a;'
            f'padding:10px 16px;border-radius:6px;min-width:120px;text-align:center;">'
            f'<div style="font-size:24px;font-weight:bold;color:#24292f;">{other_count}</div>'
            f'<div style="font-size:12px;color:#57606a;margin-top:2px;">Other</div>'
            f'</div></td>'
        )

    # ── Codebase Summary ────────────────────────────────────────────
    codebase_rows = ""
    for cb, cnt in sorted(summary.get("codebases", {}).items()):
        codebase_rows += (
            f'<tr>'
            f'<td style="padding:6px 14px;border-bottom:1px solid #d0d7de;font-size:14px;color:#24292f;">{cb}</td>'
            f'<td style="padding:6px 14px;border-bottom:1px solid #d0d7de;font-size:14px;'
            f'font-weight:bold;color:#0550ae;text-align:center;">{cnt}</td>'
            f'</tr>'
        )

    # ── Bug Detail Rows ─────────────────────────────────────────────
    bug_rows = ""
    row_idx = 0
    for key in sorted(analysis.keys()):
        rec = analysis[key]
        status = rec.get("status", "UNKNOWN")
        s_color = _status_color(status)
        s_bg = _status_bg_color(status)

        confidence = _compute_confidence(rec)
        conf_label, conf_color, conf_bg = _confidence_label(confidence)

        cat_label, cat_color, cat_bg = _categorize_priority(rec)

        root_cause = rec.get("root_cause", "N/A")
        bug_summary = rec.get("summary", "")
        pr_url = rec.get("pr_url", "")

        pr_cell = ""
        if pr_url:
            pr_cell = f'<a href="{pr_url}" style="color:#0969da;text-decoration:none;font-weight:bold;">View PR</a>'
        elif rec.get("branch"):
            pr_cell = f'<span style="color:#57606a;font-size:11px;">Branch: {rec["branch"]}</span>'
        elif rec.get("fix_files"):
            pr_cell = (
                f'<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>'
                f'<td style="background:#dafbe1;color:#1a7f37;font-weight:bold;font-size:11px;'
                f'padding:3px 10px;border-radius:4px;text-align:center;">Local Fix Available</td>'
                f'</tr></table>'
            )
        else:
            pr_cell = '<span style="color:#8b949e;">—</span>'

        row_bg = "#ffffff" if row_idx % 2 == 0 else "#f6f8fa"
        row_idx += 1

        bug_rows += f"""<tr style="background:{row_bg};">
            <td style="padding:8px 12px;border-bottom:1px solid #d0d7de;">
                <a href="https://hyland.atlassian.net/browse/{key}" style="color:#0969da;font-weight:bold;text-decoration:none;">{key}</a></td>
            <td style="padding:8px 12px;border-bottom:1px solid #d0d7de;color:#24292f;max-width:320px;">{bug_summary}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #d0d7de;text-align:center;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
                <td style="background:{cat_bg};color:{cat_color};font-weight:bold;font-size:12px;padding:4px 12px;border-radius:4px;text-align:center;">{cat_label}</td>
                </tr></table></td>
            <td style="padding:8px 12px;border-bottom:1px solid #d0d7de;color:#57606a;">{rec.get('codebase','')}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #d0d7de;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="background:{s_bg};color:{s_color};font-weight:bold;font-size:12px;padding:4px 10px;border-radius:4px;white-space:nowrap;">{status}</td>
                </tr></table></td>
            <td style="padding:10px 14px;border-bottom:1px solid #d0d7de;background:#e8f0fe;color:#1a1a2e;font-size:13px;min-width:350px;max-width:500px;line-height:1.6;border-left:3px solid #0969da;">{root_cause}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #d0d7de;text-align:center;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
                <td style="background:{conf_bg};color:{conf_color};font-weight:bold;font-size:14px;padding:6px 14px;border-radius:4px;text-align:center;white-space:nowrap;">{confidence}%<br/><span style="font-size:11px;font-weight:normal;">{conf_label}</span></td>
                </tr></table></td>
            <td style="padding:8px 12px;border-bottom:1px solid #d0d7de;text-align:center;">{pr_cell}</td>
        </tr>"""

    html = f"""
    <html><body style="font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#24292f;background:#f6f8fa;margin:0;padding:0;">
    <div style="max-width:1200px;margin:0 auto;background:#ffffff;border:1px solid #d0d7de;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0052cc 0%,#0969da 100%);padding:24px 32px;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">CSFMD Bug Analysis Report</h1>
            <p style="color:#cce5ff;margin:6px 0 0 0;font-size:14px;">
                Generated: <b style="color:#fff;">{now}</b> &nbsp;&bull;&nbsp;
                Total bugs tracked: <b style="color:#fff;">{summary['total']}</b>
            </p>
        </div>

        <div style="padding:24px 32px;">

            <!-- Status Overview -->
            <h2 style="color:#24292f;font-size:16px;margin:0 0 12px 0;border-bottom:2px solid #0969da;padding-bottom:6px;">
                Status Overview</h2>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>{status_cards}</tr>
            </table>

            <!-- By Codebase -->
            <h2 style="color:#24292f;font-size:16px;margin:0 0 12px 0;border-bottom:2px solid #0969da;padding-bottom:6px;">
                By Codebase</h2>
            <table style="border-collapse:collapse;margin-bottom:24px;min-width:300px;">
            <tr style="background:#0969da;">
                <th style="padding:8px 14px;text-align:left;color:#fff;font-size:13px;font-weight:600;">Codebase</th>
                <th style="padding:8px 14px;text-align:center;color:#fff;font-size:13px;font-weight:600;">Count</th>
            </tr>
            {codebase_rows}
            </table>

            <!-- Bug Details -->
            <h2 style="color:#24292f;font-size:16px;margin:0 0 12px 0;border-bottom:2px solid #0969da;padding-bottom:6px;">
                Bug Details</h2>
            <table style="border-collapse:collapse;width:100%;font-size:13px;border:1px solid #d0d7de;">
            <tr style="background:#0969da;">
                <th style="padding:10px 12px;text-align:left;color:#fff;font-weight:600;">Key</th>
                <th style="padding:10px 12px;text-align:left;color:#fff;font-weight:600;min-width:200px;">Summary</th>
                <th style="padding:10px 12px;text-align:center;color:#fff;font-weight:600;">Category</th>
                <th style="padding:10px 12px;text-align:left;color:#fff;font-weight:600;">Codebase</th>
                <th style="padding:10px 12px;text-align:left;color:#fff;font-weight:600;">Status</th>
                <th style="padding:10px 12px;text-align:left;color:#fff;font-weight:600;min-width:350px;">Root Cause</th>
                <th style="padding:10px 12px;text-align:center;color:#fff;font-weight:600;">Confidence</th>
                <th style="padding:10px 12px;text-align:center;color:#fff;font-weight:600;">PR Link</th>
            </tr>
            {bug_rows}
            </table>

        </div>

        <!-- Footer -->
        <div style="background:#f6f8fa;border-top:1px solid #d0d7de;padding:16px 32px;">
            <p style="font-size:12px;color:#57606a;margin:0;">
                This is an automated report from the <b>CSFMD Bug Pipeline</b>.<br>
                Reply to this email for questions or feedback.
            </p>
        </div>
    </div>
    </body></html>
    """
    return html


def send_report(
    to: list[str] | None = None,
    cc: list[str] | None = None,
    dry_run: bool = False,
) -> bool:
    """Compose and send the bug analysis report via Outlook COM.

    Returns True if sent successfully (or dry-run preview printed).
    """
    to = to or TO_LIST
    cc = cc or CC_LIST
    analysis = _load_analysis()

    if not analysis:
        print("No bug analysis data to report.")
        return False

    summary = _build_summary(analysis)
    html_body = _build_html(analysis, summary)
    now = datetime.now().strftime("%Y-%m-%d")
    subject = f"CSFMD Bug Analysis Report — {now} ({summary['total']} bugs)"

    # Prepare JSON attachment as temp file
    json_content = json.dumps(analysis, indent=2, ensure_ascii=False)
    json_bytes = json_content.encode("utf-8")

    if dry_run:
        print(f"[DRY RUN] Email preview:")
        print(f"  To:      {'; '.join(to)}")
        print(f"  CC:      {'; '.join(cc)}")
        print(f"  Subject: {subject}")
        print(f"  Bugs:    {summary['total']}")
        print(f"  Statuses: {summary['statuses']}")
        print(f"  Attachment: bug_analysis_{now}.json ({len(json_bytes)} bytes)")

        # Save HTML preview
        preview_path = Path("generated_tests") / f"email_preview_{now}.html"
        preview_path.write_text(html_body, encoding="utf-8")
        print(f"  Preview saved: {preview_path}")
        return True

    try:
        import win32com.client

        print("Connecting to Outlook...")
        outlook = win32com.client.Dispatch("Outlook.Application")
        mail = outlook.CreateItem(0)  # 0 = olMailItem

        mail.To = "; ".join(to)
        mail.CC = "; ".join(cc)
        mail.Subject = subject
        mail.HTMLBody = html_body

        # Save JSON to a temp file and attach it
        tmp_dir = tempfile.mkdtemp()
        attachment_path = os.path.join(tmp_dir, f"bug_analysis_{now}.json")
        with open(attachment_path, "w", encoding="utf-8") as f:
            f.write(json_content)
        mail.Attachments.Add(attachment_path)

        mail.Send()
        print(f"  ✓ Report sent via Outlook")
        print(f"    To: {'; '.join(to)}")
        print(f"    CC: {'; '.join(cc)}")
        print(f"    Subject: {subject}")

        # Clean up temp file
        try:
            os.remove(attachment_path)
            os.rmdir(tmp_dir)
        except OSError:
            pass

        return True
    except ImportError:
        print("  ✗ pywin32 not installed. Run: pip install pywin32")
        return False
    except Exception as e:
        print(f"  ✗ Failed to send email via Outlook: {e}")
        print("  Make sure Outlook is running and signed in.")
        return False


def main():
    p = argparse.ArgumentParser(description="Send CSFMD Bug Analysis Report")
    p.add_argument("--dry-run", action="store_true", help="Preview email without sending")
    p.add_argument("--to", nargs="+", help="Additional To recipients")
    p.add_argument("--cc", nargs="+", help="Additional CC recipients")
    args = p.parse_args()

    to = TO_LIST + (args.to or [])
    cc = CC_LIST + (args.cc or [])
    send_report(to=to, cc=cc, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
