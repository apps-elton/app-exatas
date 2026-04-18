-- Add missing FK indexes for performance (from Supabase advisor warnings)

CREATE INDEX IF NOT EXISTS tenant_invites_created_by_idx
  ON public.tenant_invites(created_by);

CREATE INDEX IF NOT EXISTS tenant_invites_tenant_id_idx
  ON public.tenant_invites(tenant_id);

CREATE INDEX IF NOT EXISTS ticket_messages_sender_id_idx
  ON public.ticket_messages(sender_id) WHERE sender_id IS NOT NULL;
