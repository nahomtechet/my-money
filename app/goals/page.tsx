"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { 
    ChevronLeft, 
    Target, 
    Plus,
    Trophy,
    Calendar,
    ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function GoalsPage() {
    const [goals] = useState([
        { id: 1, name: "New iPhone 17 Pro", current: 12000, target: 45000, deadline: "July 2026", color: "bg-teal-500" },
        { id: 2, name: "Emergency Fund", current: 25000, target: 100000, deadline: "December 2026", color: "bg-blue-600" },
        { id: 3, name: "Vacation Fund", current: 8000, target: 15000, deadline: "May 2026", color: "bg-orange-500" },
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
                        <h1 className="text-xl font-black tracking-tight text-slate-900">Savings Goals</h1>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#008080] rounded-xl text-white shadow-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                        <Plus className="w-4 h-4" />
                        <span>Create Goal</span>
                    </button>
                </motion.div>

                {/* Progress Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                    <GlassCard className="p-5 bg-teal-50 border border-teal-100/50 rounded-[1.5rem] flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-teal-50 flex items-center justify-center mb-4">
                            <Trophy className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-teal-800/60 text-[10px] font-black uppercase tracking-widest mb-1">Total Saved</p>
                            <p className="text-2xl font-black tabular-nums text-teal-900">45,000 ETB</p>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-5 bg-slate-50 border border-slate-200/50 rounded-[1.5rem] flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                            <Target className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Goals</p>
                            <p className="text-2xl font-black tabular-nums text-slate-900">3</p>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Goals List */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Goal Milestones</h3>
                    <div className="space-y-4">
                        {goals.map((goal) => {
                            const percentage = (goal.current / goal.target) * 100
                            return (
                                <section key={goal.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] space-y-4 hover:border-slate-200 transition-colors group relative overflow-hidden">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 ${goal.color}/10 rounded-2xl flex items-center justify-center`}>
                                                <Target className={`w-6 h-6 ${goal.color.replace('bg-', 'text-')}`} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 tracking-tight">{goal.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Calendar className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">By {goal.deadline}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-800 tabular-nums">{Math.round(percentage)}%</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Achieved</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-100/50">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className={`h-full ${goal.color} rounded-full flex items-center justify-end px-1`}
                                            >
                                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                            </motion.div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black tracking-tight text-slate-400 uppercase tracking-widest">
                                            <span>{goal.current.toLocaleString()} ETB</span>
                                            <span>{goal.target.toLocaleString()} ETB</span>
                                        </div>
                                    </div>

                                    <Link href={`/goals/${goal.id}`} className="flex items-center justify-center gap-2 pt-2 text-[10px] font-black text-teal-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                        <span>View Details</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>

                                    {/* Subdued Glow */}
                                    <div className={`absolute bottom-0 right-0 w-32 h-32 ${goal.color} opacity-[0.03] blur-[40px] rounded-full translate-x-10 translate-y-10`} />
                                </section>
                            )
                        })}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
