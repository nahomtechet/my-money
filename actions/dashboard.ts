"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { startOfDay, subDays, endOfDay, format } from "date-fns"

export async function getDashboardData() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id
  const now = new Date()
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Fetch all data in parallel
  const [
    transactions,
    categories,
    goals
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: null }]
      },
      orderBy: { name: 'asc' }
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  ])

  // --- Stats Calculations ---
  const income = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = income - expenses

  // --- Growth & Savings Calculation ---
  const currentMonthExpenses = transactions
    .filter(t => t.type === 'EXPENSE' && new Date(t.date) >= firstDayCurrentMonth)
    .reduce((sum, t) => sum + t.amount, 0)

  const lastMonthExpenses = transactions
    .filter(t => t.type === 'EXPENSE' && new Date(t.date) >= firstDayLastMonth && new Date(t.date) <= lastDayLastMonth)
    .reduce((sum, t) => sum + t.amount, 0)

  let growthPercentage = 0
  if (lastMonthExpenses > 0) {
    growthPercentage = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
  } else if (currentMonthExpenses > 0) {
    growthPercentage = 100
  }

  const savingsRate = income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0

  // --- Biggest Expense ---
  const expensesList = transactions.filter(t => t.type === 'EXPENSE')
  let biggestExpense = { amount: 0, category: 'None' }
  
  if (expensesList.length > 0) {
    const biggest = expensesList.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
    biggestExpense = {
        amount: biggest.amount,
        category: biggest.category?.name || 'Other'
    }
  }

  // --- Recent Transactions ---
  const recentTransactions = transactions.slice(0, 10).map(tx => ({
    ...tx,
    amount: tx.amount, // Ensure number type
  }))

  // --- Cash Flow (Last 7 Days) ---
  const today = endOfDay(new Date())
  
  // Prepare labels for the last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i) // Corrected from new Date() to today to ensure consistency
    return {
      dateStr: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE'),
    }
  })

  const cashFlow = days.map(day => {
    const dayTransactions = transactions.filter(t => 
      format(new Date(t.date), 'yyyy-MM-dd') === day.dateStr
    )

    const dayIncome = dayTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const dayExpenses = dayTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      day: day.label,
      income: dayIncome,
      expenses: dayExpenses,
    }
  })

  // Return aggregated data
  return {
    stats: {
        balance,
        income,
        expenses,
        growthPercentage: parseFloat(growthPercentage.toFixed(1)),
        savingsRate: Math.round(savingsRate),
        biggestExpense,
    },
    recentTransactions,
    categories,
    cashFlow,
    goalsCount: goals.length
  }
}
