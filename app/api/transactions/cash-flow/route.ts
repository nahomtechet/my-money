import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { startOfDay, subDays, endOfDay, format } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const today = endOfDay(new Date())
    const sevenDaysAgo = startOfDay(subDays(today, 6))

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    })

    // Prepare labels for the last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        dateStr: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE'),
      }
    })

    const data = days.map(day => {
      const dayTransactions = transactions.filter(t => 
        format(new Date(t.date), 'yyyy-MM-dd') === day.dateStr
      )

      const income = dayTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const expenses = dayTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      return {
        day: day.label,
        income,
        expenses,
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Cash flow stats error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
