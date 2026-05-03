// push.js — push notification subscription management

function urlBase64ToUint8Array(base64String) {
  var padding = "=".repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  var rawData = atob(base64);
  var output = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

async function registerPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  var permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  var reg = await navigator.serviceWorker.ready;
  var existing = await reg.pushManager.getSubscription();
  if (existing) {
    // Already subscribed — ensure it's saved in Supabase
    await upsertPushSubscription(existing);
    return existing;
  }

  var subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  await upsertPushSubscription(subscription);
  return subscription;
}

async function upsertPushSubscription(subscription) {
  var json = subscription.toJSON();
  var { data, error } = await supabaseClient
    .from("push_subscriptions")
    .upsert({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent
    }, { onConflict: "endpoint" })
    .select("id")
    .single();
  if (error) { console.error("Failed to save push subscription:", error.message); return; }
  localStorage.setItem("la-push-sub-id", data.id);
}

async function scheduleNotification(patient, timer) {
  var subId = localStorage.getItem("la-push-sub-id");
  if (!subId) return;

  var typeInfo = TIMER_TYPES.find(function(t) { return t.id === timer.type; }) || TIMER_TYPES[TIMER_TYPES.length - 1];
  var label = timer.type === "custom" ? (timer.customLabel || "Custom") : typeInfo.label;

  var { data, error } = await supabaseClient
    .from("scheduled_notifications")
    .insert({
      subscription_id: subId,
      send_at: new Date(timer.nextDueAt).toISOString(),
      title: "Little Arrivals",
      body: patient.label + " — " + label + " is due",
      data: { patientId: patient.id, timerId: timer.id }
    })
    .select("id")
    .single();

  if (error) { console.error("Failed to schedule notification:", error.message); return; }
  timer.pushNotificationId = data.id;
  saveTimers();
}

async function cancelNotification(timer) {
  if (!timer.pushNotificationId) return;
  var { error } = await supabaseClient
    .from("scheduled_notifications")
    .delete()
    .eq("id", timer.pushNotificationId);
  if (error) { console.error("Failed to cancel notification:", error.message); return; }
  timer.pushNotificationId = null;
  saveTimers();
}
