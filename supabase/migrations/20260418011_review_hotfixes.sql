-- Hotfixes from code review of Tasks 8-10:
-- 1. Make tenant_invites_no_student_insert RESTRICTIVE (was PERMISSIVE, which weakened the gate)
-- 2. Tighten subdomain match in get_tenant_by_host to single label

-- Fix 1: RESTRICTIVE policy
DROP POLICY IF EXISTS "tenant_invites_no_student_insert" ON public.tenant_invites;
CREATE POLICY "tenant_invites_no_student_insert"
  ON public.tenant_invites AS RESTRICTIVE FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

COMMENT ON POLICY "tenant_invites_no_student_insert" ON public.tenant_invites IS
  'RESTRICTIVE: students cannot create invites. AND-combines with other invite policies.';

-- Fix 2: Tighten subdomain match in get_tenant_by_host
CREATE OR REPLACE FUNCTION public.get_tenant_by_host(p_host text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_main_domain text := 'cliqueexatas.com.br';
  v_app_host text := 'app.cliqueexatas.com.br';
  v_slug text;
  v_tenant record;
BEGIN
  p_host := lower(split_part(p_host, ':', 1));

  IF p_host IN (v_main_domain, v_app_host) THEN
    RETURN NULL;
  END IF;

  -- Match por custom_domain
  SELECT id, display_name, name, logo_url, primary_color, secondary_color, slug, is_active
    INTO v_tenant
  FROM public.tenants
  WHERE custom_domain = p_host
    AND custom_domain_status = 'active'
    AND is_active = true
  LIMIT 1;

  IF v_tenant.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'id', v_tenant.id,
      'display_name', COALESCE(v_tenant.display_name, v_tenant.name),
      'logo_url', v_tenant.logo_url,
      'primary_color', v_tenant.primary_color,
      'secondary_color', v_tenant.secondary_color,
      'slug', v_tenant.slug,
      'match_type', 'custom_domain'
    );
  END IF;

  -- Match por subdomínio {slug}.cliqueexatas.com.br (exatamente 1 label antes do domain)
  IF p_host LIKE '%.' || v_main_domain THEN
    v_slug := split_part(p_host, '.', 1);
    -- Rejeitar se tem mais de 1 label antes do domain (ex: x.y.cliqueexatas.com.br)
    IF p_host <> v_slug || '.' || v_main_domain THEN
      RETURN NULL;
    END IF;

    SELECT id, display_name, name, logo_url, primary_color, secondary_color, slug, is_active
      INTO v_tenant
    FROM public.tenants
    WHERE slug = v_slug AND is_active = true
    LIMIT 1;

    IF v_tenant.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'id', v_tenant.id,
        'display_name', COALESCE(v_tenant.display_name, v_tenant.name),
        'logo_url', v_tenant.logo_url,
        'primary_color', v_tenant.primary_color,
        'secondary_color', v_tenant.secondary_color,
        'slug', v_tenant.slug,
        'match_type', 'subdomain'
      );
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.get_tenant_by_host(text) IS
  'Resolve tenant pelo host HTTP. Exato 1 label de subdomínio ou custom_domain. Retorna branding público.';
