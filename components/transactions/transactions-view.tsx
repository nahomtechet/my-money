"use client"

import { useState, useEffect, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Search, 
    Filter, 
    ArrowUpRight, 
    ArrowDownLeft, 
    DollarSign, 
    Calendar,
    Briefcase,
    Globe,
    TrendingUp,
    Gift,
    Zap,
    Home,
    RefreshCw,
    ShoppingBag,
    Utensils,
    Car,
    Gamepad2,
    HeartPulse,
    GraduationCap,
    Trash2,
    MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteTransaction, getTransactions } from "@/actions/transactions"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"

// Icon Mapping (Should be shared but copying for now for speed)
const ICON_MAP: any = {
    Utensils, Car, ShoppingBag, Zap, Gamepad2, HeartPulse, GraduationCap,
    Briefcase, Globe, TrendingUp, Gift, Home, RefreshCw, DollarSign
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function TransactionsView({ initialTransactions, categories }: { initialTransactions: any[], categories: any[] }) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Debounced Search & Filter Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        startTransition(async () => {
             const result = await getTransactions({
                search,
                type: typeFilter !== "ALL" ? typeFilter : undefined,
                categoryId: categoryFilter !== "ALL" ? categoryFilter : undefined
             })
             if (result.transactions) {
                 setTransactions(result.transactions)
             }
        })
    }, 300)

    return () => clearTimeout(timer)
  }, [search, typeFilter, categoryFilter])

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure?")) return
      const res = await deleteTransaction(id)
      if (res.success) {
          toast.success("Transaction deleted")
          // Optimistic update
          setTransactions(prev => prev.filter(t => t.id !== id))
          router.refresh() 
      } else {
          toast.error("Failed to delete")
      }
  }

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
                        <ArrowDownLeft className="w-5 h-5 text-slate-700 rotate-45" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900">Transactions</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">History & Details</p>
                    </div>
                </div>
                <AddTransactionDialog 
                    categories={categories} 
                    onSuccess={() => {
                        // Re-fetch to be safe
                        router.refresh()
                        // Also trigger local re-fetch logic slightly delayed
                        setTimeout(() => setSearch(s => s + " "), 10) 
                        setTimeout(() => setSearch(s => s.trim()), 10)
                    }} 
                />
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search transactions..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-2xl h-12 pl-10 bg-white/50 backdrop-blur-md border-white/20 shadow-sm focus:bg-white transition-all"
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {/* Type Filter */}
                    <div className="flex gap-1 p-1 bg-white/50 border border-white/20 rounded-xl">
                        {["ALL", "INCOME", "EXPENSE"].map((type) => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    typeFilter === type
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                }`}
                            >
                                {type === "ALL" ? "All" : type}
                            </button>
                        ))}
                    </div>
                    
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/50 border border-white/20 hover:bg-white text-slate-500 outline-none appearance-none cursor-pointer min-w-[120px]"
                    >
                        <option value="ALL">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* List */}
            <motion.div variants={itemVariants} className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {transactions.length === 0 ? (
                         <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                         >
                            <p className="text-slate-400 font-bold text-sm">No transactions found.</p>
                         </motion.div>
                    ) : (
                        transactions.map((t) => {
                            const Icon = (t.category?.icon && ICON_MAP[t.category.icon]) 
                                        ? ICON_MAP[t.category.icon] // Use saved icon name
                                        : (t.type === "INCOME" ? DollarSign : ShoppingBag) // Fallback

                            return (
                                <motion.div
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative bg-white/60 backdrop-blur-xl border border-white/40 p-4 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all flex items-center gap-4"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                        t.type === "INCOME" ? "bg-teal-100 text-teal-600" : "bg-rose-100 text-rose-600"
                                    }`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="font-bold text-slate-900 truncate pr-2">{t.description || "Unnamed"}</h3>
                                            <span className={`font-black text-sm whitespace-nowrap ${t.type === "INCOME" ? "text-teal-600" : "text-slate-900"}`}>
                                                {t.type === "INCOME" ? "+" : "-"}${t.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                                {t.category?.name || "Uncategorized"} • {format(new Date(t.date), "MMM d")}
                                            </p>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-0 shadow-lg bg-white/90 backdrop-blur-xl">
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(t.id)}
                                                        className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-bold text-xs"
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    </div>
  )
}
