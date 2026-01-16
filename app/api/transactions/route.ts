import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const transactionSchema = z.object({
  amount: z.coerce.number().min(0.01),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(), // For "Other" manual entry
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.coerce.date().optional(),
  isRecurring: z.coerce.boolean().optional(),
  frequency: z.string().nullable().optional(),
  bankAccountId: z.string().nullable().optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = transactionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let categoryId = parsed.data.categoryId

    // Handle manual category entry ("Other")
    if (!categoryId && parsed.data.categoryName) {
        const category = await prisma.category.upsert({
            where: { 
                // Since user-specific categories aren't uniquely indexed by name alone in the schema per se (@@unique is missing)
                // we'll just find or create based on name and user
                id: (await prisma.category.findFirst({
                    where: { name: parsed.data.categoryName, userId: user.id }
                }))?.id || 'new'
            },
            update: {},
            create: {
                name: parsed.data.categoryName,
                type: parsed.data.type,
                userId: user.id,
                icon: "📦"
            }
        })
        categoryId = category.id
    }

    if (!categoryId) {
        return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parsed.data.amount,
        description: parsed.data.description,
        categoryId: categoryId,
        type: parsed.data.type,
        date: parsed.data.date || new Date(),
        userId: user.id,
        isRecurring: parsed.data.isRecurring || false,
        frequency: parsed.data.frequency || null,
        bankAccountId: parsed.data.bankAccountId || null
      }
    })

    // Create notification
    await prisma.notification.create({
        data: {
            userId: user.id,
            title: parsed.data.type === "INCOME" ? "Income Recorded 💰" : "Expense Recorded 💸",
            message: `${parsed.data.type === "INCOME" ? "Added" : "Spent"} ${parsed.data.amount.toLocaleString()} ETB for ${parsed.data.description || "a transaction"}.`,
            type: "SUCCESS"
        }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
