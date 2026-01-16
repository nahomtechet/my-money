import React from 'react'
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div 
      className={cn(
        "glass rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
