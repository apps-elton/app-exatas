const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

export function isResendConfigured(): boolean {
  return !!RESEND_API_KEY;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.info('[Resend] No API key configured, email sending disabled');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'GeoTeach <noreply@geoteach.com.br>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Resend] Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('[Resend] Error sending email:', error);
    return { success: false, error: String(error) };
  }
}
