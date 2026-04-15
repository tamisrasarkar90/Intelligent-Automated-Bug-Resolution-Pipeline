# CSFMD Bug Pipeline — Automated Bug Analysis & Fix Agent

Automated pipeline that fetches NEW bugs from JIRA (CSFMD project), analyzes them against TFS source code, generates fixes, raises PRs, and updates JIRA status — all on a configurable schedule.

## Pipeline Flow


```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│ JIRA Cloud   │───→│ Deduplicate  │───→│ Prioritize  │───→│  Analyze    │
│ Fetch NEW    │    │ vs existing  │    │ High→Med→Lo │    │ vs TFS src  │
│ bugs (CSFMD) │    │ analysis.json│    │             │    │             │
└─────────────┘    └──────────────┘    └─────────────┘    └──────┬──────┘
                                                                  │
                    ┌──────────────┐    ┌─────────────┐    ┌──────▼──────┐
                    │ Update JIRA  │←───│ Raise PR    │←───│ Fix / Flag  │
                    │ In Dev /     │    │ on GitHub   │    │ Valid bugs  │
                    │ Code Review  │    │             │    │ get fixes   │
                    └──────────────┘    └─────────────┘    └─────────────┘
```

## Quick Start

### 1. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 2. Set Environment Variables

```powershell
# Required — JIRA Cloud API token
$env:JIRA_API_TOKEN = "your-jira-api-token"

# Optional — Path to local CSF repo clone (for PR pushes)
$env:CSF_REPO_DIR = "C:\Users\you\source\repos\CSF-ob-client-web-ui-automation-master"
```

### 3. Run the Pipeline

```powershell
# Full pipeline — fetch, analyze, fix, push, update JIRA
python pipeline.py

# Dry run — analyze only, no pushes or JIRA updates
python pipeline.py --dry-run

# Process a single specific bug
python pipeline.py --bug CSFMD-10288

# Limit to top N bugs by priority
python pipeline.py --limit 5

# Filter by a different JIRA status
python pipeline.py --status "Backlog"
```

## Scheduled Execution

The pipeline can run automatically on a recurring interval.

### Option A: Windows Task Scheduler (Recommended for production)

```powershell
# Install as a scheduled task (runs every 4 hours)
python scheduler.py install

# Custom interval (every 2 hours)
python scheduler.py install --interval 2

# Remove the scheduled task
python scheduler.py uninstall
```

### Option B: Foreground Loop (For development/testing)

```powershell
# Run in a loop with 4-hour interval
python scheduler.py run-loop

# Custom interval (1 hour)
python scheduler.py run-loop --interval 1
```

### Option C: Single Run (Used by scheduler internally)

```powershell
python scheduler.py run-once
```

## Project Structure

```
ONBASEAgentWorkSpace/
├── pipeline.py              # Main orchestrator — entry point
├── scheduler.py             # Windows Task Scheduler / loop runner
├── jira_client.py           # JIRA REST API client
│                            #   - Fetch NEW bugs via JQL
│                            #   - Deduplicate against tracked bugs
│                            #   - Transition issues (In Dev, Code Review)
│                            #   - Add comments
├── tfs_client.py            # TFS REST API client
│                            #   - Browse $/OnBase/DEV source tree
│                            #   - Download source files
│                            #   - Search by keyword/pattern
├── bug_analyzer.py          # Bug analysis engine
│                            #   - Classify codebase (Web/Unity/Core/EDM)
│                            #   - Detect root cause patterns
│                            #   - Generate fix files
│                            #   - Flag invalid bugs
├── github_push.py           # Git/GitHub integration
│                            #   - Create feature branches
│                            #   - Push fix files
│                            #   - Raise PRs via `gh` CLI
├── requirements.txt         # Python dependencies
├── generated_tests/
│   ├── bugs.json            # Latest fetched bugs from JIRA
│   ├── bug_analysis.json    # Analysis results for all tracked bugs
│   └── pipeline_log.json    # Run history log
├── fixes/                   # Generated fix files organized per bug
│   ├── EmbeddedScripts.cs
│   └── DataValidation2025.js
├── logs/                    # Scheduler output logs
└── .github/
    └── copilot-instructions.md
```

## How It Works

### Step 1: Fetch Bugs
Uses JIRA REST API v3 (`/rest/api/3/search/jql`) to query:
```
project = CSFMD AND issuetype = Bug AND status = "New"
```

### Step 2: Deduplicate
Compares fetched bug keys against `bug_analysis.json` — only new/untracked bugs proceed.

### Step 3: Prioritize
Sorts bugs by JIRA priority: **Highest → High → Medium → Low → Lowest**

### Step 4: Analyze
For each bug:
1. Classifies **codebase** — Web Client, Unity Client, Core/DB, EDM, Workflow
2. Maps bug keywords to **TFS source paths** under `$/OnBase/DEV/Core/OnBase.NET/Libraries/`
3. Downloads relevant source files via TFS REST API
4. Applies **pattern-matching engine** to detect root causes:
   - DataValidation version mismatches
   - Cascading dataset hidden keyword issues
   - Keyword panel rendering failures
   - MIKG/SIKG expansion bugs
   - Locale/date format issues
5. Marks bug as: `FIX_PENDING`, `NEEDS_MANUAL_REVIEW`, or `FLAGGED_INVALID`

### Step 5: Fix & Push
For bugs marked `FIX_PENDING`:
1. Generates fix files in `fixes/` directory
2. Creates a feature branch: `feature/tamisra.sarkar/agent-tests-<ID>-<date>`
3. Commits and pushes fix files
4. Raises a PR via GitHub CLI (`gh pr create`)

### Step 6: Update JIRA
- **Fixed bugs:** Transitions to "In Development", adds comment with branch/PR info
- **Invalid bugs:** Adds comment explaining why flagged, for team review

## TFS Source Code Areas

The analyzer covers these key source areas:

| Area | TFS Path | Bug Types |
|------|----------|-----------|
| Web Scripts | `Hyland.Web.Resources.Scripts/` | DataValidation, locale, embedded scripts |
| Keyword Panel | `Hyland.Controls.Web/KeywordPanel/` | Keywords, masks, MIKG, SIKG, AFKS, reindex, import |
| Web Controls | `Hyland.Controls.Web/` | Web Client UI controls |
| Web Admin | `Hyland.Web.Administration/` | Admin panel, security keywords |
| Web App | `Hyland.Applications.Web/` | Web Client application logic |

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JIRA_API_TOKEN` | Yes | — | JIRA Cloud API token |
| `CSF_REPO_DIR` | No | `~/source/repos/CSF-ob-client-web-ui-automation-master` | Local repo clone path |
| `GIT_TOKEN` | No | — | GitHub PAT (if `gh` CLI not configured) |

## Data Files

### `bugs.json`
Latest raw bug data from JIRA — refreshed every pipeline run.

### `bug_analysis.json`
Persistent analysis record for every tracked bug. Schema:
```json
{
  "CSFMD-XXXXX": {
    "valid": true,
    "fixable": true,
    "severity": "HIGH",
    "codebase": "Web Client",
    "root_cause": "...",
    "affected_files": ["$/OnBase/DEV/..."],
    "fix_description": "...",
    "fix_files": ["fixes/..."],
    "status": "IN_DEVELOPMENT",
    "analyzed_at": "2026-04-10T...",
    "pr_url": "https://github.com/...",
    "branch": "feature/..."
  }
}
```

### `pipeline_log.json`
Timestamped log of every pipeline run with counts of fetched/analyzed/fixed/flagged bugs.
