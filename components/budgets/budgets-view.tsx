"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { 
    ChevronLeft, 
    PieChart, 
    MoreVertical,
    Calendar,
    Trash2,
    AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { AddBudgetDialog } from "./add-budget-dialog"
import { deleteBudget } from "@/actions/budgets"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface BudgetsViewProps {
    budgets: any[]
    availableCategories: any[]
    totalBudgeted: number
    totalSpent: number
}

export function BudgetsView({ budgets, availableCategories, totalBudgeted, totalSpent }: BudgetsViewProps) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function handleDelete(id: string) {
        setDeletingId(id)
        await deleteBudget(id)
        setDeletingId(null)
        // Router refresh handled by server action revalidatePath, 
        // but explicit refresh ensures client state sync if needed
        router.refresh() 
    }

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

    const currentMonthName = format(new Date(), "MMMM yyyy")

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
                    <AddBudgetDialog availableCategories={availableCategories} onSuccess={() => router.refresh()} />
                </motion.div>

                {/* Summary Card */}
                <motion.div variants={itemVariants}>
                    <GlassCard className="p-6 bg-[#008080] text-white rounded-[1.5rem] border-0 shadow-xl overflow-hidden relative group">
                        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[80%] bg-white/10 blur-[60px] rounded-full" />
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 opacity-70">
                                <Calendar className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{currentMonthName} Overview</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-teal-100/70 text-[10px] uppercase font-bold tracking-widest mb-1">Total Budgeted</p>
                                    <p className="text-2xl font-black tabular-nums">{totalBudgeted.toLocaleString()} ETB</p>
                                </div>
                                <div>
                                    <p className="text-teal-100/70 text-[10px] uppercase font-bold tracking-widest mb-1">Total Remaining</p>
                                    <p className={`text-2xl font-black tabular-nums ${totalSpent > totalBudgeted ? "text-rose-300" : "text-teal-300"}`}>
                                        {Math.max(0, totalBudgeted - totalSpent).toLocaleString()} ETB
                                    </p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Budget List */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <h3 className="px-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Budgets</h3>
                    
                    {budgets.length === 0 ? (
                        <div className="text-center py-12 glass rounded-[2rem] border-dashed border-2 border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                📊
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-1">No Budgets Set</h3>
                            <p className="text-slate-500 text-sm max-w-[200px] mx-auto">Create a budget to track your spending limits.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {budgets.map((b) => (
                                    <motion.section 
                                        key={b.id} 
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`p-5 bg-white border ${b.isOver ? 'border-rose-100 bg-rose-50/10' : 'border-slate-100'} rounded-[1.5rem] space-y-4 hover:border-slate-200 transition-colors group relative overflow-hidden`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 ${b.color}/10 rounded-xl flex items-center justify-center`}>
                                                    {/* We can use the category icon here if it matches standard icons, otherwise default to PieChart */}
                                                    <span className="text-lg">{b.category.icon || "📊"}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 tracking-tight">{b.category.name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {b.spent.toLocaleString()} / {b.amount.toLocaleString()} ETB
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors">
                                                        <MoreVertical className="w-5 h-5 text-slate-300" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem 
                                                        className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                                                        onClick={() => handleDelete(b.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete Budget
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="space-y-1.5 relative z-10">
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(b.percentage, 100)}%` }}
                                                    className={`h-full ${b.color} rounded-full`} 
                                                />
                                            </div>
                                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                                                <span className={b.isOver ? 'text-rose-500 font-black flex items-center gap-1' : 'text-slate-400'}>
                                                    {b.isOver && <AlertTriangle className="w-3 h-3" />}
                                                    {b.isOver ? (b.spent - b.amount).toLocaleString() + ' Over' : (b.amount - b.spent).toLocaleString() + ' Remaining'}
                                                </span>
                                                <span className="text-slate-400">{Math.round(b.percentage)}%</span>
                                            </div>
                                        </div>
                                    </motion.section>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    )
}
