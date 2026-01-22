"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { ChevronLeft, Info, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { AddEqubDialog } from "./add-equb-dialog"
import { EqubCard } from "./equb-card"

interface EqubViewProps {
  equbs: any[]
  bankAccounts: any[]
}

export function EqubView({ equbs, bankAccounts }: EqubViewProps) {
  const [filter, setFilter] = useState<"all" | "active" | "history">("active")
  const [layout, setLayout] = useState<"grid" | "list">("grid")

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  }

  const activeEqubs = equbs.filter(e => e.payout?.status === "PENDING" || !e.payout)
  const historyEqubs = equbs.filter(e => e.payout?.status === "RECEIVED")

  const filteredEqubs = filter === "active" ? activeEqubs : 
                       filter === "history" ? historyEqubs : 
                       equbs

  const counts = {
    active: activeEqubs.length,
    history: historyEqubs.length,
    all: equbs.length
  }

  return (
    <div className="min-h-screen animate-mesh text-slate-900 pb-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 pt-6 space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full glass hover:bg-white/60 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </Link>
              <div>
                <p className="text-slate-500 font-medium text-[9px] uppercase tracking-wider">Savings</p>
                <h1 className="text-xl font-black tracking-tighter text-slate-900">Personal Equbs</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="glass p-1 rounded-xl flex items-center gap-1">
                  <button 
                    onClick={() => setLayout("grid")}
                    className={cn("p-1.5 rounded-lg transition-all", layout === "grid" ? "bg-white text-[#008080] shadow-sm" : "text-slate-400")}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setLayout("list")}
                    className={cn("p-1.5 rounded-lg transition-all", layout === "list" ? "bg-white text-[#008080] shadow-sm" : "text-slate-400")}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
               </div>
               <AddEqubDialog />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-1 bg-slate-100/50 p-0.5 rounded-2xl w-full sm:w-auto">
                {["active", "history", "all"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={cn(
                      "flex-1 sm:flex-none sm:px-4 py-2 px-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                      filter === f ? "bg-white text-[#008080] shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {f}
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-bold",
                      filter === f ? "bg-[#008080]/10 text-[#008080]" : "bg-slate-200/50 text-slate-400"
                    )}>
                      {counts[f as keyof typeof counts]}
                    </span>
                  </button>
                ))}
             </div>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div variants={itemVariants} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[10px] leading-relaxed text-indigo-900 font-medium">
            Manage your rotating savings simply. Payments are logged as expenses, and payouts as income.
          </p>
        </motion.div>

        {/* Content Section */}
        <div key={filter} className={cn(
          "grid gap-4 sm:gap-6",
          layout === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        )}>
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredEqubs.length > 0 ? (
              filteredEqubs.map((equb) => (
                <motion.div 
                  key={equb.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <EqubCard equb={equb} bankAccounts={bankAccounts} />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-center py-20 glass rounded-3xl col-span-full"
              >
                <p className="text-slate-400 text-xs font-bold italic">No Equbs found for this view.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
