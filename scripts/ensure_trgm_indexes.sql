-- Ensure pg_trgm extension and GIN trigram indexes for Facebook Inbox conversation search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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
