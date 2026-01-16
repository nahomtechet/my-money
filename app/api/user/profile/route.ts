import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        const { name, email } = await req.json()

        if (!name || !email) {
            return new NextResponse("Name and Email are required", { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { name, email }
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
            user: { name: updatedUser.name, email: updatedUser.email } 
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
        select: { name: true, email: true }
    })

    return NextResponse.json(user)
}
