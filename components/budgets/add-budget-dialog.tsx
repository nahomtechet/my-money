"use client"

import { useState } from "react"
import { createBudget } from "@/actions/budgets" // We'll create this next
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Wallet, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
// Note: toast is assumed to be available or we can use generic alert

interface AddBudgetDialogProps {
    availableCategories: any[]
    onSuccess?: () => void
}

export function AddBudgetDialog({ availableCategories, onSuccess }: AddBudgetDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError("")

        const result = await createBudget(null, formData)
        
        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setOpen(false)
            setIsLoading(false)
            if (onSuccess) onSuccess()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#008080] rounded-xl text-white shadow-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                    <Plus className="w-4 h-4" />
                    <span>Add Budget</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#fdf8f4]/95 backdrop-blur-xl border-white/20 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-teal-600" /> New Budget
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">
                        Set a spending limit for a specific category to track your progress.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="grid gap-6 py-4">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 flex items-center gap-2 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="category" className="text-slate-700 font-bold">Category</Label>
                        <Select name="categoryId" required>
                            <SelectTrigger className="glass-input">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCategories.length > 0 ? (
                                    availableCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{cat.icon || "📁"}</span>
                                                <span className="font-semibold">{cat.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-xs text-slate-500 font-medium text-center">
                                        No unbudgeted categories available
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount" className="text-slate-700 font-bold">Monthly Limit</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">ETB</div>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                required
                                className="pl-12 glass-input font-bold tabular-nums"
                                placeholder="5000"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl shadow-lg shadow-teal-900/10">
                            {isLoading ? "Creating..." : "Set Budget"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
