"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Clock } from "lucide-react"

export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) {
    return (
      <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-4 rounded-md border border-border/40 shadow-inner h-10 animate-pulse w-[240px]">
      </div>
    )
  }

  return (
    <div className="flex items-center h-10 gap-3 text-sm font-medium text-foreground bg-card/50 backdrop-blur-md px-4 rounded-md border border-border/50 shadow-sm whitespace-nowrap">
      <div className="flex items-center text-muted-foreground border-r border-border/50 pr-3 h-full">
        <CalendarIcon className="w-3.5 h-3.5 mr-2 text-primary/70" />
        {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div className="flex items-center text-foreground font-semibold h-full">
        <Clock className="w-3.5 h-3.5 mr-2 text-primary/70" />
        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
    </div>
  )
}
