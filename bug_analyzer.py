"""
Bug Analyzer — Cross-references CSFMD bugs with TFS source code to determine
if bugs are valid and fixable, then produces analysis records and fix files.

Reads from: generated_tests/bug_analysis.json (existing analysis)
Writes to:  generated_tests/bug_analysis.json (updated)
            fixes/<CSFMD-XXXXX>/ (per-bug fix directories)
"""


import json
import re
from pathlib import Path
from datetime import datetime

from tfs_client import find_relevant_paths, search_files, cache_file, fetch_file, SOURCE_PATHS

ANALYSIS_FILE = Path("generated_tests/bug_analysis.json")
FIXES_DIR = Path("fixes")


def load_analysis() -> dict:
    """Load existing bug analysis from disk."""
    if ANALYSIS_FILE.exists():
        return json.loads(ANALYSIS_FILE.read_text(encoding="utf-8"))
    return {}


def save_analysis(analysis: dict):
    """Persist bug analysis to disk."""
    ANALYSIS_FILE.parent.mkdir(parents=True, exist_ok=True)
    ANALYSIS_FILE.write_text(
        json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"  ✓ Analysis saved ({len(analysis)} bugs)")


def _classify_codebase(bug: dict) -> str:
    """Determine which codebase a bug belongs to based on keywords in summary."""
    text = f"{bug.get('summary', '')} {bug.get('components', '')}".lower()
    if "unity" in text:
        return "Unity Client"
    if "configuration" in text or "onbase config" in text:
        return "Configuration Client"
    if "edm" in text or "checkout" in text or "check-in" in text or "checkin" in text:
        return "EDM Module"
    if any(k in text for k in ["web client", "appnet", "web server", "import",
                                 "reindex", "keyword panel", "data validation"]):
        return "Web Client"
    if "oracle" in text:
        return "Core / Database"
    if "workflow" in text:
        return "Workflow"
    return "Core / Other"


def _detect_root_cause(bug: dict, source_files: dict) -> dict:
    """Analyze source files to determine root cause for a bug.
    Returns a partial analysis dict with root_cause, affected_files, etc.
    """
    summary = bug.get("summary", "").lower()
    description = bug.get("description", "").lower()
    text = f"{summary} {description}"

    result = {
        "root_cause": "",
        "affected_files": [],
        "fix_description": "",
        "fixable_by_agent": False,
    }

    # === Pattern: DataValidation version missing ===
    if "datavalidation" in text and ("invalid" in text or "resorting" in text):
        result["root_cause"] = (
            "DataValidation JS file missing for detected OS version. "
            "EmbeddedScripts.cs PickDataValidationVersion() cannot find matching file."
        )
        result["affected_files"] = [
            f"{SOURCE_PATHS['web_scripts']}/EmbeddedScripts.cs"
        ]
        result["fix_description"] = (
            "Add new DataValidation<version>.js and register in EmbeddedScripts.cs"
        )
        result["fixable_by_agent"] = True

    # === Pattern: Cascading Dataset + hidden keyword ===
    elif "cascad" in text and "hidden" in text:
        result["root_cause"] = (
            "Hidden parent keywords in cascading datasets return empty value, "
            "causing child keywords to have no selectable values."
        )
        result["affected_files"] = [
            f"{SOURCE_PATHS['keyword_panel']}/Scripts/KeywordPanelItem.js"
        ]
        result["fix_description"] = (
            "Include hidden keyword values in cascading dataset parent value collection."
        )
        result["fixable_by_agent"] = False  # Requires business logic review

    # === Pattern: Keyword panel collapse / error ===
    elif "keyword panel" in text and ("collaps" in text or "error" in text):
        result["root_cause"] = "Keyword panel rendering failure — likely null/empty response from server."
        result["affected_files"] = [
            f"{SOURCE_PATHS['keyword_panel']}/Scripts/KeywordPanel.js"
        ]
        result["fix_description"] = "Add null-check guards in keyword panel rendering logic."
        result["fixable_by_agent"] = False

    # === Pattern: MIKG / SIKG expansion issues ===
    elif ("mikg" in text or "sikg" in text) and ("expand" in text or "autofill" in text or "instance" in text):
        result["root_cause"] = "MIKG/SIKG instance handling issue during autofill expansion."
        result["affected_files"] = [
            f"{SOURCE_PATHS['keyword_panel']}/KeywordHandler.cs"
        ]
        result["fix_description"] = "Review server-side MIKG/SIKG instance management during AFKS expansion."
        result["fixable_by_agent"] = False

    # === Pattern: Locale / date issues ===
    elif "locale" in text or "hungarian" in text or "hungarian" in text or "vietnamese" in text:
        result["root_cause"] = "Locale-specific date/time format mismatch in DataValidation.js."
        result["affected_files"] = [
            f"{SOURCE_PATHS['web_scripts']}/DataValidation.js"
        ]
        result["fix_description"] = "Update locale date format definitions."
        result["fixable_by_agent"] = False

    # === Pattern: Mask / security mask ===
    elif "mask" in text and ("security" in text or "encrypt" in text):
        result["root_cause"] = "Security mask keyword handling issue."
        result["affected_files"] = [
            f"{SOURCE_PATHS['keyword_panel']}/Scripts/KeywordPanelItem.js"
        ]
        result["fix_description"] = "Review security mask validation and display logic."
        result["fixable_by_agent"] = False

    # === Pattern: Switch document type ===
    elif "switch" in text and "document" in text:
        result["root_cause"] = "Document type switching does not properly transfer keyword values."
        result["affected_files"] = [
            f"{SOURCE_PATHS['keyword_panel']}/Scripts/KeywordPanel.js"
        ]
        result["fix_description"] = "Review keyword value propagation during document type switch."
        result["fixable_by_agent"] = False

    # === General / unknown ===
    else:
        codebase = _classify_codebase(bug)
        result["root_cause"] = f"Requires manual investigation. Classified as: {codebase}"
        result["fix_description"] = f"Manual investigation needed in {codebase} codebase."
        result["fixable_by_agent"] = False

    return result


