-- Enable pg_cron for scheduled jobs (used by trial expiration sweep).
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;
