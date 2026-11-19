from __future__ import annotations

import hashlib
import time
from typing import Any
from urllib.parse import urlparse

import httpx
from agent_framework import FunctionTool
from pydantic import BaseModel, Field

# 15-Minute Cache: query_hash -> (results, expires_at)
_SEARCH_CACHE: dict[str, tuple[list[dict[str, Any]], float]] = {}
CACHE_TTL_SECONDS = 15 * 60

# Rate limiting per company: company_id -> list of timestamps
_COMPANY_RATE_LIMITS: dict[str, list[float]] = {}
MAX_REQUESTS_PER_MINUTE = 10

# Task call counter: task_id -> count
_TASK_CALL_COUNTS: dict[str, int] = {}
MAX_CALLS_PER_TASK = 5

BOT_USER_AGENT = "MaxP-Bot/1.0 (+https://maxp.online/bot; bot@maxp.online)"

PAYWALLED_DOMAINS = (
    "wsj.com",
    "ft.com",
    "bloomberg.com",
    "nytimes.com",
    "economist.com",
    "theinformation.com",
    "hbr.org",
    "barrons.com",
)


def _is_private_host(hostname: str) -> bool:
    if not hostname:
        return True
    host = hostname.lower().strip()
    if host in {"localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254", "metadata.google.internal"}:
        return True
    if host.endswith(".local") or host.endswith(".internal"):
        return True
    parts = host.split(".")
    if len(parts) == 4 and all(p.isdigit() for p in parts):
        a, b = int(parts[0]), int(parts[1])
        if a == 10 or a == 127 or a == 0:
            return True
        if a == 172 and 16 <= b <= 31:
            return True
        if a == 192 and b == 168:
            return True
        if a == 169 and b == 254:
            return True
    return False


def _check_rate_limit(company_id: str | None) -> bool:
    if not company_id:
        return True
    now = time.time()
    records = [t for t in _COMPANY_RATE_LIMITS.get(company_id, []) if now - t < 60.0]
    if len(records) >= MAX_REQUESTS_PER_MINUTE:
        return False
    records.append(now)
    _COMPANY_RATE_LIMITS[company_id] = records
    return True


def _check_task_limit(task_id: str | None) -> bool:
    if not task_id:
        return True
    count = _TASK_CALL_COUNTS.get(task_id, 0)
    if count >= MAX_CALLS_PER_TASK:
        return False
    _TASK_CALL_COUNTS[task_id] = count + 1
    return True


class WebSearchInput(BaseModel):
    query: str = Field(description="Search query in Arabic or English")
    limit: int = Field(default=5, ge=1, le=10, description="Max search results to return (1-10)")
    task_id: str | None = Field(default=None, description="Current agent task ID to enforce maximum call limits")
    company_id: str | None = Field(default=None, description="Tenant ID (auto-injected)")


class WebFetchInput(BaseModel):
    url: str = Field(description="The web URL to fetch and convert into clean readable text")
    company_id: str | None = Field(default=None, description="Tenant ID (auto-injected)")


