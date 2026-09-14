"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Receipt, 
  BarChart3, 
  Lightbulb, 
  Brain, 
  Bell, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Predictions", href: "/dashboard/predictions", icon: Lightbulb },
  { title: "Smart Search", href: "/dashboard/search", icon: Brain }, // Repurposed AI icon
]

const bottomNav = [
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

import { AddExpenseModal } from "@/components/expenses/AddExpenseModal"

import { useLanguage } from "@/components/providers/LanguageProvider"

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)

  return (
    <aside 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-sidebar border-r border-sidebar-border hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 z-40`}
    >
      <AddExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />

      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border relative">
        <Link href="/dashboard" className={`flex items-center space-x-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-sm">
            B
          </div>
          {!isCollapsed && <span className="font-bold text-xl text-sidebar-foreground tracking-tight whitespace-nowrap">BillBrain</span>}
        </Link>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 bg-sidebar border border-sidebar-border rounded-full p-1 text-sidebar-foreground hover:bg-sidebar-accent shadow-sm z-50 hidden md:flex"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
        <button
          onClick={() => setExpenseModalOpen(true)}
          className={`w-full mb-4 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm`}
        >
          <span className="text-xl font-bold mr-2">+</span> 
          {!isCollapsed && <span>{t("track_expense")}</span>}
        </button>

        {mainNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}`))
          
          // map the original english title to the i18n key format
          let i18nKey = item.title.toLowerCase().replace(" ", "_")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
              title={isCollapsed ? t(i18nKey) : undefined}
            >
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
              )}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} ${isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"}`} />
              {!isCollapsed && <span className="truncate">{t(i18nKey)}</span>}
            </Link>
          )
        })}
      </div>

      <div className="p-3 border-t border-sidebar-border space-y-1 bg-sidebar">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href
          let i18nKey = item.title.toLowerCase().replace(" ", "_")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
              title={isCollapsed ? t(i18nKey) : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} ${isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"}`} />
              {!isCollapsed && <span className="truncate">{t(i18nKey)}</span>}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
