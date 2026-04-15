# Copilot Instructions — ONBASEAgentWorkSpace

## Purpose
This workspace contains a Python-based automated bug pipeline that:
1. Fetches NEW bugs from JIRA Cloud (project: CSFMD) on a scheduled interval
2. Deduplicates against already-tracked bugs in `bug_analysis.json`
3. Prioritizes by severity (Highest → High → Medium → Low → Lowest)
4. Analyzes each bug against TFS source code (`$/OnBase/DEV`)
5. Fixes valid/fixable bugs, flags invalid ones
6. Pushes fixes to GitHub and raises PRs
7. Updates JIRA status (In Development / Code Review)


## Key Files
- `pipeline.py` — Main orchestrator (entry point for the full pipeline)
- `scheduler.py` — Windows Task Scheduler integration + foreground loop
- `jira_client.py` — JIRA REST API client (fetch bugs, transitions, comments)
- `tfs_client.py` — TFS REST API client (browse/fetch OnBase source code)
- `bug_analyzer.py` — Cross-references bugs with source code, classifies codebases
- `github_push.py` — Git branch creation, push fixes, and raise PRs

## Running the Pipeline
```powershell
$env:JIRA_API_TOKEN = "your-token"
python pipeline.py                    # Full pipeline run
python pipeline.py --dry-run          # Analyze only
python pipeline.py --bug CSFMD-10288  # Single bug
python scheduler.py install           # Install as Windows Scheduled Task
```

## Data Files
- `generated_tests/bugs.json` — Latest fetched bugs from JIRA
- `generated_tests/bug_analysis.json` — Analysis results for all tracked bugs
- `generated_tests/pipeline_log.json` — Run history log
- `fixes/` — Generated fix files per bug

## TFS Source Code
The pipeline analyzes source under `$/OnBase/DEV/Core/OnBase.NET/Libraries/`:
- `Hyland.Web.Resources.Scripts` — DataValidation JS, embedded scripts
- `Hyland.Controls.Web/KeywordPanel` — Keyword panel, reindex, import
- `Hyland.Applications.Web` — Web Client application code
- `Hyland.Web.Administration` — Admin panel
