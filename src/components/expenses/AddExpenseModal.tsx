"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

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
  "UPI", "Cash"
]

export function AddExpenseModal({ open, onOpenChange, onSuccess }: AddExpenseModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
    paymentMethod: "UPI",
    notes: ""
  })

  useEffect(() => {
    if (open) {
      setFormData({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "UPI",
        notes: ""
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onOpenChange(false)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("billbrain:refresh"))
        }
        onSuccess?.()
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to add expense")
      }
    } catch (error) {
      console.error("Failed to add expense", error)
      alert("Failed to add expense due to a network error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Track a new expense to update your dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (INR)</Label>
            <Input 
              id="amount" 
              type="number" 
              step="0.01" 
              required 
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="text-lg font-medium"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input 
                id="category" 
                list="category-suggestions"
                required 
                placeholder="e.g. Food, Taxi..."
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
              <datalist id="category-suggestions">
                {CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
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
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              placeholder="e.g. Lunch at Cafe"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date" 
              required
              suppressHydrationWarning
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
