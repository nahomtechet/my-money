"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { addWeeks, addMonths, addDays } from "date-fns"

const equbSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contributionAmount: z.coerce.number().min(1, "Amount must be at least 1"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  startDate: z.coerce.date(),
  totalCycles: z.coerce.number().int().min(1),
  payoutCycle: z.coerce.number().int().min(1),
})

async function getOrCreateCategory(name: string, type: "INCOME" | "EXPENSE", userId: string) {
  let category = await prisma.category.findFirst({
    where: { name, type, userId }
  })

  if (!category) {
    category = await prisma.category.create({
      data: {
        name,
        type,
        userId,
        icon: type === "INCOME" ? "🎁" : "📅"
      }
    })
  }

  return category
}

async function getAccountBalance(bankAccountId: string, userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId, bankAccountId }
  })

  return transactions.reduce((sum, t) => {
    if (t.type === "INCOME") return sum + t.amount
    if (t.type === "EXPENSE") return sum - t.amount
    return sum
  }, 0)
}

export async function createEqub(data: z.infer<typeof equbSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const validated = equbSchema.parse(data)

    const equb = await prisma.$transaction(async (tx) => {
      const newEqub = await tx.equb.create({
        data: {
          ...validated,
          userId: session.user.id!,
        }
      })

      // Generate contributions
      const contributions = []
      for (let i = 1; i <= validated.totalCycles; i++) {
        let date = new Date(validated.startDate)
        if (validated.frequency === "DAILY") {
          date = addDays(date, i - 1)
        } else if (validated.frequency === "WEEKLY") {
          date = addWeeks(date, i - 1)
        } else {
          date = addMonths(date, i - 1)
        }

        contributions.push({
          equbId: newEqub.id,
          cycleNumber: i,
          amount: validated.contributionAmount,
          date,
          status: "PENDING"
        })
      }

      await tx.equbContribution.createMany({
        data: contributions
      })

      // Generate payout
      let payoutDate = new Date(validated.startDate)
      if (validated.frequency === "DAILY") {
        payoutDate = addDays(payoutDate, validated.payoutCycle - 1)
      } else if (validated.frequency === "WEEKLY") {
        payoutDate = addWeeks(payoutDate, validated.payoutCycle - 1)
      } else {
        payoutDate = addMonths(payoutDate, validated.payoutCycle - 1)
      }

      await tx.equbPayout.create({
        data: {
          equbId: newEqub.id,
          amount: validated.contributionAmount * validated.totalCycles,
          date: payoutDate,
          status: "PENDING"
        }
      })

      return newEqub
    })

    revalidatePath("/equb")
    return { success: true, equb }
  } catch (error) {
    console.error("Failed to create Equb:", error)
    return { error: "Failed to create Equb" }
  }
}

export async function getEqubs() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const equbs = await prisma.equb.findMany({
      where: { userId: session.user.id },
      include: {
        contributions: {
          orderBy: { cycleNumber: "asc" }
        },
        payout: true
      },
      orderBy: { createdAt: "desc" }
    })

    return { equbs }
  } catch (error) {
    console.error("Failed to fetch Equbs:", error)
    return { error: "Failed to fetch Equbs" }
  }
}

export async function getBankAccounts() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id }
    })
    return { bankAccounts }
  } catch (error) {
    return { error: "Failed to fetch accounts" }
  }
}

export async function markContributionPaid(contributionId: string, bankAccountId?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const contribution = await prisma.equbContribution.findUnique({
      where: { id: contributionId },
      include: { equb: true }
    })

    if (!contribution || contribution.equb.userId !== session.user.id) {
      return { error: "Contribution not found" }
    }

    if (contribution.status === "PAID") {
      return { error: "Already paid" }
    }

    // Balance check
    if (bankAccountId) {
      const balance = await getAccountBalance(bankAccountId, session.user.id)
      if (balance < contribution.amount) {
        return { error: `Insufficient balance! Your current balance is ${balance.toLocaleString()} ETB.` }
      }
    }

    const category = await getOrCreateCategory("Equb Contribution", "EXPENSE", session.user.id)

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: contribution.amount,
          description: `Equb Contribution: ${contribution.equb.name} (Cycle ${contribution.cycleNumber})`,
          type: "EXPENSE",
          date: new Date(),
          userId: session.user.id!,
          categoryId: category.id,
          bankAccountId: bankAccountId || null
        }
      })

      await tx.equbContribution.update({
        where: { id: contributionId },
        data: {
          status: "PAID",
          transactionId: transaction.id
        }
      })

      // Add Notification
      await tx.notification.create({
        data: {
          userId: session.user.id!,
          title: "Equb Payment Recorded 💸",
          message: `You paid ${contribution.amount.toLocaleString()} ETB for your ${contribution.equb.name} (Cycle ${contribution.cycleNumber}).`,
          type: "SUCCESS"
        }
      })
    })

    revalidatePath("/equb")
    revalidatePath("/transactions")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to record payment:", error)
    return { error: "Failed to record payment" }
  }
}

export async function receiveEqubPayout(payoutId: string, bankAccountId?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    const payout = await prisma.equbPayout.findUnique({
      where: { id: payoutId },
      include: { equb: true }
    })

    if (!payout || payout.equb.userId !== session.user.id) {
      return { error: "Payout not found" }
    }

    if (payout.status === "RECEIVED") {
      return { error: "Already received" }
    }

    const category = await getOrCreateCategory("Equb Payout", "INCOME", session.user.id)

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          amount: payout.amount,
          description: `Equb Payout: ${payout.equb.name}`,
          type: "INCOME",
          date: new Date(),
          userId: session.user.id!,
          categoryId: category.id,
          bankAccountId: bankAccountId || null
        }
      })

      await tx.equbPayout.update({
        where: { id: payoutId },
        data: {
          status: "RECEIVED",
          transactionId: transaction.id
        }
      })

      // Add Notification
      await tx.notification.create({
        data: {
          userId: session.user.id!,
          title: "Equb Payout Received! 💰",
          message: `Hooray! You received a lump sum of ${payout.amount.toLocaleString()} ETB from ${payout.equb.name}.`,
          type: "SUCCESS"
        }
      })
    })

    revalidatePath("/equb")
    revalidatePath("/transactions")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to record payout:", error)
    return { error: "Failed to record payout" }
  }
}

export async function deleteEqub(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  try {
    await prisma.equb.deleteMany({
      where: { id, userId: session.user.id }
    })

    revalidatePath("/equb")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete Equb:", error)
    return { error: "Failed to delete Equb" }
  }
}
