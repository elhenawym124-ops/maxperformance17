-- Ensure pg_trgm extension and GIN trigram indexes for Facebook Inbox conversation search.
-- Idempotent + non-blocking: every index is built with CREATE INDEX CONCURRENTLY.
-- Run directly with psql (NOT inside a transaction / `psql -1`): CONCURRENTLY
-- cannot run in a transaction block.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Repair path: a failed CONCURRENTLY build leaves an INVALID index behind, and
-- `CREATE INDEX CONCURRENTLY IF NOT EXISTS` would then skip it forever — the
-- inbox search would silently fall back to a sequential scan. Drop those first
-- (\gexec runs each row as its own top-level statement, so CONCURRENTLY works).
SELECT format('DROP INDEX CONCURRENTLY IF EXISTS %I', c.relname)
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE NOT i.indisvalid
  AND c.relname IN (
    'idx_customers_first_name_trgm',
    'idx_customers_last_name_trgm',
    'idx_customers_phone_trgm',
    'idx_conversations_last_message_preview_trgm',
    'idx_messages_content_trgm'
  )
\gexec

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_first_name_trgm 
  ON customers USING gin ("firstName" gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_last_name_trgm 
  ON customers USING gin ("lastName" gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone_trgm 
  ON customers USING gin (phone gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_last_message_preview_trgm 
  ON conversations USING gin ("lastMessagePreview" gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_content_trgm 
  ON messages USING gin (content gin_trgm_ops);

-- Verification (visible in the deploy log):
SELECT c.relname AS index_name, i.indisvalid AS is_valid, pg_size_pretty(pg_relation_size(c.oid)) AS size
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE c.relname IN (
    'idx_customers_first_name_trgm',
    'idx_customers_last_name_trgm',
    'idx_customers_phone_trgm',
    'idx_conversations_last_message_preview_trgm',
    'idx_messages_content_trgm'
  )
ORDER BY c.relname;
