"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, List, Calendar as CalendarIcon, Filter, Search, ArrowDownRight, ArrowUpRight, Receipt, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses", { cache: "no-store" })
      if (res.ok) {
        setExpenses(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()

    const onRefresh = () => {
      fetchExpenses()
    }

    window.addEventListener("billbrain:refresh", onRefresh)
    return () => window.removeEventListener("billbrain:refresh", onRefresh)
  }, [])

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(search.toLowerCase()) || 
    (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
    (e.paymentMethod && e.paymentMethod.toLowerCase().includes(search.toLowerCase()))
  )

  // Group by date
  const groupedExpenses = filteredExpenses.reduce((groups: any, expense) => {
    const date = new Date(expense.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {})

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <AddExpenseModal 
        open={expenseModalOpen} 
        onOpenChange={setExpenseModalOpen}
        onSuccess={fetchExpenses} 
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Expense Timeline</h1>
          <p className="text-muted-foreground mt-1 text-lg">Track and search all your daily transactions.</p>
        </div>
        <Button onClick={() => setExpenseModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Track Expense
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by category, description, or payment method..." 
            className="pl-9 bg-background border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="shrink-0 bg-background border-border/50 shadow-sm">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : Object.keys(groupedExpenses).length === 0 ? (
        <Card className="shadow-sm border-dashed border-2 flex flex-col items-center justify-center p-12 text-center bg-transparent">
          <div className="p-4 bg-muted/30 rounded-full mb-4">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No Expenses Found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">No transactions match your search or you haven't tracked any expenses yet.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedExpenses).map(([date, dayExpenses]: [string, any]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" /> {date}
              </h3>
              <div className="bg-background border border-border/50 rounded-xl shadow-sm overflow-hidden divide-y divide-border/50">
                {dayExpenses.map((expense: any) => (
                  <div key={expense.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-base">{expense.category}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-0.5 space-x-2">
                          <span>{expense.description || "No description"}</span>
                          {expense.paymentMethod && (
                            <>
                              <span>•</span>
                              <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold">{expense.paymentMethod}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right sm:text-right font-bold text-lg text-foreground flex items-center sm:justify-end">
                      ₹{expense.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
