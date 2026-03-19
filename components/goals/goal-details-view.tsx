"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { 
    ChevronLeft, 
    Target, 
    Calendar,
    Car, Home, Smartphone, Plane, GraduationCap, Laptop, Gift, Heart, Shield,
    LucideIcon,
    History,
    TrendingUp,
    Clock,
    CheckCircle2,
    Coins
} from "lucide-react"
import Link from "next/link"
import { LogContributionDialog } from "@/components/goals/log-contribution-dialog"
import { format } from "date-fns"

interface Contribution {
    id: string
    amount: number
    description: string | null
    source: string | null
    date: Date
}

interface Goal {
    id: string
    name: string
    targetValue: number
    currentValue: number
    deadline: Date | null
    color: string | null
    icon: string | null
    dailyTarget: number
    monthlyTarget: number
    remainingToday: number
    todayContributions: number
    daysRemaining: number
    contributions: Contribution[]
    createdAt: Date
}

interface GoalDetailsViewProps {
    goal: Goal
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

export function GoalDetailsView({ goal }: GoalDetailsViewProps) {
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

    const GoalIcon = (goal.icon && ICON_MAP[goal.icon]) ? ICON_MAP[goal.icon] : Target
    const percentage = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    const colorClass = goal.color || "bg-blue-500"

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
                        <Link href="/goals" className="w-10 h-10 flex items-center justify-center rounded-full glass hover:bg-white/60 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-700" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">{goal.name}</h1>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Goal Details</p>
                        </div>
                    </div>
                </motion.div>

                {/* Main Progress Card */}
                <motion.div variants={itemVariants}>
                    <GlassCard className="p-8 rounded-[2.5rem] relative overflow-hidden">
                        <div className={`absolute -right-20 -top-20 w-60 h-60 ${colorClass} opacity-[0.08] rounded-full blur-[80px]`} />
                        
                        <div className="flex items-center gap-6 mb-8 relative z-10">
                            <div className={`w-20 h-20 ${colorClass} rounded-[2rem] shadow-2xl flex items-center justify-center text-white`}>
                                <GoalIcon className="w-10 h-10" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                                        {Math.round(percentage)}%
                                    </p>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Target</p>
                                        <p className="text-lg font-black text-slate-800 tabular-nums">{goal.targetValue.toLocaleString()} ETB</p>
                                    </div>
                                </div>
                                <div className="h-4 w-full bg-slate-100/50 rounded-full overflow-hidden p-1 border border-slate-100/20 shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        className={`h-full ${colorClass} rounded-full shadow-sm`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 relative z-10">
                            <div className="bg-white/50 p-4 rounded-3xl border border-white/20">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Coins className="w-3 h-3" /> Saved
                                </p>
                                <p className="text-lg font-black text-slate-800 tabular-nums">{goal.currentValue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/50 p-4 rounded-3xl border border-white/20">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Target
                                </p>
                                <p className="text-lg font-black text-slate-800 tabular-nums">{goal.targetValue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/50 p-4 rounded-3xl border border-white/20">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Left
                                </p>
                                <p className="text-lg font-black text-slate-800 tabular-nums">{(goal.targetValue - goal.currentValue).toLocaleString()}</p>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Daily Status & Log */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-6 rounded-[2rem] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Tracker</p>
                                <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${goal.remainingToday === 0 ? "bg-teal-500/10 text-teal-600" : "bg-orange-500/10 text-orange-600"}`}>
                                    {goal.remainingToday === 0 ? "Achieved" : "Pending"}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-black text-slate-800">Today&apos;s Target</p>
                                    <p className="text-2xl font-black tabular-nums text-slate-900">{goal.dailyTarget.toLocaleString()} <span className="text-sm font-bold text-slate-400">ETB</span></p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Progress</span>
                                        <span>{Math.round(((goal.todayContributions || 0) / (goal.dailyTarget || 1)) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(((goal.todayContributions || 0) / (goal.dailyTarget || 1)) * 100, 100)}%` }}
                                            className={`h-full ${goal.remainingToday === 0 ? "bg-teal-500" : colorClass}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <LogContributionDialog 
                                goalId={goal.id} 
                                goalName={goal.name} 
                                suggestedAmount={goal.remainingToday}
                            />
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 rounded-[2rem]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Time Remaining</p>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-800">{goal.daysRemaining}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Days Left</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-slate-500">Starts</span>
                                    <span className="text-slate-800">{format(new Date(goal.createdAt), "MMM d, yyyy")}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold mt-2">
                                    <span className="text-slate-500">Deadline</span>
                                    <span className="text-slate-800">{goal.deadline ? format(new Date(goal.deadline), "MMM d, yyyy") : "No deadline"}</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Contribution History */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <History className="w-4 h-4 text-slate-400" />
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Savings History</h3>
                    </div>
                    <div className="space-y-3">
                        {goal.contributions.length > 0 ? (
                            goal.contributions.map((contribution) => (
                                <GlassCard key={contribution.id} className="p-4 rounded-3xl flex items-center justify-between hover:bg-white/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-600">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-slate-800">{contribution.amount.toLocaleString()} ETB</p>
                                                {contribution.source && (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 text-[8px] font-black uppercase tracking-wider">
                                                        {contribution.source}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {format(new Date(contribution.date), "EEEE, MMM d")}
                                                </p>
                                                {contribution.description && (
                                                    <p className="text-[10px] font-medium text-slate-400 italic">
                                                        &ldquo;{contribution.description}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                        {format(new Date(contribution.date), "p")}
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="text-center py-12 glass rounded-[2.5rem]">
                                <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 text-sm font-bold">No contributions yet.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
