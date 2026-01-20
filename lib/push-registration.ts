const VAPID_PUBLIC_KEY = "BL2dRwb1YneNPTuAZkk4kZ9BVZkdfHnG5bq67DIbDxzjJ3sG3sBQM3kklJH9nsQX60Nc9r0iBpBb-UP_5oL02to"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerPush() {
  if (!("serviceWorker" in navigator)) return

  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  })

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  await fetch("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "Content-Type": "application/json",
    },
  })
}
