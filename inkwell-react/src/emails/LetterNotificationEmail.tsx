/**
 * LetterNotificationEmail.tsx — React Email component for the letter notification.
 *
 * This component is rendered to HTML by the send-letter edge function.
 * It can also be previewed locally with:
 *   npx email dev
 * from the project root.
 *
 * Design intent:
 *   - Dark parchment aesthetic matching Inkwell's identity
 *   - Minimal — the letter content is NOT included
 *   - A single prominent CTA linking to the recipient page
 */

import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface Props {
  letterTitle: string;
  letterUrl:   string;
  senderEmail?: string;
}

export function LetterNotificationEmail({ letterTitle, letterUrl, senderEmail }: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="Cormorant Garamond"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/cormorantgaramond/v22/co3YmX5slCNuHLi8bLeY9MK7whWMhyjornFLsS6V7w.woff2',
            format: 'woff2',
          }}
          fontWeight={300}
          fontStyle="normal"
        />
      </Head>

      <Preview>You have a letter waiting for you.</Preview>

      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header wordmark */}
          <Section style={styles.header}>
            <Text style={styles.wordmark}>Inkwell</Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Main message */}
          <Section style={styles.main}>
            <Heading style={styles.heading}>
              You have a letter.
            </Heading>

            <Text style={styles.body_text}>
              Someone has written{' '}
              <em style={styles.italic}>
                &ldquo;{letterTitle}&rdquo;
              </em>{' '}
              especially for you. It was composed on a virtual typewriter,
              sealed with care, and has been waiting to reach you.
            </Text>

            <Text style={styles.body_text}>
              Click below to open and read your letter.
            </Text>

            <Section style={styles.cta_section}>
              <Button href={letterUrl} style={styles.cta_button}>
                Open My Letter
              </Button>
            </Section>

            <Text style={styles.url_fallback}>
              Or copy this link into your browser:
              <br />
              <span style={styles.url_text}>{letterUrl}</span>
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footer_text}>
              This letter was written with{' '}
              <a href="https://inkwell.app" style={styles.footer_link}>Inkwell</a>
              {' '}— a typewriter for the digital age.
            </Text>
            {senderEmail && (
              <Text style={styles.footer_sub}>
                Sent by {senderEmail}
              </Text>
            )}
            <Text style={styles.footer_sub}>
              If you were not expecting this, you can safely ignore this email.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ---- Default props (for React Email preview) ----------------------------
LetterNotificationEmail.PreviewProps = {
  letterTitle: 'A Note for You',
  letterUrl:   'https://inkwell.app/r/abc-123',
  senderEmail: 'someone@example.com',
} satisfies Props;

export default LetterNotificationEmail;

// ---- Styles (inline, required for email clients) ------------------------

const PARCHMENT = '#F5E6C8';
const GOLD      = '#C9974A';
const DARK_BG   = '#1A1208';
const MUTED     = '#8A7060';

const styles = {
  body: {
    backgroundColor: DARK_BG,
    fontFamily:      '"Cormorant Garamond", Georgia, serif',
    margin:          '0',
    padding:         '40px 0',
  },
  container: {
    backgroundColor: '#251A10',
    border:          `1px solid ${GOLD}30`,
    borderRadius:    '4px',
    maxWidth:        '560px',
    margin:          '0 auto',
    padding:         '0',
    overflow:        'hidden',
  },
  header: {
    padding:    '32px 40px 24px',
    textAlign:  'center' as const,
  },
  wordmark: {
    fontFamily:     '"Cormorant Garamond", Georgia, serif',
    fontSize:       '28px',
    fontWeight:     300,
    letterSpacing:  '0.12em',
    color:          GOLD,
    margin:         '0',
    textTransform:  'uppercase' as const,
  },
  divider: {
    borderColor: `${GOLD}30`,
    margin:      '0',
  },
  main: {
    padding: '40px 40px 32px',
  },
  heading: {
    fontFamily:    '"Cormorant Garamond", Georgia, serif',
    fontSize:      '32px',
    fontWeight:    300,
    color:         PARCHMENT,
    margin:        '0 0 24px',
    letterSpacing: '0.02em',
    lineHeight:    '1.2',
  },
  body_text: {
    fontFamily:  '"Cormorant Garamond", Georgia, serif',
    fontSize:    '17px',
    fontWeight:  300,
    lineHeight:  '1.7',
    color:       `${PARCHMENT}CC`,
    margin:      '0 0 16px',
  },
  italic: {
    fontStyle: 'italic' as const,
    color:     PARCHMENT,
  },
  cta_section: {
    textAlign: 'center' as const,
    margin:    '32px 0',
  },
  cta_button: {
    backgroundColor: GOLD,
    borderRadius:    '2px',
    color:           DARK_BG,
    display:         'inline-block',
    fontFamily:      '"Cormorant Garamond", Georgia, serif',
    fontSize:        '15px',
    fontWeight:      600,
    letterSpacing:   '0.08em',
    padding:         '14px 36px',
    textDecoration:  'none',
    textTransform:   'uppercase' as const,
  },
  url_fallback: {
    fontSize:   '12px',
    color:      MUTED,
    textAlign:  'center' as const,
    margin:     '0',
    lineHeight: '1.6',
  },
  url_text: {
    color:          GOLD,
    wordBreak:      'break-all' as const,
    fontFamily:     'monospace',
    fontSize:       '11px',
  },
  footer: {
    padding:   '24px 40px 32px',
  },
  footer_text: {
    fontFamily:  '"Cormorant Garamond", Georgia, serif',
    fontSize:    '13px',
    color:       MUTED,
    margin:      '0 0 8px',
    lineHeight:  '1.6',
  },
  footer_link: {
    color:          GOLD,
    textDecoration: 'none',
  },
  footer_sub: {
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontSize:   '12px',
    color:      `${MUTED}99`,
    margin:     '0 0 4px',
    lineHeight: '1.6',
  },
} as const;
