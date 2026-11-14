import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the signed-in user's account and data (required by Google Play).
 * The user is identified only by the verified bearer token, never by a client-supplied id.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context;

    // These tables have no foreign key to auth.users, so they are removed explicitly.
    for (const table of ["user_progress", "tutor_messages", "ai_usage"] as const) {
      const res = await supabaseAdmin.from(table).delete().eq("user_id", userId);
      if (res.error) throw new Error(res.error.message);
    }
    const profile = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profile.error) throw new Error(profile.error.message);
    const auth = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (auth.error) throw new Error(auth.error.message);
    return { ok: true as const };
  });
