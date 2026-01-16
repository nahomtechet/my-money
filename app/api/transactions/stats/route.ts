import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

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

  const now = new Date()
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id }
  })

  // Calculations
  const income = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

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

  const expensesList = transactions.filter(t => t.type === 'EXPENSE')
  let biggestExpense = { amount: 0, category: 'None' }
  
  if (expensesList.length > 0) {
    const biggest = expensesList.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
    // Fetch category name for the biggest expense
    const category = await prisma.category.findUnique({
        where: { id: biggest.categoryId }
    })
    biggestExpense = {
        amount: biggest.amount,
        category: category?.name || 'Other'
    }
  }
  
  return NextResponse.json({
    balance: income - expenses,
    income,
    expenses,
    growthPercentage: parseFloat(growthPercentage.toFixed(1)),
    savingsRate: Math.round(savingsRate),
    biggestExpense
  })
}
