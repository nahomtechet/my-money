"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay } from "date-fns"
import { sendTelegramMessage, deleteTelegramMessage } from "@/lib/telegram"

async function deleteTelegramSync(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: { select: { telegramId: true } } }
    })
    
    if (notification?.telegramMessageId && notification.user?.telegramId) {
      await deleteTelegramMessage(notification.user.telegramId, parseInt(notification.telegramMessageId))
    }
  } catch (error) {
    console.error("Failed to sync telegram deletion:", error)
  }
}

export async function createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    actionId?: string;
    actionType?: string;
}) {
    // 1. Create in-app notification
    const notification = await prisma.notification.create({
        data
    });

    // 2. Check if user has Telegram linked
    const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { telegramId: true }
    });

    if (user?.telegramId) {
        // Build Telegram message
        let text = `<b>${data.title}</b>\n\n${data.message}`;
        let replyMarkup = undefined;

        // If it's an actionable Equb reminder, add the button
        if (data.actionType === "MARK_EQUB_PAID" && data.actionId) {
            replyMarkup = {
                inline_keyboard: [[
                    { text: "✅ Yes, Pay Now", callback_data: `pay_equb:${data.actionId}` }
                ]]
            };
        }

        const sentMessageId = await sendTelegramMessage(user.telegramId, text, replyMarkup);

        if (sentMessageId) {
            // Log the message ID for sync/deletion later
            await prisma.notification.update({
                where: { id: notification.id },
                data: { telegramMessageId: sentMessageId.toString() }
            });
        }
    }

    return notification;
}

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
        await createNotification({
          userId: session.user.id,
          title: "Equb Payment Due Today 📅",
          message: `Hi ${session.user.name || "there"}, today you have ${contribution.equb.name}. Do you want to pay ${contribution.amount.toLocaleString()} ETB now?`,
          type: "EQUB_REMINDER",
          actionId: contribution.id,
          actionType: "MARK_EQUB_PAID"
        })
        console.log(`📱 Processed notification for contribution ${contribution.id}`)
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
    // Before marking as read, handle telegram sync
    await deleteTelegramSync(id, session.user.id)

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
    // Before deleting, handle telegram sync
    await deleteTelegramSync(id, session.user.id)

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
    // Handle telegram sync for all unread notifications before marking all as read
    const unreadNotifications = await prisma.notification.findMany({
      where: { userId: session.user.id, read: false, telegramMessageId: { not: null } },
      select: { id: true, telegramMessageId: true }
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { telegramId: true }
    })

    if (user?.telegramId) {
      for (const n of unreadNotifications) {
        if (n.telegramMessageId) {
          await deleteTelegramMessage(user.telegramId, parseInt(n.telegramMessageId))
        }
      }
    }

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
