import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { createNotification } from "@/actions/notifications"

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: user.id },
        { userId: null }
      ]
    },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = categorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        icon: parsed.data.icon,
        userId: user.id,
      }
    })

    // Create notification
    await createNotification({
        userId: user.id,
        title: "New Category Added 📁",
        message: `Created "${parsed.data.name}" as a new ${parsed.data.type.toLowerCase()} category.`,
        type: "INFO"
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
