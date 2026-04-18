-- Extend tenants table for solo-tenant flag, custom domain state (Cloudflare for SaaS),
-- and display branding.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_solo boolean NOT NULL DEFAULT false;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS display_name text;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS custom_domain_status text
    CHECK (custom_domain_status IN ('pending', 'active', 'failed', 'revoked'));

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cloudflare_hostname_id text;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS branding_enabled_at timestamptz;

-- Unique index on cloudflare_hostname_id when not null
CREATE UNIQUE INDEX IF NOT EXISTS tenants_cloudflare_hostname_id_idx
  ON public.tenants(cloudflare_hostname_id)
  WHERE cloudflare_hostname_id IS NOT NULL;

COMMENT ON COLUMN public.tenants.is_solo IS
  'True para tenants criados por professor autônomo (1 membro), false para escolas';
COMMENT ON COLUMN public.tenants.custom_domain_status IS
  'Estado da validação Cloudflare for SaaS do domínio custom';
