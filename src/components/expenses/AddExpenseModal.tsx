"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UploadCloud, X, RefreshCw, Paperclip, Sparkles, Check, Wand2 } from "lucide-react"
import { compressImageToDataUrl } from "@/lib/imageUtils"
import { notify } from "@/components/ui/toast"

interface AddExpenseModalProps {
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

const QUICK_EXAMPLES = [
  "350 Biryani lunch UPI",
  "Petrol 500 Cash",
  "Groceries 1200 Card",
  "Tea & snacks 40 Cash",
  "Mobile recharge 299 UPI"
]

function parseNaturalExpense(input: string) {
  if (!input.trim()) return null

  let text = input.trim()
  let detectedAmount = ""
  let detectedPaymentMethod = ""
  let detectedCategory = ""
  let detectedDate = ""

  // 1. Amount detection: look for numbers like "₹500", "500", "500.50", "rs 500", "500rs", "2,500"
  const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)(?:\s*(?:rs|inr|\/-))?/i)
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/,/g, "")
    const num = parseFloat(rawNum)
    if (!isNaN(num) && num > 0) {
      detectedAmount = rawNum
    }
  }

  // 2. Payment method detection
  if (/(?:via|using|through|by|with)?\s*(upi|gpay|google\s*pay|phonepe|paytm|bhim)/i.test(text)) {
    detectedPaymentMethod = "UPI"
  } else if (/(?:via|using|through|by|with)?\s*(cash|hand\s*cash)/i.test(text)) {
    detectedPaymentMethod = "Cash"
  } else if (/(?:via|using|through|by|with)?\s*(card|credit\s*card|debit\s*card|pos)/i.test(text)) {
    detectedPaymentMethod = "Card"
  } else if (/(?:via|using|through|by|with)?\s*(net\s*banking|netbanking|bank\s*transfer|neft|imps)/i.test(text)) {
    detectedPaymentMethod = "Net Banking"
  }

  // 3. Category detection
  const lower = text.toLowerCase()
  if (/(petrol|fuel|diesel|gasoline|cng)/i.test(lower)) {
    detectedCategory = "Petrol"
  } else if (/(food|lunch|dinner|breakfast|biryani|pizza|burger|snack|snacks|tea|chai|coffee|restaurant|hotel|swiggy|zomato|cafe|dosa|idli|meals)/i.test(lower)) {
    detectedCategory = "Food"
  } else if (/(groceries|grocery|vegetable|vegetables|fruits|milk|dmart|d-mart|supermarket|rice|provision|kirana)/i.test(lower)) {
    detectedCategory = "Groceries"
  } else if (/(shopping|dress|clothes|shirt|pant|shoes|amazon|flipkart|myntra|zara|h&m)/i.test(lower)) {
    detectedCategory = "Shopping"
  } else if (/(electricity|eb\s*bill|current\s*bill|tneb|power)/i.test(lower)) {
    detectedCategory = "Electricity"
  } else if (/(internet|wifi|broadband|fiber|act|airtel\s*fiber|jio\s*fiber)/i.test(lower)) {
    detectedCategory = "Internet"
  } else if (/(mobile|recharge|jio|airtel|vi|phone\s*bill)/i.test(lower)) {
    detectedCategory = "Mobile"
  } else if (/(insurance|lic|health\s*insurance|term\s*insurance)/i.test(lower)) {
    detectedCategory = "Insurance"
  } else if (/(emi|loan|mortgage|credit\s*card\s*bill)/i.test(lower)) {
    detectedCategory = "EMI / Loans"
  } else if (/(education|school|college|fees|tuition|books|stationery|course|exam)/i.test(lower)) {
    detectedCategory = "Education"
  } else if (/(healthcare|hospital|medicine|medical|doctor|pharmacy|clinic|tablets|apollo)/i.test(lower)) {
    detectedCategory = "Healthcare"
  } else if (/(travel|trip|flight|train|irctc|bus|cab|taxi|uber|ola|auto|flight|toll|fastag)/i.test(lower)) {
    detectedCategory = "Travel"
  } else if (/(movie|cinema|theatre|film|netflix|prime|hotstar|popcorn)/i.test(lower)) {
    detectedCategory = "Personal"
  }

  // 4. Date detection: "yesterday", "today"
  if (/\byesterday\b/i.test(lower)) {
    const y = new Date()
    y.setDate(y.getDate() - 1)
    detectedDate = y.toISOString().split("T")[0]
  } else if (/\btoday\b/i.test(lower)) {
    detectedDate = new Date().toISOString().split("T")[0]
  }

  // 5. Clean Description: remove numbers, payment words, "yesterday/today", "for", "via", "at", "paid"
  let cleanDesc = text
    .replace(/(?:₹|rs\.?|inr)?\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:rs|inr|\/-))?/gi, "")
    .replace(/\b(upi|gpay|google\s*pay|phonepe|paytm|bhim|cash|card|credit\s*card|debit\s*card|net\s*banking|netbanking)\b/gi, "")
    .replace(/\b(yesterday|today|paid|spend|spent|bought|buy|via|using|through|by|with|for|at)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()

  if (cleanDesc) {
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1)
  }

  return {
    amount: detectedAmount,
    category: detectedCategory,
    paymentMethod: detectedPaymentMethod,
    description: cleanDesc,
    date: detectedDate,
    raw: text
  }
}

