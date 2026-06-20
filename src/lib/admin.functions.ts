import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: !!data };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [usersC, analysesC, contactsC, analysesAgg, recentAnalyses, recentMessages, recentUsers] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("analyses").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("analyses").select("match_score, ats_score, resume_strength"),
      supabaseAdmin
        .from("analyses")
        .select("id, user_id, file_name, match_score, ats_score, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("contact_messages")
        .select("id, name, email, subject, message, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const rows = (analysesAgg.data ?? []) as Array<{ match_score: number; ats_score: number; resume_strength: number }>;
    const avg = (k: keyof typeof rows[number]) =>
      rows.length ? Math.round(rows.reduce((s, r) => s + (r[k] ?? 0), 0) / rows.length) : 0;

    return {
      totals: {
        users: usersC.count ?? 0,
        analyses: analysesC.count ?? 0,
        contacts: contactsC.count ?? 0,
      },
      averages: {
        match: avg("match_score"),
        ats: avg("ats_score"),
        strength: avg("resume_strength"),
      },
      recent_analyses: recentAnalyses.data ?? [],
      recent_messages: recentMessages.data ?? [],
      recent_users: recentUsers.data ?? [],
    };
  });