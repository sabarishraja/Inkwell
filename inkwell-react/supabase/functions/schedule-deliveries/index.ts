/**
 * schedule-deliveries/index.ts — Supabase Edge Function
 *
 * Processes all pending letters whose deliver_at has passed.
 * Called hourly by a pg_cron job (see 002_seal_and_send.sql).
 *
 * This function is an internal worker — it is NOT called by the frontend.
 * It uses the SUPABASE_SERVICE_ROLE_KEY for all DB operations.
 * Shares the same SMTP secrets as send-letter.
 *
 * Deploy:
 *   supabase functions deploy schedule-deliveries
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer       from 'npm:nodemailer@6';

// ---------------------------------------------------------------------------
// Shared email HTML builder (duplicated from send-letter for isolation)
// ---------------------------------------------------------------------------

function buildEmailHtml(params: {
  letterTitle:  string;
  letterUrl:    string;
  senderEmail?: string;
}): string {
  const { letterTitle, letterUrl, senderEmail } = params;
  const escapedTitle = letterTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You have a letter — Inkwell</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&display=swap" rel="stylesheet" />
</head>
<body style="background:#1A1208;font-family:'Cormorant Garamond',Georgia,serif;margin:0;padding:40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1208;">
    <tr>
      <td align="center" style="padding:0 20px;">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#251A10;border:1px solid rgba(201,151,74,0.18);border-radius:4px;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:32px 40px 24px;">
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;
                         letter-spacing:0.12em;color:#C9974A;margin:0;text-transform:uppercase;">
                Inkwell
              </p>
            </td>
          </tr>
          <tr><td style="border-top:1px solid rgba(201,151,74,0.18);font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:300;
                          color:#F5E6C8;margin:0 0 24px;letter-spacing:0.02em;line-height:1.2;">
                You have a letter.
              </h1>
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:300;
                         line-height:1.7;color:rgba(245,230,200,0.8);margin:0 0 16px;">
                Someone has written
                <em style="font-style:italic;color:#F5E6C8;">&ldquo;${escapedTitle}&rdquo;</em>
                especially for you. It was composed on a virtual typewriter,
                sealed with care, and has been waiting to reach you.
              </p>
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:300;
                         line-height:1.7;color:rgba(245,230,200,0.8);margin:0 0 32px;">
                Click the button below to open and read your letter.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${letterUrl}"
                       style="background:#C9974A;border-radius:2px;color:#1A1208;display:inline-block;
                              font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:600;
                              letter-spacing:0.08em;padding:14px 36px;text-decoration:none;text-transform:uppercase;">
                      Open My Letter
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#8A7060;text-align:center;margin:0;line-height:1.6;">
                Or copy this link:<br />
                <span style="color:#C9974A;word-break:break-all;font-family:monospace;font-size:11px;">
                  ${letterUrl}
                </span>
              </p>
            </td>
          </tr>
          <tr><td style="border-top:1px solid rgba(201,151,74,0.18);font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;color:#8A7060;
                         margin:0 0 8px;line-height:1.6;">
                This letter was written with
                <a href="https://inkwell.app" style="color:#C9974A;text-decoration:none;">Inkwell</a>
                — a typewriter for the digital age.
              </p>
              ${senderEmail ? `<p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;
                       color:rgba(138,112,96,0.6);margin:0 0 4px;line-height:1.6;">
                Sent by ${senderEmail}
              </p>` : ''}
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;
                         color:rgba(138,112,96,0.6);margin:0;line-height:1.6;">
                If you were not expecting this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Edge function handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const frontendUrl    = Deno.env.get('FRONTEND_URL')    ?? 'https://inkwell.app';
  const fromEmail      = Deno.env.get('FROM_EMAIL')      ?? Deno.env.get('SMTP_USER')!;

  const transporter = nodemailer.createTransport({
    host:   Deno.env.get('SMTP_HOST')!,
    port:   Number(Deno.env.get('SMTP_PORT') ?? 587),
    secure: Deno.env.get('SMTP_SECURE') === 'true',
    auth: {
      user: Deno.env.get('SMTP_USER')!,
      pass: Deno.env.get('SMTP_PASS')!,
    },
  });

  // Verify the caller is authorized (service role or pg_cron)
  const authHeader = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
  if (authHeader !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all pending letters past their delivery date
  const { data: pendingLetters, error: fetchError } = await supabase
    .from('letters')
    .select('id, title, recipient_email, user_id')
    .eq('status', 'pending')
    .lte('deliver_at', new Date().toISOString())
    .limit(100); // safety cap per run

  if (fetchError) {
    console.error('schedule-deliveries fetch error:', fetchError.message);
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!pendingLetters || pendingLetters.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
  }

  let sent  = 0;
  let failed = 0;

  for (const letter of pendingLetters) {
    try {
      // Fetch sender email for footer
      const { data: senderData } = await supabase.auth.admin.getUserById(letter.user_id);
      const senderEmail = senderData?.user?.email ?? undefined;

      const letterUrl = `${frontendUrl}/r/${letter.id}`;
      const html      = buildEmailHtml({ letterTitle: letter.title, letterUrl, senderEmail });

      await transporter.sendMail({
        from:    fromEmail,
        to:      letter.recipient_email,
        subject: `You have a letter — "${letter.title}"`,
        html,
      });

      // Mark as delivered
      await supabase
        .from('letters')
        .update({ status: 'delivered' })
        .eq('id', letter.id);

      sent++;
    } catch (err) {
      console.error(`Error processing letter ${letter.id}:`, err);
      failed++;
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