export function AddExpenseModal({ open, onOpenChange, onSuccess }: AddExpenseModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [magicInput, setMagicInput] = useState("")
  const [magicParsed, setMagicParsed] = useState(false)

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
    if (open) {
      setMagicInput("")
      setMagicParsed(false)
      setFormData({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "UPI",
        notes: "",
        isRecurring: false,
        recurrenceRule: "MONTHLY",
        receiptUrl: ""
      })
    }
  }, [open])

  const handleMagicInputChange = (text: string) => {
    setMagicInput(text)
    const parsed = parseNaturalExpense(text)
    if (parsed && (parsed.amount || parsed.category || parsed.description || parsed.paymentMethod)) {
      setMagicParsed(true)
      setFormData(prev => ({
        ...prev,
        amount: parsed.amount || prev.amount,
        category: parsed.category || prev.category,
        paymentMethod: parsed.paymentMethod || prev.paymentMethod,
        description: parsed.description || prev.description,
        date: parsed.date || prev.date,
        notes: text.trim()
      }))
    } else {
      setMagicParsed(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setCompressing(true)
      const compressed = await compressImageToDataUrl(file)
      setFormData(prev => ({ ...prev, receiptUrl: compressed }))
      notify.success("Receipt Attached", "Photo compressed and ready to save.")
    } catch (err: any) {
      console.error(err)
      notify.error("Image Error", err.message || "Failed to process receipt image")
    } finally {
      setCompressing(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveReceipt = () => {
    setFormData(prev => ({ ...prev, receiptUrl: "" }))
    notify.info("Receipt Removed", "The attached photo was removed.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      notify.error("Invalid Amount", "Please enter an amount greater than 0.")
      return
    }
    if (!formData.category.trim()) {
      notify.error("Category Required", "Please select or enter a category.")
      return
    }
    setLoading(true)

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        notify.success("Expense Added", `₹${parseFloat(formData.amount).toLocaleString()} added to ${formData.category}`)
        onOpenChange(false)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("billbrain:refresh"))
        }
        onSuccess?.()
        router.refresh()
      } else {
        const data = await res.json()
        notify.error("Failed to Add Expense", data.error || "Please try again.")
      }
    } catch (error) {
      console.error("Failed to add expense", error)
      notify.error("Network Error", "Could not connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <span>Add Expense</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Save in your own words, or customize details and attach receipts below.
          </DialogDescription>
        </DialogHeader>

        {/* Magic "In Your Own Words" One-Liner Box */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 p-3 sm:p-3.5 rounded-2xl border border-primary/20 space-y-2 mt-1">
          <div className="flex items-center justify-between">
            <label htmlFor="magicInput" className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Save in your own words (Quick Fill)</span>
            </label>
            {magicInput && (
              <button 
                type="button" 
                onClick={() => {
                  setMagicInput("")
                  setMagicParsed(false)
                }} 
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative">
            <Input
              id="magicInput"
              value={magicInput}
              onChange={(e) => handleMagicInputChange(e.target.value)}
              placeholder="e.g. 350 biryani lunch UPI, or petrol 500 cash..."
              className="bg-background text-sm pr-8 border-primary/30 focus-visible:ring-primary shadow-xs rounded-xl"
              autoFocus
            />
            {magicParsed && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-0.5" title="Auto-filled fields below">
                <Check className="w-4 h-4 stroke-[3]" />
              </span>
            )}
          </div>

          {magicParsed && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> Fields below auto-filled. You can review or edit anytime.
            </p>
          )}

          {/* Quick Examples */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide text-[11px]">
            <span className="text-muted-foreground shrink-0 font-medium">Try:</span>
            {QUICK_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleMagicInputChange(example)}
                className="shrink-0 px-2 py-0.5 rounded-lg bg-background/80 hover:bg-background border border-primary/20 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all text-[11px]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Existing Full Form Fields (Kept 100% Intact) */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold">Amount (INR)</Label>
            <Input 
              id="amount" 
              type="number" 
              step="0.01" 
              required 
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="text-base sm:text-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold">Category</Label>
              <Input 
                id="category" 
                list="category-suggestions"
                required 
                placeholder="e.g. Food, Petrol, Rent..."
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
              <datalist id="category-suggestions">
                {CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod" className="text-xs font-semibold">Payment Method</Label>
              <select 
                id="paymentMethod"
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
          
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
            <Input 
              id="description" 
              placeholder="e.g. Grocery run, Dinner with family"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs font-semibold">Date</Label>
            <Input 
              id="date" 
              type="date" 
              required
              suppressHydrationWarning
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          {/* Notes / User's own words */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground">Notes / Wish Details (Optional)</Label>
            <Input 
              id="notes" 
              placeholder="e.g. Personal notes, who was with you, why you bought it..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="text-xs"
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
              <div className="relative border border-border/60 rounded-xl p-2 bg-muted/20 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={formData.receiptUrl} 
                  alt="Receipt Preview" 
                  className="w-14 h-14 object-cover rounded-lg border border-border/50 shrink-0"
                />
                <div className="text-xs text-muted-foreground truncate flex-1">
                  <p className="font-medium text-foreground truncate">Receipt Attached</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Ready to save</p>
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
                className="w-full border border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 rounded-xl p-3 text-center transition-colors flex items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                {compressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Compressing image...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-muted-foreground" />
                    <span>Upload or take a photo of receipt (optional)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Recurring Schedule Section */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label htmlFor="isRecurring" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Recurring Transaction
              </label>
              <input 
                id="isRecurring"
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {formData.isRecurring && (
              <div className="bg-muted/20 p-3 rounded-xl border border-border/50 space-y-2 animate-in fade-in-50 duration-200">
                <Label htmlFor="recurrenceRule" className="text-xs text-muted-foreground">Repeat Frequency</Label>
                <select
                  id="recurrenceRule"
                  value={formData.recurrenceRule}
                  onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="MONTHLY">Monthly (e.g. Rent, Wi-Fi, Subscriptions)</option>
                  <option value="WEEKLY">Weekly (e.g. Groceries, Allowance)</option>
                  <option value="YEARLY">Yearly (e.g. Annual Insurance, Taxes)</option>
                  <option value="DAILY">Daily (e.g. Daily Transport)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  BillBrain will remind you and automatically log this transaction each billing cycle.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || compressing} className="w-full sm:w-auto font-semibold">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
