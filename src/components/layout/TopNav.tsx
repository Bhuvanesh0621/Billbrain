"use client"

import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { 
  Bell, 
  Search, 
  Menu, 
  Sun, 
  Moon, 
  Sparkles, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  Plus,
  Home,
  BarChart3,
  Lightbulb,
  Brain,
  FileText,
  Settings,
  X
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal"

const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Predictions", href: "/dashboard/predictions", icon: Lightbulb },
  { title: "Smart Search", href: "/dashboard/search", icon: Brain },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function TopNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [insights, setInsights] = useState<any[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [topSearchQuery, setTopSearchQuery] = useState("")

  const cycleLanguage = () => {
    if (language === 'en') setLanguage('ta')
    else if (language === 'ta') setLanguage('tanglish')
    else setLanguage('en')
  }

  const getLanguageLabel = () => {
    if (language === 'en') return 'English'
    if (language === 'ta') return 'தமிழ்'
    return 'Tanglish'
  }

  const handleTopSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = topSearchQuery.trim()
    if (trimmed) {
      router.push(`/dashboard/search?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push(`/dashboard/search`)
    }
  }

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/insights")
        if (res.ok) {
          setInsights(await res.json())
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchInsights()
    const interval = setInterval(fetchInsights, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <AddExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />

      {/* Mobile Navigation Drawer / Menu */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="sm:max-w-[340px] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  B
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">BillBrain</DialogTitle>
                  <p className="text-[11px] text-muted-foreground">Financial Navigation</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-3 space-y-1 max-h-[65vh] overflow-y-auto">
            <Button
              onClick={() => {
                setMobileMenuOpen(false)
                setExpenseModalOpen(true)
              }}
              className="w-full mb-3 bg-primary text-primary-foreground hover:bg-primary/90 h-10 font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </Button>

            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>

          <div className="p-3 border-t border-border/50 bg-muted/10 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={cycleLanguage}
              className="text-xs h-8"
            >
              🌐 {getLanguageLabel()}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-xs h-8"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="h-14 sm:h-16 bg-background/80 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 transition-colors">
        <div className="flex items-center flex-1 gap-2 min-w-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden h-9 w-9 text-foreground shrink-0"
            title="Open Navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-base text-foreground tracking-tight md:hidden">BillBrain</span>
            <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              v2.1
            </span>
          </div>

          <form onSubmit={handleTopSearch} className="max-w-md w-full hidden sm:flex relative ml-2">
            <button 
              type="submit" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <Input 
              value={topSearchQuery}
              onChange={(e) => setTopSearchQuery(e.target.value)}
              placeholder={language === 'ta' ? "பில்கள், தொகையைத் தேடு (எ.கா. 500, Petrol)..." : "Search bills, notes, amounts (e.g. 500, Petrol)..."}
              className="pl-10 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background transition-all h-9 text-xs sm:text-sm"
            />
          </form>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Quick Search Button on Mobile */}
          <Link href="/dashboard/search" className="sm:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-foreground hover:bg-muted rounded-full"
              title="Smart Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          {/* Quick Add Expense button for Mobile Headers */}
          <Button 
            size="sm" 
            onClick={() => setExpenseModalOpen(true)} 
            className="md:hidden bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-2.5 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={cycleLanguage}
            className="hidden sm:flex border-primary/20 text-primary hover:bg-primary/10 h-8 text-xs font-semibold"
            title="Switch Language: English / தமிழ் / Tanglish"
          >
            🌐 {getLanguageLabel()}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8 sm:h-9 sm:w-9"
          >
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "relative text-muted-foreground hover:text-foreground rounded-full focus-visible:ring-0 w-8 h-8 sm:w-9 sm:h-9 p-0" })}>
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {insights.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <span className="font-semibold text-sm">Notifications</span>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">
                  <Check className="h-3 w-3 mr-1" /> Mark all read
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto py-2">
                {insights.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                ) : (
                  insights.map((insight, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full shrink-0 ${
                          insight.type === 'anomaly' ? 'bg-destructive/10 text-destructive' :
                          insight.type === 'saving' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {insight.type === 'anomaly' && <TrendingUp className="h-4 w-4" />}
                          {insight.type === 'saving' && <TrendingDown className="h-4 w-4" />}
                          {insight.type === 'prediction' && <Sparkles className="h-4 w-4" />}
                          {(!insight.type) && <Receipt className="h-4 w-4" />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {insight.type === 'anomaly' ? 'High Spending Alert' :
                             insight.type === 'saving' ? 'Savings Opportunity' : 'Insight'}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-border/50">
                <Link href="/dashboard/analytics" className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full text-xs text-primary" })}>
                  View All Analytics
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "relative h-8 w-8 rounded-full p-0 overflow-hidden ring-2 ring-transparent focus:ring-primary transition-all cursor-pointer" })}>
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={session?.user?.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {session?.user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/dashboard/settings" className="w-full h-full cursor-pointer">Profile Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive cursor-pointer focus:bg-destructive focus:text-destructive-foreground" onClick={() => signOut({ callbackUrl: "/auth/login" })}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  )
}
