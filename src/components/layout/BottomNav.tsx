"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PieChart, BrainCircuit, Menu, Plus, Receipt } from "lucide-react"
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal"

export function BottomNav() {
  const pathname = usePathname()
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)

  const links = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/dashboard/expenses", icon: PieChart, label: "Expenses" },
    { href: "/dashboard/ai", icon: BrainCircuit, label: "AI" },
    { href: "/dashboard/settings", icon: Menu, label: "More" },
  ]

  return (
    <>
      <button 
        onClick={() => setExpenseModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-primary/90 active:scale-95 transition-all"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`))
            const Icon = item.icon
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
