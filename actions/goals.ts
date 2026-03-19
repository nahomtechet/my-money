"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function getGoals() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        contributions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const now = new Date()

    return goals.map(goal => {
      const contributions = goal.contributions || []
      const currentValue = contributions.reduce((sum, c) => sum + c.amount, 0)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayContributions = contributions
        .filter(c => new Date(c.date) >= todayStart)
        .reduce((sum, c) => sum + c.amount, 0)

      let dailyTarget = 0
      let monthlyTarget = 0
      let remainingToday = 0
      let daysRemaining = 0

      if (goal.deadline) {
        const deadline = new Date(goal.deadline)
        const createdAt = new Date(goal.createdAt)
        
        // Cumulative Target Logic
        const totalDays = Math.max(1, Math.ceil((deadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
        const fixedDailyTarget = goal.targetValue / totalDays
        
        const daysPassed = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
        const targetToDate = fixedDailyTarget * (daysPassed + 1)
        
        dailyTarget = Math.round(fixedDailyTarget)
        remainingToday = Math.max(0, Math.round(targetToDate - currentValue))
        
        const diffTime = deadline.getTime() - now.getTime()
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        
        monthlyTarget = Math.round(fixedDailyTarget * 30)
      }

      return {
        ...goal,
        currentValue,
        dailyTarget,
        monthlyTarget,
        remainingToday,
        todayContributions,
        daysRemaining
      }
    })
  } catch (error) {
    console.error("Failed to fetch goals:", error)
    return []
  }
}

const CreateGoalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetValue: z.number().min(1, "Target amount must be greater than 0"),
  deadline: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional()
})

export async function createGoal(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const rawData = {
    name: formData.get("name"),
    targetValue: Number(formData.get("targetValue")),
    deadline: formData.get("deadline"),
    color: formData.get("color"),
    icon: formData.get("icon")
  }

  const validatedFields = CreateGoalSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: "Invalid fields" }
  }

  try {
    await prisma.goal.create({
      data: {
        name: validatedFields.data.name,
        targetValue: validatedFields.data.targetValue,
        deadline: validatedFields.data.deadline ? new Date(validatedFields.data.deadline) : null,
        color: validatedFields.data.color || "bg-blue-500",
        icon: validatedFields.data.icon,
        userId: session.user.id
      }
    })
    
    revalidatePath("/goals")
    return { success: true }
  } catch (error) {
    console.error("Failed to create goal:", error)
    return { error: "Failed to create goal" }
  }
}

export async function addGoalContribution(goalId: string, amount: number, description?: string, source?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    // 1. Find the goal to make sure it belongs to the user
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { userId: true, name: true }
    })

    if (!goal || goal.userId !== session.user.id) {
      return { error: "Goal not found" }
    }

    // 2. Create a transaction for this saving if it's an expense (saving money is often viewed as moving it to a goal)
    // Or we just record it as a goal contribution. 
    // The user's request: "if i save like 1500, 1000 will left".
    
    await prisma.goalContribution.create({
      data: {
        goalId,
        amount,
        description,
        source,
        date: new Date()
      }
    })

    // Optionally create a transaction if we want it to show up in the main history
    // For now, let's keep it simple as just a goal contribution tracker as requested.
    
    revalidatePath("/goals")
    return { success: true }
  } catch (error) {
    console.error("Failed to add contribution:", error)
    return { error: "Failed to add contribution" }
  }
}

export async function getGoalById(id: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    try {
        const goal = await prisma.goal.findFirst({
            where: { id, userId: session.user.id },
            include: {
                contributions: {
                    orderBy: { date: 'desc' as const }
                }
            }
        })

        if (!goal) return null

        const contributions = goal.contributions || []
        const currentValue = contributions.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0)
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayContributions = contributions
            .filter((c: { date: Date | string }) => new Date(c.date) >= todayStart)
            .reduce((sum: number, c: { amount: number }) => sum + c.amount, 0)

        let dailyTarget = 0
        let monthlyTarget = 0
        let remainingToday = 0
        let daysRemaining = 0

        if (goal.deadline) {
            const deadline = new Date(goal.deadline)
            const createdAt = new Date(goal.createdAt)
            
            const totalDays = Math.max(1, Math.ceil((deadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
            const fixedDailyTarget = goal.targetValue / totalDays
            
            const daysPassed = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
            const targetToDate = fixedDailyTarget * (daysPassed + 1)
            
            dailyTarget = Math.round(fixedDailyTarget)
            remainingToday = Math.max(0, Math.round(targetToDate - currentValue))
            
            const diffTime = deadline.getTime() - now.getTime()
            daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
            
            monthlyTarget = Math.round(fixedDailyTarget * 30)
        }

        return {
            ...goal,
            currentValue,
            dailyTarget,
            monthlyTarget,
            remainingToday,
            todayContributions,
            daysRemaining
        }
    } catch (error) {
        console.error("Failed to fetch goal detail:", error)
        return null
    }
}
