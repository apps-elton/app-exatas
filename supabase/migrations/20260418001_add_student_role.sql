-- Add 'student' role to user_role enum
-- Used by Aluno B2C signup (conta pessoal sem tenant)

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student';

-- Note: Postgres requires ALTER TYPE ADD VALUE to be outside a transaction block.
-- Supabase MCP apply_migration handles this correctly.