async def web_search(input_data: WebSearchInput) -> dict[str, Any]:
    """Search the internet for real-time information, market data, and references."""
    query = (input_data.query or "").strip()
    if not query:
        return {"success": True, "count": 0, "results": [], "message": "Empty query"}

    # 1. Task Call Limit Guard
    if input_data.task_id and not _check_task_limit(input_data.task_id):
        return {
            "success": False,
            "error": "TASK_CALL_LIMIT_EXCEEDED",
            "message": f"Maximum {MAX_CALLS_PER_TASK} search calls exceeded for task. Aborted to prevent loop.",
            "results": [],
        }

    # 2. Rate Limit Guard
    if input_data.company_id and not _check_rate_limit(input_data.company_id):
        return {
            "success": False,
            "error": "RATE_LIMIT_EXCEEDED",
            "message": f"Rate limit of {MAX_REQUESTS_PER_MINUTE} searches/min exceeded.",
            "results": [],
        }

    # 3. 15-Minute Cache Check
    q_hash = hashlib.sha256(query.lower().encode("utf-8")).hexdigest()
    now = time.time()
    if q_hash in _SEARCH_CACHE:
        cached_results, expires_at = _SEARCH_CACHE[q_hash]
        if now < expires_at:
            return {
                "success": True,
                "query": query,
                "count": len(cached_results[: input_data.limit]),
                "results": cached_results[: input_data.limit],
                "cached": True,
            }

    # 4. Multi-Source Search (Wikipedia + DuckDuckGo Instant Answers)
    results: list[dict[str, Any]] = []
    is_arabic = any("\u0600" <= c <= "\u06ff" for c in query)
    lang = "ar" if is_arabic else "en"

    async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": BOT_USER_AGENT}) as client:
        # Wikipedia OpenSearch
        try:
            wiki_url = f"https://{lang}.wikipedia.org/w/api.php"
            resp = await client.get(
                wiki_url,
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": query,
                    "utf8": 1,
                    "format": "json",
                    "srlimit": input_data.limit,
                },
            )
            if resp.status_code == 200:
                wiki_data = resp.json()
                for item in wiki_data.get("query", {}).get("search", []):
                    import re

                    clean_snippet = re.sub(r"<[^>]+>", "", item.get("snippet", "")).strip()
                    title = item.get("title", "")
                    link = f"https://{lang}.wikipedia.org/wiki/{title.replace(' ', '_')}"
                    results.append(
                        {
                            "title": title,
                            "link": link,
                            "snippet": clean_snippet,
                            "date": item.get("timestamp", "")[:10] if item.get("timestamp") else None,
                            "source": f"Wikipedia ({lang.upper()})",
                        }
                    )
        except Exception:
            pass

        # DuckDuckGo fallback
        if len(results) < input_data.limit:
            try:
                ddg_resp = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
                )
                if ddg_resp.status_code == 200:
                    ddg_data = ddg_resp.json()
                    heading = ddg_data.get("Heading")
                    abstract = ddg_data.get("AbstractText") or ddg_data.get("Abstract")
                    if heading and abstract:
                        results.append(
                            {
                                "title": heading,
                                "link": ddg_data.get("AbstractURL") or f"https://duckduckgo.com/?q={query}",
                                "snippet": abstract,
                                "date": None,
                                "source": "DuckDuckGo",
                            }
                        )
                    for topic in ddg_data.get("RelatedTopics", []):
                        if len(results) >= input_data.limit:
                            break
                        if isinstance(topic, dict) and topic.get("Text") and topic.get("FirstURL"):
                            results.append(
                                {
                                    "title": topic.get("Text", "").split(" - ")[0],
                                    "link": topic.get("FirstURL"),
                                    "snippet": topic.get("Text"),
                                    "date": None,
                                    "source": "DuckDuckGo Related",
                                }
                            )
            except Exception:
                pass

    # Save to 15-minute cache
    _SEARCH_CACHE[q_hash] = (results, now + CACHE_TTL_SECONDS)

    return {
        "success": True,
        "query": query,
        "count": len(results[: input_data.limit]),
        "results": results[: input_data.limit],
        "cached": False,
    }


async def web_fetch(input_data: WebFetchInput) -> dict[str, Any]:
    """Fetch structured text from a webpage URL with SSRF and paywall protection."""
    raw_url = (input_data.url or "").strip()
    if not raw_url:
        return {"success": False, "error": "INVALID_URL", "message": "No URL provided."}

    try:
        parsed = urlparse(raw_url)
    except Exception:
        return {"success": False, "error": "INVALID_URL", "message": f"Malformed URL: {raw_url}"}

    if parsed.scheme not in {"http", "https"}:
        return {"success": False, "error": "SSRF_BLOCKED", "message": "Only HTTP/HTTPS allowed."}

    if _is_private_host(parsed.hostname or ""):
        return {"success": False, "error": "SSRF_BLOCKED", "message": f"Private host forbidden: {parsed.hostname}"}

    if any((parsed.hostname or "").endswith(d) for d in PAYWALLED_DOMAINS):
        return {"success": False, "error": "PAYWALLED_OR_RESTRICTED", "message": "Domain is paywalled."}

    try:
        async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": BOT_USER_AGENT}) as client:
            resp = await client.get(raw_url)
            if resp.status_code in {401, 402, 403}:
                return {"success": False, "error": "ACCESS_DENIED", "statusCode": resp.status_code}
            if resp.status_code >= 400:
                return {"success": False, "error": "HTTP_ERROR", "statusCode": resp.status_code}

            import re

            html = resp.text
            # Extract title
            title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
            title = title_match.group(1).strip() if title_match else parsed.hostname or raw_url

            # Remove boilerplate tags
            clean = re.sub(r"<(script|style|svg|nav|footer|header)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
            clean = re.sub(r"<[^>]+>", " ", clean)
            clean = re.sub(r"\s+", " ", clean).strip()

            capped = clean[:15000]
            return {
                "success": True,
                "url": raw_url,
                "title": title,
                "content": capped,
                "length": len(capped),
                "word_count": len(capped.split()),
            }
    except Exception as e:
        return {"success": False, "error": "FETCH_ERROR", "message": str(e)}


web_search_tool = FunctionTool(
    name="web_search",
    description="Search the internet for real-time information, current pricing, competitor data, and industry benchmarks. Returns title, link, and snippets.",
    func=web_search,
    input_model=WebSearchInput,
)

web_fetch_tool = FunctionTool(
    name="web_fetch",
    description="Fetch and extract structured clean text from a web URL with SSRF filtering and paywall protection.",
    func=web_fetch,
    input_model=WebFetchInput,
)

__all_tools__ = [
    web_search_tool,
    web_fetch_tool,
]
