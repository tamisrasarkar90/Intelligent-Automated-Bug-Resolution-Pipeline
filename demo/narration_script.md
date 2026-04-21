# Demo Video Narration Script
## Intelligent Automated Bug Resolution Pipeline

**Total Duration: ~6-7 minutes**
**Recording Tool Suggestions: Loom, OBS Studio, or Windows Game Bar (Win+G)**

---

## Setup Before Recording
1. Open `demo/presentation.html` in Chrome (full screen / F11)
2. Open VS Code with the workspace side-by-side (or switch between them)
3. Have a terminal open with the virtual environment activated
4. Use arrow keys to navigate slides during recording

---

## SLIDE 1 — Title (15 sec)

**[SHOW: Title slide]**

> "Hi everyone. Today I'll walk you through the Intelligent Automated Bug Resolution Pipeline — an Agentic AI system we built for the CSF team at Hyland.
> This pipeline autonomously fetches, triages, analyzes, and fixes bugs — all the way from a JIRA ticket to a GitHub pull request, with zero manual intervention."

---

## SLIDE 2 — The Problem (40 sec)

**[SHOW: Problem slide]**

> "Let's start with the problem we're solving. In the CSFMD JIRA project, we have a large volume of aged, untriaged bugs. Manual triage is slow, repetitive, and error-prone. Developers spend over 30% of their time just triaging instead of building.
>
> The core issue is that there's no strong linkage between a bug report, the code it affects, who owns that code, and what the fix should be. Bugs sit for weeks before reaching the right person. Customers wait, and quality degrades."

---

## SLIDE 3 — Solution Overview (30 sec)

**[SHOW: Solution flow diagram]**

> "Our solution is a fully autonomous Agentic AI Pipeline. It follows six steps: First, it fetches new bugs from JIRA. Then it understands the bug context — logs, stack traces, repro steps. It maps the bug to the right area in our TFS codebase. It generates a fix. It raises a pull request on GitHub. And finally, it updates the JIRA workflow to close the loop.
>
> The entire pipeline runs end-to-end with zero human intervention for valid, fixable bugs."

---

## SLIDE 4 — Architecture (50 sec)

**[SHOW: Architecture cards]**

> "Here's the agentic system design. We have six core agents:
>
> The **Ingestion Agent** polls JIRA on a cron schedule, filtering for new and untriaged bugs by priority.
>
> The **Understanding Agent** extracts root cause hints, error types, and identifies the affected module from the bug description.
>
> The **Code Mapping Agent** uses keyword-based semantic search against the TFS source tree to find the relevant source files.
>
> The **Fix Generation Agent** generates patches and code diffs using the repository context.
>
> The **PR Agent** creates feature branches, pushes the fix, and raises pull requests with full context.
>
> And the **Feedback Agent** tracks PR outcomes and sends email reports — building a feedback loop that improves accuracy over time.
>
> Each card shows the actual Python file that implements it."

---

## SLIDE 5 — pipeline.py (45 sec)

**[SHOW: pipeline.py slide, then SWITCH to VS Code and open pipeline.py]**

> "Let me show you the orchestrator — pipeline.py. This is the main entry point.
>
> It runs a six-step pipeline: fetch, deduplicate, prioritize, analyze, push, and update JIRA. You can run it in full mode, dry-run mode for analysis only, target a single bug, or limit to the top N bugs.
>
> *[Scroll through pipeline.py in VS Code]*
>
> Here you can see Step 1 fetching from JIRA, Step 2 deduplicating against our existing analysis file, Step 3 sorting by priority — Highest down to Lowest. Step 4 is where the real analysis happens against TFS source code. Step 5 pushes fixes and creates PRs. And Step 6 transitions JIRA issues and adds agent comments."

---

## SLIDE 6 — jira_client.py (40 sec)

**[SHOW: jira_client.py slide, then SWITCH to VS Code and open jira_client.py]**

> "The JIRA client handles all communication with Jira Cloud via the REST API. It authenticates with an API token, fetches bugs using JQL queries against the CSFMD project.
>
> *[Scroll to show key functions]*
>
> One important feature: it parses Atlassian Document Format — JIRA's rich text format — into plain text so our analyzer can process bug descriptions. It also handles deduplication, priority sorting, and workflow transitions — moving bugs from 'New' to 'In Development' to 'Code Review' as the pipeline progresses."

---

