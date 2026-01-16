import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    })

    // If no notifications, create some dummy ones for first-time users
    if (notifications.length === 0) {
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
        
        const initialNotifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" }
        })
        return NextResponse.json(initialNotifications)
    }

    return NextResponse.json(notifications)
}

export async function PATCH(req: Request) {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { id, readAll } = await req.json()

    if (readAll) {
        await prisma.notification.deleteMany({
            where: { userId: session.user.id }
        })
    } else if (id) {
        await prisma.notification.deleteMany({
            where: { id, userId: session.user.id }
        })
    }

    return NextResponse.json({ success: true })
}
