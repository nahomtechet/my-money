"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEqub } from "@/actions/equb"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contributionAmount: z.coerce.number().min(1, "Amount must be at least 1"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  startDate: z.string().min(1, "Start date is required"),
  totalCycles: z.coerce.number().int().min(1),
  payoutCycle: z.coerce.number().int().min(1),
})

export function AddEqubDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contributionAmount: 0,
      frequency: "WEEKLY",
      startDate: new Date().toISOString().split("T")[0],
      totalCycles: 1,
      payoutCycle: 1,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      const result = await createEqub({
        ...values,
        startDate: new Date(values.startDate),
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Equb created successfully!")
        setOpen(false)
        form.reset()
        router.refresh()
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="glass flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl hover:scale-[1.03] transition-all group bg-teal-50/30 min-w-[100px]">
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-teal-100/50 text-teal-600 group-hover:bg-teal-100 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest leading-tight text-center text-slate-600">
            Start Equb
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Personal Equb</DialogTitle>
          <DialogDescription>
            Set up your rotating savings schedule.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equb Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Work Equb" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contributionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (ETB)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalCycles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cycles</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payoutCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payout Cycle</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-[#008080] hover:bg-[#006666] h-12 text-sm font-bold uppercase tracking-widest" disabled={loading}>
                {loading ? "Creating..." : "Create Equb"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
