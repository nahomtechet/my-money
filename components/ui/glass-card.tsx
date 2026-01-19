import React from 'react'
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div 
      className={cn(
        "glass border border-white/20 shadow-lg backdrop-blur-xl bg-white/40 hover:bg-white/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
