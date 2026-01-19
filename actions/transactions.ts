"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

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
