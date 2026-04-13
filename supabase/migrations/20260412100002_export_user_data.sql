-- F34 LGPD: Function to export all user data for data portability.
-- Returns a JSON object with all user data across tables.

CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  user_id_val UUID;
BEGIN
  user_id_val := auth.uid();
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.id = user_id_val),
    'subscription', (SELECT row_to_json(s) FROM subscriptions s WHERE s.user_id = user_id_val),
    'projects', (SELECT COALESCE(jsonb_agg(row_to_json(pr)), '[]'::jsonb) FROM projects pr WHERE pr.user_id = user_id_val),
    'support_tickets', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM support_tickets t WHERE t.user_id = user_id_val),
    'exported_at', now()
  ) INTO result;

  RETURN result;
END;
$$;
