"use client"

import { signOut, useSession } from "next-auth/react"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { GlassCard } from "@/components/ui/glass-card"
import { NotificationPopover } from "@/components/notifications/notification-popover"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Eye, 
  EyeOff, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Bell, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PieChart, 
  Target, 
  ArrowDownRight, 
  ChevronRight 
} from "lucide-react"

interface Transaction {
  id: string
  description: string | null
  amount: number
  type: string
  date: string
  category: { name: string } | null
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    recentTransactions: [],
    categories: [],
    growthPercentage: 0,
    savingsRate: 87, // Mocked for design
    biggestExpense: { amount: 120, category: "Bills & Utilities" }, // Mocked
    cashFlow: []
  })
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  async function fetchData() {
      try {
          const [statsRes, recentRes, categoriesRes, cashFlowRes] = await Promise.all([
              fetch("/api/transactions/stats"),
              fetch("/api/transactions/recent"),
              fetch("/api/categories"),
              fetch("/api/transactions/cash-flow")
          ])
          const statsData = await statsRes.json()
          const recentData = await recentRes.json()
          const categoriesData = await categoriesRes.json()
          const cashFlowData = await cashFlowRes.json()
          setStats(prev => ({ 
              ...prev, 
              ...statsData, 
              recentTransactions: recentData,
              categories: categoriesData,
              cashFlow: cashFlowData
          }))
      } catch (error) {
          console.error("Failed to fetch dashboard data:", error)
      } finally {
          setIsLoading(false)
      }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdf8f4]/30">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-6 pt-6 space-y-6"
      >
        {/* Header Greeting */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
                <p className="text-slate-400 font-medium text-[10px]">Good afternoon</p>
                <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                    Hey, {session?.user?.name?.split(' ')[0] || "User"} <span className="animate-bounce">👋</span>
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <NotificationPopover />
                <Link href="/settings" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <Settings className="w-4 h-4 text-slate-600" />
                </Link>
            </div>
        </motion.div>

        {/* Hero Balance Card */}
        <motion.div variants={itemVariants}>
            <div className="bg-[#008080] rounded-[1.5rem] p-6 text-white shadow-2xl shadow-teal-900/10 relative overflow-hidden group">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[60%] bg-white/5 blur-[80px] rounded-full group-hover:bg-white/10 transition-colors" />

                <div className="space-y-4 relative z-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-teal-50/70 font-medium tracking-wide text-[10px]">Total Balance</p>
                            <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                {isBalanceVisible ? <Eye className="w-3.5 h-3.5 opacity-70" /> : <EyeOff className="w-3.5 h-3.5 opacity-70" />}
                            </button>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter tabular-nums drop-shadow-sm">
                            {isBalanceVisible ? `${stats.balance.toLocaleString()} ETB` : '•••• ETB'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 space-y-1.5 hover:bg-white/15 transition-colors border border-white/5">
                            <div className="flex items-center gap-1.5 text-teal-100/80">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Income</span>
                            </div>
                            <p className="text-lg font-black tabular-nums">
                                {isBalanceVisible ? `${stats.income.toLocaleString()} ETB` : '•••• ETB'}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 md:p-4 space-y-1.5 hover:bg-white/15 transition-colors border border-white/5">
                            <div className="flex items-center gap-1.5 text-teal-100/80">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Expenses</span>
                            </div>
                            <p className="text-lg font-black tabular-nums text-rose-400">
                                {isBalanceVisible ? `${stats.expenses.toLocaleString()} ETB` : '•••• ETB'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Quick Action Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2">
            <AddTransactionDialog categories={stats.categories} onSuccess={fetchData} /> 
            
            <Link href="/analytics" className="flex flex-col items-center justify-center gap-1.5 p-3 md:p-4 rounded-[1.25rem] border border-slate-100 bg-white hover:bg-slate-50 transition-all hover:scale-[1.02] shadow-sm">
                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                    <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest leading-tight text-center">View<br/>Analytics</span>
            </Link>

            <Link href="/budgets" className="flex flex-col items-center justify-center gap-1.5 p-3 md:p-4 rounded-[1.25rem] border border-slate-100 bg-white hover:bg-slate-50 transition-all hover:scale-[1.02] shadow-sm">
                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                    <PieChart className="w-4 h-4" />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest leading-tight text-center">Budget<br/>Goals</span>
            </Link>

            <Link href="/goals" className="flex flex-col items-center justify-center gap-1.5 p-3 md:p-4 rounded-[1.25rem] border border-slate-100 bg-white hover:bg-slate-50 transition-all hover:scale-[1.02] shadow-sm">
                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                    <Target className="w-4 h-4" />
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest leading-tight text-center">Set<br/>Goals</span>
            </Link>
        </motion.div>

        {/* Cash Flow Section */}
        <motion.div variants={itemVariants} className="space-y-3">
            <GlassCard className="p-5 border-slate-100/60 shadow-lg bg-white/80 rounded-[1.5rem]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-black tracking-tight text-slate-900">Cash Flow</h3>
                        <p className="text-slate-400 text-[9px] font-medium">Last 7 days activity</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-[9px] font-bold text-slate-400">Income</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-rose-500 rounded-full" />
                            <span className="text-[9px] font-bold text-slate-400">Expenses</span>
                        </div>
                    </div>
                </div>

                {/* Real Chart Visualization */}
                <div className="h-32 flex items-end justify-between gap-1 relative overflow-hidden group">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="w-full h-px bg-slate-200 border-t border-dashed border-slate-400" />
                        ))}
                    </div>

                    {stats.cashFlow.map((day: any) => {
                        const maxVal = Math.max(...stats.cashFlow.map((d: any) => Math.max(d.income, d.expenses, 1)))
                        const incomeHeight = (day.income / maxVal) * 80
                        const expenseHeight = (day.expenses / maxVal) * 80
                        
                        return (
                            <div key={day.day} className="flex-1 flex flex-col items-center gap-1 group/day relative">
                                <div className="absolute bottom-6 opacity-0 group-hover/day:opacity-100 transition-opacity bg-white border border-slate-100 shadow-lg rounded-lg p-1.5 z-20 min-w-[70px]">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">{day.day}</p>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-emerald-600">income : {day.income.toLocaleString()}</p>
                                        <p className="text-[8px] font-bold text-rose-600">expense : {day.expenses.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-end gap-0.5 w-full justify-center">
                                    <div 
                                        style={{ height: `${Math.max(incomeHeight, 2)}px` }}
                                        className="w-1 bg-emerald-500/20 rounded-full group-hover/day:bg-emerald-500 transition-colors" 
                                    />
                                    <div 
                                        style={{ height: `${Math.max(expenseHeight, 2)}px` }}
                                        className="w-1 bg-rose-500/20 rounded-full group-hover/day:bg-rose-500 transition-colors" 
                                    />
                                </div>
                                <span className="text-[8px] font-black text-slate-400">{day.day}</span>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 group hover:bg-teal-50/30 transition-colors">
                    <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5 text-teal-600 opacity-20" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-slate-800 tracking-tight leading-none">Projected balance by month-end</h4>
                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            {stats.balance.toLocaleString()} ETB based on current spending
                        </p>
                    </div>
                </div>
            </GlassCard>
        </motion.div>

        {/* Bottom Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <div className="bg-[#008080] rounded-[1.5rem] p-5 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute top-2 right-2 p-2 bg-white/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-0.5">
                    <h3 className="text-teal-100/70 font-bold text-[10px]">Savings Rate</h3>
                    <p className="text-3xl font-black tabular-nums">{stats.savingsRate}%</p>
                    <p className="text-[8px] font-bold text-teal-100/50 uppercase tracking-widest mt-1">of income saved</p>
                </div>
            </div>

            <div className="bg-[#fdf8f4] rounded-[1.5rem] p-5 border border-[#f9f1e8] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all">
                <div className="absolute top-2 right-2 p-2 bg-orange-500/10 rounded-lg">
                    <ArrowDownRight className="w-5 h-5 text-orange-500/30" />
                </div>
                <div className="space-y-0.5">
                    <h3 className="text-slate-400 font-bold text-[10px]">Biggest Expense</h3>
                    <p className="text-2xl font-black tabular-nums text-slate-900 group-hover:text-amber-600 transition-colors">
                        {stats.biggestExpense.amount.toLocaleString()} ETB
                    </p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {stats.biggestExpense.category}
                    </p>
                </div>
            </div>
        </motion.div>

        {/* Recent Transactions List */}
        <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-black tracking-tight text-slate-900">Recent Transactions</h3>
                <Link href="/transactions" className="text-teal-600 text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                    See all <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="space-y-1">
                {stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-50 hover:border-slate-100 hover:shadow-sm rounded-xl transition-all group">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 bg-slate-100/50 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                                    {tx.category?.icon || "📁"}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 tracking-tight">{tx.description}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{tx.category?.name}</p>
                                </div>
                            </div>
                            <p className={`font-black tracking-tight tabular-nums text-sm ${tx.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {tx.type === 'EXPENSE' ? '-' : '+'} {tx.amount.toLocaleString()}
                                <span className="text-[8px] ml-1 uppercase opacity-50 font-bold">ETB</span>
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 glass rounded-[1.5rem] opacity-50">
                        <p className="text-slate-400 text-[10px] font-bold italic tracking-wide">No recent transactions to display</p>
                    </div>
                )}
            </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