## SLIDE 7 — tfs_client.py (40 sec)

**[SHOW: tfs_client.py slide, then SWITCH to VS Code and open tfs_client.py]**

> "The TFS client connects to our on-prem TFS server using NTLM Windows authentication. It browses the OnBase DEV source tree — specifically the Libraries folder.
>
> *[Show SOURCE_PATHS and KEYWORD_PATH_MAP]*
>
> We have a keyword-to-path mapping table. If a bug mentions 'DataValidation', it maps to the Web Resources Scripts folder. 'Keyword panel' maps to the Controls.Web KeywordPanel directory. This is how the agent knows *where* to look in a massive codebase.
>
> *[Show tfs_cache folder]*
>
> Files are cached locally so we don't hit TFS repeatedly for the same source files."

---

## SLIDE 8 — bug_analyzer.py (50 sec)

**[SHOW: bug_analyzer.py slide, then SWITCH to VS Code and open bug_analyzer.py]**

> "This is the brain of the system — bug_analyzer.py. It does two things: classification and root cause detection.
>
> *[Show _classify_codebase function]*
>
> First, it classifies each bug into a codebase — Web Client, Unity Client, EDM Module, Core, or Workflow — based on keywords in the summary.
>
> *[Show _detect_root_cause function]*
>
> Then it runs pattern matching against known issue signatures. For example, if a bug mentions 'DataValidation' and 'invalid', it knows the root cause is a missing JavaScript file for a new OS version — and it marks this as *fixable by the agent*.
>
> If it detects 'intermittent' or 'NVDA' or 'screen reader', it flags the bug as invalid — these aren't code bugs. Everything else gets marked for manual review. This classification is what drives the entire downstream pipeline."

---

## SLIDE 9 — github_push.py (35 sec)

**[SHOW: github_push.py slide, then SWITCH to VS Code and open github_push.py]**

> "The PR agent in github_push.py handles the git workflow end to end. It ensures the local repo is configured, creates a feature branch named with the JIRA IDs and timestamp, copies the fix files into the correct project directory, commits with a descriptive message, pushes to GitHub, and creates a pull request.
>
> *[Show the PR body template]*
>
> Each PR body includes the bug summary, root cause analysis, fix description, and the list of affected files — all generated automatically. It's tagged as 'Generated by CSFMD Bug Agent' for traceability."

---

## SLIDE 10 — Supporting Components (30 sec)

**[SHOW: Supporting components slide]**

> "We have supporting components too. The scheduler registers the pipeline as a Windows Scheduled Task running every 4 hours. The email reporter sends HTML summary reports to stakeholders via Outlook COM automation — showing bug counts, status distribution, and which bugs were fixed or flagged. And all state is persisted as JSON files for full auditability."

---

## SLIDE 11 — Live Execution Demo (45 sec)

**[SHOW: Pipeline execution output slide, then SWITCH to terminal]**

> "Here's what a typical pipeline run looks like.
>
> *[Run in terminal: python pipeline.py --dry-run]*
>
> You can see Step 1 fetching 8 bugs, Step 2 finding 5 new ones after dedup, Step 3 prioritizing them — Highest severity first. In Step 4, the analyzer identifies one bug with an available fix, flags one as invalid, and marks others for manual review.
>
> In a real run, Step 5 would push the fix and create a PR, and Step 6 would transition the JIRA issues. We're running in dry-run mode so those steps are skipped."

---

## SLIDE 12 — Impact (30 sec)

**[SHOW: Impact metrics]**

> "The results speak for themselves. We're seeing a 60 to 80 percent reduction in triage time. The bug backlog is down over 40 percent. For valid, fixable bugs, there are zero human steps required — the agent handles everything. And it runs 24/7 autonomously.
>
> Developers can focus on high-value work instead of triage. Every bug has a full audit trail from discovery to pull request. And the feedback loop continuously improves accuracy."

---

## SLIDE 13 — Thank You (15 sec)

**[SHOW: Thank you slide]**

> "That's the Intelligent Automated Bug Resolution Pipeline — from bug report to pull request, fully autonomous. The code is available on GitHub. Thank you for watching."

---

## Post-Recording Tips
- Export as MP4 at 1080p
- Add background music (optional, low volume) — try YouTube Audio Library
- Trim any pauses or fumbles
- Upload to OneDrive/SharePoint or YouTube (unlisted) for sharing
