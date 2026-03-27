/**
 * _shared/auth.ts — Auth + response helpers for Supabase Edge Functions.
 *
 * Provides:
 *   getAuthUser()   — validate JWT from request, return user + supabase client
 *   CORS_HEADERS    — standard CORS response headers
 *   jsonResponse()  — JSON success response
 *   errorResponse() — JSON error response
 *   unauthorizedResponse() — 401 shorthand
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Extract and validate the authenticated user from the request's Authorization header.
 * Returns the user (or null) and a scoped Supabase client for further DB calls.
 */
export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  return { user: error ? null : user, supabase };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

export function errorResponse(message: string, status = 500): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

export function unauthorizedResponse(): Response {
  return errorResponse('Unauthorized', 401);
}
