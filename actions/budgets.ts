"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const CreateBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  period: z.string().default("MONTHLY")
})

export async function createBudget(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    const validatedFields = CreateBudgetSchema.safeParse({
        categoryId: formData.get("categoryId"),
        amount: Number(formData.get("amount")),
        period: formData.get("period") || "MONTHLY"
    })

    if (!validatedFields.success) {
        return { error: "Invalid fields" }
    }

    try {
        await prisma.budget.create({
            data: {
                userId: session.user.id,
                categoryId: validatedFields.data.categoryId,
                amount: validatedFields.data.amount,
                period: validatedFields.data.period
            }
        })

        revalidatePath("/budgets")
        revalidatePath("/") // Update dashboard quick view if needed
        return { success: true }
    } catch (error) {
        console.error("Failed to create budget:", error)
        return { error: "Failed to create budget" }
    }
}

export async function deleteBudget(id: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    try {
        const result = await prisma.budget.deleteMany({
            where: { id, userId: session.user.id }
        })
        
        if (result.count === 0) {
            return { error: "Budget not found or access denied" }
        }
        revalidatePath("/budgets")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete budget:", error)
        return { error: "Failed to delete budget" }
    }
}

export async function getBudgetsWithProgress() {
    const session = await auth()
    if (!session?.user?.id) return { budgets: [], categories: [], totalBudgeted: 0, totalSpent: 0 }

    const userId = session.user.id
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Fetch budgets and categories
    const [budgets, categories, transactions] = await Promise.all([
        prisma.budget.findMany({
            where: { userId },
            include: { category: true }
        }),
        prisma.category.findMany({
            where: { 
                OR: [{ userId }, { userId: null }] 
            },
            orderBy: { name: 'asc' }
        }),
        prisma.transaction.findMany({
            where: {
                userId,
                type: 'EXPENSE',
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        })
    ])

    // Calculate progress for each budget
    const budgetsWithProgress = budgets.map(budget => {
        const spent = transactions
            .filter(t => t.categoryId === budget.categoryId)
            .reduce((sum, t) => sum + t.amount, 0)
        
        const percentage = Math.min((spent / budget.amount) * 100, 100)
        let color = "bg-emerald-500" // Safe
        if (percentage > 80) color = "bg-amber-500" // Warning
        if (percentage >= 100) color = "bg-rose-500" // Over

        return {
            ...budget,
            spent,
            percentage,
            color,
            remaining: Math.max(0, budget.amount - spent),
            isOver: spent > budget.amount
        }
    })

    // Filter categories that don't have a budget yet (for the add dropdown)
    const availableCategories = categories.filter(cat => 
        !budgets.some(b => b.categoryId === cat.id) && cat.type === 'EXPENSE'
    )

    return {
        budgets: budgetsWithProgress,
        categories: availableCategories,
        totalBudgeted: budgets.reduce((sum, b) => sum + b.amount, 0),
        totalSpent: budgetsWithProgress.reduce((sum, b) => sum + b.spent, 0)
    }
}
