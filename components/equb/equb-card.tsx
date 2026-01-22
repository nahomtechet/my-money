"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Check, Clock, Trash2, Calendar, Coins, ArrowBigDownDash, Award, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { markContributionPaid, receiveEqubPayout, deleteEqub } from "@/actions/equb"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EqubCardProps {
  equb: any
  bankAccounts: any[]
}

export function EqubCard({ equb, bankAccounts }: EqubCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedBank, setSelectedBank] = useState<string>("cash")
  const [showTimeline, setShowTimeline] = useState(false)
  const router = useRouter()

  const paidCycles = equb.contributions?.filter((c: any) => c.status === "PAID").length || 0
  const totalCycles = equb.totalCycles || 0
  const progress = totalCycles > 0 ? (paidCycles / totalCycles) * 100 : 0
  const totalContributed = paidCycles * (equb.contributionAmount || 0)
  const expectedPayout = equb.payout?.amount || 0
  
  const isCompleted = equb.payout?.status === "RECEIVED"
  const canDelete = paidCycles === 0 && !isCompleted

  async function handlePay(contributionId: string) {
    if (!contributionId) return
    setLoading(contributionId)
    try {
      const bankId = selectedBank === "cash" ? undefined : selectedBank
      const result = await markContributionPaid(contributionId, bankId)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Payment recorded!")
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to record payment")
    } finally {
      setLoading(null)
    }
  }

  async function handleReceivePayout(payoutId: string) {
    setLoading(payoutId)
    try {
      const bankId = selectedBank === "cash" ? undefined : selectedBank
      const result = await receiveEqubPayout(payoutId, bankId)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Payout recorded!")
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to record payout")
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this Equb?")) return
    try {
      const result = await deleteEqub(equb.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Equb deleted")
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to delete Equb")
    }
  }

  return (
    <GlassCard className={cn(
      "p-5 rounded-3xl space-y-5 relative overflow-hidden transition-all duration-300",
      isCompleted ? "bg-amber-50/20 border-amber-100" : "bg-white/40"
    )}>
      {isCompleted && (
        <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
          <Award className="w-16 h-16 text-amber-500" />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{equb.name}</h3>
            {isCompleted && (
              <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Completed</span>
            )}
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {equb.frequency} &bull; Started {format(new Date(equb.startDate), "MMM d")}
          </p>
        </div>
        {canDelete && (
          <button onClick={handleDelete} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "rounded-xl p-3 space-y-1",
          isCompleted ? "bg-amber-100/50" : "bg-[#008080]/5"
        )}>
          <p className={cn(
            "text-[8px] font-black uppercase tracking-widest",
            isCompleted ? "text-amber-700" : "text-[#008080]"
          )}>
            {isCompleted ? "Total Saved" : "Paid"}
          </p>
          <p className="text-base font-black tabular-nums">{totalContributed.toLocaleString()} <span className="text-[8px] opacity-40">ETB</span></p>
        </div>
        <div className="bg-white/40 border border-slate-50 rounded-xl p-3 space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            {isCompleted ? "Lump Sum Received" : "Expected Payout"}
          </p>
          <p className="text-base font-black tabular-nums text-slate-700">{expectedPayout.toLocaleString()} <span className="text-[8px] opacity-40">ETB</span></p>
        </div>
      </div>

      {!isCompleted && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
            <span className="text-slate-400">Cycle Progress</span>
            <span className="text-[#008080]">{paidCycles}/{totalCycles}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#008080] transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Bank Selection */}
      {!isCompleted && (
        <div className="space-y-2 py-2 border-t border-dashed border-slate-100">
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">Payment Method</p>
           <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="h-8 text-[11px] font-medium bg-white/60 border-none shadow-none focus:ring-0 rounded-lg">
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Cash (Manual)</SelectItem>
                {bankAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.type === "BANK" ? "🏦" : "📱"} {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
           </Select>
        </div>
      )}

      {/* Action Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {!isCompleted && (
             <Button 
                onClick={() => {
                  const pending = equb.contributions.find((c: any) => c.status === "PENDING")
                  if (pending) handlePay(pending.id)
                }}
                disabled={loading !== null || progress === 100}
                className="flex-1 h-9 bg-[#008080] hover:bg-[#006666] text-white font-black uppercase tracking-widest text-[9px]"
              >
                {loading ? "..." : "Make Next Payment"}
              </Button>
          )}

          {progress === 100 && !isCompleted && equb.payout && (
             <Button 
                onClick={() => handleReceivePayout(equb.payout.id)}
                disabled={loading !== null}
                className="flex-1 h-9 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[9px]"
              >
                {loading === equb.payout.id ? "Recording..." : "Receive Payout"}
              </Button>
          )}

          <Button 
            variant="ghost" 
            onClick={() => setShowTimeline(!showTimeline)}
            className="h-9 px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
          >
            {showTimeline ? "Hide Details" : "Details"}
            <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", showTimeline && "rotate-180")} />
          </Button>
        </div>

        {/* Collapsible Timeline */}
        <AnimatePresence>
          {showTimeline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3"
            >
              <div className="h-px bg-slate-100 mt-2" />
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Schedule</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-none">
                {equb.contributions?.map((c: any) => {
                  const isPayoutDay = c.cycleNumber === (equb.payoutCycle || 0)
                  return (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-50 bg-white/40">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center text-[10px]",
                          c.status === "PAID" ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-400"
                        )}>
                          {c.status === "PAID" ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-700">Cycle {c.cycleNumber}</p>
                          <p className="text-[8px] font-bold text-slate-400">{format(new Date(c.date), "MMM d")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPayoutDay && !isCompleted && <ArrowBigDownDash className="w-3 h-3 text-amber-500" />}
                        {c.status === "PENDING" ? (
                          <button 
                            onClick={() => handlePay(c.id)} 
                            disabled={loading === c.id || isCompleted}
                            className="text-[8px] font-black uppercase tracking-widest text-[#008080] hover:underline"
                          >
                            Pay
                          </button>
                        ) : (
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Paid</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
