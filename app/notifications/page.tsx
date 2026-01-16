"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { 
    Bell, 
    ChevronLeft, 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    Trash2,
    CheckCheck
} from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([
        { 
            id: 1, 
            title: "Salary Credited", 
            message: "Your monthly salary of 45,000 ETB has been successfully credited.", 
            type: "SUCCESS", 
            time: "2 hours ago",
            read: false 
        },
        { 
            id: 2, 
            title: "Budget Alert", 
            message: "You have reached 80% of your 'Food & Dining' budget for this month.", 
            type: "WARNING", 
            time: "5 hours ago",
            read: false 
        },
        { 
            id: 3, 
            title: "Goal Reached", 
            message: "Congratulations! You've achieved your 'New Phone' savings goal.", 
            type: "SUCCESS", 
            time: "Yesterday",
            read: true 
        },
        { 
            id: 4, 
            title: "System Update", 
            message: "We've added new recurring transaction features to your dashboard.", 
            type: "INFO", 
            time: "2 days ago",
            read: true 
        },
    ])

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "SUCCESS": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            case "WARNING": return <AlertCircle className="w-5 h-5 text-orange-500" />
            default: return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-12">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-2xl mx-auto px-6 pt-6 space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <h1 className="text-xl font-black tracking-tight text-slate-900">Notifications</h1>
                    </div>
                    <button 
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-teal-600"
                    >
                        <CheckCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Mark all as read</span>
                    </button>
                </motion.div>

                {/* Notifications List */}
                <motion.div variants={itemVariants} className="space-y-2">
                    {notifications.length > 0 ? (
                        notifications.map((n) => (
                            <div 
                                key={n.id} 
                                className={`p-4 rounded-2xl border transition-all flex gap-4 ${
                                    n.read 
                                    ? "bg-white border-slate-50 opacity-70" 
                                    : "bg-white border-slate-100 shadow-sm ring-1 ring-slate-100/50"
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    n.type === "SUCCESS" ? "bg-emerald-50" : n.type === "WARNING" ? "bg-orange-50" : "bg-blue-50"
                                }`}>
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-slate-800 tracking-tight">{n.title}</h3>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{n.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                                </div>
                                {!n.read && (
                                    <div className="pt-1">
                                        <div className="w-2 h-2 bg-teal-500 rounded-full shadow-sm shadow-teal-500/50" />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-50">
                            <Bell className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold italic tracking-wide">No notifications today</p>
                        </div>
                    )}
                </motion.div>

                {/* Clear History */}
                {notifications.length > 0 && (
                    <motion.div variants={itemVariants} className="flex justify-center pt-4">
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-500 transition-colors group">
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Clear Notification History</span>
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
