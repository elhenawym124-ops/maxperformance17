from __future__ import annotations

import asyncio
import hashlib
import json
import re
import ssl
import time
import urllib.parse
import urllib.request
import urllib.robotparser
from typing import Any
from urllib.parse import urlparse

def _get_ssl_context() -> ssl.SSLContext:
    try:
        ctx = ssl.create_default_context()
        return ctx
    except Exception:
        return ssl._create_unverified_context()

def _safe_urlopen(req: urllib.request.Request, timeout: float = 8.0):
    try:
        return urllib.request.urlopen(req, timeout=timeout, context=_get_ssl_context())
    except urllib.error.URLError as e:
        if "CERTIFICATE_VERIFY_FAILED" in str(e):
            return urllib.request.urlopen(req, timeout=timeout, context=ssl._create_unverified_context())
        raise

try:
    from agent_framework import FunctionTool
except ImportError:
    class FunctionTool:  # type: ignore
        def __init__(self, name: str, description: str, func: Any, input_model: Any = None, **kwargs: Any):
            self.name = name
            self.description = description
            self.func = func
            self.input_model = input_model
            self.approval_mode = kwargs.get("approval_mode", "never_require")

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:  # type: ignore
        def __init__(self, **kwargs: Any):
            for k, v in kwargs.items():
                setattr(self, k, v)

    def Field(default=None, description="", **kwargs):  # type: ignore
        return default

# 15-Minute Cache: query_hash -> (results, expires_at)
_SEARCH_CACHE: dict[str, tuple[list[dict[str, Any]], float]] = {}
CACHE_TTL_SECONDS = 15 * 60

# Rate limiting per company: company_id -> list of timestamps
_COMPANY_RATE_LIMITS: dict[str, list[float]] = {}
MAX_REQUESTS_PER_MINUTE = 10

# Task call counter: task_id -> count
_TASK_CALL_COUNTS: dict[str, int] = {}
MAX_CALLS_PER_TASK = 5

# Robots.txt cache: hostname -> (RobotFileParser, expires_at)
_ROBOTS_CACHE: dict[str, tuple[urllib.robotparser.RobotFileParser, float]] = {}
ROBOTS_TTL_SECONDS = 3600

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
    "medium.com",
    "businessinsider.com",
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


def _http_get_sync(url: str, headers: dict[str, str] | None = None, timeout: float = 8.0) -> tuple[int, str]:
    """Synchronous HTTP GET with timeout."""
    req_headers = {"User-Agent": BOT_USER_AGENT}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    with _safe_urlopen(req, timeout=timeout) as response:
        status = response.status
        content = response.read().decode("utf-8", errors="ignore")
        return status, content


def _http_post_sync(url: str, data: dict[str, Any], headers: dict[str, str] | None = None, timeout: float = 8.0) -> tuple[int, str]:
    """Synchronous HTTP POST with form data."""
    encoded_data = urllib.parse.urlencode(data).encode("utf-8")
    req_headers = {
        "User-Agent": BOT_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
    }
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=encoded_data, headers=req_headers)
    with _safe_urlopen(req, timeout=timeout) as response:
        status = response.status
        content = response.read().decode("utf-8", errors="ignore")
        return status, content


async def _check_robots_allowed(url: str, user_agent: str = "MaxP-Bot") -> bool:
    """Fetch and parse robots.txt for target hostname, caching parser for 1 hour."""
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        if not hostname or _is_private_host(hostname):
            return False

        now = time.time()
        if hostname in _ROBOTS_CACHE:
            rp, expires_at = _ROBOTS_CACHE[hostname]
            if now < expires_at:
                return rp.can_fetch(user_agent, url)

        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(robots_url)

        try:
            loop = asyncio.get_running_loop()
            status, text_body = await loop.run_in_executor(
                None, _http_get_sync, robots_url, None, 4.0
            )
            if status == 200:
                rp.parse(text_body.splitlines())
            else:
                rp.parse(["User-agent: *", "Allow: /"])
        except Exception:
            rp.parse(["User-agent: *", "Allow: /"])

        _ROBOTS_CACHE[hostname] = (rp, now + ROBOTS_TTL_SECONDS)
        return rp.can_fetch(user_agent, url)
    except Exception:
        return True


