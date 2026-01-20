import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subscription = await req.json()

  if (!subscription || !subscription.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  try {
    // Save or update subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: session.user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving push subscription:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { endpoint } = await req.json()

  try {
    await prisma.pushSubscription.delete({
      where: { endpoint },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting push subscription:", error)
    return NextResponse.json({ success: true }) // Return true even if not found
  }
}
