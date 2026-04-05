import webpush from "web-push";

// In a real app, you'd store push subscriptions per user in the DB.
// This is the dispatch layer — subscription management is handled via the API.

if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@kanboard.local",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// In-memory subscription store (replace with DB in production at scale)
// Key: userId, Value: PushSubscription[]
const subscriptions = new Map<string, webpush.PushSubscription[]>();

export function registerPushSubscription(
  userId: string,
  subscription: webpush.PushSubscription
) {
  const existing = subscriptions.get(userId) ?? [];
  // Avoid duplicate endpoints
  if (!existing.find((s) => s.endpoint === subscription.endpoint)) {
    existing.push(subscription);
  }
  subscriptions.set(userId, existing);
}

export function unregisterPushSubscription(userId: string, endpoint: string) {
  const existing = subscriptions.get(userId) ?? [];
  subscriptions.set(
    userId,
    existing.filter((s) => s.endpoint !== endpoint)
  );
}

export async function sendBrowserPush(userId: string, message: string) {
  const userSubs = subscriptions.get(userId);
  if (!userSubs?.length) return;

  const payload = JSON.stringify({ message });

  await Promise.allSettled(
    userSubs.map((sub) =>
      webpush.sendNotification(sub, payload).catch((err) => {
        // Remove invalid subscriptions (e.g. expired)
        if (err.statusCode === 410) {
          unregisterPushSubscription(userId, sub.endpoint);
        }
      })
    )
  );
}
