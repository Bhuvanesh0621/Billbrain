"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, AlertCircle, CheckCircle2, AlertTriangle, Plus } from "lucide-react"

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Quick inline add state
  const [newCategory, setNewCategory] = useState("Food")
  const [newAmount, setNewAmount] = useState("")

  const CATEGORIES = [
    "Overall", "Food", "Groceries", "Transport", "Shopping", "Entertainment", 
    "Rent", "Electricity", "Water", "Internet", "Mobile", 
    "Insurance", "EMI / Loans", "Education", "Healthcare", 
    "Subscriptions", "Travel", "Personal", "Other"
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resBudgets, resExpenses] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/expenses")
      ])
      
      if (resBudgets.ok) setBudgets(await resBudgets.json())
      if (resExpenses.ok) setExpenses(await resExpenses.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAmount) return

    try {
      await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          amount: newAmount,
          period: "monthly"
        })
      })
      setNewAmount("")
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const currentMonthExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth)

  return (
    <div className="space-y-8 pb-10 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Budgets</h1>
        <p className="text-muted-foreground mt-1 text-lg">Set limits and track your spending pace.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-border/50 bg-primary/5">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center text-lg">
                <Target className="mr-2 h-5 w-5 text-primary" /> Set New Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSetBudget} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Limit (₹)</label>
                  <Input 
                    type="number" 
                    required 
                    placeholder="e.g. 5000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">Save Budget</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : budgets.length === 0 ? (
            <Card className="shadow-sm border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
              <div className="p-4 bg-muted/30 rounded-full mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No Budgets Set</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">Create your first budget on the left to start tracking your spending progress.</p>
            </Card>
          ) : (
            budgets.map(budget => {
              // Calculate spent
              const spent = budget.category === "Overall" 
                ? currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
                : currentMonthExpenses.filter(e => e.category === budget.category).reduce((sum, e) => sum + e.amount, 0);
              
              const percentage = Math.min(100, Math.round((spent / budget.amount) * 100));
              
              // Determine status
              let statusColor = "bg-emerald-500";
              let lightColor = "bg-emerald-500/10";
              let textColor = "text-emerald-600";
              let Icon = CheckCircle2;
              let statusText = "On Track";

              if (percentage >= 100) {
                statusColor = "bg-destructive";
                lightColor = "bg-destructive/10";
                textColor = "text-destructive";
                Icon = AlertCircle;
                statusText = "Exceeded";
              } else if (percentage >= 90) {
                statusColor = "bg-rose-500";
                lightColor = "bg-rose-500/10";
                textColor = "text-rose-600";
                Icon = AlertTriangle;
                statusText = "High Usage";
              } else if (percentage >= 70) {
                statusColor = "bg-amber-500";
                lightColor = "bg-amber-500/10";
                textColor = "text-amber-600";
                Icon = AlertTriangle;
                statusText = "Warning";
              }

              return (
                <Card key={budget.id} className="shadow-sm border-border/50 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{budget.category} Budget</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          ₹{spent.toLocaleString()} / ₹{budget.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full ${lightColor} ${textColor} text-xs font-semibold uppercase tracking-wide`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span>{statusText}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-3 mb-2 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full ${statusColor} transition-all duration-500`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs font-medium mt-3">
                      <span className="text-muted-foreground">{percentage}% used</span>
                      <span className={textColor}>
                        {percentage >= 100 
                          ? `Over by ₹${(spent - budget.amount).toLocaleString()}`
                          : `₹${(budget.amount - spent).toLocaleString()} left`
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
