"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X, Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function TelegramPrompt() {
    const [isVisible, setIsVisible] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const checkTelegram = async () => {
            // Don't show on settings page itself
            if (pathname === "/settings") {
                setIsVisible(false)
                return
            }

            try {
                const res = await fetch("/api/user/profile")
                if (res.ok) {
                    const data = await res.json()
                    if (!data.telegramUsername && !isDismissed) {
                        setIsVisible(true)
                    } else {
                        setIsVisible(false)
                    }
                }
            } catch (error) {
                console.error("Failed to check telegram status:", error)
            }
        }

        checkTelegram()
    }, [pathname, isDismissed])

    if (!isVisible) return null

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-24 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-80"
            >
                <div className="bg-white/90 backdrop-blur-xl border border-teal-100 shadow-2xl rounded-2xl p-4 overflow-hidden relative group">
                    {/* Decorative background circle */}
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#0088cc]/5 rounded-full blur-2xl group-hover:bg-[#0088cc]/10 transition-colors" />
                    
                    <button 
                        onClick={() => setIsDismissed(true)}
                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center shrink-0">
                            <Send className="w-5 h-5 text-[#0088cc]" />
                        </div>
                        <div className="flex-1 space-y-1 pr-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Telegram Alerts</h4>
                            <p className="text-[10px] text-slate-500 font-bold leading-normal">
                                Connect your Telegram to get morning Equb reminders.
                            </p>
                            <div className="pt-2">
                                <Link 
                                    href="/settings"
                                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#0088cc] hover:underline"
                                >
                                    Setup Now
                                    <Bell className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
