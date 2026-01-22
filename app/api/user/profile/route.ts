import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        const { name, email, pushEnabled, budgetRemindersEnabled, telegramUsername, telegramId } = await req.json()

        if (!name || !email) {
            return new NextResponse("Name and Email are required", { status: 400 })
        }

        let verificationCode = undefined
        if (telegramUsername) {
            // Check if username changed or no code exists
            const currentUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { telegramUsername: true, telegramVerificationCode: true }
            })
            
            if (currentUser?.telegramUsername !== telegramUsername || !currentUser?.telegramVerificationCode) {
                verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { 
                name, 
                email,
                pushEnabled: pushEnabled !== undefined ? pushEnabled : undefined,
                budgetRemindersEnabled: budgetRemindersEnabled !== undefined ? budgetRemindersEnabled : undefined,
                telegramUsername: telegramUsername !== undefined ? telegramUsername : undefined,
                telegramId: telegramId !== undefined ? telegramId : undefined,
                telegramVerificationCode: verificationCode
            }
        })

        // Create notification
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                title: "Profile Updated 👤",
                message: "Your profile information has been successfully updated.",
                type: "SUCCESS"
            }
        })

        return NextResponse.json({ 
            success: true, 
            user: { 
                name: updatedUser.name, 
                email: updatedUser.email,
                pushEnabled: updatedUser.pushEnabled,
                budgetRemindersEnabled: updatedUser.budgetRemindersEnabled,
                telegramUsername: updatedUser.telegramUsername,
                telegramId: updatedUser.telegramId,
                telegramVerificationCode: updatedUser.telegramVerificationCode
            } 
        })
    } catch (error) {
        console.error("Profile update failed:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { 
            name: true, 
            email: true,
            pushEnabled: true,
            budgetRemindersEnabled: true,
            telegramUsername: true,
            telegramId: true,
            telegramVerificationCode: true
        }
    })

    return NextResponse.json(user)
}
