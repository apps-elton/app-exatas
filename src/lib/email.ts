import { supabase } from '@/integrations/supabase/client';

export type EmailTemplate =
  | 'welcome_teacher'
  | 'welcome_school'
  | 'welcome_student'
  | 'invite';

interface SendEmailArgs {
  template: EmailTemplate;
  to: string;
  data?: Record<string, string>;
}

/**
 * Sends a transactional email via the Supabase Edge Function `send-email`,
 * which proxies to Resend using a server-side RESEND_API_KEY.
 *
 * Fire-and-forget by default — signup/invite flows should not fail just
 * because email delivery is slow or misconfigured. The returned promise
 * resolves with { ok } so callers can log failures if desired.
 */
export async function sendEmail(args: SendEmailArgs): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: args,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    if (data && typeof data === 'object' && 'error' in data) {
      return { ok: false, error: String((data as { error: unknown }).error) };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
