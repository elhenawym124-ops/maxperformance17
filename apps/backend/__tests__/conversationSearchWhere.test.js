const {
  extractContentTokens,
  buildConversationSearchWhere,
  searchMessageConversationIds,
  SEARCH_STATEMENT_TIMEOUT_MS,
} = require('../controller/conversation/conversationSearchWhere');

describe('conversationSearchWhere', () => {
  describe('buildConversationSearchWhere', () => {
    it("buildConversationSearchWhere('') and ('   ') → null", () => {
      expect(buildConversationSearchWhere('')).toBeNull();
      expect(buildConversationSearchWhere('   ')).toBeNull();
      expect(buildConversationSearchWhere(null)).toBeNull();
      expect(buildConversationSearchWhere(undefined)).toBeNull();
    });

    it("buildConversationSearchWhere('ahmed') → one OR group with exactly 4 branches; the three text branches carry mode: 'insensitive', the phone branch does not", () => {
      const result = buildConversationSearchWhere('ahmed');
      expect(result).toBeDefined();
      expect(result.AND).toBeDefined();
      expect(result.AND).toHaveLength(1);

      const orBranches = result.AND[0].OR;
      expect(orBranches).toHaveLength(4);

      const preview = orBranches.find((b) => b.lastMessagePreview);
      const firstName = orBranches.find((b) => b.customer && b.customer.firstName);
      const lastName = orBranches.find((b) => b.customer && b.customer.lastName);
      const phone = orBranches.find((b) => b.customer && b.customer.phone);

      expect(preview).toEqual({
        lastMessagePreview: { contains: 'ahmed', mode: 'insensitive' },
      });
      expect(firstName).toEqual({
        customer: { firstName: { contains: 'ahmed', mode: 'insensitive' } },
      });
      expect(lastName).toEqual({
        customer: { lastName: { contains: 'ahmed', mode: 'insensitive' } },
      });
      expect(phone).toEqual({
        customer: { phone: { contains: 'ahmed' } },
      });
      expect(phone.customer.phone.mode).toBeUndefined();
    });

    it("buildConversationSearchWhere('Menna Mansour') → two OR groups inside AND (firstName Menna, lastName Mansour)", () => {
      const result = buildConversationSearchWhere('Menna Mansour');
      expect(result).toBeDefined();
      expect(result.AND).toHaveLength(2);

      const group1 = result.AND[0].OR;
      const group2 = result.AND[1].OR;

      expect(group1).toHaveLength(4);
      expect(group2).toHaveLength(4);

      expect(group1.some((b) => b.customer?.firstName?.contains === 'Menna' && b.customer?.firstName?.mode === 'insensitive')).toBe(true);
      expect(group2.some((b) => b.customer?.lastName?.contains === 'Mansour' && b.customer?.lastName?.mode === 'insensitive')).toBe(true);
    });

    it('no branch anywhere is a messages relation filter', () => {
      const result1 = buildConversationSearchWhere('ahmed');
      const result2 = buildConversationSearchWhere('Menna Mansour');

      const containsMessagesRelation = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        if (Object.prototype.hasOwnProperty.call(obj, 'messages')) return true;
        return Object.values(obj).some((val) => containsMessagesRelation(val));
      };

      expect(containsMessagesRelation(result1)).toBe(false);
      expect(containsMessagesRelation(result2)).toBe(false);
      expect(JSON.stringify(result2)).not.toContain('"messages"');
    });
  });

  describe('extractContentTokens', () => {
    it("extractContentTokens('ab cd') → []", () => {
      expect(extractContentTokens('ab cd')).toEqual([]);
    });

    it("extractContentTokens drops tokens under 3 chars ('ahmed mo') → ['ahmed'] and keeps 3+ chars for pg_trgm", () => {
      expect(extractContentTokens('ahmed mo')).toEqual(['ahmed']);
      // 'moh' has length 3, fulfilling the pg_trgm >= 3 requirement
      const mohResult = extractContentTokens('ahmed moh');
      expect(mohResult).toEqual(['ahmed', 'moh']);
    });

    it("extractContentTokens('menna mansour') → both", () => {
      expect(extractContentTokens('menna mansour')).toEqual(['menna', 'mansour']);
    });

    it('returns empty array for empty / whitespace / non-string input', () => {
      expect(extractContentTokens('')).toEqual([]);
      expect(extractContentTokens('   ')).toEqual([]);
      expect(extractContentTokens(null)).toEqual([]);
      expect(extractContentTokens(undefined)).toEqual([]);
    });
  });

  describe('searchMessageConversationIds', () => {
    it('returns empty array if search term is empty or has no content tokens', async () => {
      const mockPrisma = { $queryRawUnsafe: jest.fn() };
      const res1 = await searchMessageConversationIds(mockPrisma, { companyId: 'comp1', search: '' });
      const res2 = await searchMessageConversationIds(mockPrisma, { companyId: 'comp1', search: 'ab' });
      const res3 = await searchMessageConversationIds(null, { companyId: 'comp1', search: 'valid' });

      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
      expect(res3).toEqual([]);
      expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('queries messages using parameterized CTE and returns conversation IDs', async () => {
      const mockPrisma = {
        $queryRawUnsafe: jest.fn().mockResolvedValue([
          { id: 'conv-1' },
          { id: 'conv-2' },
        ]),
      };

      const result = await searchMessageConversationIds(mockPrisma, {
        companyId: 'comp1',
        channel: 'FACEBOOK',
        search: 'سناء',
        days: 180,
        limit: 200,
      });

      expect(result).toEqual(['conv-1', 'conv-2']);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);

      const [queryStr, pattern, cutoffDate, companyId, channel, limit] = mockPrisma.$queryRawUnsafe.mock.calls[0];
      expect(queryStr).toContain('WITH matched_messages AS');
      expect(queryStr).toContain('m.content ILIKE');
      expect(pattern).toBe('%سناء%');
      expect(cutoffDate).toBeInstanceOf(Date);
      expect(companyId).toBe('comp1');
      expect(channel).toBe('FACEBOOK');
      expect(limit).toBe(200);
    });

    it('applies the tenant filter INSIDE the CTE, before the 1000-row cap', async () => {
      const mockPrisma = { $queryRawUnsafe: jest.fn().mockResolvedValue([]) };

      await searchMessageConversationIds(mockPrisma, {
        companyId: 'comp1',
        channel: 'FACEBOOK',
        search: 'المقاسات',
      });

      const [queryStr] = mockPrisma.$queryRawUnsafe.mock.calls[0];
      const cte = queryStr.split('WITH matched_messages AS (')[1].split(')')[0];
      expect(cte).toContain('JOIN conversations c2');
      expect(cte).toContain('c2."companyId" = $');
      expect(cte).toContain('c2.channel = $');
      // companyId placeholder must appear before the LIMIT 1000 inside the CTE
      expect(cte.indexOf('companyId')).toBeLessThan(cte.indexOf('LIMIT 1000'));
      expect(cte).toContain('ORDER BY m."createdAt" DESC');
    });

    it('sets a server-side statement_timeout in a pipelined (array-form) transaction', async () => {
      const exec = jest.fn().mockResolvedValue(1);
      const query = jest.fn().mockResolvedValue([{ id: 'conv-9' }]);
      const tx = jest.fn().mockResolvedValue([1, [{ id: 'conv-9' }]]);
      const mockPrisma = {
        $executeRawUnsafe: exec,
        $queryRawUnsafe: query,
        $transaction: tx,
      };

      const ids = await searchMessageConversationIds(mockPrisma, { companyId: 'comp1', search: 'سناء' });

      expect(ids).toEqual(['conv-9']);
      // Array form only: a callback transaction would hold a pooled connection
      // (PgBouncer hardening removed interactive transactions).
      expect(Array.isArray(tx.mock.calls[0][0])).toBe(true);
      expect(tx.mock.calls[0][0]).toHaveLength(2);
      expect(exec).toHaveBeenCalledTimes(1);
      expect(String(exec.mock.calls[0][0])).toContain('SET LOCAL statement_timeout = 5000');
      expect(query).toHaveBeenCalledTimes(1);
      expect(query.mock.calls[0][0]).toContain('WITH matched_messages AS');
    });

    it('keeps the server deadline at or below the 5s acceptance target', () => {
      expect(SEARCH_STATEMENT_TIMEOUT_MS).toBeLessThanOrEqual(5000);
    });

    it('propagates database failures instead of returning an empty result', async () => {
      const mockPrisma = {
        $queryRawUnsafe: jest.fn().mockRejectedValue(new Error('DB connection failed')),
      };

      await expect(
        searchMessageConversationIds(mockPrisma, {
          companyId: 'comp1',
          search: 'error-term',
        })
      ).rejects.toThrow('DB connection failed');
    });
  });
});
