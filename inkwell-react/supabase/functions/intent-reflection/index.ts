/**
 * intent-reflection/index.ts — Post-writing reflection.
 *
 * Compares the letter with the original coach intent and returns a warm
 * reflection — not a review, not a grade.
 *
 * Request:  { letterContent, intentSummary?, qaPairs? }
 * Response: { type: 'aligned' | 'drifted', reflection: string }
 *
 * Deploy: supabase functions deploy intent-reflection
 * Secrets: ANTHROPIC_API_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const REFLECTION_SYSTEM = `You are a thoughtful, warm companion who walked alongside someone as they wrote a personal letter. Your role is to offer a gentle reflection — not a review, not a grade. This is a mirror, not a critique.

You will be given the original intent and the letter they wrote.

Determine if the letter feels "aligned" with the intent or "drifted" from it.

If ALIGNED: Write a warm 1-2 sentence affirmation acknowledging what they captured. Tone: sincere, gentle.

If DRIFTED: Write a gentle 2-3 sentence observation:
- Name what feels missing, without judgment
- Acknowledge something real and valuable in what they did write
- Offer one soft optional suggestion ("you might consider..." / "if it feels right...")
- Make clear it is entirely okay to send as-is

Respond with valid JSON only (no markdown):
{"type": "aligned" | "drifted", "reflection": "..."}

If there is no intent provided, always return type "aligned" with a warm generic affirmation.
Never be harsh. This is a sacred space.`;

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\u200B/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function callClaude(system: string, userMsg: string, maxTokens = 350): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY secret is not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.content?.[0]?.text ?? '').trim();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    // Auth — gateway has already verified the JWT; decode to get user ID.
    const authHeader = req.headers.get('Authorization') ?? '';
    try {
      const [, b64] = authHeader.replace('Bearer ', '').split('.');
      const payload = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload?.sub || payload.role !== 'authenticated') return json({ error: 'Unauthorized' }, 401);
    } catch {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { letterContent = '', intentSummary = '', qaPairs = [] } = await req.json();

    if (!letterContent) return json({ error: 'Missing letterContent' }, 400);

    // No intent → generic affirmation
    if (!intentSummary) {
      return json({
        type: 'aligned',
        reflection: "Writing a letter takes real courage — putting words to what the heart holds. Whatever you've written, the act of reaching out matters deeply.",
      });
    }

    const letterText = htmlToText(letterContent).slice(0, 1500);
    const coachContext = (qaPairs as { question: string; answer: string }[]).length > 0
      ? '\n\nWhat they shared before writing:\n' +
      (qaPairs as { question: string; answer: string }[])
        .map((qa, i) => `Q${i + 1}: ${qa.question}\nA: ${qa.answer}`)
        .join('\n\n')
      : '';

    const userMessage =
      `Original intent:\n"${intentSummary}"` +
      coachContext +
      `\n\nThe letter they wrote:\n"${letterText}"`;

    const raw = await callClaude(REFLECTION_SYSTEM, userMessage, 400);

    let type: 'aligned' | 'drifted' = 'aligned';
    let reflection: string = raw;

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        type = parsed.type === 'drifted' ? 'drifted' : 'aligned';
        reflection = (parsed.reflection ?? raw).trim();
      }
    } catch { /* fallback to raw as aligned */ }

    return json({ type, reflection });

  } catch (err) {
    console.error('[intent-reflection]', err);
    return json({ error: err instanceof Error ? err.message : 'Internal server error' }, 500);
  }
});
