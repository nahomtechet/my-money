import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        const { name, email, pushEnabled, budgetRemindersEnabled } = await req.json()

        if (!name || !email) {
            return new NextResponse("Name and Email are required", { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { 
                name, 
                email,
                pushEnabled: pushEnabled !== undefined ? pushEnabled : undefined,
                budgetRemindersEnabled: budgetRemindersEnabled !== undefined ? budgetRemindersEnabled : undefined
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
                budgetRemindersEnabled: updatedUser.budgetRemindersEnabled
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
            budgetRemindersEnabled: true
        }
    })

    return NextResponse.json(user)
}
