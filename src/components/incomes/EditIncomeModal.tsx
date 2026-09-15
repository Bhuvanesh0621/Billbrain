"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IndianRupee, Loader2 } from "lucide-react"

export interface IncomeItem {
  id: string
  amount: number
  source: string
  date: string
}

interface EditIncomeModalProps {
  income: IncomeItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditIncomeModal({ 
  income, 
  open, 
  onOpenChange,
  onSuccess
}: EditIncomeModalProps) {
  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("")
  const [date, setDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (income) {
      setAmount(income.amount ? income.amount.toString() : "")
      setSource(income.source || "")
      setDate(income.date ? new Date(income.date).toISOString().split('T')[0] : "")
    }
  }, [income, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!income || !amount || isNaN(Number(amount))) return
    
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/incomes/${income.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: Number(amount), 
          source: source || "Manual Entry",
          date: date || new Date().toISOString()
        })
      })
      
      if (res.ok) {
        onOpenChange(false)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("billbrain:refresh"))
        }
        onSuccess?.()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to update income")
      }
    } catch (error) {
      console.error("Failed to update income", error)
      alert("Failed to update income due to a network error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Income</DialogTitle>
          <DialogDescription>
            Modify incoming funds to update your balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-income-amount">Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-income-amount"
                type="number"
                placeholder="0.00"
                className="pl-9"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-income-source">Source (How it came)</Label>
            <Input
              id="edit-income-source"
              placeholder="e.g. Salary, Dad, Sold Phone..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-income-date">Date</Label>
            <Input
              id="edit-income-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
