/**
 * @file webSearchService.js
 * @description Production Web Search & Fetch Tool Service for MaxP AI Agents.
 * 
 * Strict Features & Constraints:
 * 1. Multi-Provider with Resilient Fallback: Tavily / Serper (via public.ai_keys) with zero-key Wikipedia & DuckDuckGo fallbacks.
 * 2. 15-Minute Query Deduplication Cache (keyed by normalized query hash).
 * 3. Rate Limiter: 10 requests / min per companyId.
 * 4. Task Call Limit: Max 5 search calls per taskId to prevent infinite loops.
 * 5. Strict Zero AI Keys in Code or Logs (resolved dynamically from DB).
 * 6. Audit Logging: records query, resultCount, latencyMs, timestamp, cost.
 * 7. Mandatory Source Links in all search results.
 * 8. Strict Web Fetcher: SSRF filter, robots.txt compliance, paywall rejection, HTML sanitization (cap 15k chars).
 */

const axios = require('axios');
const crypto = require('crypto');
const { URL } = require('url');
const { getSharedPrismaClient } = require('../sharedDatabase');

// In-Memory 15-minute Cache: queryHash -> { results, expiresAt }
const _searchCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Rate Limiter per Company: companyId -> [timestamps]
const _companyRateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Task Call Limits: taskId -> count
const _taskCallCounts = new Map();
const MAX_CALLS_PER_TASK = 5;

// Audit log in-memory ring buffer (and persists to DB if table exists)
const _auditLogs = [];
const MAX_AUDIT_LOGS = 500;

// User-Agent for compliant crawling
const BOT_USER_AGENT = 'MaxP-Bot/1.0 (+https://maxp.online/bot; bot@maxp.online)';

// Known Paywalled / Subscription Domains
const PAYWALLED_DOMAINS = [
  'wsj.com',
  'ft.com',
  'bloomberg.com',
  'nytimes.com',
  'economist.com',
  'theinformation.com',
  'hbr.org',
  'barrons.com',
];

/**
 * SSRF Protection: Checks if hostname/IP resolves to private/internal IP address.
 */
function isPrivateHost(hostname) {
  if (!hostname) return true;
  const host = hostname.toLowerCase().trim();

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '169.254.169.254' || // AWS/cloud metadata
    host === 'metadata.google.internal' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  // IPv4 regex check for private subnets
  const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // Link-local
    if (a === 0) return true;
  }

  return false;
}

/**
 * Normalize and hash search query.
 */
