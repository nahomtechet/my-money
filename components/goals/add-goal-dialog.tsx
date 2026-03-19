"use client"

import { motion } from "framer-motion"

import { useState, useEffect } from "react"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
    Plus, Check, Loader2,
    Car, Home, Smartphone, Plane, GraduationCap, Laptop, Gift, Heart, Shield,
    LucideIcon
} from "lucide-react"
import { createGoal } from "@/actions/goals"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

const COLORS = [
    { name: "Teal", class: "bg-teal-500" },
    { name: "Blue", class: "bg-blue-600" },
    { name: "Orange", class: "bg-orange-500" },
    { name: "Purple", class: "bg-purple-500" },
    { name: "Pink", class: "bg-pink-500" },
]

// Icon Mapping
const ICON_MAP: Record<string, LucideIcon> = {
    "Laptop": Laptop,
    "Car": Car,
    "Home": Home,
    "Smartphone": Smartphone,
    "Plane": Plane,
    "GraduationCap": GraduationCap,
    "Gift": Gift,
    "Heart": Heart,
    "Shield": Shield,
}

const PREDICTIVE_KEYWORDS: Record<string, string> = {
    "laptop": "Laptop", "macbook": "Laptop", "computer": "Laptop", "tech": "Laptop",
    "car": "Car", "auto": "Car", "vehicle": "Car", "drive": "Car",
    "home": "Home", "house": "Home", "rent": "Home", "mortgage": "Home",
    "renovation": "Home", "apartment": "Home",
    "phone": "Smartphone", "iphone": "Smartphone", "samsung": "Smartphone", "mobile": "Smartphone",
    "trip": "Plane", "vacation": "Plane", "travel": "Plane", "flight": "Plane", "holiday": "Plane",
    "school": "GraduationCap", "college": "GraduationCap", "tuition": "GraduationCap", "course": "GraduationCap",
    "gift": "Gift", "birthday": "Gift", "present": "Gift",
    "wedding": "Heart", "engagement": "Heart",
    "emergency": "Shield", "fund": "Shield", "save": "Shield"
}

const DURATIONS = [
    { label: "1 Mo", value: 1 },
    { label: "2 Mo", value: 2 },
    { label: "3 Mo", value: 3 },
    { label: "4 Mo", value: 4 },
    { label: "6 Mo", value: 6 },
]

export function AddGoalDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedColor, setSelectedColor] = useState(COLORS[0].class)
    const [goalName, setGoalName] = useState("")
    const [selectedIconName, setSelectedIconName] = useState<string>("Target")
    const [selectedDuration, setSelectedDuration] = useState<number | null>(DURATIONS[0].value)
    const [customDeadline, setCustomDeadline] = useState("")
    const [isCustomMode, setIsCustomMode] = useState(false)
    const router = useRouter()

    // Predictive Icon Logic
    useEffect(() => {
        const lowerName = goalName.toLowerCase()
        let foundIcon = "Target" // Default

        for (const [keyword, iconName] of Object.entries(PREDICTIVE_KEYWORDS)) {
            if (lowerName.includes(keyword)) {
                foundIcon = iconName
                break
            }
        }
        
        // Only update if we found a match, otherwise keep current (or default)
        // This allows manual override if we implement a picker later
        if (foundIcon !== "Target") {
             setSelectedIconName(foundIcon)
        }
    }, [goalName])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.append("color", selectedColor)
        formData.append("icon", selectedIconName)

        // Calculate deadline if using presets
        if (!isCustomMode && selectedDuration) {
            const date = new Date()
            date.setMonth(date.getMonth() + selectedDuration)
            formData.set("deadline", date.toISOString().split('T')[0])
        }

        const result = await createGoal(formData)
        
        setIsLoading(false)
        if (result?.success) {
            setOpen(false)
            setGoalName("")
            setSelectedIconName("Target")
            setCustomDeadline("")
            setSelectedDuration(DURATIONS[0].value)
            setIsCustomMode(false)
            router.refresh()
        }
    }

    const SelectedIcon = ICON_MAP[selectedIconName] || Plus // Fallback

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="glass flex items-center gap-2 px-4 py-2 rounded-[1rem] hover:scale-105 transition-all text-slate-800 font-bold text-xs group">
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                    </div>
                    <span>New Goal</span>
                </button>
            </DialogTrigger>
            <DialogContent className="glass-dark sm:max-w-md border-white/20 bg-white/90 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900">Create Savings Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Goal Name</label>
                        <div className="relative">
                            <input 
                                name="name"
                                value={goalName}
                                onChange={(e) => setGoalName(e.target.value)}
                                required
                                placeholder="e.g., New Laptop"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                                {SelectedIcon && <SelectedIcon className="w-5 h-5" />}
                             </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target Amount (ETB)</label>
                        <input 
                            name="targetValue"
                            type="number"
                            required
                            min="1"
                            placeholder="0.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label 
                                onClick={() => setIsCustomMode(!isCustomMode)}
                                className="text-[10px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer hover:text-teal-600 transition-colors flex items-center gap-2"
                            >
                                Target Date {isCustomMode ? "(Specific Date)" : "(Duration)"}
                                <span className="text-[8px] font-normal lowercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">click to switch</span>
                            </label>
                        </div>

                        {!isCustomMode ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="grid grid-cols-5 gap-2"
                            >
                                {DURATIONS.map((d) => (
                                    <button
                                        key={d.value}
                                        type="button"
                                        onClick={() => setSelectedDuration(d.value)}
                                        className={`py-2 rounded-xl text-[10px] font-black transition-all border ${selectedDuration === d.value ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <input 
                                    name="deadline"
                                    type="date"
                                    value={customDeadline}
                                    onChange={(e) => setCustomDeadline(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                            </motion.div>
                        )}
                        
                        {!isCustomMode && selectedDuration && (
                            <p className="text-[10px] font-bold text-teal-600 px-1">
                                Goal sets for: {format(new Date(new Date().setMonth(new Date().getMonth() + selectedDuration)), "MMM d, yyyy")}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Color Theme</label>
                        <div className="flex gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => setSelectedColor(color.class)}
                                    className={`w-8 h-8 rounded-full ${color.class} flex items-center justify-center transition-transform hover:scale-110 ${selectedColor === color.class ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''}`}
                                >
                                    {selectedColor === color.class && <Check className="w-3 h-3 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-slate-900 text-white font-bold rounded-xl py-3 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Goal"
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
