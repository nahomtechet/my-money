"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
    const session = await auth()
    if (!session?.user?.id) return []

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    })

    if (notifications.length === 0) {
        // Check if user has any transactions
        const transactionCount = await prisma.transaction.count({
            where: { userId: session.user.id }
        })

        // ONLY create initial notifications if they have NO transactions and NO notifications
        if (transactionCount === 0) {
            await prisma.notification.createMany({
                data: [
                    {
                        userId: session.user.id,
                        title: "Welcome to MyMoney! 👋",
                        message: "We're glad to have you. Start by adding your first transaction.",
                        type: "INFO",
                    },
                    {
                        userId: session.user.id,
                        title: "Security Alert 🛡️",
                        message: "Your account was successfully set up. Keep your credentials safe.",
                        type: "SUCCESS",
                    }
                ]
            })
            
            return await prisma.notification.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" }
            })
        }
    }

    return notifications
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
        await prisma.notification.deleteMany({
            where: { userId: session.user.id }
        })
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        return { error: "Failed to mark all as read" }
    }
}