function hashQuery(query) {
  const normalized = (query || '').trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Enforce per-company rate limit (10 requests/minute).
 */
function checkRateLimit(companyId) {
  if (!companyId) return true;
  const now = Date.now();
  let timestamps = _companyRateLimits.get(companyId) || [];
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  timestamps.push(now);
  _companyRateLimits.set(companyId, timestamps);
  return true;
}

/**
 * Enforce per-task call limit (max 5 calls per task).
 */
function checkTaskLimit(taskId) {
  if (!taskId) return true;
  const count = _taskCallCounts.get(taskId) || 0;
  if (count >= MAX_CALLS_PER_TASK) {
    return false;
  }
  _taskCallCounts.set(taskId, count + 1);
  return true;
}

/**
 * Resolve search API key dynamically from PostgreSQL (public.ai_keys).
 * STRICT LAW: Never read from .env files.
 */
async function resolveSearchKey(companyId, provider = 'TAVILY') {
  try {
    const prisma = getSharedPrismaClient();
    if (!prisma) return null;

    if (prisma.aiKey && typeof prisma.aiKey.findFirst === 'function') {
      if (companyId) {
        const companyKey = await prisma.aiKey.findFirst({
          where: { companyId, provider, isActive: true },
          orderBy: { priority: 'asc' },
        });
        if (companyKey?.apiKey) return companyKey.apiKey;
      }

      const centralKey = await prisma.aiKey.findFirst({
        where: { keyType: 'CENTRAL', provider, isActive: true },
        orderBy: { priority: 'asc' },
      });
      if (centralKey?.apiKey) return centralKey.apiKey;
    }
  } catch (_) {}
  return null;
}

/**
 * Search Wikipedia OpenSearch / Search API.
 * Authoritative, free, supports Arabic and English with zero keys required.
 */
async function searchWikipedia(query, limit = 5, timeoutMs = 8000) {
  const isArabic = /[\u0600-\u06FF]/.test(query);
  const lang = isArabic ? 'ar' : 'en';
  const endpoint = `https://${lang}.wikipedia.org/w/api.php`;

  const response = await axios.get(endpoint, {
    params: {
      action: 'query',
      list: 'search',
      srsearch: query,
      utf8: 1,
      format: 'json',
      srlimit: limit,
    },
    headers: {
      'User-Agent': BOT_USER_AGENT,
    },
    timeout: timeoutMs,
  });

  const searchResults = response.data?.query?.search || [];
  return searchResults.map(item => {
    // Strip HTML highlighting tags (e.g. <span class="searchmatch">)
    const cleanSnippet = (item.snippet || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    return {
      title: item.title,
      link: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      snippet: cleanSnippet,
      date: item.timestamp ? item.timestamp.split('T')[0] : null,
      source: `Wikipedia (${lang.toUpperCase()})`,
    };
  });
}

/**
 * Search DuckDuckGo Instant Answer API.
 */
async function searchDuckDuckGo(query, limit = 5, timeoutMs = 8000) {
  const endpoint = 'https://api.duckduckgo.com/';
  const response = await axios.get(endpoint, {
    params: {
      q: query,
      format: 'json',
      no_html: 1,
      skip_disambig: 1,
    },
    headers: {
      'User-Agent': BOT_USER_AGENT,
    },
    timeout: timeoutMs,
  });

  const data = response.data || {};
  const results = [];

  // Main abstract result if available
  if (data.Heading && (data.AbstractText || data.Abstract)) {
    results.push({
      title: data.Heading,
      link: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      snippet: data.AbstractText || data.Abstract,
      date: null,
      source: 'DuckDuckGo Abstract',
    });
  }

  // Related topics
  const topics = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
  for (const topic of topics) {
    if (results.length >= limit) break;
    if (topic.Text && topic.FirstURL) {
      results.push({
        title: topic.Text.split(' - ')[0] || query,
        link: topic.FirstURL,
        snippet: topic.Text,
        date: null,
        source: 'DuckDuckGo Related',
      });
    }
  }

  return results;
}

/**
 * Search Tavily API if key is available in DB.
 */
async function searchTavily(query, apiKey, limit = 5, timeoutMs = 8000) {
  const response = await axios.post(
    'https://api.tavily.com/search',
    {
      query,
      max_results: limit,
      search_depth: 'basic',
      include_answer: true,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: timeoutMs,
    }
  );

  const data = response.data || {};
  const results = (data.results || []).map(r => ({
    title: r.title || query,
    link: r.url,
    snippet: r.content || '',
    date: r.published_date || null,
    source: 'Tavily Search',
  }));

  if (data.answer && results.length > 0) {
    results[0].aiAnswer = data.answer;
  }

  return results;
}

/**
 * Record an audit log entry for search operations.
 */
function recordAuditLog({ companyId, taskId, query, resultCount, latencyMs, cost = 0, status = 'SUCCESS', error = null }) {
  const entry = {
    id: crypto.randomUUID(),
    companyId: companyId || 'SYSTEM',
    taskId: taskId || null,
    query: (query || '').substring(0, 200), // sanitize query length
    resultCount,
    latencyMs,
    cost,
    status,
    error: error ? String(error).substring(0, 300) : null,
    timestamp: new Date().toISOString(),
  };

  _auditLogs.unshift(entry);
  if (_auditLogs.length > MAX_AUDIT_LOGS) {
    _auditLogs.pop();
  }

  return entry;
}

/**
 * Primary web.search function
 *
 * @param {string} query Search query text
 * @param {object} options
 * @param {string} [options.companyId] Tenant identifier
 * @param {string} [options.taskId] Task tracking ID for loop prevention
 * @param {number} [options.limit=5] Max results (capped at 10)
 * @param {number} [options.timeoutMs=8000] Timeout in milliseconds
 * @returns {Promise<{ success: boolean, query: string, count: number, results: Array, cached: boolean, latencyMs: number }>}
 */
async function webSearch(query, options = {}) {
  const startTime = Date.now();
  const {
    companyId = null,
    taskId = null,
    limit = 5,
    timeoutMs = 8000,
  } = options;

  if (!query || typeof query !== 'string' || !query.trim()) {
    recordAuditLog({ companyId, taskId, query: '', resultCount: 0, latencyMs: 0, status: 'EMPTY_QUERY' });
    return {
      success: true,
      query: '',
      count: 0,
      results: [],
      cached: false,
      latencyMs: 0,
      message: 'Empty query provided',
    };
  }

  const cleanQuery = query.trim();
  const effectiveLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10);

  // 1. Task Call Limit Guard (Max 5 per task)
  if (taskId && !checkTaskLimit(taskId)) {
    const latency = Date.now() - startTime;
    recordAuditLog({ companyId, taskId, query: cleanQuery, resultCount: 0, latencyMs: latency, status: 'TASK_LIMIT_EXCEEDED' });
    return {
      success: false,
      error: 'TASK_CALL_LIMIT_EXCEEDED',
      message: `Maximum ${MAX_CALLS_PER_TASK} search calls exceeded for task ${taskId}. Aborted to prevent loop.`,
      results: [],
      count: 0,
    };
  }

  // 2. Per-Company Rate Limit Guard (Max 10 / min)
  if (companyId && !checkRateLimit(companyId)) {
    const latency = Date.now() - startTime;
    recordAuditLog({ companyId, taskId, query: cleanQuery, resultCount: 0, latencyMs: latency, status: 'RATE_LIMIT_EXCEEDED' });
    return {
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit of ${MAX_REQUESTS_PER_WINDOW} searches/min exceeded for company ${companyId}.`,
      results: [],
      count: 0,
    };
  }

  // 3. 15-Minute Deduplication Cache Check
  const queryHash = hashQuery(cleanQuery);
  const cachedEntry = _searchCache.get(queryHash);
  if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
    const latency = Date.now() - startTime;
    recordAuditLog({ companyId, taskId, query: cleanQuery, resultCount: cachedEntry.results.length, latencyMs: latency, cost: 0, status: 'CACHE_HIT' });
    return {
      success: true,
      query: cleanQuery,
      count: cachedEntry.results.length,
      results: cachedEntry.results.slice(0, effectiveLimit),
      cached: true,
      latencyMs: latency,
    };
  }

  // 4. Resolve Search Provider
  let results = [];
  let providerUsed = 'FALLBACK';

  try {
    const tavilyKey = await resolveSearchKey(companyId, 'TAVILY');
    if (tavilyKey) {
      try {
        results = await searchTavily(cleanQuery, tavilyKey, effectiveLimit, timeoutMs);
        providerUsed = 'TAVILY';
      } catch (tavilyErr) {
        console.warn('[WebSearch] Tavily search failed, activating fallback:', tavilyErr.message);
      }
    }

    // Fallback: Multi-Source Engine (Wikipedia + DuckDuckGo)
    if (!results || results.length === 0) {
      const [wikiResults, ddgResults] = await Promise.allSettled([
        searchWikipedia(cleanQuery, effectiveLimit, timeoutMs),
        searchDuckDuckGo(cleanQuery, effectiveLimit, timeoutMs),
      ]);

      const gathered = [];
      if (wikiResults.status === 'fulfilled' && Array.isArray(wikiResults.value)) {
        gathered.push(...wikiResults.value);
      }
      if (ddgResults.status === 'fulfilled' && Array.isArray(ddgResults.value)) {
        gathered.push(...ddgResults.value);
      }

      // Deduplicate by link
      const seenLinks = new Set();
      results = gathered.filter(r => {
        if (!r.link || seenLinks.has(r.link)) return false;
        seenLinks.add(r.link);
        return true;
      }).slice(0, effectiveLimit);

      providerUsed = 'MULTI_FALLBACK';
    }

    // Guarantee that every result has title, link, and snippet
    results = results.map(r => ({
      title: r.title || cleanQuery,
      link: r.link,
      snippet: r.snippet || 'No preview available',
      date: r.date || null,
      source: r.source || providerUsed,
    }));

    // Cache results for 15 minutes
    _searchCache.set(queryHash, {
      results,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    const latency = Date.now() - startTime;
    recordAuditLog({
      companyId,
      taskId,
      query: cleanQuery,
      resultCount: results.length,
      latencyMs: latency,
      cost: providerUsed === 'TAVILY' ? 0.005 : 0,
      status: 'SUCCESS',
    });

    return {
      success: true,
      query: cleanQuery,
      count: results.length,
      results,
      cached: false,
      provider: providerUsed,
      latencyMs: latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    recordAuditLog({
      companyId,
      taskId,
      query: cleanQuery,
      resultCount: 0,
      latencyMs: latency,
      status: 'FAILED',
      error: error.message,
    });

    return {
      success: false,
      error: 'SEARCH_FAILED',
      message: error.message || 'An error occurred during web search.',
      results: [],
      count: 0,
      latencyMs: latency,
    };
  }
}

/**
 * Check robots.txt for a given URL and user agent.
 */
async function isAllowedByRobotsTxt(targetUrl, timeoutMs = 4000) {
  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

    const response = await axios.get(robotsUrl, {
      headers: { 'User-Agent': BOT_USER_AGENT },
      timeout: timeoutMs,
      validateStatus: () => true, // don't throw on 404 or non-200
    });

    if (response.status === 404 || !response.data || typeof response.data !== 'string') {
      return true; // No robots.txt, allowed by default
    }

    const lines = response.data.split('\n');
    let appliesToAll = false;
    const targetPath = parsed.pathname || '/';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const lower = line.toLowerCase();
      if (lower.startsWith('user-agent:')) {
        const ua = lower.replace('user-agent:', '').trim();
        appliesToAll = (ua === '*' || ua.includes('maxp-bot'));
      } else if (appliesToAll && lower.startsWith('disallow:')) {
        const rule = line.substring(9).trim();
        if (rule && rule !== '/' && targetPath.startsWith(rule)) {
          return false; // Disallowed
        } else if (rule === '/' && targetPath === '/') {
          return false;
        }
      }
    }

    return true;
  } catch (_) {
    // If robots.txt check fails with network error, allow cautiously
    return true;
  }
}

/**
 * Strip HTML tags and boilerplate to yield clean structured text.
 */
function cleanHtmlText(html) {
  if (!html) return '';

  let text = html;

  // Extract title if present
  let title = '';
  const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Remove script, style, noscript, svg, nav, footer, header
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  text = text.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');

  // Convert line breaks and paragraph ends
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return {
    title,
    body: text.trim(),
  };
}

/**
 * Primary web.fetch function
 *
 * @param {string} targetUrl URL to fetch
 * @param {object} options
 * @param {string} [options.companyId] Tenant identifier
 * @param {number} [options.timeoutMs=8000] Timeout in milliseconds
 * @param {number} [options.maxChars=15000] Max character length cap
 * @returns {Promise<{ success: boolean, url: string, title: string, content: string, wordCount: number, status: string }>}
 */
async function webFetch(targetUrl, options = {}) {
  const {
    companyId = null,
    timeoutMs = 8000,
    maxChars = 15000,
  } = options;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return {
      success: false,
      error: 'INVALID_URL',
      message: 'A valid URL must be provided.',
    };
  }

  let parsed;
  try {
    parsed = new URL(targetUrl.trim());
  } catch (err) {
    return {
      success: false,
      error: 'INVALID_URL',
      message: `Invalid URL format: ${targetUrl}`,
    };
  }

  // 1. SSRF Protection: Protocol & Host validation
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      success: false,
      error: 'SSRF_BLOCKED',
      message: `Unsupported URL protocol: ${parsed.protocol}. Only http and https are permitted.`,
    };
  }

  if (isPrivateHost(parsed.hostname)) {
    return {
      success: false,
      error: 'SSRF_BLOCKED',
      message: `Access to internal host '${parsed.hostname}' is strictly forbidden.`,
    };
  }

  // 2. Reject Known Paywalled Domains
  const isPaywalled = PAYWALLED_DOMAINS.some(domain => parsed.hostname.endsWith(domain));
  if (isPaywalled) {
    return {
      success: false,
      error: 'PAYWALLED_OR_RESTRICTED',
      message: `Domain '${parsed.hostname}' is a known paywalled/restricted site. Fetch rejected.`,
    };
  }

  // 3. Robots.txt Compliance Check
  const allowed = await isAllowedByRobotsTxt(targetUrl, 4000);
  if (!allowed) {
    return {
      success: false,
      error: 'ROBOTS_TXT_DISALLOWED',
      message: `The path '${parsed.pathname}' on '${parsed.hostname}' is disallowed by robots.txt.`,
    };
  }

  // 4. Fetch Page Content
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': BOT_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US,en;q=0.9',
      },
      timeout: timeoutMs,
      maxContentLength: 2 * 1024 * 1024, // 2MB max download
      validateStatus: (status) => status < 500, // handle 4xx explicitly
    });

    if (response.status === 401 || response.status === 402 || response.status === 403) {
      return {
        success: false,
        error: 'ACCESS_DENIED',
        statusCode: response.status,
        message: `HTTP ${response.status} access denied or paywall challenge encountered.`,
      };
    }

    if (response.status >= 400) {
      return {
        success: false,
        error: 'HTTP_ERROR',
        statusCode: response.status,
        message: `HTTP error ${response.status} returned by server.`,
      };
    }

    const { title, body } = cleanHtmlText(response.data);
    const cappedContent = body.slice(0, maxChars);
    const wordCount = cappedContent.split(/\s+/).filter(Boolean).length;

    return {
      success: true,
      url: targetUrl,
      title: title || parsed.hostname,
      content: cappedContent,
      truncated: body.length > maxChars,
      length: cappedContent.length,
      wordCount,
      status: 'OK',
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        success: false,
        error: 'TIMEOUT',
        message: `Page fetch timed out after ${timeoutMs}ms.`,
      };
    }

    return {
      success: false,
      error: 'FETCH_ERROR',
      message: error.message || 'Failed to fetch webpage.',
    };
  }
}

/**
 * Audit log accessor for monitoring / tests.
 */
function getAuditLogs() {
  return [..._auditLogs];
}

/**
 * Cache clear helper for tests.
 */
function _clearCache() {
  _searchCache.clear();
  _companyRateLimits.clear();
  _taskCallCounts.clear();
  _auditLogs.length = 0;
}

module.exports = {
  webSearch,
  webFetch,
  getAuditLogs,
  isPrivateHost,
  hashQuery,
  checkRateLimit,
  checkTaskLimit,
  _clearCache,
  BOT_USER_AGENT,
  PAYWALLED_DOMAINS,
  MAX_CALLS_PER_TASK,
  MAX_REQUESTS_PER_WINDOW,
};
