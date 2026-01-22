"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { sendPushNotification } from "@/lib/push"
import { startOfWeek, endOfWeek } from "date-fns"

const transactionSchema = z.object({
  amount: z.coerce.number().min(0.01),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(), // For "Other" manual entry
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  date: z.coerce.date().optional(),
  isRecurring: z.coerce.boolean().optional(),
  frequency: z.string().nullable().optional(),
  bankAccountId: z.string().nullable().optional(),
  toBankAccountId: z.string().nullable().optional(),
})

export async function getTransactions(filters: {
  type?: string
  categoryId?: string
  search?: string
  page?: number
} = {}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const { type, categoryId, search } = filters
  
  // Build where clause
  const where: Prisma.TransactionWhereInput = {
    userId: session.user.id,
    ...(type && { type: type as any }),
    ...(categoryId && categoryId !== "ALL" && { categoryId }),
    ...(search && {
      OR: [
        { description: { contains: search, mode: "insensitive" } },
        { 
          category: { 
            name: { contains: search, mode: "insensitive" } 
          } 
        }
      ]
    })
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        bankAccount: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 100 // Limit for performance, can add pagination later
    })

    return { transactions }
  } catch (error) {
    console.error("Failed to fetch transactions:", error)
    return { error: "Failed to fetch transactions", transactions: [] }
  }
}

export async function deleteTransaction(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    await prisma.transaction.deleteMany({
      where: {
        id,
        userId: session.user.id
      }
    })
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete transaction" }
  }
}

