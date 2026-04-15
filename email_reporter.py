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

TO_LIST = ["Subhankar.Mukherjee@hyland.com"]
CC_LIST = ["tamisra.sarkar@hyland.com"]


def _load_analysis() -> dict:
    if ANALYSIS_FILE.exists():
        return json.loads(ANALYSIS_FILE.read_text(encoding="utf-8"))
    return {}


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
        "PR_CREATED": "#17a2b8",
        "IN_DEVELOPMENT": "#007bff",
        "FLAGGED_INVALID": "#dc3545",
        "NEEDS_MANUAL_REVIEW": "#ffc107",
    }
    return colors.get(status, "#6c757d")


def _build_html(analysis: dict, summary: dict) -> str:
    """Build an HTML email body with summary and bug table."""
    now = datetime.now().strftime("%B %d, %Y")

    # Status summary row
    status_pills = ""
    for status, count in sorted(summary["statuses"].items()):
        color = _status_color(status)
        status_pills += (
            f'<span style="display:inline-block;padding:4px 10px;margin:2px;'
            f'border-radius:12px;background:{color};color:#fff;font-size:13px;">'
            f'{status}: {count}</span> '
        )

    # Bug detail rows
    bug_rows = ""
    for key in sorted(analysis.keys()):
        rec = analysis[key]
        status = rec.get("status", "UNKNOWN")
        color = _status_color(status)
        bug_rows += f"""<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;">
                <a href="https://hyland.atlassian.net/browse/{key}">{key}</a></td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;">{rec.get('summary','')[:80]}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;">{rec.get('priority','')}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;">{rec.get('codebase','')}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;">
                <span style="color:{color};font-weight:bold;">{status}</span></td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;">{rec.get('root_cause','')[:100]}</td>
        </tr>"""

    html = f"""
    <html><body style="font-family:Segoe UI,Arial,sans-serif;color:#333;">
    <div style="max-width:900px;margin:0 auto;">
        <h2 style="color:#0052cc;">CSFMD Bug Analysis Report</h2>
        <p style="color:#666;">Generated: {now} &nbsp;|&nbsp; Total bugs tracked: <b>{summary['total']}</b></p>

        <h3>Status Overview</h3>
        <p>{status_pills}</p>

        <h3>By Codebase</h3>
        <table style="border-collapse:collapse;font-size:14px;">
        {''.join(f'<tr><td style="padding:3px 12px;">{cb}</td><td style="padding:3px 12px;font-weight:bold;">{cnt}</td></tr>'
                 for cb, cnt in sorted(summary['codebases'].items()))}
        </table>

        <h3>Bug Details</h3>
        <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <tr style="background:#f4f5f7;">
            <th style="padding:8px 10px;text-align:left;">Key</th>
            <th style="padding:8px 10px;text-align:left;">Summary</th>
            <th style="padding:8px 10px;text-align:left;">Priority</th>
            <th style="padding:8px 10px;text-align:left;">Codebase</th>
            <th style="padding:8px 10px;text-align:left;">Status</th>
            <th style="padding:8px 10px;text-align:left;">Root Cause</th>
        </tr>
        {bug_rows}
        </table>

        <hr style="margin-top:20px;border:none;border-top:1px solid #ddd;">
        <p style="font-size:12px;color:#999;">
            This is an automated report from the CSFMD Bug Pipeline.<br>
            Reply to this email for questions or feedback.
        </p>
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
