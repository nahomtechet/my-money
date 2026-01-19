"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { 
    ChevronLeft, 
    Target, 
    Trophy,
    Calendar,
    ArrowRight,
    Car, Home, Smartphone, Plane, GraduationCap, Laptop, Gift, Heart, Shield,
    LucideIcon
} from "lucide-react"
import Link from "next/link"
import { AddGoalDialog } from "@/components/goals/add-goal-dialog"

interface Goal {
    id: string
    name: string
    targetValue: number
    currentValue: number
    deadline: Date | null
    color: string | null
    icon: string | null
}

interface GoalsViewProps {
    goals: Goal[]
}

const ICON_MAP: Record<string, LucideIcon> = {
    "Laptop": Laptop,
    "Car": Car,
    "Home": Home,
    "Smartphone": Smartphone,
    "Plane": Plane,
    "GraduationCap": GraduationCap,
    "Gift": Gift,
    "Heart": Heart,
    "Shield": Shield,
    "Target": Target
}

export function GoalsView({ goals }: GoalsViewProps) {
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

    const totalSaved = goals.reduce((sum, g) => sum + g.currentValue, 0)

    return (
        <div className="min-h-screen animate-mesh text-slate-900 pb-12">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-2xl mx-auto px-6 pt-6 space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full glass hover:bg-white/60 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-700" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">Savings Goals</h1>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Dream it. Achieve it.</p>
                        </div>
                    </div>
                    {/* Interactive Dialog */}
                    <AddGoalDialog />
                </motion.div>

                {/* Progress Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                    <GlassCard className="p-6 rounded-[2rem] bg-teal-500/10 border-teal-500/20">
                        <div className="w-10 h-10 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center mb-4 text-white">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-teal-700/60 text-[10px] font-black uppercase tracking-widest mb-1">Total Saved</p>
                            <p className="text-2xl font-black tabular-nums text-teal-900 drop-shadow-sm">{totalSaved.toLocaleString()} <span className="text-sm">ETB</span></p>
                        </div>
                    </GlassCard>
                    <GlassCard className="p-6 rounded-[2rem]">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center mb-4">
                            <Target className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Goals</p>
                            <p className="text-2xl font-black tabular-nums text-slate-900">{goals.length}</p>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Goals List */}
                <motion.div variants={itemVariants} className="space-y-4">
                    {goals.length > 0 ? (
                        goals.map((goal) => {
                            const percentage = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
                            const colorClass = goal.color || "bg-blue-500" // Fallback color
                            
                            const GoalIcon = (goal.icon && ICON_MAP[goal.icon]) ? ICON_MAP[goal.icon] : Target

                            return (
                                <GlassCard key={goal.id} className="p-6 rounded-[2rem] space-y-5 hover:scale-[1.01] transition-transform group relative overflow-hidden">
                                     {/* Background Glow */}
                                    <div className={`absolute -right-10 -top-10 w-40 h-40 ${colorClass} opacity-[0.05] rounded-full blur-[50px]`} />
                                    
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 ${colorClass} rounded-2xl shadow-lg flex items-center justify-center text-white`}>
                                                <GoalIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-slate-800 tracking-tight">{goal.name}</h4>
                                                {goal.deadline && (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-slate-800 tabular-nums">{Math.round(percentage)}%</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <div className="h-4 w-full bg-slate-100/50 rounded-full overflow-hidden p-0.5 border border-slate-100/20 shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className={`h-full ${colorClass} rounded-full shadow-sm relative`}
                                            >
                                                 <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/40 rounded-full" />
                                            </motion.div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>{goal.currentValue.toLocaleString()} ETB</span>
                                            <span>{goal.targetValue.toLocaleString()} ETB</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 flex items-center gap-1">
                                            Details <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </GlassCard>
                            )
                        })
                    ) : (
                        <div className="text-center py-12 glass rounded-[2rem]">
                            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm font-bold">No goals found. Start saving today!</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    )
}
