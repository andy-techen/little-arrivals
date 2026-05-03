import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
if (!secretKeysRaw) throw new Error("SUPABASE_SECRET_KEYS is not set");
const secretKeys = JSON.parse(secretKeysRaw);
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, secretKeys.default);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

serve(async () => {
  // Atomically claim all due rows — prevents double-send if cron overlaps
  const { data: due, error } = await supabase
    .from("scheduled_notifications")
    .update({ claimed_at: new Date().toISOString() })
    .lte("send_at", new Date().toISOString())
    .is("claimed_at", null)
    .is("sent_at", null)
    .select("*, push_subscriptions(endpoint, p256dh, auth)");

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!due?.length) return new Response(JSON.stringify({ claimed: 0, sent: 0 }));

  let sent = 0;
  await Promise.allSettled(due.map(async (row) => {
    const sub = row.push_subscriptions;
    if (!sub?.endpoint) return;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: row.title, body: row.body, data: row.data })
      );
      await supabase
        .from("scheduled_notifications")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } catch (err: any) {
      // Remove dead subscriptions (gone / expired)
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      } else {
        await supabase
          .from("scheduled_notifications")
          .update({ error: String(err) })
          .eq("id", row.id);
      }
    }
  }));

  return new Response(JSON.stringify({ claimed: due.length, sent }));
});
