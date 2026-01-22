"use server"

import prisma from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"
import { startOfWeek, endOfWeek, subDays, startOfDay, endOfDay } from "date-fns"

/**
 * Finds a user by their Telegram Chat ID
 */
async function getUserByChatId(chatId: string) {
    return await prisma.user.findFirst({
        where: { telegramId: chatId },
        select: { id: true, name: true }
    })
}

/**
 * FEATURE 1: Quick Expense Logging
 * Patterns: "Lunch 200", "200 Taxi", "Dinner 500"
 */
export async function handleQuickLog(chatId: string, text: string) {
    const user = await getUserByChatId(chatId)
    if (!user) return false

    // Try to match "Description Amount" or "Amount Description"
    const match = text.match(/^(.+?)\s+(\d+)$/) || text.match(/^(\d+)\s+(.+?)$/)
    if (!match) return false

    let description, amountStr
    if (text.match(/^(.+?)\s+(\d+)$/)) {
        description = match[1].trim()
        amountStr = match[2]
    } else {
        amountStr = match[1]
        description = match[2].trim()
    }

    const amount = parseFloat(amountStr)
    if (isNaN(amount)) return false

    try {
        // Find or create a generic category if possible, or just use a default one
        let category = await prisma.category.findFirst({
            where: { userId: user.id, name: "General Expense" }
        })

        if (!category) {
            category = await prisma.category.create({
                data: {
                    name: "General Expense",
                    type: "EXPENSE",
                    userId: user.id,
                    icon: "💸"
                }
            })
        }

        await prisma.transaction.create({
            data: {
                amount,
                description,
                type: "EXPENSE",
                userId: user.id,
                categoryId: category.id,
                date: new Date()
            }
        })

        await sendTelegramMessage(chatId, `✅ <b>Logged!</b>\n\n<b>Amount:</b> ${amount.toLocaleString()} ETB\n<b>Description:</b> ${description}\n<b>Category:</b> ${category.name}`)
        return true
    } catch (error) {
        console.error("Quick Log Error:", error)
        await sendTelegramMessage(chatId, "❌ Failed to log transaction. Please try again.")
        return true
    }
}

/**
 * FEATURE 2: Balance & Status Queries
 */
export async function handleBalanceQuery(chatId: string) {
    const user = await getUserByChatId(chatId)
    if (!user) return false

    try {
        const bankAccounts = await prisma.bankAccount.findMany({
            where: { userId: user.id },
            include: { transactions: true }
        })

        if (bankAccounts.length === 0) {
            await sendTelegramMessage(chatId, "💰 <b>Balance Info</b>\n\nYou haven't added any bank accounts yet. Add them on the MyMoney website to see your balance here!")
            return true
        }

        let totalBalance = 0
        const accountsList = bankAccounts.map(account => {
            const balance = account.transactions.reduce((sum, t) => {
                return t.type === "INCOME" ? sum + t.amount : sum - t.amount
            }, 0)
            totalBalance += balance
            return `• <b>${account.name}:</b> ${balance.toLocaleString()} ETB`
        }).join("\n")

        await sendTelegramMessage(chatId, `💰 <b>Balance Summary</b>\n\n${accountsList}\n\n<b>Total:</b> ${totalBalance.toLocaleString()} ETB`)
        return true
    } catch (error) {
        await sendTelegramMessage(chatId, "❌ Failed to fetch balance.")
        return true
    }
}

/**
 * Summary for the last 7 days
 */
export async function handleSummaryQuery(chatId: string) {
    const user = await getUserByChatId(chatId)
    if (!user) return false

    const sevenDaysAgo = subDays(new Date(), 7)

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                date: { gte: sevenDaysAgo }
            }
        })

        const income = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0)
        const expenses = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0)

        await sendTelegramMessage(chatId, `📊 <b>Last 7 Days</b>\n\n📈 <b>Income:</b> ${income.toLocaleString()} ETB\n📉 <b>Expenses:</b> ${expenses.toLocaleString()} ETB\n\n<b>Net:</b> ${(income - expenses).toLocaleString()} ETB`)
        return true
    } catch (error) {
        await sendTelegramMessage(chatId, "❌ Failed to fetch summary.")
        return true
    }
}

/**
 * Equb Status Query
 */
export async function handleEqubQuery(chatId: string) {
    const user = await getUserByChatId(chatId)
    if (!user) return false

    try {
        const upcomingContributions = await prisma.equbContribution.findMany({
            where: {
                equb: { userId: user.id },
                status: "PENDING"
            },
            include: { equb: true },
            orderBy: { date: "asc" },
            take: 3
        })

        if (upcomingContributions.length === 0) {
            await sendTelegramMessage(chatId, "🗓️ <b>Equb Status</b>\n\nYou have no pending contributions! You're all caught up.")
            return true
        }

        const list = upcomingContributions.map(c => {
            const dateStr = new Date(c.date).toLocaleDateString()
            return `• <b>${c.equb.name}:</b> ${c.amount.toLocaleString()} ETB (Due: ${dateStr})`
        }).join("\n")

        await sendTelegramMessage(chatId, `🗓️ <b>Upcoming Equbs</b>\n\n${list}`)
        return true
    } catch (error) {
        await sendTelegramMessage(chatId, "❌ Failed to fetch Equb status.")
        return true
    }
}

/**
 * FEATURE 3: Weekly Financial Reports
 */
export async function handleWeeklyReport(chatId: string) {
    const user = await getUserByChatId(chatId)
    if (!user) return false

    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: weekStart,
                    lte: weekEnd
                }
            },
            include: { category: true }
        })

        const income = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0)
        const expenses = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0)
        
        // Group by category
        const categoryUsage: Record<string, number> = {}
        transactions.filter(t => t.type === "EXPENSE").forEach(t => {
            const catName = t.category?.name || "Other"
            categoryUsage[catName] = (categoryUsage[catName] || 0) + t.amount
        })

        const topCategories = Object.entries(categoryUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, amount]) => `• ${name}: ${amount.toLocaleString()} ETB`)
            .join("\n")

        const report = [
            `📅 <b>Weekly Report</b> (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`,
            "",
            `📈 <b>Total Income:</b> ${income.toLocaleString()} ETB`,
            `📉 <b>Total Expenses:</b> ${expenses.toLocaleString()} ETB`,
            `💰 <b>Net Savings:</b> ${(income - expenses).toLocaleString()} ETB`,
            "",
            "🏷️ <b>Top Expense Categories:</b>",
            topCategories || "No expenses recorded this week."
        ].join("\n")

        await sendTelegramMessage(chatId, report)
        return true
    } catch (error) {
        console.error("Weekly Report Error:", error)
        await sendTelegramMessage(chatId, "❌ Failed to generate weekly report.")
        return true
    }
}
