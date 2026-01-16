"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Plus } from "lucide-react"

export function AddCategoryDialog({ variant = "button" }: { variant?: "button" | "card" }) {
  const [open, setOpen] = useState(false)

  // We could use useFormState here but simple action call is fine for prototype
  async function handleSubmit(formData: FormData) {
    const data = Object.fromEntries(formData)
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        setOpen(false)
        window.location.reload()
      } else {
        const result = await response.json()
        alert(result.error || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      alert("Failed to create category")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "card" ? (
            <div className="glass rounded-3xl p-6 border-dashed border-2 border-primary/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="font-bold text-primary">New Category</p>
            </div>
        ) : (
            <Button className="rounded-full shadow-lg hover:translate-y-[-2px] transition-transform">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new category for your transactions.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
           <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                  {/* Select needs to be controlled or we use a hidden input with it 
                      or just use native select for simplicity in prototype, 
                      BUT shadcn select is nicer. 
                      Let's use native select to save time on controlled state or 
                      wrap shadcn select.
                  */}
                  <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
