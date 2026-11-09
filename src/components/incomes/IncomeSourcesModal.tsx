"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IndianRupee, ArrowDownToLine, Calendar, Pencil, Trash2, Plus } from "lucide-react"

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
  totalIncome: number
  onAddIncome: () => void
  onEditIncome: (item: IncomeItem) => void
  onDeleteIncome: (item: any) => void
}

export function IncomeSourcesModal({
  open,
  onOpenChange,
  incomes,
  totalIncome,
  onAddIncome,
  onEditIncome,
  onDeleteIncome
}: IncomeSourcesModalProps) {
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
      <DialogContent className="sm:max-w-[460px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Income Sources</span>
            </DialogTitle>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              ₹{totalIncome.toLocaleString('en-IN')}
            </span>
          </div>
        </DialogHeader>

        {/* Sources Data List */}
        <div className="py-2 space-y-2">
          {incomes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No income sources recorded this month.</p>
              <Button 
                onClick={onAddIncome}
                size="sm"
                className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Income
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60 border rounded-xl overflow-hidden bg-card">
              {incomes.map((item, index) => (
                <div 
                  key={`${item.id}-${index}`} 
                  className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {item.source || "Manual Entry"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" /> {formatDate(item.date)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                      +₹{item.amount.toLocaleString('en-IN')}
                    </span>

                    <button
                      type="button"
                      onClick={() => onEditIncome(item)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
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
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 flex flex-row items-center justify-between sm:justify-between border-t border-border/40">
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
