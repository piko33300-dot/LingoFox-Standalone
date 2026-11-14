// Server-only: identify the signed-in learner from a request's bearer token.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

/** Returns a user-scoped database client (row rules apply) and the verified user id, or null. */
export async function authFromRequest(request: Request) {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const header = request.headers.get("authorization") ?? "";
  if (!url || !key || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  if (token.split(".").length !== 3) return null;
  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` }, fetch: supabaseFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id };
}

export const jsonError = (status: number, code: string) => Response.json({ error: code }, { status });
