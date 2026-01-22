"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay } from "date-fns"
import { sendTelegramMessage } from "@/lib/telegram"

export async function checkPendingEqubs() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)

  try {
    // Find all pending contributions due today or earlier that don't have a notification yet
    const pendingContributions = await prisma.equbContribution.findMany({
      where: {
        status: "PENDING",
        date: {
          lte: dayEnd
        },
        equb: {
          userId: session.user.id
        }
      },
      include: {
        equb: true
      }
    })

    for (const contribution of pendingContributions) {
      // Check if notification already exists for this contribution
      const existing = await prisma.notification.findFirst({
        where: {
          userId: session.user.id,
          actionId: contribution.id,
          actionType: "MARK_EQUB_PAID",
          read: false
        }
      })

      if (!existing) {
        const notification = await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: "Equb Payment Due Today 📅",
            message: `Hi ${session.user.name || "there"}, today you have ${contribution.equb.name}. Do you want to pay ${contribution.amount.toLocaleString()} ETB now?`,
            type: "EQUB_REMINDER",
            actionId: contribution.id,
            actionType: "MARK_EQUB_PAID"
          }
        })

        // Send to Telegram if user has registered their ID
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { telegramId: true }
        })

        if (user?.telegramId) {
          await sendTelegramMessage(user.telegramId, `🔔 <b>Equb Reminder</b>\n\n${notification.message}`)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to check pending Equbs:", error)
    return { error: "Failed to check pending Equbs" }
  }
}

export async function dismissNotification(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true }
    })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { error: "Failed to dismiss notification" }
  }
}
export async function getNotifications() {
  const session = await auth()
  if (!session?.user?.id) return []

  try {
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: session.user.id,
        read: false 
      },
      orderBy: { createdAt: "desc" }
    })
    return notifications
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return []
  }
}

export async function deleteNotification(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    await prisma.notification.deleteMany({
      where: { id, userId: session.user.id }
    })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete notification" }
  }
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id },
      data: { read: true }
    })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { error: "Failed to mark all read" }
  }
}
