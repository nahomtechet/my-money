"use client"

import { useState } from "react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
    Plus, Loader2, Coins
} from "lucide-react"
import { addGoalContribution } from "@/actions/goals"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface LogContributionDialogProps {
    goalId: string
    goalName: string
    suggestedAmount?: number
}

export function LogContributionDialog({ goalId, goalName, suggestedAmount }: LogContributionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState(suggestedAmount?.toString() || "")
    const [description, setDescription] = useState("")
    const [source, setSource] = useState("")
    const router = useRouter()

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const result = await addGoalContribution(goalId, Number(amount), description, source)
        
        setIsLoading(false)
        if (result?.success) {
            setOpen(false)
            setAmount("")
            setDescription("")
            setSource("")
            toast.success(`Recorded saving for ${goalName}`)
            router.refresh()
        } else {
            toast.error(result?.error || "Failed to record saving")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Record Saving</span>
                </button>
            </DialogTrigger>
            <DialogContent className="glass-dark sm:max-w-md border-white/20 bg-white/90 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900">Record Saving</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Goal</p>
                        <p className="font-black text-slate-800">{goalName}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Amount Saved (ETB)</label>
                        <div className="relative">
                            <input 
                                name="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                min="1"
                                placeholder="0.00"
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-teal-500/20 tabular-nums"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">ETB</div>
                        </div>
                        {suggestedAmount && suggestedAmount > 0 && (
                             <p className="text-[10px] font-bold text-teal-600 flex items-center gap-1">
                                <span className="w-1 h-1 bg-teal-500 rounded-full" />
                                Suggested to reach today&apos;s target: {Math.round(suggestedAmount).toLocaleString()} ETB
                             </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Source of Money (Optional)</label>
                        <select 
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            <option value="">Select Source...</option>
                            <option value="Salary">Salary 💼</option>
                            <option value="Bonus">Bonus 🎊</option>
                            <option value="Gift">Gift 🎁</option>
                            <option value="Savings">Savings 🏦</option>
                            <option value="Side Hustle">Side Hustle 🚀</option>
                            <option value="Other">Other ✨</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Note (Optional)</label>
                        <input 
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Weekly saving, Birthday gift..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isLoading || !amount || Number(amount) <= 0}
                            className="w-full bg-slate-900 text-white font-black rounded-xl py-3.5 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Recording...
                                </>
                            ) : (
                                "Confirm Saving"
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
