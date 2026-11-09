"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  IndianRupee, 
  TrendingUp, 
  ArrowDownToLine, 
  Calendar, 
  Pencil, 
  Trash2, 
  Plus, 
  PieChart, 
  RefreshCw,
  Sparkles
} from "lucide-react"

export interface IncomeItem {
  id: string
  amount: number
  source: string
  date: string
  isRecurring?: boolean
}

interface IncomeSourcesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incomes: IncomeItem[]
  allIncomes?: IncomeItem[]
  totalIncome: number
  onAddIncome: () => void
  onEditIncome: (item: IncomeItem) => void
  onDeleteIncome: (item: any) => void
}

const PALETTE = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500"
]

export function IncomeSourcesModal({
  open,
  onOpenChange,
  incomes,
  allIncomes = [],
  totalIncome,
  onAddIncome,
  onEditIncome,
  onDeleteIncome
}: IncomeSourcesModalProps) {
  const [viewScope, setViewScope] = useState<"month" | "all">("month")

  const displayList = viewScope === "month" ? incomes : allIncomes
  const activeTotal = displayList.reduce((sum, item) => sum + item.amount, 0)

  // Group by source name for aggregated breakdown
  const sourceAggregates = displayList.reduce((acc: Record<string, { total: number; count: number; items: IncomeItem[] }>, item) => {
    const key = item.source?.trim() || "Manual Entry"
    if (!acc[key]) {
      acc[key] = { total: 0, count: 0, items: [] }
    }
    acc[key].total += item.amount
    acc[key].count += 1
    acc[key].items.push(item)
    return acc
  }, {})

  const aggregatedList = Object.entries(sourceAggregates)
    .map(([source, data]) => ({
      source,
      total: data.total,
      count: data.count,
      percentage: activeTotal > 0 ? (data.total / activeTotal) * 100 : 0,
      items: data.items
    }))
    .sort((a, b) => b.total - a.total)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border/50 bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Income Sources Analysis
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Detailed breakdown of where your funds originate
                </DialogDescription>
              </div>
            </div>

            {/* Scope Switcher: This Month vs All Time */}
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setViewScope("month")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewScope === "month"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setViewScope("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewScope === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Summary KPI Banner */}
          <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-background border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {viewScope === "month" ? "Total Income (This Month)" : "Total Income (All Time)"}
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center mt-0.5">
                <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 mr-0.5" />
                <span>{activeTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                {displayList.length} {displayList.length === 1 ? 'source' : 'sources'}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                {aggregatedList.length} unique streams
              </p>
            </div>
          </div>

          {/* Proportional Distribution Bar */}
          {aggregatedList.length > 0 && activeTotal > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <PieChart className="w-3.5 h-3.5" /> Distribution Share
                </span>
                <span>100% Total</span>
              </div>

              {/* Stacked Percentage Bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-muted/60 border border-border/50">
                {aggregatedList.map((agg, idx) => (
                  <div 
                    key={agg.source}
                    className={`${PALETTE[idx % PALETTE.length]} h-full transition-all`}
                    style={{ width: `${Math.max(agg.percentage, 2)}%` }}
                    title={`${agg.source}: ${agg.percentage.toFixed(1)}%`}
                  />
                ))}
              </div>

              {/* Legend Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                {aggregatedList.map((agg, idx) => (
                  <div key={agg.source} className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                    <span className={`w-2 h-2 rounded-full ${PALETTE[idx % PALETTE.length]}`} />
                    <span className="font-medium text-foreground truncate max-w-[120px]">{agg.source}</span>
                    <span className="text-muted-foreground font-bold">{agg.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of Income Sources */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Individual Entries ({displayList.length})
              </h4>
              <Button 
                type="button" 
                size="sm" 
                variant="outline"
                onClick={onAddIncome}
                className="h-7 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Income
              </Button>
            </div>

            {displayList.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-2xl bg-muted/10 p-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">No income sources found</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record your salary, freelance, or other earnings to analyze your income.
                </p>
                <Button 
                  onClick={onAddIncome}
                  size="sm"
                  className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add First Income
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60 border rounded-xl overflow-hidden bg-card shadow-xs">
                {displayList.map((item, index) => {
                  const share = activeTotal > 0 ? ((item.amount / activeTotal) * 100).toFixed(1) : "0"
                  return (
                    <div 
                      key={`${item.id}-${index}`} 
                      className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                          <ArrowDownToLine className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground truncate">
                              {item.source || "Manual Entry"}
                            </p>
                            {item.isRecurring && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center gap-0.5">
                                <RefreshCw className="w-2.5 h-2.5" /> Recurring
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(item.date)}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{share}% of total</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Amount & Quick Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                            +₹{item.amount.toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => onEditIncome(item)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit income"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteIncome({
                              id: `inc-${item.id}`,
                              rawId: item.id,
                              amount: item.amount,
                              category: item.source,
                              isIncome: true
                            })}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                            title="Delete income"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/50 bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
          <Button 
            type="button" 
            size="sm" 
            onClick={onAddIncome}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Income
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
