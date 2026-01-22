"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Bell, 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    CheckCheck,
    X,
    BellOff,
    CalendarClock
} from "lucide-react"
import { toast } from "sonner"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getNotifications, deleteNotification, markAllAsRead, dismissNotification } from "@/actions/notifications"
import { markContributionPaid } from "@/actions/equb"

interface Notification {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    actionId?: string
    actionType?: string
    createdAt: string
}

export function NotificationPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications()
            setNotifications(data as any)
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    const unreadCount = notifications.filter(n => !n.read).length

    const handleMarkAllRead = async () => {
        try {
            // Optimistic update
            setNotifications([])
            await markAllAsRead()
        } catch (error) {
            console.error("Failed to mark all read:", error)
        }
    }

    const handleDeleteNotification = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id))
            await deleteNotification(id)
        } catch (error) {
            console.error("Failed to delete notification:", error)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "SUCCESS": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            case "WARNING": return <AlertCircle className="w-4 h-4 text-orange-500" />
            case "EQUB_REMINDER": return <CalendarClock className="w-4 h-4 text-[#008080]" />
            default: return <Info className="w-4 h-4 text-blue-500" />
        }
    }

    const handleAction = async (id: string, actionType: string, actionId: string, choice: "YES" | "NO") => {
        try {
            if (choice === "YES" && actionType === "MARK_EQUB_PAID") {
                const result = await markContributionPaid(actionId)
                if (result.error) {
                    toast.error(result.error)
                    return
                }
                toast.success("Payment recorded!")
            }
            
            // Mark notification as read/dismissed in either case
            await dismissNotification(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
        } catch (error) {
            console.error("Failed to process action:", error)
            toast.error("Action failed")
        }
    }

    return (
        <Popover onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                    <Bell className="w-4 h-4 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center text-[7px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-white/95 backdrop-blur-md border-slate-100 shadow-2xl rounded-2xl overflow-hidden mt-2" align="end">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white/50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-teal-600" />
                        <h3 className="text-xs font-black tracking-tight text-slate-900">Notifications</h3>
                    </div>
                    {unreadCount > 0 && (
                        <button 
                            onClick={handleMarkAllRead}
                            className="text-[9px] font-black text-teal-600 uppercase tracking-widest hover:underline flex items-center gap-1.5"
                        >
                            <CheckCheck className="w-3 h-3" />
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="max-h-[350px] overflow-y-auto scrollbar-none">
                    {isLoading ? (
                        <div className="p-8 text-center space-y-2">
                            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={`p-4 transition-colors flex gap-3 hover:bg-slate-50/50 ${!n.read ? "bg-teal-50/30" : ""}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        n.type === "SUCCESS" ? "bg-emerald-50" : n.type === "WARNING" ? "bg-orange-50" : "bg-blue-50"
                                    }`}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 space-y-0.5 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-[11px] font-bold text-slate-800 truncate">{n.title}</h4>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteNotification(n.id);
                                                }}
                                                className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-300 hover:text-slate-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{n.message}</p>
                                        
                                        {n.type === "EQUB_REMINDER" && n.actionType && n.actionId && (
                                            <div className="flex items-center gap-2 pt-2">
                                                <button 
                                                    onClick={() => handleAction(n.id, n.actionType!, n.actionId!, "YES")}
                                                    className="h-7 px-4 rounded-lg bg-[#008080] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#006666] transition-colors"
                                                >
                                                    Yes, Pay
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(n.id, n.actionType!, n.actionId!, "NO")}
                                                    className="h-7 px-4 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center opacity-40 grayscale flex flex-col items-center gap-3">
                            <BellOff className="w-10 h-10 text-slate-200" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No alerts yet</p>
                        </div>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                        <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                            View All History
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
