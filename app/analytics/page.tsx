"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { 
    ChevronLeft, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Calendar,
    Filter,
    ArrowRight,
    TrendingUp,
    Download
} from "lucide-react"
import Link from "next/link"

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState("This Month")

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
                        <h1 className="text-xl font-black tracking-tight text-slate-900">Analytics</h1>
                    </div>
                    <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                        <Download className="w-4 h-4 text-slate-600" />
                    </button>
                </motion.div>

                {/* Filters */}
                <motion.div variants={itemVariants} className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {["This Week", "This Month", "Last 3 Months", "Yearly"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                timeRange === range 
                                ? "bg-[#008080] text-white shadow-md shadow-teal-900/10" 
                                : "bg-slate-50 text-slate-400 border border-slate-100"
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </motion.div>

                {/* Key Metrics */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                    <div className="p-5 bg-[#008080] rounded-[1.5rem] text-white shadow-xl relative overflow-hidden group">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                            <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <p className="text-teal-100/70 font-bold text-[10px] uppercase tracking-widest">Total Income</p>
                        <p className="text-2xl font-black tabular-nums">48,250.00</p>
                        <div className="mt-2 flex items-center gap-1 text-emerald-300 font-bold text-[10px]">
                            <TrendingUp className="w-3 h-3" />
                            <span>+12.5%</span>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] relative overflow-hidden group">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mb-4 text-slate-400">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Total Spent</p>
                        <p className="text-2xl font-black tabular-nums text-slate-800">12,480.00</p>
                        <div className="mt-2 flex items-center gap-1 text-rose-500 font-bold text-[10px]">
                            <TrendingUp className="w-3 h-3 rotate-180" />
                            <span>-4.2%</span>
                        </div>
                    </div>
                </motion.div>

                {/* Categories Distribution */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-base font-black tracking-tight text-slate-900">Spending by Category</h3>
                        <Filter className="w-4 h-4 text-slate-400" />
                    </div>
                    
                    <GlassCard className="p-5 border-slate-100/60 shadow-lg bg-white/80 rounded-[1.5rem] space-y-4">
                        {[
                            { name: "Food & Dining", amount: 4800, percentage: 38, color: "bg-orange-500" },
                            { name: "Transport", amount: 2400, percentage: 19, color: "bg-blue-500" },
                            { name: "Shopping", amount: 1800, percentage: 14, color: "bg-purple-500" },
                            { name: "Bills", amount: 1200, percentage: 10, color: "bg-rose-500" },
                        ].map((cat) => (
                            <div key={cat.name} className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-black tracking-tight">
                                    <span className="text-slate-800 uppercase tracking-widest">{cat.name}</span>
                                    <span className="text-slate-400">{cat.amount.toLocaleString()} ETB</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cat.percentage}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full ${cat.color} rounded-full`} 
                                    />
                                </div>
                            </div>
                        ))}
                    </GlassCard>
                </motion.div>

                {/* Insights */}
                <motion.div variants={itemVariants} className="p-5 bg-teal-50 border border-teal-100/50 rounded-[1.5rem] flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-teal-50">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black text-teal-800 tracking-tight">Smart Insight</h4>
                        <p className="text-[10px] text-teal-700/80 leading-relaxed font-medium">
                            Your spending on "Transport" is 20% lower than last month. Consider moving the difference to your "Savings" goal.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
