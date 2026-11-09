"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PieChart, Sparkles, Settings, Plus } from "lucide-react"
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal"

export function BottomNav() {
  const pathname = usePathname()
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)

  const leftNav = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/dashboard/expenses", icon: PieChart, label: "Expenses" },
  ]

  const rightNav = [
    { href: "/dashboard/ai", icon: Sparkles, label: "AI" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <>
      <AddExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />

      {/* Modern Docked Bottom Navigation with Center Action Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/60 pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="flex items-center justify-around h-14 sm:h-16 px-3 max-w-md mx-auto">
          {/* Left items */}
          {leftNav.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </Link>
            )
          })}

          {/* Center Elevated Action Button */}
          <div className="flex flex-col items-center justify-center px-1">
            <button 
              type="button"
              onClick={() => setExpenseModalOpen(true)}
              className="flex items-center justify-center -mt-6 sm:-mt-7 h-11 w-11 sm:h-13 sm:w-13 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95 transition-transform border-4 border-background focus:outline-none"
              title="Add Expense"
              aria-label="Add Expense"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
            </button>
            <span className="text-[9px] font-semibold text-primary mt-0.5">Add</span>
          </div>

          {/* Right items */}
          {rightNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`))
            const Icon = item.icon
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
