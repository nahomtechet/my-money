"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { 
    ChevronLeft, 
    PieChart, 
    Plus,
    MoreVertical,
    TrendingDown,
    Calendar
} from "lucide-react"
import Link from "next/link"

export default function BudgetsPage() {
    const [budgets] = useState([
        { id: 1, name: "Food & Dining", spent: 4800, total: 6000, color: "bg-orange-500" },
        { id: 2, name: "Transport", spent: 2400, total: 3000, color: "bg-blue-500" },
        { id: 3, name: "Shopping", spent: 5500, total: 5000, color: "bg-rose-500" },
    ])

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-12">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-2xl mx-auto px-6 pt-6 space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <h1 className="text-xl font-black tracking-tight text-slate-900">Budgets</h1>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#008080] rounded-xl text-white shadow-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                        <Plus className="w-4 h-4" />
                        <span>Add Budget</span>
                    </button>
                </motion.div>

                {/* Summary Card */}
                <motion.div variants={itemVariants}>
                    <GlassCard className="p-6 bg-[#008080] text-white rounded-[1.5rem] border-0 shadow-xl overflow-hidden relative group">
                        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[80%] bg-white/10 blur-[60px] rounded-full" />
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 opacity-70">
                                <Calendar className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">January 2026 Overview</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-teal-100/70 text-[10px] uppercase font-bold tracking-widest mb-1">Total Budgeted</p>
                                    <p className="text-2xl font-black tabular-nums">14,000 ETB</p>
                                </div>
                                <div>
                                    <p className="text-teal-100/70 text-[10px] uppercase font-bold tracking-widest mb-1">Total Remaining</p>
                                    <p className="text-2xl font-black tabular-nums text-teal-300">1,300 ETB</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Budget List */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Budgets</h3>
                    <div className="space-y-3">
                        {budgets.map((b) => {
                            const percentage = (b.spent / b.total) * 100
                            const isOver = b.spent > b.total

                            return (
                                <section key={b.id} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] space-y-4 hover:border-slate-200 transition-colors group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 ${b.color}/10 rounded-xl flex items-center justify-center`}>
                                                <PieChart className={`w-5 h-5 ${b.color.replace('bg-', 'text-')}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 tracking-tight">{b.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {b.spent.toLocaleString()} / {b.total.toLocaleString()} ETB
                                                </p>
                                            </div>
                                        </div>
                                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors">
                                            <MoreVertical className="w-5 h-5 text-slate-300" />
                                        </button>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(percentage, 100)}%` }}
                                                className={`h-full ${isOver ? 'bg-rose-500' : b.color} rounded-full`} 
                                            />
                                        </div>
                                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                                            <span className={isOver ? 'text-rose-500' : 'text-slate-400'}>
                                                {isOver ? (b.spent - b.total).toLocaleString() + ' Over' : (b.total - b.spent).toLocaleString() + ' Remaining'}
                                            </span>
                                            <span className="text-slate-400">{Math.round(percentage)}%</span>
                                        </div>
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
