-- Fix domain: the actual production domain is clickexatas.com.br (not cliqueexatas.com.br).
-- Earlier migrations 010 and 011 hardcoded the wrong spelling.
-- This migration replaces get_tenant_by_host with the correct domain.

CREATE OR REPLACE FUNCTION public.get_tenant_by_host(p_host text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_main_domain text := 'clickexatas.com.br';
  v_app_host text := 'app.clickexatas.com.br';
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

  -- Match por subdomínio {slug}.clickexatas.com.br (exatamente 1 label)
  IF p_host LIKE '%.' || v_main_domain THEN
    v_slug := split_part(p_host, '.', 1);
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
  'Resolve tenant pelo host HTTP. Domínio: clickexatas.com.br. Retorna branding público ou null.';