async def _log_audit_call(
    action: str,
    query_or_url: str,
    company_id: str | None,
    task_id: str | None,
    results_count: int,
    latency_ms: int,
    status: str,
    error_message: str | None = None,
) -> None:
    """Log search/fetch calls to database provider_logs / audit tables."""
    try:
        from src.db.session import async_session
        from sqlalchemy import text
        import uuid

        if not async_session:
            return

        async with async_session() as session:
            stmt = text("""
                INSERT INTO ai.provider_logs (
                    id, provider, company_id, scope, action, status, message, metadata, created_at
                ) VALUES (
                    :id, 'WEB_GATEWAY', :company_id, 'web_tools', :action, :status, :message, :metadata::jsonb, NOW()
                )
            """)
            meta = {
                "target": query_or_url,
                "taskId": task_id,
                "resultsCount": results_count,
                "latencyMs": latency_ms,
                "error": error_message,
                "costEGP": 0.0,
            }
            await session.execute(stmt, {
                "id": str(uuid.uuid4()),
                "company_id": company_id or "CENTRAL",
                "action": action,
                "status": status,
                "message": f"{action}: {query_or_url[:100]} ({status})",
                "metadata": json.dumps(meta),
            })
            await session.commit()
    except Exception:
        pass


class WebSearchInput(BaseModel):
    query: str = Field(description="Search query in Arabic or English")
    limit: int = Field(default=5, ge=1, le=10, description="Max search results to return (1-10)")
    task_id: str | None = Field(default=None, description="Current agent task ID to enforce maximum call limits")
    company_id: str | None = Field(default=None, description="Tenant ID (auto-injected)")


class WebFetchInput(BaseModel):
    url: str = Field(description="The web URL to fetch and convert into clean readable text")
    company_id: str | None = Field(default=None, description="Tenant ID (auto-injected)")
    task_id: str | None = Field(default=None, description="Current agent task ID (optional)")


