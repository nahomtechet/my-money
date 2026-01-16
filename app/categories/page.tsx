"use client"

import { useEffect, useState } from "react"
import { AddCategoryDialog } from "@/components/categories/add-category-dialog"
import { GlassCard } from "@/components/ui/glass-card"
import { motion } from "framer-motion"
import { LayoutGrid, Plus, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  type: string
  icon: string | null
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch("/api/categories")
                if (response.ok) {
                    const data = await response.json()
                    setCategories(data)
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCategories()
    }, [])

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } as any }
    }

    return (
        <div className="relative min-h-screen p-4 md:p-8 overflow-hidden bg-slate-50/50">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto space-y-8 md:space-y-12 relative z-10"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="rounded-full bg-white/50 backdrop-blur-md">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-slate-900">Categories</h1>
                            <p className="text-muted-foreground mt-1 text-sm md:text-base">Organize your wealth with precision.</p>
                        </div>
                    </div>
                    <AddCategoryDialog />
                </div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {isLoading ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="glass rounded-[2rem] h-40 animate-pulse bg-white/20" />
                        ))
                    ) : (
                        <>
                            {categories.map((cat) => (
                                <motion.div key={cat.id} variants={itemVariants}>
                                    <GlassCard className="h-full flex flex-col justify-between group cursor-default p-7 border-slate-200/50 shadow-lg bg-white/60">
                                        <div className="flex items-start justify-between">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110",
                                                cat.type === 'INCOME' ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" : "bg-rose-50 text-rose-600 border border-rose-100/50"
                                            )}>
                                                {cat.icon || "📁"}
                                            </div>
                                            <span className={cn(
                                                "px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase",
                                                cat.type === 'INCOME' ? "bg-emerald-100/50 text-emerald-700" : "bg-rose-100/50 text-rose-700"
                                            )}>
                                                {cat.type}
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors tracking-tight">{cat.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">No recent transactions</p>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                            <AddCategoryDialog variant="card" />
                        </>
                    )}
                </motion.div>
                
                {!isLoading && categories.length === 0 && (
                    <div className="text-center py-20 glass rounded-3xl">
                        <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No categories found yet.</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
