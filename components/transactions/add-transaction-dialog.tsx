"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Plus, 
    X, 
    Utensils, 
    Car, 
    ShoppingBag, 
    Zap, 
    Gamepad2, 
    HeartPulse, 
    GraduationCap,
    Calendar,
    Briefcase,
    Globe,
    Gift,
    TrendingUp,
    Home,
    RefreshCw,
    Repeat,
    Building2,
    Wallet
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Category = {
    id: string;
    name: string;
    type: string;
    icon?: string;
}

const EXPENSE_CATEGORIES = [
    { name: "Food", icon: "🍔", lucide: Utensils },
    { name: "Transport", icon: "🚗", lucide: Car },
    { name: "Shopping", icon: "🛍️", lucide: ShoppingBag },
    { name: "Bills", icon: "⚡", lucide: Zap },
    { name: "Entertainment", icon: "🎮", lucide: Gamepad2 },
    { name: "Health", icon: "🏥", lucide: HeartPulse },
    { name: "Education", icon: "🎓", lucide: GraduationCap },
    { name: "Other", icon: "📦", lucide: ShoppingBag },
]

const INCOME_CATEGORIES = [
    { name: "Salary", icon: "💰", lucide: Briefcase },
    { name: "Business", icon: "💼", lucide: Globe },
    { name: "Freelance", icon: "📈", lucide: TrendingUp },
    { name: "Gift", icon: "🎁", lucide: Gift },
    { name: "Investment", icon: "🏦", lucide: Zap },
    { name: "Rental", icon: "🏠", lucide: Home },
    { name: "Refund", icon: "🔄", lucide: RefreshCw },
    { name: "Other", icon: "✨", lucide: ShoppingBag },
]

