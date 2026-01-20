import webpush from "web-push"

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BL2dRwb1YneNPTuAZkk4kZ9BVZkdfHnG5bq67DIbDxzjJ3sG3sBQM3kklJH9nsQX60Nc9r0iBpBb-UP_5oL02to"
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "MZSTtCo6Mqxucd9XVKTdJFgNaXM3Z5QuRNaKWovUqv8"

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  publicVapidKey,
  privateVapidKey
)

export async function sendPushNotification(subscription: any, payload: any) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (error) {
    console.error("Error sending push notification:", error)
    return { success: false, error }
  }
}