export async function createTransaction(data: any) {
  const session = await auth()
  if (!session?.user?.email) {
    return { error: "Not authenticated" }
  }

  try {
    const parsed = transactionSchema.safeParse(data)

    if (!parsed.success) {
      return { error: "Invalid data", details: parsed.error.format() }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    
    if (!user) {
      return { error: "User not found" }
    }

    // --- Handle Transfer ---
    if (parsed.data.type === "TRANSFER") {
        const { amount, description, bankAccountId, toBankAccountId, date } = parsed.data
        
        // Find or create Transfer category
        let transferCategory = await prisma.category.findFirst({
            where: { name: "Transfer", userId: user.id }
        })

        if (!transferCategory) {
            transferCategory = await prisma.category.create({
                data: {
                    name: "Transfer",
                    type: "EXPENSE", // Default type
                    userId: user.id,
                    icon: "🔄"
                }
            })
        }

        // Fetch account names for better descriptions
        let fromAccountName = "Cash"
        let toAccountName = "Cash"

        if (bankAccountId) {
            const fromAcc = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } })
            if (fromAcc) fromAccountName = fromAcc.name
        }

        if (toBankAccountId) {
            const toAcc = await prisma.bankAccount.findUnique({ where: { id: toBankAccountId } })
            if (toAcc) toAccountName = toAcc.name
        }

        // --- Simple Flow Logic ---
        // If one side is Cash (null), we do a SINGLE ENTRY to keep balance update simple for the user.
        // If both are Banks, we keep DOUBLE ENTRY for accounting integrity.
        
        if (!bankAccountId || !toBankAccountId) {
            // SINGLE ENTRY (Simple Flow)
            const targetType = toBankAccountId ? "INCOME" : "EXPENSE"
            const targetBankId = toBankAccountId || bankAccountId
            const actionLabel = toBankAccountId ? "Deposit to" : "Withdrawal from"
            const finalDescription = description || `${actionLabel} ${toBankAccountId ? toAccountName : fromAccountName}`

            await prisma.transaction.create({
                data: {
                    amount,
                    description: finalDescription,
                    categoryId: transferCategory.id,
                    type: targetType,
                    date: date || new Date(),
                    userId: user.id,
                    bankAccountId: targetBankId || null
                }
            })
        } else {
            // DOUBLE ENTRY (Bank to Bank)
            await prisma.$transaction([
                // 1. Source Transaction (Expense)
                prisma.transaction.create({
                    data: {
                        amount,
                        description: description || `Transfer to ${toAccountName}`,
                        categoryId: transferCategory.id,
                        type: "EXPENSE",
                        date: date || new Date(),
                        userId: user.id,
                        bankAccountId: bankAccountId
                    }
                }),
                // 2. Destination Transaction (Income)
                prisma.transaction.create({
                    data: {
                        amount,
                        description: description || `Transfer from ${fromAccountName}`,
                        categoryId: transferCategory.id,
                        type: "INCOME",
                        date: date || new Date(),
                        userId: user.id,
                        bankAccountId: toBankAccountId
                    }
                })
            ])
        }

        // Create notification
        await prisma.notification.create({
            data: {
                userId: user.id,
                title: "Transfer Completed 💸",
                message: `Transferred ${amount.toLocaleString()} ETB between accounts.`,
                type: "INFO"
            }
        })

        revalidatePath("/")
        revalidatePath("/transactions")
        return { success: true }
    }

    // --- Handle Income/Expense ---
    let categoryId = parsed.data.categoryId

    // Handle manual category entry ("Other")
    if (!categoryId && parsed.data.categoryName) {
        const categoryResult = await prisma.category.findFirst({
            where: { name: parsed.data.categoryName, userId: user.id }
        })

        if (categoryResult) {
            categoryId = categoryResult.id
        } else {
            const category = await prisma.category.create({
                data: {
                    name: parsed.data.categoryName,
                    type: parsed.data.type as "INCOME" | "EXPENSE",
                    userId: user.id,
                    icon: "📦"
                }
            })
            categoryId = category.id
        }
    }

    if (!categoryId) {
        return { error: "Category is required" }
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parsed.data.amount,
        description: parsed.data.description,
        categoryId: categoryId,
        type: parsed.data.type as "INCOME" | "EXPENSE",
        date: parsed.data.date || new Date(),
        userId: user.id,
        isRecurring: parsed.data.isRecurring || false,
        frequency: parsed.data.frequency || null,
        bankAccountId: parsed.data.bankAccountId || null
      }
    })

    // --- 4. Contextual Alerts Engine ---
    let smartInsight = ""
    if (parsed.data.type === "EXPENSE") {
        // A. Frequency Insights
        const weekStart = startOfWeek(new Date())
        const weekEnd = endOfWeek(new Date())
        
        const countThisWeek = await prisma.transaction.count({
            where: {
                userId: user.id,
                categoryId: categoryId,
                type: "EXPENSE",
                date: {
                    gte: weekStart,
                    lte: weekEnd
                }
            }
        })

        const category = await prisma.category.findUnique({ where: { id: categoryId } })
        if (countThisWeek >= 3) {
            smartInsight = `This is your ${countThisWeek}${countThisWeek === 3 ? 'rd' : 'th'} ${category?.name} expense this week. 🧐`
        }

        // B. Size Insights
        const avgExpense = await prisma.transaction.aggregate({
            where: { userId: user.id, categoryId: categoryId, type: "EXPENSE" },
            _avg: { amount: true }
        })

        if (avgExpense._avg.amount && parsed.data.amount > avgExpense._avg.amount * 1.5) {
            smartInsight = smartInsight 
                ? `${smartInsight} Also, this is 50% larger than your usual ${category?.name} spend.`
                : `This spend is 50% larger than your usual ${category?.name} amount. 📉`
        }
    }

    // Create notification record
    await prisma.notification.create({
        data: {
            userId: user.id,
            title: parsed.data.type === "INCOME" ? "Income Recorded 💰" : "Expense Recorded 💸",
            message: smartInsight || `${parsed.data.type === "INCOME" ? "Added" : "Spent"} ${parsed.data.amount.toLocaleString()} ETB for ${parsed.data.description || "a transaction"}.`,
            type: "SUCCESS"
        }
    })

    // Send Real-time Push if enabled
    const userWithPush = await prisma.user.findUnique({
        where: { id: user.id },
        include: { pushSubscriptions: true }
    })

    if (userWithPush?.pushEnabled && userWithPush.pushSubscriptions.length > 0) {
        for (const sub of userWithPush.pushSubscriptions) {
            await sendPushNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                },
                {
                    title: parsed.data.type === "INCOME" ? "Income Recorded 💰" : "Expense Recorded 💸",
                    message: smartInsight || `${parsed.data.type === "INCOME" ? "Added" : "Spent"} ${parsed.data.amount.toLocaleString()} ETB.`
                }
            )
        }
    }

    revalidatePath("/")
    revalidatePath("/transactions")
    
    return { success: true, transaction }
  } catch (error) {
    console.error("Create transaction error:", error)
    return { error: "Internal Server Error" }
  }
}