export function AddTransactionDialog({ categories = [], onSuccess }: { categories: Category[], onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE")
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null)
  const [customCategoryName, setCustomCategoryName] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState("MONTHLY")
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchAccounts = async () => {
        try {
            const res = await fetch("/api/accounts")
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
                // Select first account by default if available
                if (data.length > 0) setSelectedAccountId(data[0].id)
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error)
        }
    }
    fetchAccounts()
  }, [])

  const currentCategoryList = type === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: any = Object.fromEntries(formData)
    
    // Logic for categoryId vs categoryName
    const matchedCategory = categories.find(c => c.name === selectedCategoryName && c.type === type)
    
    if (selectedCategoryName === "Other") {
        data.categoryName = customCategoryName || undefined
        delete data.categoryId
    } else if (matchedCategory) {
        data.categoryId = matchedCategory.id
        delete data.categoryName
    } else {
        data.categoryName = selectedCategoryName || undefined
        delete data.categoryId
    }

    data.type = type
    data.date = date
    data.isRecurring = isRecurring
    data.frequency = isRecurring ? (frequency || "MONTHLY") : null
    data.bankAccountId = selectedAccountId || null

    setIsLoading(true)
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        setOpen(false)
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        const result = await response.json()
        const errorMsg = result.details 
            ? `Validation failed: ${Object.keys(result.details).join(", ")}`
            : result.error || "Failed to create transaction"
        alert(errorMsg)
      }
    } catch (error) {
      console.error("Error creating transaction:", error)
      alert("Failed to create transaction")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center justify-center gap-2 p-4 md:p-6 rounded-[2rem] border-0 bg-[#008080] text-white hover:bg-[#006666] transition-all hover:scale-[1.02] shadow-xl shadow-teal-900/20 w-full md:w-auto">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-white/20 text-white">
                <Plus className="w-6 h-6" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-tight text-center">Add<br/>Transaction</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] border-0 bg-white shadow-2xl p-0 overflow-y-auto max-h-[90vh]">
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Add Transaction</DialogTitle>
                <DialogDescription className="sr-only">Enter the details of your new transaction.</DialogDescription>
            </div>

            {/* Type Toggle */}
            <div className="bg-[#fdf8f4] p-1.5 rounded-3xl flex items-center gap-1.5 border border-[#f9f1e8]">
                <button 
                    type="button"
                    onClick={() => {
                        setType("EXPENSE")
                        setSelectedCategoryName(null)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${
                        type === "EXPENSE" 
                        ? "bg-[#ef4444] text-white shadow-lg shadow-red-200" 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    <div className={`w-3 h-0.5 md:w-4 md:h-1 rounded-full ${type === "EXPENSE" ? "bg-white" : "bg-slate-300"}`} />
                    Expense
                </button>
                <button 
                    type="button"
                    onClick={() => {
                        setType("INCOME")
                        setSelectedCategoryName(null)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${
                        type === "INCOME" 
                        ? "bg-[#008080] text-white shadow-lg shadow-teal-200" 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    <Plus className="w-4 h-4" />
                    Income
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Amount (ETB)</Label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-black">ETB</span>
                            <Input 
                                id="amount" 
                                name="amount" 
                                type="number" 
                                step="any" 
                                placeholder="0.00" 
                                required 
                                className="rounded-2xl h-14 md:h-16 bg-[#fdf8f4] border-[#f9f1e8] font-black text-xl pl-14 focus:ring-teal-500/20 focus:bg-white transition-all border-0 shadow-none ring-offset-0 focus-visible:ring-0"
                            />
                        </div>
                    </div>

                    {/* Account Selection Dropdown */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Pay with / Receive to</Label>
                        <select 
                            value={selectedAccountId || "CASH"}
                            onChange={(e) => setSelectedAccountId(e.target.value === "CASH" ? null : e.target.value)}
                            className="w-full h-14 md:h-16 px-6 bg-[#fdf8f4] border-0 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.25rem' }}
                        >
                            <option value="CASH">💵 Cash</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.type === "BANK" ? "🏦" : "📱"} {acc.name}
                                </option>
                            ))}
                        </select>
                        {accounts.length === 0 && (
                            <p className="text-[8px] font-bold text-slate-400 uppercase px-2">
                                Tip: Add bank/mobile accounts in <Link href="/settings" className="text-teal-600 hover:underline">Settings</Link>
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Category</Label>
                        <div className="grid grid-cols-4 gap-2 md:gap-3">
                            {currentCategoryList.map((cat) => {
                                const Icon = cat.lucide
                                return (
                                    <button 
                                        key={cat.name}
                                        type="button"
                                        onClick={() => setSelectedCategoryName(cat.name)}
                                        className={`flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-2xl border transition-all ${
                                            selectedCategoryName === cat.name 
                                            ? "bg-white border-teal-500 shadow-md scale-105" 
                                            : "bg-[#fdf8f4] border-[#f9f1e8] hover:border-slate-300"
                                        }`}
                                    >
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${selectedCategoryName === cat.name ? (type === "EXPENSE" ? "text-rose-600" : "text-teal-600") : "text-slate-400"}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[8px] md:text-[9px] font-bold text-center truncate w-full ${selectedCategoryName === cat.name ? "text-slate-900" : "text-slate-400"}`}>
                                            {cat.name}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                        
                        <AnimatePresence>
                            {selectedCategoryName === "Other" && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pt-2"
                                >
                                    <Input 
                                        placeholder="Type category name manually..." 
                                        value={customCategoryName}
                                        onChange={(e) => setCustomCategoryName(e.target.value)}
                                        required
                                        className="rounded-2xl h-14 bg-[#fdf8f4] border-[#f9f1e8] font-bold px-6 focus:ring-teal-500/20 focus:bg-white transition-all border-0 shadow-none ring-offset-0 focus-visible:ring-0"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Input 
                                    id="date" 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="rounded-2xl h-14 bg-[#fdf8f4] border-[#f9f1e8] font-bold pl-12 focus:ring-teal-500/20 focus:bg-white transition-all appearance-none border-0 shadow-none ring-offset-0 focus-visible:ring-0 text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Recurring</Label>
                            <button 
                                type="button"
                                onClick={() => setIsRecurring(!isRecurring)}
                                className={`flex items-center justify-between px-6 rounded-2xl h-14 w-full transition-all border-0 shadow-none ${isRecurring ? "bg-teal-500 text-white" : "bg-[#fdf8f4] text-slate-400"}`}
                            >
                                <Repeat className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{isRecurring ? "On" : "Off"}</span>
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isRecurring && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#f0f9f9] p-4 rounded-3xl border border-teal-100 flex items-center justify-between"
                            >
                                <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Frequency</span>
                                <div className="flex gap-2">
                                    {["WEEKLY", "MONTHLY"].map(f => (
                                        <button 
                                            key={f}
                                            type="button"
                                            onClick={() => setFrequency(f)}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${frequency === f ? "bg-teal-600 text-white shadow-md" : "text-teal-400 hover:bg-white/50"}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Description</Label>
                        <Input 
                            id="description" 
                            name="description" 
                            placeholder="What's this for?" 
                            required 
                            className="rounded-2xl h-14 md:h-16 bg-[#fdf8f4] border-[#f9f1e8] font-bold pl-6 focus:ring-teal-500/20 focus:bg-white transition-all border-0 shadow-none ring-offset-0 focus-visible:ring-0"
                        />
                    </div>
                </div>

                <Button 
                    type="submit" 
                    className={`w-full h-14 md:h-16 rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-widest shadow-xl transition-all hover:translate-y-[-2px] ${
                        type === "EXPENSE" ? "bg-[#f8b49b] hover:bg-[#f69d7e] text-white" : "bg-[#008080] hover:bg-[#006666] text-white"
                    }`}
                    disabled={isLoading || !selectedCategoryName || (selectedCategoryName === "Other" && !customCategoryName)}
                >
                    {isLoading ? "Processing..." : `Add ${type === "EXPENSE" ? "Expense" : "Income"}`}
                </Button>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
