"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UploadCloud, X, RefreshCw, Paperclip } from "lucide-react"
import { compressImageToDataUrl } from "@/lib/imageUtils"

export interface ExpenseItem {
  id: string
  amount: number
  category: string
  description?: string | null
  date: string
  paymentMethod?: string | null
  notes?: string | null
  receiptUrl?: string | null
  isRecurring?: boolean
  recurrenceRule?: string | null
}

interface EditExpenseModalProps {
  expense: ExpenseItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const CATEGORIES = [
  "Food", "Groceries", "Petrol", "Shopping", 
  "Electricity", "Internet", "Mobile", 
  "Insurance", "EMI / Loans", "Education", "Healthcare", 
  "Travel", "Personal", "Other"
]

const PAYMENT_METHODS = [
  "UPI", "Cash", "Card", "Net Banking"
]

export function EditExpenseModal({ expense, open, onOpenChange, onSuccess }: EditExpenseModalProps) {
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
    paymentMethod: "UPI",
    notes: "",
    isRecurring: false,
    recurrenceRule: "MONTHLY",
    receiptUrl: "" as string
  })

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount ? expense.amount.toString() : "",
        category: expense.category || "",
        description: expense.description || "",
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : "",
        paymentMethod: expense.paymentMethod || "UPI",
        notes: expense.notes || "",
        isRecurring: Boolean(expense.isRecurring),
        recurrenceRule: expense.recurrenceRule || "MONTHLY",
        receiptUrl: expense.receiptUrl || ""
      })
    }
  }, [expense, open])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setCompressing(true)
      const compressed = await compressImageToDataUrl(file)
      setFormData(prev => ({ ...prev, receiptUrl: compressed }))
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to process receipt image")
    } finally {
      setCompressing(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveReceipt = () => {
    setFormData(prev => ({ ...prev, receiptUrl: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expense) return
    setLoading(true)

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onOpenChange(false)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("billbrain:refresh"))
        }
        onSuccess?.()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update expense")
      }
    } catch (error) {
      console.error("Failed to update expense", error)
      alert("Failed to update expense due to a network error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Modify details, manage attached receipts, or update recurring schedules.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount (INR)</Label>
            <Input 
              id="edit-amount" 
              type="number" 
              step="0.01" 
              required 
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="text-lg font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input 
                id="edit-category" 
                list="edit-category-suggestions"
                required 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
              <datalist id="edit-category-suggestions">
                {CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-paymentMethod">Payment Method</Label>
              <select 
                id="edit-paymentMethod"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.paymentMethod} 
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input 
              id="edit-description" 
              placeholder="e.g. Lunch or shopping"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input 
              id="edit-date" 
              type="date" 
              required
              suppressHydrationWarning
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          {/* Receipt Attachment Section */}
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Receipt Photo
              </Label>
              {formData.receiptUrl && (
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />

            {formData.receiptUrl ? (
              <div className="relative border border-border/60 rounded-lg p-2 bg-muted/20 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={formData.receiptUrl} 
                  alt="Receipt Preview" 
                  className="w-14 h-14 object-cover rounded-md border border-border/50 shrink-0"
                />
                <div className="text-xs text-muted-foreground truncate flex-1">
                  <p className="font-medium text-foreground truncate">Receipt Attached</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Attached to expense</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
              </div>
            ) : (
              <button
                type="button"
                disabled={compressing}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 rounded-lg p-3 text-center transition-colors flex items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                {compressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Compressing image...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-muted-foreground" />
                    <span>Upload or take a photo of receipt</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Recurring Schedule Section */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-isRecurring" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Recurring Transaction
              </label>
              <input 
                id="edit-isRecurring"
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {formData.isRecurring && (
              <div className="bg-muted/20 p-3 rounded-lg border border-border/50 space-y-2 animate-in fade-in-50 duration-200">
                <Label htmlFor="edit-recurrenceRule" className="text-xs text-muted-foreground">Repeat Frequency</Label>
                <select
                  id="edit-recurrenceRule"
                  value={formData.recurrenceRule}
                  onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="MONTHLY">Monthly (e.g. Rent, Wi-Fi, Subscriptions)</option>
                  <option value="WEEKLY">Weekly (e.g. Groceries, Allowance)</option>
                  <option value="YEARLY">Yearly (e.g. Annual Insurance, Taxes)</option>
                  <option value="DAILY">Daily (e.g. Daily Transport)</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || compressing} className="w-full sm:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
