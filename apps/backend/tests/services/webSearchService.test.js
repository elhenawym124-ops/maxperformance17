/**
 * @file webSearchService.test.js
 * @description Comprehensive Test Suite for Web Search & Fetch Tool Service.
 */

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
  get: (...args) => mockAxiosGet(...args),
  post: (...args) => mockAxiosPost(...args),
}));

const {
  webSearch,
  webFetch,
  getAuditLogs,
  isPrivateHost,
  hashQuery,
  _clearCache,
  MAX_CALLS_PER_TASK,
  MAX_REQUESTS_PER_WINDOW,
} = require('../../services/tools/webSearchService');

describe('WebSearchService - Production Tool Verification Suite', () => {
  beforeEach(() => {
    _clearCache();
    mockAxiosGet.mockReset();
    mockAxiosPost.mockReset();
  });

  describe('1. Query Handling & Edge Cases', () => {
    test('handles empty or whitespace-only queries cleanly', async () => {
      const res1 = await webSearch('');
      expect(res1.success).toBe(true);
      expect(res1.count).toBe(0);
      expect(res1.results).toEqual([]);

      const res2 = await webSearch('   ');
      expect(res2.success).toBe(true);
      expect(res2.count).toBe(0);
      expect(res2.results).toEqual([]);
    });

    test('hashes normalized query for deduplication', () => {
      const h1 = hashQuery('  مصر اليوم  ');
      const h2 = hashQuery('مصر اليوم');
      expect(h1).toBe(h2);

      const h3 = hashQuery('Egypt Prices');
      const h4 = hashQuery('egypt prices');
      expect(h3).toBe(h4);
    });
  });

  describe('2. Rate Limiting & Loop Prevention Guards', () => {
    test('enforces per-company rate limit (10 requests per minute)', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          query: {
            search: [
              { title: 'Test Article', snippet: 'Test snippet', timestamp: '2026-01-01T00:00:00Z' }
            ]
          }
        }
      });

      const companyId = 'tenant_rate_test_1';
      // First 10 calls should succeed (or hit cache if query repeated)
      for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
        const res = await webSearch(`query unique ${i}`, { companyId });
        expect(res.success).toBe(true);
      }

      // 11th call must be blocked by rate limiter
      const blockedRes = await webSearch('query unique 11', { companyId });
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(blockedRes.message).toContain('Rate limit');
    });

    test('enforces per-task call limit (maximum 5 calls per task to prevent loops)', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          query: {
            search: [
              { title: 'Result', snippet: 'Snippet', timestamp: '2026-01-01T00:00:00Z' }
            ]
          }
        }
      });

      const taskId = 'task_loop_prevention_xyz';
      for (let i = 0; i < MAX_CALLS_PER_TASK; i++) {
        const res = await webSearch(`step search ${i}`, { taskId });
        expect(res.success).toBe(true);
      }

      // 6th call on same task must be blocked
      const loopBlocked = await webSearch('step search 6', { taskId });
      expect(loopBlocked.success).toBe(false);
      expect(loopBlocked.error).toBe('TASK_CALL_LIMIT_EXCEEDED');
      expect(loopBlocked.message).toContain('Maximum 5 search calls exceeded');
    });
  });

  describe('3. 15-Minute Deduplication Cache', () => {
    test('returns cached results on repeated queries without new HTTP requests', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          query: {
            search: [
              { title: 'Cache Test 1', snippet: 'Cached snippet', timestamp: '2026-02-01T00:00:00Z' }
            ]
          }
        }
      });

      const query = 'سعر الدولار اليوم';
      const firstRes = await webSearch(query, { companyId: 'tenant_cache_1' });
      expect(firstRes.success).toBe(true);
      expect(firstRes.cached).toBe(false);
      expect(mockAxiosGet).toHaveBeenCalled();

      const callCountAfterFirst = mockAxiosGet.mock.calls.length;

      // Second identical call within 15 mins
      const secondRes = await webSearch(query, { companyId: 'tenant_cache_1' });
      expect(secondRes.success).toBe(true);
      expect(secondRes.cached).toBe(true);
      expect(secondRes.results[0].title).toBe('Cache Test 1');
      // No extra HTTP calls should be made
      expect(mockAxiosGet.mock.calls.length).toBe(callCountAfterFirst);
    });
  });

  describe('4. SSRF & Security Filters on web.fetch', () => {
    test('identifies and blocks private hosts and IP ranges', () => {
      expect(isPrivateHost('localhost')).toBe(true);
      expect(isPrivateHost('127.0.0.1')).toBe(true);
      expect(isPrivateHost('10.0.1.5')).toBe(true);
      expect(isPrivateHost('192.168.1.100')).toBe(true);
      expect(isPrivateHost('172.20.0.1')).toBe(true);
      expect(isPrivateHost('169.254.169.254')).toBe(true);
      expect(isPrivateHost('service.internal')).toBe(true);
      expect(isPrivateHost('example.com')).toBe(false);
      expect(isPrivateHost('ar.wikipedia.org')).toBe(false);
    });

    test('webFetch rejects SSRF attempts to private hosts and localhost', async () => {
      const resLocal = await webFetch('http://localhost:3000/api/secret');
      expect(resLocal.success).toBe(false);
      expect(resLocal.error).toBe('SSRF_BLOCKED');

      const resMeta = await webFetch('http://169.254.169.254/latest/meta-data/');
      expect(resMeta.success).toBe(false);
      expect(resMeta.error).toBe('SSRF_BLOCKED');

      const resFtp = await webFetch('ftp://example.com/file.txt');
      expect(resFtp.success).toBe(false);
      expect(resFtp.error).toBe('SSRF_BLOCKED');
    });

    test('webFetch rejects known paywalled and subscription domains', async () => {
      const resWsj = await webFetch('https://www.wsj.com/articles/markets-today');
      expect(resWsj.success).toBe(false);
      expect(resWsj.error).toBe('PAYWALLED_OR_RESTRICTED');

      const resFt = await webFetch('https://www.ft.com/content/12345');
      expect(resFt.success).toBe(false);
      expect(resFt.error).toBe('PAYWALLED_OR_RESTRICTED');
    });
  });

  describe('5. HTML Sanitization & Structuring on web.fetch', () => {
    test('strips scripts, styles, nav, and footers, returning clean structured text', async () => {
      const rawHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>E-commerce Trends 2026</title>
            <style>body { color: red; }</style>
            <script>console.log("secret tracker");</script>
          </head>
          <body>
            <header>Header Banner</header>
            <nav><a href="/">Home</a><a href="/shop">Shop</a></nav>
            <main>
              <h1>The Future of Egyptian Commerce</h1>
              <p>Direct-to-consumer fashion is booming in Cairo and Alexandria.</p>
              <p>Cash on delivery remains popular, but InstaPay has grown 400%.</p>
            </main>
            <footer>Footer copyright and links</footer>
          </body>
        </html>
      `;

      // Mock robots.txt check and page body
      mockAxiosGet.mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('robots.txt')) {
          return Promise.resolve({ status: 200, data: 'User-agent: *\nAllow: /' });
        }
        return Promise.resolve({
          status: 200,
          data: rawHtml,
        });
      });

      const res = await webFetch('https://ecommerce-insight.org/trends-2026');
      expect(res.success).toBe(true);
      expect(res.title).toBe('E-commerce Trends 2026');
      expect(res.content).toContain('The Future of Egyptian Commerce');
      expect(res.content).toContain('InstaPay has grown 400%');
      expect(res.content).not.toContain('console.log');
      expect(res.content).not.toContain('Header Banner');
      expect(res.content).not.toContain('Footer copyright');
      expect(res.wordCount).toBeGreaterThan(10);
    });

    test('handles timeout failures gracefully', async () => {
      mockAxiosGet.mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('robots.txt')) {
          return Promise.resolve({ status: 200, data: 'User-agent: *\nAllow: /' });
        }
        const err = new Error('timeout of 8000ms exceeded');
        err.code = 'ECONNABORTED';
        return Promise.reject(err);
      });

      const res = await webFetch('https://slow-server.com/page', { timeoutMs: 8000 });
      expect(res.success).toBe(false);
      expect(res.error).toBe('TIMEOUT');
      expect(res.message).toContain('timed out');
    });
  });

  describe('6. Audit Logging & Zero Key Exposure', () => {
    test('records operations in audit logs with zero API keys or secrets', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          query: {
            search: [
              { title: 'Gold Rates', snippet: 'Daily gold prices', timestamp: '2026-03-01T00:00:00Z' }
            ]
          }
        }
      });

      await webSearch('اسعار الذهب في مصر اليوم', { companyId: 'tenant_audit_test' });

      const logs = getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      const latest = logs[0];
      expect(latest.companyId).toBe('tenant_audit_test');
      expect(latest.query).toBe('اسعار الذهب في مصر اليوم');
      expect(latest.resultCount).toBeGreaterThanOrEqual(1);
      expect(latest.latencyMs).toBeGreaterThanOrEqual(0);
      expect(latest.timestamp).toBeDefined();

      // Verify no API keys are present in log object
      const logString = JSON.stringify(logs);
      expect(logString).not.toContain('Bearer');
      expect(logString).not.toContain('apiKey');
      expect(logString).not.toContain('tvly-');
      expect(logString).not.toContain('AIza');
    });
  });
});
