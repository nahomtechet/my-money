"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/ui/glass-card"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LogIn, Mail, Lock, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Login failed")
      }

      window.location.href = "/"
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-50/50">
      {/* Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary/10 blur-[150px] rounded-full animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full animate-pulse-slow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8 space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl border border-primary/20">
                <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-slate-900">Secure Access</h1>
            <p className="text-muted-foreground text-sm font-medium">Continue your financial journey with MyMoney.</p>
        </div>

        <GlassCard className="p-6 md:p-10 border-slate-200/50 shadow-2xl bg-white/70 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
                >
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    {error}
                </motion.div>
            )}
            
            <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="m@example.com" 
                        required 
                        className="rounded-2xl h-14 bg-white/50 border-slate-200/60 font-bold px-12 focus:ring-primary/20 transition-all focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Secret Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        required 
                        className="rounded-2xl h-14 bg-white/50 border-slate-200/60 font-bold px-12 focus:ring-primary/20 transition-all focus:bg-white"
                    />
                  </div>
                </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] hover:shadow-primary/30" disabled={isLoading}>
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Authenticating...
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Enter Dashboard
                    </div>
                )}
            </Button>
          </form>

          <div className="mt-10 text-center font-bold text-slate-400 text-sm">
            New to our community? <Link href="/register" className="text-primary hover:underline ml-1">Create an account</Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