async def web_search(input_data: WebSearchInput) -> dict[str, Any]:
    """Search the internet for real-time information, market data, and verifiable references."""
    start_ts = time.time()
    query = (getattr(input_data, "query", "") or "").strip()
    limit = getattr(input_data, "limit", 5) or 5
    task_id = getattr(input_data, "task_id", None)
    company_id = getattr(input_data, "company_id", None)

    if not query:
        return {"success": True, "count": 0, "results": [], "message": "Empty query"}

    # 1. Task Call Limit Guard
    if task_id and not _check_task_limit(task_id):
        latency_ms = int((time.time() - start_ts) * 1000)
        await _log_audit_call("web.search", query, company_id, task_id, 0, latency_ms, "LIMIT_EXCEEDED", "Task limit exceeded")
        return {
            "success": False,
            "error": "TASK_CALL_LIMIT_EXCEEDED",
            "message": f"Maximum {MAX_CALLS_PER_TASK} search calls exceeded for task. Aborted to prevent loop.",
            "results": [],
        }

    # 2. Rate Limit Guard
    if company_id and not _check_rate_limit(company_id):
        latency_ms = int((time.time() - start_ts) * 1000)
        await _log_audit_call("web.search", query, company_id, task_id, 0, latency_ms, "RATE_LIMITED", "Company rate limit exceeded")
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
            latency_ms = int((time.time() - start_ts) * 1000)
            res = cached_results[:limit]
            return {
                "success": True,
                "query": query,
                "count": len(res),
                "results": res,
                "cached": True,
                "latency_ms": latency_ms,
            }

    results: list[dict[str, Any]] = []
    loop = asyncio.get_running_loop()

    # 4. Attempt Provider Search if Vault Key exists in DB (public.ai_keys)
    provider_used = "WebSearchEngine"
    try:
        from src.llm.key_resolver import get_active_key
        serper_key = await get_active_key("SERPER")
        if serper_key:
            req_data = json.dumps({"q": query, "num": limit}).encode("utf-8")
            s_req = urllib.request.Request(
                "https://google.serper.dev/search",
                data=req_data,
                headers={"X-API-KEY": serper_key, "Content-Type": "application/json"}
            )
            def _run_serper():
                with urllib.request.urlopen(s_req, timeout=6.0) as r:
                    return json.loads(r.read().decode("utf-8"))
            s_data = await loop.run_in_executor(None, _run_serper)
            for org in s_data.get("organic", [])[:limit]:
                results.append({
                    "title": org.get("title", ""),
                    "link": org.get("link", ""),
                    "snippet": org.get("snippet", ""),
                    "date": org.get("date"),
                    "source": "Google (Serper)",
                })
            if results:
                provider_used = "Serper (Vault Key)"
    except Exception:
        pass

    # 5. Fallback Multi-Engine Web Search (DuckDuckGo Lite + Wikipedia)
    if not results:
        is_arabic = any("\u0600" <= c <= "\u06ff" for c in query)
        lang = "ar" if is_arabic else "en"

        # Source A: DuckDuckGo Lite
        def _fetch_ddg():
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                }
                status, html = _http_post_sync("https://lite.duckduckgo.com/lite/", {"q": query}, headers=headers, timeout=8.0)
                if status != 200:
                    return []
                link_matches = re.findall(
                    r'<a\s+[^>]*class=[\'"]result-link[\'"][^>]*href=[\'"]([^\'"]+)[\'"][^>]*>(.*?)</a>|<a\s+[^>]*href=[\'"]([^\'"]+)[\'"][^>]*class=[\'"]result-link[\'"][^>]*>(.*?)</a>',
                    html,
                    re.DOTALL | re.IGNORECASE,
                )
                snippet_matches = re.findall(
                    r'<td[^>]*class=[\'"]result-snippet[\'"][^>]*>(.*?)</td>',
                    html,
                    re.DOTALL | re.IGNORECASE,
                )
                parsed_res = []
                for i, m in enumerate(link_matches[:limit]):
                    raw_link = m[0] or m[2]
                    title_html = m[1] or m[3]
                    clean_link = raw_link
                    if "uddg=" in raw_link:
                        try:
                            clean_link = urllib.parse.unquote(raw_link.split("uddg=")[1].split("&")[0])
                        except Exception:
                            pass
                    clean_title = re.sub(r"<[^>]+>", "", title_html).strip()
                    clean_snippet = ""
                    if i < len(snippet_matches):
                        clean_snippet = re.sub(r"<[^>]+>", "", snippet_matches[i]).strip()

                    if clean_title and clean_link:
                        parsed_res.append({
                            "title": clean_title,
                            "link": clean_link,
                            "snippet": clean_snippet,
                            "date": None,
                            "source": "DuckDuckGo Web",
                        })
                return parsed_res
            except Exception:
                return []

        try:
            ddg_results = await loop.run_in_executor(None, _fetch_ddg)
            results.extend(ddg_results)
        except Exception:
            pass

        # Source B: Wikipedia API (for supplementary and factual queries)
        if len(results) < limit:
            def _fetch_wiki():
                try:
                    def _query_wiki(q_str: str) -> list[dict[str, Any]]:
                        w_url = (
                            f"https://{lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch="
                            f"{urllib.parse.quote(q_str)}&utf8=1&format=json&srlimit={limit - len(results)}"
                        )
                        status, w_html = _http_get_sync(w_url, timeout=6.0)
                        if status != 200:
                            return []
                        w_data = json.loads(w_html)
                        w_res = []
                        for item in w_data.get("query", {}).get("search", []):
                            clean_snippet = re.sub(r"<[^>]+>", "", item.get("snippet", "")).strip()
                            title = item.get("title", "")
                            link = f"https://{lang}.wikipedia.org/wiki/{title.replace(' ', '_')}"
                            w_res.append({
                                "title": title,
                                "link": link,
                                "snippet": clean_snippet,
                                "date": item.get("timestamp", "")[:10] if item.get("timestamp") else None,
                                "source": f"Wikipedia ({lang.upper()})",
                            })
                        return w_res

                    found = _query_wiki(query)
                    if not found and len(query.split()) > 3:
                        # Fallback to primary search terms
                        shorter = " ".join(query.split()[:3])
                        found = _query_wiki(shorter)
                    return found
                except Exception:
                    return []

            try:
                wiki_results = await loop.run_in_executor(None, _fetch_wiki)
                results.extend(wiki_results)
            except Exception:
                pass

    final_results = results[:limit]
    # Save to 15-minute cache
    _SEARCH_CACHE[q_hash] = (final_results, now + CACHE_TTL_SECONDS)

    latency_ms = int((time.time() - start_ts) * 1000)

    # Audit log call
    await _log_audit_call(
        "web.search",
        query,
        company_id,
        task_id,
        len(final_results),
        latency_ms,
        "SUCCESS" if final_results else "NO_RESULTS",
    )

    return {
        "success": True,
        "query": query,
        "count": len(final_results),
        "results": final_results,
        "cached": False,
        "latency_ms": latency_ms,
        "provider": provider_used,
    }


