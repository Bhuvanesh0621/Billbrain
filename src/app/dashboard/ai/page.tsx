"use client"

import { useState, useRef, useEffect } from "react"
import { BrainCircuit, Send, User, Sparkles, Zap, PieChart, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm BillBrain AI, your personal financial intelligence center. I can analyze your spending patterns, explain specific bills, or find optimization opportunities. What would you like to know today?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [dbStats, setDbStats] = useState<any>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [resExpenses, resBudgets] = await Promise.all([
          fetch("/api/expenses"),
          fetch("/api/budgets")
        ])
        if (resExpenses.ok && resBudgets.ok) {
          const expenses = await resExpenses.json()
          const budgets = await resBudgets.json()
          
          const today = new Date()
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          const currentMonthExpenses = expenses.filter((e: any) => new Date(e.date) >= startOfMonth)
          
          const spentThisMonth = currentMonthExpenses.reduce((acc: number, curr: any) => acc + curr.amount, 0)
          
          const categoryTotals = currentMonthExpenses.reduce((acc: any, e: any) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount
            return acc
          }, {})

          let highestCat = "None"
          let highestAmt = 0
          for (const [cat, amt] of Object.entries(categoryTotals)) {
            if ((amt as number) > highestAmt) {
              highestAmt = amt as number
              highestCat = cat
            }
          }

          setDbStats({
            spentThisMonth,
            highestCat,
            highestAmt,
            expensesCount: currentMonthExpenses.length
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      })
      
      if (res.ok) {
        const data = await res.json()
        setMessages([...newMessages, { role: "assistant", content: data.reply }])
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Sorry, I am having trouble connecting to my neural network right now." }])
      }
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "An error occurred while contacting the AI." }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    { text: "Where am I spending the most?", icon: PieChart },
    { text: "How can I reduce my expenses?", icon: TrendingDown },
    { text: "Compare my last two electricity bills", icon: Zap }
  ]

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col pb-4 max-w-5xl mx-auto">
      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <div className="p-2 bg-primary/10 rounded-xl mr-3">
            <BrainCircuit className="h-7 w-7 text-primary" />
          </div>
          Financial Intelligence Center
        </h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl">Ask questions about your real-time expenses, budgets, and bills.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/60 shadow-md bg-background/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto scroll-smooth" ref={scrollRef}>
          <div className="space-y-6 pb-4 max-w-4xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-foreground text-background ml-3 sm:ml-4' 
                      : 'bg-primary text-primary-foreground mr-3 sm:mr-4'
                  }`}>
                    {msg.role === 'user' ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div className={`px-5 py-4 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-muted/60 text-foreground rounded-2xl rounded-tr-sm border border-border/50' 
                      : 'bg-primary/5 text-foreground rounded-2xl rounded-tl-sm border border-primary/20'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex flex-row max-w-[80%]">
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-primary text-primary-foreground mr-3 sm:mr-4 shadow-sm">
                    <BrainCircuit className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="px-5 py-5 rounded-2xl bg-primary/5 border border-primary/20 rounded-tl-sm flex space-x-2 items-center shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 sm:p-6 bg-muted/10 border-t border-border/60">
          <div className="max-w-4xl mx-auto">
            {messages.length === 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setInput(suggestion.text)
                      setTimeout(() => document.getElementById("ai-submit-btn")?.click(), 50)
                    }}
                    className="flex items-center text-xs sm:text-sm px-3.5 py-2 bg-background text-muted-foreground rounded-full hover:bg-primary/5 hover:text-primary transition-colors border border-border shadow-sm group"
                  >
                    <suggestion.icon className="h-3.5 w-3.5 mr-2 group-hover:text-primary transition-colors" />
                    {suggestion.text}
                  </button>
                ))}
              </div>
            )}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative flex items-center"
            >
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask BillBrain anything about your finances..."
                className="pr-14 pl-5 py-6 rounded-2xl bg-background border-border/80 focus-visible:ring-primary shadow-sm text-base"
                disabled={loading}
              />
              <Button 
                id="ai-submit-btn"
                type="submit" 
                disabled={!input.trim() || loading} 
                size="icon"
                className="absolute right-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-sm"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            </form>
            <p className="text-center text-[11px] text-muted-foreground mt-3 font-medium tracking-wide">
              BillBrain AI integrates with your real-time expenses and budgets.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
