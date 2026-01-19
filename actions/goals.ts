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
      orderBy: {
        createdAt: 'desc'
      }
    })
    return goals
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
