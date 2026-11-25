npm notice run chat-backend@1.0.0 npx
npm notice run jest __tests__/conversationSearchWhere.test.js --runInBand --testTimeout=30000 --forceExit
PASS __tests__/conversationSearchWhere.test.js
  conversationSearchWhere
    buildConversationSearchWhere
      √ buildConversationSearchWhere('') and ('   ') → null (3 ms)
      √ buildConversationSearchWhere('ahmed') → one OR group with exactly 4 branches; the three text branches carry mode: 'insensitive', the phone branch does not (3 ms)
      √ buildConversationSearchWhere('Menna Mansour') → two OR groups inside AND (firstName Menna, lastName Mansour) (1 ms)
      √ no branch anywhere is a messages relation filter (1 ms)
    extractContentTokens
      √ extractContentTokens('ab cd') → []
      √ extractContentTokens drops tokens under 3 chars ('ahmed mo') → ['ahmed'] and keeps 3+ chars for pg_trgm
      √ extractContentTokens('menna mansour') → both
      √ returns empty array for empty / whitespace / non-string input
    searchMessageConversationIds
      √ returns empty array if search term is empty or has no content tokens (1 ms)
      √ queries messages using parameterized CTE and returns conversation IDs (2 ms)
      √ applies the tenant filter INSIDE the CTE and aggregates one row per conversation (no 1000-row message cap) (1 ms)
      √ returns every matching conversation (300) instead of capping at 200
      √ clamps an oversized limit to SEARCH_MAX_CONVERSATIONS (1 ms)
      √ sets a server-side statement_timeout in a pipelined (array-form) transaction
      √ falls back to a plain query when the pipelined transaction is rejected (PgBouncer) (1 ms)
      √ does NOT retry when the transaction failed because of a deadline/cancel error (6 ms)
      √ does NOT retry an unrelated database error (no masking of real failures) (1 ms)
      √ still throws when the query itself fails (no silent empty result)
      √ keeps the server deadline at or below the 5s acceptance target (1 ms)
      √ propagates database failures instead of returning an empty result (1 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        0.466 s, estimated 1 s
Ran all test suites matching /__tests__\\conversationSearchWhere.test.js/i.
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?