async def web_fetch(input_data: WebFetchInput) -> dict[str, Any]:
    """Fetch structured text from a webpage URL with SSRF, paywall, and robots.txt protection."""
    start_ts = time.time()
    raw_url = (getattr(input_data, "url", "") or "").strip()
    company_id = getattr(input_data, "company_id", None)
    task_id = getattr(input_data, "task_id", None)

    if not raw_url:
        return {"success": False, "error": "INVALID_URL", "message": "No URL provided."}

    try:
        parsed = urlparse(raw_url)
        # Ensure path and query are safely percent-encoded for non-ASCII characters (e.g. Arabic URLs)
        safe_path = urllib.parse.quote(urllib.parse.unquote(parsed.path), safe="/:@!$&'()*+,;=")
        safe_query = urllib.parse.quote(urllib.parse.unquote(parsed.query), safe="=&?/:@!$'()*+,;")
        raw_url = urllib.parse.urlunparse((
            parsed.scheme,
            parsed.netloc,
            safe_path,
            parsed.params,
            safe_query,
            parsed.fragment,
        ))
        parsed = urlparse(raw_url)
    except Exception:
        return {"success": False, "error": "INVALID_URL", "message": f"Malformed URL: {raw_url}"}

    if parsed.scheme not in {"http", "https"}:
        return {"success": False, "error": "SSRF_BLOCKED", "message": "Only HTTP/HTTPS allowed."}

    if _is_private_host(parsed.hostname or ""):
        latency_ms = int((time.time() - start_ts) * 1000)
        await _log_audit_call("web.fetch", raw_url, company_id, task_id, 0, latency_ms, "SSRF_BLOCKED")
        return {"success": False, "error": "SSRF_BLOCKED", "message": f"Private host forbidden: {parsed.hostname}"}

    # Reject paywalled domains
    hostname = (parsed.hostname or "").lower()
    if any(hostname == d or hostname.endswith("." + d) for d in PAYWALLED_DOMAINS):
        latency_ms = int((time.time() - start_ts) * 1000)
        await _log_audit_call("web.fetch", raw_url, company_id, task_id, 0, latency_ms, "PAYWALL_BLOCKED")
        return {"success": False, "error": "PAYWALLED_OR_RESTRICTED", "message": f"Domain '{hostname}' is paywalled or restricted."}

    # Respect robots.txt
    is_allowed = await _check_robots_allowed(raw_url, user_agent="MaxP-Bot")
    if not is_allowed:
        latency_ms = int((time.time() - start_ts) * 1000)
        await _log_audit_call("web.fetch", raw_url, company_id, task_id, 0, latency_ms, "ROBOTS_TXT_DISALLOWED")
        return {"success": False, "error": "ROBOTS_TXT_DISALLOWED", "message": "Web scraping disallowed by site robots.txt policy."}

    try:
        loop = asyncio.get_running_loop()
        def _fetch_page():
            req = urllib.request.Request(raw_url, headers={"User-Agent": BOT_USER_AGENT})
            with _safe_urlopen(req, timeout=8.0) as resp:
                return resp.status, resp.read().decode("utf-8", errors="ignore")

        try:
            status_code, html = await loop.run_in_executor(None, _fetch_page)
        except urllib.error.HTTPError as he:
            latency_ms = int((time.time() - start_ts) * 1000)
            status_desc = "ACCESS_DENIED" if he.code in {401, 402, 403} else "HTTP_ERROR"
            await _log_audit_call("web.fetch", raw_url, company_id, task_id, 0, latency_ms, status_desc)
            return {"success": False, "error": status_desc, "statusCode": he.code}
        except TimeoutError:
            latency_ms = int((time.time() - start_ts) * 1000)
            await _log_audit_call("web.fetch", raw_url, company_id, task_id, 0, latency_ms, "TIMEOUT")
            return {"success": False, "error": "TIMEOUT", "message": "Request timed out after 8.0s"}

        # Extract title
        title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else parsed.hostname or raw_url
        title = re.sub(r"\s+", " ", title)

        # Strip non-content blocks
        clean = re.sub(r"<(script|style|svg|nav|footer|header|aside|form)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
        clean = re.sub(r"<[^>]+>", " ", clean)
        clean = re.sub(r"&[a-zA-Z0-9#]+;", " ", clean)
        clean = re.sub(r"\s+", " ", clean).strip()

        capped = clean[:15000]
        latency_ms = int((time.time() - start_ts) * 1000)

        await _log_audit_call("web.fetch", raw_url, company_id, task_id, 1, latency_ms, "SUCCESS")

        return {
            "success": True,
            "url": raw_url,
            "title": title,
            "content": capped,
            "length": len(capped),
            "word_count": len(capped.split()),
            "latency_ms": latency_ms,
        }
    except Exception as e:
        latency_ms = int((time.time() - start_ts) * 1000)
        err_str = str(e)
        if "timed out" in err_str.lower() or "timeout" in err_str.lower():
            await _log_audit_call("web.fetch", raw_url, company_id, task_id, 0, latency_ms, "TIMEOUT")
            return {"success": False, "error": "TIMEOUT", "message": "Request timed out"}
        await _log_audit_call("web.fetch", raw_url, company_id, task_id, 0, latency_ms, "FETCH_ERROR", err_str)
        return {"success": False, "error": "FETCH_ERROR", "message": err_str}


web_search_tool = FunctionTool(
    name="web_search",
    description="Search the internet for real-time information, market data, and verifiable references. Returns title, link, snippet, and date.",
    func=web_search,
    input_model=WebSearchInput,
)

web_fetch_tool = FunctionTool(
    name="web_fetch",
    description="Fetch and extract structured clean text from a web URL with SSRF filtering, robots.txt compliance, and paywall protection.",
    func=web_fetch,
    input_model=WebFetchInput,
)

__all_tools__ = [
    web_search_tool,
    web_fetch_tool,
]
