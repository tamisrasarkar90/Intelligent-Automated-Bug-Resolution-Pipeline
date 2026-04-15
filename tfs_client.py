"""
TFS Client — Browses and fetches source files from the OnBase TFS repository.

Uses the TFS REST API with Windows (NTLM) authentication.
Target repo: http://dev-tfs:8080/tfs/HylandCollection/OnBase/_versionControl
"""

import os
import re
from pathlib import Path
from typing import Optional

import requests
from requests_ntlm import HttpNtlmAuth

TFS_BASE_URL = "http://dev-tfs:8080/tfs/HylandCollection"
TFS_API_VERSION = "5.0"
DEV_ROOT = "$/OnBase/DEV"


# Well-known source paths for CSFMD bug areas
SOURCE_PATHS = {
    "web_scripts": f"{DEV_ROOT}/Core/OnBase.NET/Libraries/Hyland.Web.Resources.Scripts",
    "keyword_panel": f"{DEV_ROOT}/Core/OnBase.NET/Libraries/Hyland.Controls.Web/KeywordPanel",
    "controls_web": f"{DEV_ROOT}/Core/OnBase.NET/Libraries/Hyland.Controls.Web",
    "web_admin": f"{DEV_ROOT}/Core/OnBase.NET/Libraries/Hyland.Web.Administration",
    "web_app": f"{DEV_ROOT}/Core/OnBase.NET/Libraries/Hyland.Applications.Web",
}

# Bug keyword → source path mapping for analysis
KEYWORD_PATH_MAP = [
    (["DataValidation", "locale", "date format"], "web_scripts"),
    (["keyword panel", "keyword", "MIKG", "SIKG", "autofill", "AFKS", "mask",
      "reindex", "import", "cascading", "switch document"], "keyword_panel"),
    (["web client", "web server", "AppNet"], "controls_web"),
    (["admin", "security keyword"], "web_admin"),
]

CACHE_DIR = Path("tfs_cache")

_session: Optional[requests.Session] = None


def _get_session() -> requests.Session:
    """Get or create an NTLM-authenticated TFS session."""
    global _session
    if _session is not None:
        return _session
    _session = requests.Session()
    _session.auth = HttpNtlmAuth(None, None)  # Uses current Windows credentials
    _session.headers.update({"Accept": "application/json"})
    return _session


def list_items(scope_path: str, recursion: str = "OneLevel") -> list[dict]:
    """List TFVC items at the given path."""
    s = _get_session()
    url = f"{TFS_BASE_URL}/_apis/tfvc/items"
    r = s.get(url, params={
        "scopePath": scope_path,
        "recursionLevel": recursion,
        "api-version": TFS_API_VERSION,
    })
    r.raise_for_status()
    return r.json().get("value", [])


def fetch_file(tfs_path: str) -> str:
    """Download a file's content from TFS by its $/... path."""
    s = _get_session()
    url = f"{TFS_BASE_URL}/_apis/tfvc/items"
    r = s.get(url, params={
        "path": tfs_path,
        "api-version": TFS_API_VERSION,
    })
    r.raise_for_status()
    return r.text


def search_files(scope_path: str, pattern: str) -> list[str]:
    """Recursively search for files matching a regex pattern under scope_path."""
    items = list_items(scope_path, recursion="Full")
    regex = re.compile(pattern, re.IGNORECASE)
    return [item["path"] for item in items if regex.search(item["path"])]


def cache_file(tfs_path: str, force: bool = False) -> Path:
    """Download a TFS file to local cache. Returns the local path."""
    CACHE_DIR.mkdir(exist_ok=True)
    filename = tfs_path.split("/")[-1]
    local = CACHE_DIR / filename
    if local.exists() and not force:
        return local
    content = fetch_file(tfs_path)
    local.write_text(content, encoding="utf-8")
    return local


def find_relevant_paths(bug_summary: str, bug_description: str = "") -> list[str]:
    """Determine which TFS source paths are relevant for a given bug."""
    text = f"{bug_summary} {bug_description}".lower()
    paths = set()
    for keywords, path_key in KEYWORD_PATH_MAP:
        for kw in keywords:
            if kw.lower() in text:
                paths.add(SOURCE_PATHS.get(path_key, ""))
                break
    return [p for p in paths if p]


def fetch_relevant_source_files(bug: dict) -> dict[str, str]:
    """Given a bug dict, fetch relevant source files from TFS.
    Returns {tfs_path: content} for files related to the bug.
    """
    relevant_paths = find_relevant_paths(bug.get("summary", ""), bug.get("description", ""))
    files = {}

    for base_path in relevant_paths:
        # Search for .cs and .js files matching bug keywords
        summary_words = re.findall(r'\w+', bug.get("summary", ""))
        # Use broad search terms from the bug summary
        search_terms = [w for w in summary_words if len(w) > 4][:5]
        pattern = "|".join(re.escape(t) for t in search_terms) if search_terms else "Keyword|Import|Mask"

        try:
            matches = search_files(base_path, rf"({pattern}).*\.(cs|js)$")
            for tfs_path in matches[:10]:  # Limit to 10 files per path
                try:
                    local = cache_file(tfs_path)
                    files[tfs_path] = local.read_text(encoding="utf-8")
                except Exception as e:
                    print(f"  ⚠ Could not fetch {tfs_path}: {e}")
        except Exception as e:
            print(f"  ⚠ Could not search {base_path}: {e}")

    return files
