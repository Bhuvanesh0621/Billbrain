"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, TrendingDown, Info, BrainCircuit, Activity } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function PredictionsPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/expenses")
        if (res.ok) setExpenses(await res.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Predictions Engine Logic
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const currentDay = today.getDate()
  const remainingDays = daysInMonth - currentDay

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonthExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth)
  
  // Calculate base daily rate without large unusual expenses (trim outliers > 10k)
  const typicalExpenses = currentMonthExpenses.filter(e => e.amount < 10000)
  const typicalSpent = typicalExpenses.reduce((sum, e) => sum + e.amount, 0)
  const dailyRate = currentDay > 0 ? typicalSpent / currentDay : 0

  // Calculate known future recurring
  const recurringTotal = 0 // In real app, fetch upcoming recurring bills that haven't hit yet

  // Estimated Month End
  const spentSoFar = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  // Calculate conservative and aggressive bounds
  const estMin = spentSoFar + (dailyRate * remainingDays * 0.9) + recurringTotal
  const estMax = spentSoFar + (dailyRate * remainingDays * 1.15) + recurringTotal

  // Categories Predictions
  const categories = Array.from(new Set(currentMonthExpenses.map(e => e.category)))
  const categoryPredictions = categories.map(cat => {
    const catExp = currentMonthExpenses.filter(e => e.category === cat)
    const catSpent = catExp.reduce((sum, e) => sum + e.amount, 0)
    const catDaily = currentDay > 0 ? catSpent / currentDay : 0
    const catMin = catSpent + (catDaily * remainingDays * 0.9)
    const catMax = catSpent + (catDaily * remainingDays * 1.2)

    return {
      category: cat,
      min: Math.round(catMin),
      max: Math.round(catMax),
      trend: catDaily > 500 ? "up" : "stable", // naive trend
      confidence: catExp.length > 3 ? "High" : "Medium",
      reason: `Based on your average spending of ₹${Math.round(catDaily)}/day across ${catExp.length} transactions.`
    }
  }).sort((a, b) => b.max - a.max).slice(0, 4) // Top 4 categories

  return (
    <div className="space-y-8 pb-10 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Spending Forecast</h1>
        <p className="text-muted-foreground mt-1 text-lg">Know what you're likely to spend by the end of the month.</p>
      </div>

      <Card className="bg-gradient-to-br from-primary via-indigo-600 to-indigo-800 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BrainCircuit className="w-48 h-48" />
        </div>
        <CardContent className="p-8 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-primary-foreground/80 font-medium tracking-wide uppercase text-sm mb-2">Estimated Month-End Spending</p>
              <div className="text-5xl font-bold tracking-tight text-white flex items-baseline">
                {loading ? <Skeleton className="h-12 w-64 bg-white/20" /> : (
                  <>
                    <span className="text-3xl mr-1 font-medium text-white/80">₹</span>
                    {Math.round(estMin).toLocaleString()} <span className="mx-3 text-white/50 font-light">–</span> 
                    <span className="text-3xl mr-1 font-medium text-white/80">₹</span>
                    {Math.round(estMax).toLocaleString()}
                  </>
                )}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 max-w-xs">
              <p className="text-white text-sm flex items-start">
                <Info className="h-5 w-5 mr-2 shrink-0 text-white/70" />
                This is an estimate based on your daily spending rate of ₹{Math.round(dailyRate).toLocaleString()}/day and historical patterns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mt-8">Category Forecasts</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </>
        ) : categoryPredictions.length === 0 ? (
          <div className="col-span-2 p-12 text-center border-dashed border-2 rounded-xl text-muted-foreground">
            Not enough data to generate category predictions yet. Add more expenses.
          </div>
        ) : categoryPredictions.map((pred, i) => (
          <Card key={i} className="shadow-sm border-border/50 hover:shadow-md transition-all group overflow-hidden">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg border border-border shadow-sm">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pred.category}</CardTitle>
                    <CardDescription>Expected Range</CardDescription>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`
                    ${pred.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}
                    ${pred.confidence === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}
                    border-0 py-1 px-3 text-xs font-semibold
                  `}
                >
                  {pred.confidence} Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-end justify-between mb-6">
                <div className="text-3xl font-bold text-foreground tracking-tight">
                  <span className="text-muted-foreground text-xl mr-1 font-medium">₹</span>
                  {pred.min.toLocaleString()}
                  {pred.max !== pred.min ? (
                    <>
                      <span className="text-muted-foreground mx-1 text-xl font-light">–</span>
                      <span className="text-muted-foreground text-xl mr-1 font-medium">₹</span>
                      {pred.max.toLocaleString()}
                    </>
                  ) : ''}
                </div>
                <div className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                  pred.trend === 'up' ? 'bg-destructive/10 text-destructive' : 
                  pred.trend === 'down' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                }`}>
                  {pred.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {pred.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                  {pred.trend === 'stable' && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mr-1.5"></span>}
                  <span className="capitalize">{pred.trend}</span>
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm leading-relaxed">
                <p className="text-muted-foreground">
                  <strong className="text-foreground font-semibold">AI Reasoning:</strong> {pred.reason}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
