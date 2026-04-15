"""
Scheduler — Registers the CSFMD Bug Pipeline as a recurring Windows Task
or runs it in a loop with configurable interval.

Usage:
  python scheduler.py install              # Install as Windows Scheduled Task (every 4 hours)
  python scheduler.py install --interval 2 # Every 2 hours
  python scheduler.py uninstall            # Remove the scheduled task
  python scheduler.py run-loop             # Run in foreground loop (for dev/testing)
  python scheduler.py run-loop --interval 1 # Loop every 1 hour
  python scheduler.py run-once             # Single pipeline run (used by scheduler)
  python scheduler.py install-email        # Install biweekly email report task
  python scheduler.py uninstall-email      # Remove biweekly email task
  python scheduler.py send-report          # Send report now
  python scheduler.py send-report --dry-run # Preview report without sending
"""


import argparse
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

TASK_NAME = "CSFMD_BugPipeline"
EMAIL_TASK_NAME = "CSFMD_BugReport_Email"
WORKSPACE_DIR = Path(__file__).parent.resolve()
PYTHON_EXE = sys.executable
PIPELINE_SCRIPT = WORKSPACE_DIR / "pipeline.py"
EMAIL_SCRIPT = WORKSPACE_DIR / "email_reporter.py"
LOG_DIR = WORKSPACE_DIR / "logs"


def install_task(interval_hours: int = 4):
    """Register a Windows Scheduled Task to run the pipeline periodically."""
    LOG_DIR.mkdir(exist_ok=True)
    log_file = LOG_DIR / "scheduler.log"

    # Create a launcher batch file to keep the /TR value short
    launcher = WORKSPACE_DIR / "run_pipeline.bat"
    launcher.write_text(
        f'@echo off\r\ncd /d "{WORKSPACE_DIR}"\r\n'
        f'"{PYTHON_EXE}" "{PIPELINE_SCRIPT}" >> "{log_file}" 2>&1\r\n',
        encoding="utf-8",
    )

    # Use schtasks to create the task
    cmd = [
        "schtasks", "/Create",
        "/TN", TASK_NAME,
        "/TR", f'"{launcher}"',
        "/SC", "HOURLY",
        "/MO", str(interval_hours),
        "/ST", "09:00",
        "/F",  # Force overwrite if exists
    ]

    print(f"Installing scheduled task: {TASK_NAME}")
    print(f"  Interval: Every {interval_hours} hour(s)")
    print(f"  Working dir: {WORKSPACE_DIR}")
    print(f"  Launcher: {launcher}")
    print(f"  Log file: {log_file}")
    print(f"  Command: {' '.join(cmd)}")

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"\n  ✓ Task '{TASK_NAME}' installed successfully")
            print(f"  View in Task Scheduler or run: schtasks /Query /TN {TASK_NAME}")
        else:
            print(f"\n  ✗ Failed: {result.stderr.strip()}")
            print("  Try running as Administrator")
    except FileNotFoundError:
        print("  ✗ schtasks not found. Ensure you're on Windows.")


