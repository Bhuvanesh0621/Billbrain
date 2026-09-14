"use client"

import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Bell, Search, Menu, Sun, Moon, Sparkles, Check, TrendingUp, TrendingDown, Receipt } from "lucide-react"
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
import Link from "next/link"

import { useLanguage } from "@/components/providers/LanguageProvider"

export function TopNav() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [insights, setInsights] = useState<any[]>([])

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
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors">
      <div className="flex items-center flex-1">
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="max-w-md w-full hidden sm:flex relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={language === 'ta' ? "பில்கள், தொகையைத் தேடு..." : "Search bills, providers, amounts..."}
            className="pl-10 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
          className="hidden sm:flex border-primary/20 text-primary hover:bg-primary/10"
        >
          {language === 'ta' ? 'English' : 'தமிழ்'}
        </Button>

        <Link href="/dashboard/ai" className="hidden sm:flex">
          <Button variant="outline" size="sm" className="hidden sm:flex border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
            {language === 'ta' ? 'AI உதவியாளர்' : 'Ask BillBrain'}
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "relative text-muted-foreground hover:text-foreground rounded-full focus-visible:ring-0 w-10 h-10 p-0" })}>
            <Bell className="h-5 w-5" />
            {insights.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
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
              <Link href="/dashboard/ai" className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full text-xs text-primary" })}>
                View in AI Assistant
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "relative h-8 w-8 rounded-full p-0 overflow-hidden ring-2 ring-transparent focus:ring-primary transition-all cursor-pointer" })}>
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={session?.user?.name || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
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
            <DropdownMenuItem>
              <Link href="/dashboard/household" className="w-full h-full cursor-pointer">Household Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer focus:bg-destructive focus:text-destructive-foreground" onClick={() => signOut({ callbackUrl: "/auth/login" })}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
