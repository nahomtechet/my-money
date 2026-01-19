"use client"

import { signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { GlassCard } from "@/components/ui/glass-card"
import { NotificationPopover } from "@/components/notifications/notification-popover"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  Eye, 
  EyeOff, 
  Settings, 
  TrendingUp, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PieChart, 
  Target, 
  ArrowDownRight, 
  ChevronRight
} from "lucide-react"

interface DashboardViewProps {
    stats: {
        balance: number
        income: number
        expenses: number
        growthPercentage: number
        savingsRate: number
        biggestExpense: { amount: number, category: string }
    }
    recentTransactions: any[]
    categories: any[]
    cashFlow: any[]
    goalsCount: number
}

export function DashboardView({ stats, recentTransactions, categories, cashFlow, goalsCount }: DashboardViewProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)

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


  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date()
      const hour = now.getHours()
      
      if (hour < 12) setGreeting("Good morning")
      else if (hour < 18) setGreeting("Good afternoon")
      else setGreeting("Good evening")
    }
    
    updateGreeting()
    // Update every minute
    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen animate-mesh text-slate-900 pb-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-6 pt-6 space-y-6"
      >
        {/* Header Greeting */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
                <p className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">
                  {greeting || "Welcome"} &bull; {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
                    Hey, {session?.user?.name?.split(' ')[0] || "User"} <span className="animate-bounce">👋</span>
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <NotificationPopover />
                <Link href="/settings" className="w-10 h-10 flex items-center justify-center rounded-full glass hover:bg-white/60 transition-colors">
                    <Settings className="w-5 h-5 text-slate-700" />
                </Link>
            </div>
        </motion.div>

        {/* Hero Balance Card */}
        <motion.div variants={itemVariants}>
            <div className="bg-[#008080] rounded-[2rem] p-8 text-white shadow-2xl shadow-teal-900/20 relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] bg-white/10 blur-[90px] rounded-full group-hover:bg-white/15 transition-colors" />

                <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <p className="text-teal-50/80 font-medium tracking-wide text-xs">Total Balance</p>
                            <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors big-click">
                                {isBalanceVisible ? <Eye className="w-4 h-4 opacity-70" /> : <EyeOff className="w-4 h-4 opacity-70" />}
                            </button>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums drop-shadow-sm">
                            {isBalanceVisible ? `${stats.balance.toLocaleString()} ETB` : '•••• ETB'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2 hover:bg-white/15 transition-colors border border-white/10">
                            <div className="flex items-center gap-2 text-teal-100/90">
                                <div className="p-1 bg-white/10 rounded-full">
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Income</span>
                            </div>
                            <p className="text-xl font-black tabular-nums">
                                {isBalanceVisible ? `${stats.income.toLocaleString()} ETB` : '•••• ETB'}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2 hover:bg-white/15 transition-colors border border-white/10">
                            <div className="flex items-center gap-2 text-teal-100/90">
                                <div className="p-1 bg-white/10 rounded-full">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Expenses</span>
                            </div>
                            <p className="text-xl font-black tabular-nums text-rose-300">
                                {isBalanceVisible ? `${stats.expenses.toLocaleString()} ETB` : '•••• ETB'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Quick Action Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <AddTransactionDialog categories={categories} onSuccess={() => router.refresh()} /> 

            <Link href="/budgets" className="glass flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] hover:scale-[1.03] transition-all group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-100/50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                    <PieChart className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-center text-slate-600">Budget<br/>Goals</span>
            </Link>

            <Link href="/goals" className="glass flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] hover:scale-[1.03] transition-all group col-span-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-100/50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                    <Target className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-center text-slate-600">
                    {goalsCount > 0 ? `${goalsCount} Active Goals` : "Set Financial Goals"}
                </span>
            </Link>
        </motion.div>

        {/* Cash Flow Section */}
        <motion.div variants={itemVariants} className="space-y-3">
            <GlassCard className="p-6 rounded-[2rem]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-800">Cash Flow</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide">Last 7 days activity</p>
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

                    {cashFlow.map((day: any) => {
                        const maxVal = Math.max(...cashFlow.map((d: any) => Math.max(d.income, d.expenses, 1)))
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
                {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx: any) => (
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
