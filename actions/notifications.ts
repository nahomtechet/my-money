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

        // If it's an actionable Savings reminder, add the button
        if (data.actionType === "MARK_GOAL_SAVED" && data.actionId) {
            replyMarkup = {
                inline_keyboard: [[
                    { text: "💰 Record Saving", callback_data: `save_goal:${data.actionId}` }
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

export async function checkSavingsGoals() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const today = new Date()
  const todayStart = startOfDay(today)

  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        deadline: {
          not: null
        }
      },
      include: {
        contributions: true
      }
    })
    for (const goal of goals) {
      // 1. Calculate progress (Cumulative Logic)
      const totalSaved = goal.contributions.reduce((sum, c) => sum + c.amount, 0)
      if (totalSaved >= goal.targetValue) continue // Goal already reached

      const deadline = new Date(goal.deadline!)
      const createdAt = new Date(goal.createdAt)
      const today = new Date()
      const todayStart = startOfDay(today)

      // Total days from creation to deadline
      const totalDays = Math.max(1, Math.ceil((deadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
      const fixedDailyTarget = goal.targetValue / totalDays
      
      // Days passed including today
      const daysPassed = Math.max(0, Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
      const targetToDate = fixedDailyTarget * (daysPassed + 1)
      
      const remainingToday = Math.max(0, Math.round(targetToDate - totalSaved))

      if (remainingToday > 0) {
        // 2. User still needs to save today. Check if notification already exists
        const existing = await prisma.notification.findFirst({
          where: {
            userId: session.user.id,
            actionId: goal.id,
            actionType: "MARK_GOAL_SAVED",
            createdAt: {
              gte: todayStart
            }
          }
        })

        if (!existing) {
          const todaySaved = goal.contributions
            .filter(c => new Date(c.date) >= todayStart)
            .reduce((sum, c) => sum + c.amount, 0)

          await createNotification({
            userId: session.user.id,
            title: `Savings Goal: ${goal.name} 💰`,
            message: `Hi! Don't forget to save for your goal "${goal.name}". Your daily target is ${Math.round(fixedDailyTarget).toLocaleString()} ETB. You've saved ${todaySaved.toLocaleString()} ETB so far today. Still need ${remainingToday.toLocaleString()} ETB to stay on track!`,
            type: "INFO",
            actionId: goal.id,
            actionType: "MARK_GOAL_SAVED"
          })
          console.log(`📱 Processed savings reminder for goal ${goal.id}`)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to check savings goals:", error)
    return { error: "Failed to check savings goals" }
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