def uninstall_task():
    """Remove the Windows Scheduled Task."""
    cmd = ["schtasks", "/Delete", "/TN", TASK_NAME, "/F"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  ✓ Task '{TASK_NAME}' removed")
        else:
            print(f"  ✗ Failed: {result.stderr.strip()}")
    except FileNotFoundError:
        print("  ✗ schtasks not found.")


def install_email_task(day: str = "1,15", time_str: str = "10:00"):
    """Register Windows Scheduled Tasks to send biweekly email reports.

    By default runs on the 1st and 15th of each month at 10:00 AM.
    Creates one task per day since schtasks requires separate /D values.
    """
    LOG_DIR.mkdir(exist_ok=True)
    log_file = LOG_DIR / "email_report.log"

    # Create a launcher batch file for the email task
    launcher = WORKSPACE_DIR / "run_email_report.bat"
    launcher.write_text(
        f'@echo off\r\n'
        f'set JIRA_API_TOKEN=%JIRA_API_TOKEN%\r\n'
        f'cd /d "{WORKSPACE_DIR}"\r\n'
        f'"{PYTHON_EXE}" "{EMAIL_SCRIPT}" >> "{log_file}" 2>&1\r\n',
        encoding="utf-8",
    )

    days = [d.strip() for d in day.split(",")]
    success_count = 0

    print(f"Installing biweekly email task(s): {EMAIL_TASK_NAME}")
    print(f"  Schedule: Monthly on day(s) {day} at {time_str}")
    print(f"  Launcher: {launcher}")
    print(f"  Log file: {log_file}")
    print(f"  To: Subhankar.Mukherjee@hyland.com")
    print(f"  CC: tamisra.sarkar@hyland.com")

    for d in days:
        task_name = f"{EMAIL_TASK_NAME}_Day{d}" if len(days) > 1 else EMAIL_TASK_NAME
        cmd = [
            "schtasks", "/Create",
            "/TN", task_name,
            "/TR", f'"{launcher}"',
            "/SC", "MONTHLY",
            "/D", d,
            "/ST", time_str,
            "/F",
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  ✓ Task '{task_name}' installed (day {d})")
                success_count += 1
            else:
                print(f"  ✗ Task '{task_name}' failed: {result.stderr.strip()}")
        except FileNotFoundError:
            print("  ✗ schtasks not found.")
            return

    if success_count == len(days):
        print(f"\n  ✓ All {success_count} email task(s) installed successfully")
    else:
        print(f"\n  ⚠ {success_count}/{len(days)} tasks installed. Try running as Administrator.")


def uninstall_email_task():
    """Remove the biweekly email scheduled task(s)."""
    # Try both the single-name and day-suffixed variants
    names = [EMAIL_TASK_NAME, f"{EMAIL_TASK_NAME}_Day1", f"{EMAIL_TASK_NAME}_Day15"]
    for name in names:
        cmd = ["schtasks", "/Delete", "/TN", name, "/F"]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  ✓ Task '{name}' removed")
        except FileNotFoundError:
            print("  ✗ schtasks not found.")
            return


def run_once():
    """Run the pipeline once (used by the scheduled task)."""
    from pipeline import run_pipeline
    print(f"\n{'─' * 70}")
    print(f"  Scheduled run: {datetime.now().isoformat()}")
    print(f"{'─' * 70}")
    try:
        run_pipeline()
    except Exception as e:
        print(f"  Pipeline error: {e}")
        import traceback
        traceback.print_exc()


def run_loop(interval_hours: float = 4):
    """Run the pipeline in a foreground loop (for development/testing)."""
    interval_sec = interval_hours * 3600
    print(f"Running pipeline loop (interval: {interval_hours}h)")
    print("Press Ctrl+C to stop\n")

    while True:
        run_once()
        next_run = datetime.now().timestamp() + interval_sec
        next_str = datetime.fromtimestamp(next_run).strftime("%H:%M:%S")
        print(f"\n  Next run at {next_str} (in {interval_hours}h). Sleeping...")
        try:
            time.sleep(interval_sec)
        except KeyboardInterrupt:
            print("\n  Loop stopped by user.")
            break


def main():
    p = argparse.ArgumentParser(description="CSFMD Bug Pipeline Scheduler")
    sub = p.add_subparsers(dest="command", required=True)

    inst = sub.add_parser("install", help="Install Windows Scheduled Task")
    inst.add_argument("--interval", type=int, default=4, help="Hours between runs (default: 4)")

    sub.add_parser("uninstall", help="Remove Windows Scheduled Task")

    einst = sub.add_parser("install-email", help="Install biweekly email report task")
    einst.add_argument("--days", default="1,15", help="Day(s) of month to send (default: 1,15)")
    einst.add_argument("--time", default="10:00", dest="time_str", help="Time to send (default: 10:00)")

    sub.add_parser("uninstall-email", help="Remove biweekly email task")

    sr = sub.add_parser("send-report", help="Send email report now")
    sr.add_argument("--dry-run", action="store_true", help="Preview without sending")

    once = sub.add_parser("run-once", help="Single pipeline run")

    loop = sub.add_parser("run-loop", help="Run in foreground loop")
    loop.add_argument("--interval", type=float, default=4, help="Hours between runs (default: 4)")

    args = p.parse_args()

    if args.command == "install":
        install_task(args.interval)
    elif args.command == "uninstall":
        uninstall_task()
    elif args.command == "install-email":
        install_email_task(day=args.days, time_str=args.time_str)
    elif args.command == "uninstall-email":
        uninstall_email_task()
    elif args.command == "send-report":
        from email_reporter import send_report
        send_report(dry_run=args.dry_run)
    elif args.command == "run-once":
        run_once()
    elif args.command == "run-loop":
        run_loop(args.interval)


if __name__ == "__main__":
    main()
