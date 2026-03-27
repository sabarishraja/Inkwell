/**
 * _shared/anthropic.ts — Shared Anthropic API helper for Supabase Edge Functions.
 *
 * All Claude API calls in this project route through callClaude().
 * The API key is read from Deno.env (Supabase secrets) — never the client bundle.
 */

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallClaudeOptions {
  system: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
}

const MODEL = 'claude-sonnet-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Call the Anthropic Messages API and return the text of the first content block.
 * Throws on API errors so callers can handle them.
 */
export async function callClaude(options: CallClaudeOptions): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY secret is not set');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: options.maxTokens ?? 300,
      system:     options.system,
      messages:   options.messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return (data.content?.[0]?.text ?? '').trim();
}
