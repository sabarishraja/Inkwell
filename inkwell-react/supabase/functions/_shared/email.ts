/**
 * _shared/email.ts — Shared invitation email HTML builder.
 *
 * Generates the HTML for the "you have a letter" notification email.
 * Used by both send-letter and schedule-deliveries edge functions.
 *
 * The email intentionally OMITS letter content — it is a warm invitation
 * only, with a single link to the recipient page.
 */

export function buildEmailHtml(params: {
  letterTitle:  string;
  letterUrl:    string;
  senderEmail?: string;
}): string {
  const { letterTitle, letterUrl, senderEmail } = params;

  // Escape user-supplied strings for safe HTML embedding
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;');

  const escapedTitle = esc(letterTitle);
  const escapedUrl   = esc(letterUrl);

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You have a letter — Inkwell</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet" />
</head>
<body style="background:#1A1208;font-family:'Cormorant Garamond',Georgia,serif;margin:0;padding:40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1208;">
    <tr>
      <td align="center" style="padding:0 20px;">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#251A10;border:1px solid rgba(201,151,74,0.20);border-radius:4px;
                      overflow:hidden;max-width:560px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding:36px 44px 28px;">
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:300;
                         letter-spacing:0.16em;color:#C9974A;margin:0;text-transform:uppercase;">
                Inkwell
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top:1px solid rgba(201,151,74,0.18);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main body -->
          <tr>
            <td style="padding:44px 44px 36px;">

              <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:34px;font-weight:300;
                          color:#F5E6C8;margin:0 0 28px;letter-spacing:0.02em;line-height:1.2;">
                You have a letter.
              </h1>

              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:300;
                         line-height:1.75;color:rgba(245,230,200,0.82);margin:0 0 18px;">
                Someone took time to sit with their thoughts and write
                <em style="font-style:italic;color:#F5E6C8;">&ldquo;${escapedTitle}&rdquo;</em>
                especially for you — composing it word by careful word on a virtual typewriter.
              </p>

              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:300;
                         line-height:1.75;color:rgba(245,230,200,0.82);margin:0 0 38px;">
                It has been sealed and is waiting for you.
                No account needed to read it.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 36px;">
                    <a href="${escapedUrl}"
                       style="background:#C9974A;border-radius:2px;color:#1A1208;display:inline-block;
                              font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;font-weight:600;
                              letter-spacing:0.10em;padding:15px 44px;text-decoration:none;
                              text-transform:uppercase;">
                      Open My Letter
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="font-size:12px;color:#8A7060;text-align:center;margin:0;line-height:1.7;">
                Or copy this link into your browser:<br />
                <span style="color:#C9974A;word-break:break-all;font-family:monospace;font-size:11px;">
                  ${escapedUrl}
                </span>
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top:1px solid rgba(201,151,74,0.18);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 44px 32px;">
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;color:#8A7060;
                         margin:0 0 8px;line-height:1.6;">
                Written with
                <a href="https://inkwell.app" style="color:#C9974A;text-decoration:none;">Inkwell</a>
                — a typewriter for the digital age.
              </p>
              ${senderEmail
                ? `<p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;
                             color:rgba(138,112,96,0.55);margin:0 0 4px;line-height:1.6;">
                     Sent by ${esc(senderEmail)}
                   </p>`
                : ''}
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;
                         color:rgba(138,112,96,0.55);margin:0;line-height:1.6;">
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
