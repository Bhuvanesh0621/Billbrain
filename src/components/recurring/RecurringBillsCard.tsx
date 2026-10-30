"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Calendar, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, Clock } from "lucide-react"

export interface RecurringBillItem {
  id: string
  amount: number
  category: string
  description: string
  paymentMethod?: string
  receiptUrl?: string
  recurrenceRule: string
  originalDate: string
  lastLoggedDate: string
  nextDueDate: string
  isDue: boolean
  daysUntilDue: number
}

interface RecurringBillsCardProps {
  onProcessed?: () => void
}

export function RecurringBillsCard({ onProcessed }: RecurringBillsCardProps) {
  const [items, setItems] = useState<RecurringBillItem[]>([])
  const [totalCommitment, setTotalCommitment] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const fetchRecurring = async () => {
    try {
      const res = await fetch("/api/recurring", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalCommitment(data.totalMonthlyCommitment || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecurring()

    const onRefresh = () => fetchRecurring()
    window.addEventListener("billbrain:refresh", onRefresh)
    return () => window.removeEventListener("billbrain:refresh", onRefresh)
  }, [])

  const handleProcessDue = async () => {
    setProcessing(true)
    setFeedback(null)
    try {
      const res = await fetch("/api/recurring/process", { method: "POST" })
      if (res.ok) {
        const result = await res.json()
        if (result.processedCount > 0) {
          setFeedback(`Successfully auto-logged ${result.processedCount} due recurring payment(s)!`)
        } else {
          setFeedback("All recurring bills are up to date. No payments due today.")
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("billbrain:refresh"))
        }
        fetchRecurring()
        onProcessed?.()
      } else {
        setFeedback("Failed to process due recurring bills.")
      }
    } catch (err) {
      console.error(err)
      setFeedback("Network error while processing bills.")
    } finally {
      setProcessing(false)
    }
  }

  const dueCount = items.filter(i => i.isDue).length

  if (loading) {
    return (
      <Card className="glass-card border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading recurring bills & commitments...</p>
        </div>
      </Card>
    )
  }

  if (items.length === 0) {
    return null // Only render card when recurring transactions exist, or keep compact empty state
  }

  return (
    <Card className="glass-card border-border/50 overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <RefreshCw className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                Recurring Subscriptions & Bills
              </CardTitle>
              {dueCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {dueCount} Due Now
                </span>
              )}
            </div>
            <CardDescription className="text-xs mt-1">
              Estimated Monthly Scheduled: <span className="font-semibold text-foreground">₹{totalCommitment.toLocaleString()}</span>
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant={dueCount > 0 ? "default" : "outline"}
            disabled={processing}
            onClick={handleProcessDue}
            className="text-xs h-8 shrink-0"
          >
            {processing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Process Due Bills
              </>
            )}
          </Button>
        </div>

        {feedback && (
          <div className="mt-2 text-xs p-2 rounded-md bg-muted/30 border border-border/50 text-foreground flex items-center gap-2 animate-in fade-in-50">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{feedback}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border/40">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
          {items.map((item) => {
            const nextDate = new Date(item.nextDueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })

            return (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.description}
                    </p>
                    <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {item.recurrenceRule}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-2">
                    <span>{item.category}</span>
                    <span>•</span>
                    <span className={`flex items-center gap-1 ${item.isDue ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}`}>
                      <Clock className="w-3 h-3 inline" />
                      {item.isDue ? "Due Today" : `Next: ${nextDate}`}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-foreground">
                    ₹{item.amount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {item.daysUntilDue <= 0
                      ? "Ready to log"
                      : `In ${item.daysUntilDue} day${item.daysUntilDue === 1 ? "" : "s"}`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
