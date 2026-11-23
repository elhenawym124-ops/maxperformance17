-- Ensure pg_trgm extension and GIN trigram indexes for Facebook Inbox conversation search.
-- Invoked by scripts/deploy-remote.sh AFTER `prisma db push` (which can drop indexes that
-- are not declared in the Prisma schema). Must be run with psql and ON_ERROR_STOP=1.
--
-- Failure mode fixed here (measured on production 2026-11-23):
--   * CREATE INDEX CONCURRENTLY was interrupted (deploy restart / statement timeout) and
--     left idx_messages_content_trgm with indisvalid=false (625 MB stub).
--   * `CREATE INDEX IF NOT EXISTS` afterwards treated the invalid index as "done", so the
--     planner never used it and message search scanned 7.4 GB until the 30s timeout.
-- So: drop INVALID trigram indexes first, disable statement timeout, rebuild, verify.

\set ON_ERROR_STOP on

-- Index builds on messages (7.4 GB / ~4.9M rows) take ~20 minutes; never let a
-- session/statement timeout cut a build in half again.
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_min_messages = warning;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop trigram indexes left INVALID by an interrupted CONCURRENTLY build.
-- DROP INDEX CONCURRENTLY cannot run inside a transaction / DO block, so the
-- statements are generated and executed with psql's \gexec.
SELECT format('DROP INDEX CONCURRENTLY IF EXISTS %I;', c.relname)
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE c.relname IN (
        'idx_customers_first_name_trgm',
        'idx_customers_last_name_trgm',
        'idx_customers_phone_trgm',
        'idx_conversations_last_message_preview_trgm',
        'idx_messages_content_trgm'
      )
  AND NOT i.indisvalid
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

ANALYZE messages;

-- Verify: every trigram index must exist AND be valid; print sizes for the record.
-- Raise (=> psql exit 1 with ON_ERROR_STOP) if anything is still invalid so a
-- half-built index can never be mistaken for a working one again.
DO $$
DECLARE
  bad    text;
  report text;
BEGIN
  SELECT string_agg(c.relname, ', ') INTO bad
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  WHERE c.relname IN (
          'idx_customers_first_name_trgm',
          'idx_customers_last_name_trgm',
          'idx_customers_phone_trgm',
          'idx_conversations_last_message_preview_trgm',
          'idx_messages_content_trgm'
        )
    AND NOT i.indisvalid;

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'trigram indexes still INVALID after build: %', bad;
  END IF;

  SELECT string_agg(format('%s=%s', c.relname, pg_size_pretty(pg_relation_size(c.oid))), ', ')
    INTO report
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  WHERE c.relname IN (
          'idx_customers_first_name_trgm',
          'idx_customers_last_name_trgm',
          'idx_customers_phone_trgm',
          'idx_conversations_last_message_preview_trgm',
          'idx_messages_content_trgm'
        )
    AND i.indisvalid;

  RAISE NOTICE 'trigram indexes valid: %', report;
END $$;
