import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  streak_id?: string;
  to_user_id?: string;
  streak_count_after?: number;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("STREAK_EMAIL_FROM") || "Vardagsstyrka <onboarding@resend.dev>";
  const appUrl = Deno.env.get("APP_URL") || "https://vardagsstyrka.lovable.app/streak";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "supabase_env_missing" }, 500);
  if (!resendApiKey) return json({ error: "RESEND_API_KEY_missing" }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "not_authenticated" }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  const caller = callerData.user;
  if (callerError || !caller) return json({ error: "not_authenticated" }, 401);

  let body: NotifyRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const streakId = body.streak_id?.trim();
  const toUserId = body.to_user_id?.trim();
  const streakCountAfter = Number(body.streak_count_after);
  if (!streakId || !toUserId || !Number.isInteger(streakCountAfter) || streakCountAfter < 1) {
    return json({ error: "invalid_payload" }, 400);
  }
  if (toUserId === caller.id) return json({ skipped: true, reason: "recipient_is_caller" });

  const { data: streak, error: streakError } = await admin
    .from("shared_streaks")
    .select("id, name, streak_kind, status, current_turn_user_id, streak_count")
    .eq("id", streakId)
    .maybeSingle();

  if (streakError) return json({ error: "streak_lookup_failed", details: streakError.message }, 500);
  if (!streak || streak.status !== "active" || streak.streak_kind !== "buddy") return json({ error: "not_active_buddy_streak" }, 400);
  if (streak.current_turn_user_id !== toUserId || Number(streak.streak_count) !== streakCountAfter) {
    return json({ error: "handoff_state_mismatch" }, 409);
  }

  const { data: memberRows, error: membersError } = await admin
    .from("shared_streak_members")
    .select("user_id, display_name, status")
    .eq("streak_id", streakId)
    .eq("status", "active");

  if (membersError) return json({ error: "members_lookup_failed", details: membersError.message }, 500);
  const activeMembers = memberRows ?? [];
  if (activeMembers.length !== 2) return json({ error: "buddy_streak_requires_two_members" }, 400);
  if (!activeMembers.some((member) => member.user_id === caller.id) || !activeMembers.some((member) => member.user_id === toUserId)) {
    return json({ error: "not_a_streak_member" }, 403);
  }

  const { data: prior } = await admin
    .from("streak_turn_email_notifications")
    .select("id")
    .eq("streak_id", streakId)
    .eq("streak_count_after", streakCountAfter)
    .eq("to_user_id", toUserId)
    .maybeSingle();
  if (prior) return json({ skipped: true, reason: "already_sent" });

  const { data: recipientData, error: recipientError } = await admin.auth.admin.getUserById(toUserId);
  const recipientEmail = recipientData.user?.email;
  if (recipientError || !recipientEmail) return json({ error: "recipient_email_missing" }, 400);

  const senderMember = activeMembers.find((member) => member.user_id === caller.id);
  const senderName = senderMember?.display_name?.trim() || caller.email || "Din streakkompis";
  const safeSender = escapeHtml(senderName);
  const safeStreak = escapeHtml(streak.name || "Streak med någon");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [recipientEmail],
      subject: "Bollen är hos dig i Vardagsstyrka",
      text: `${senderName} har gjort Dagens 3 och skickat över bollen till dig. Streak: ${streak.name || "Streak med någon"}. Nu är det din tur — du har 36 timmar på dig. Öppna appen: ${appUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:560px;margin:auto">
          <h2 style="margin-bottom:8px">Bollen är hos dig 🔥</h2>
          <p><strong>${safeSender}</strong> har gjort Dagens 3 och skickat över bollen till dig.</p>
          <p>Streak: <strong>${safeStreak}</strong><br>Streaknummer: <strong>${streakCountAfter}</strong></p>
          <p>Nu är det din tur. Du har <strong>36 timmar</strong> på dig att göra Dagens 3 och skicka tillbaka bollen.</p>
          <p style="margin-top:24px"><a href="${appUrl}" style="background:#111827;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block">Öppna Vardagsstyrka</a></p>
        </div>
      `,
    }),
  });

  const resendBody = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    return json({ error: "email_provider_failed", status: resendResponse.status, details: resendBody }, 502);
  }

  const { error: auditError } = await admin.from("streak_turn_email_notifications").insert({
    streak_id: streakId,
    streak_count_after: streakCountAfter,
    from_user_id: caller.id,
    to_user_id: toUserId,
    email: recipientEmail,
    provider_message_id: typeof resendBody?.id === "string" ? resendBody.id : null,
  });

  if (auditError && auditError.code !== "23505") {
    console.error("Could not store streak email audit", auditError);
  }

  return json({ sent: true, to_user_id: toUserId, provider_message_id: resendBody?.id ?? null });
});