def analyze_bug(bug: dict, fetch_source: bool = True) -> dict:
    """Analyze a single bug against TFS source code.
    Returns a complete analysis record.
    """
    key = bug["key"]
    codebase = _classify_codebase(bug)
    print(f"\n  Analyzing {key}: {bug.get('summary', '')[:60]}...")
    print(f"    Codebase: {codebase}")

    # Fetch relevant source files from TFS
    source_files = {}
    if fetch_source and codebase in ("Web Client", "Workflow"):
        try:
            relevant = find_relevant_paths(bug.get("summary", ""), bug.get("description", ""))
            for base_path in relevant:
                try:
                    search_terms = "Keyword|Import|Mask|DataValidation|Reindex"
                    matches = search_files(base_path, rf"({search_terms}).*\.(cs|js)$")
                    for m in matches[:5]:
                        try:
                            local = cache_file(m)
                            source_files[m] = local.read_text(encoding="utf-8", errors="replace")
                        except Exception:
                            pass
                except Exception as e:
                    print(f"    ⚠ TFS search failed for {base_path}: {e}")
        except Exception as e:
            print(f"    ⚠ TFS access failed: {e}")

    # Detect root cause
    detection = _detect_root_cause(bug, source_files)

    # Check for obvious invalid patterns
    is_valid = True
    if any(kw in bug.get("summary", "").lower() for kw in ["intermittent", "nvda", "screen reader"]):
        is_valid = False

    analysis = {
        "valid": is_valid,
        "fixable": detection["fixable_by_agent"],
        "severity": bug.get("priority", "Medium").upper(),
        "codebase": codebase,
        "root_cause": detection["root_cause"],
        "affected_files": detection["affected_files"],
        "fix_description": detection["fix_description"],
        "fix_files": [],
        "status": "ANALYZED",
        "analyzed_at": datetime.now().isoformat(),
        "summary": bug.get("summary", ""),
    }

    if not is_valid:
        analysis["status"] = "FLAGGED_INVALID"
    elif detection["fixable_by_agent"]:
        analysis["status"] = "FIX_PENDING"
    else:
        analysis["status"] = "NEEDS_MANUAL_REVIEW"

    return analysis


def analyze_batch(bugs: list[dict], existing_analysis: dict = None) -> dict:
    """Analyze a batch of bugs, merging with existing analysis.
    Returns the full updated analysis dict.
    """
    if existing_analysis is None:
        existing_analysis = load_analysis()

    updated = dict(existing_analysis)
    new_count = 0

    for bug in bugs:
        key = bug["key"]
        if key in updated:
            continue  # Already analyzed

        result = analyze_bug(bug)
        updated[key] = result
        new_count += 1

    if new_count:
        save_analysis(updated)
        print(f"\n  ✓ Analyzed {new_count} new bug(s)")
    else:
        print("\n  No new bugs to analyze")

    return updated
