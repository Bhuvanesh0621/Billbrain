"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Loader2, 
  UploadCloud, 
  X, 
  RefreshCw, 
  Paperclip, 
  Sparkles, 
  Check, 
  Mic, 
  MicOff, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight,
  Volume2
} from "lucide-react"
import { compressImageToDataUrl } from "@/lib/imageUtils"
import { notify } from "@/components/ui/toast"

interface AddExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  autoStartVoice?: boolean
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

function parseNaturalExpense(input: string, userCategories: string[] = []) {
  if (!input.trim()) return null

  let text = input.trim()
  let detectedAmount = ""
  let detectedPaymentMethod = ""
  let detectedCategory = ""
  let detectedDate = ""

  // 1. Amount detection: look for numbers like "₹500", "500", "500.50", "rs 500", "500rs", "2,500"
  const amountMatch = text.match(/(?:₹|rs\.?|inr|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)(?:\s*(?:rs|inr|rupees?|\/-))?/i)
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

  const lower = text.toLowerCase()

  // 3. User usage adaptive category matching: check user's saved/frequent categories first
  if (userCategories && userCategories.length > 0) {
    for (const customCat of userCategories) {
      if (customCat && new RegExp(`\\b${customCat.toLowerCase()}\\b`, "i").test(lower)) {
        detectedCategory = customCat
        break
      }
    }
  }

  // Fallback to built-in category keywords
  if (!detectedCategory) {
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
    .replace(/(?:₹|rs\.?|inr|rupees?)?\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:rs|inr|rupees?|\/-))?/gi, "")
    .replace(/\b(upi|gpay|google\s*pay|phonepe|paytm|bhim|cash|card|credit\s*card|debit\s*card|net\s*banking|netbanking)\b/gi, "")
    .replace(/\b(yesterday|today|paid|spend|spent|bought|buy|via|using|through|by|with|for|at|rupees|rupee)\b/gi, "")
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

export function AddExpenseModal({ open, onOpenChange, onSuccess, autoStartVoice = false }: AddExpenseModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [magicInput, setMagicInput] = useState("")
  const [magicParsed, setMagicParsed] = useState(false)

  // Voice Assistant states
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [voiceAnalyzed, setVoiceAnalyzed] = useState<any>(null)
  const recognitionRef = useRef<any>(null)

  const [userCategories, setUserCategories] = useState<string[]>([])

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

  // Load user usage habits from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("billbrain_frequent_categories") || "[]")
      if (Array.isArray(saved)) {
        setUserCategories(saved)
      }
    } catch {}
  }, [])

  const handleMagicInputChange = useCallback((text: string) => {
    setMagicInput(text)
    const parsed = parseNaturalExpense(text, userCategories)
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
  }, [userCategories])

  // Stop Speech Recognition safely
  const stopVoiceAssistant = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // Start Speech Recognition
  const startVoiceAssistant = useCallback(() => {
    const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

    if (!SpeechRecognition) {
      notify.info("Voice Not Supported", "Your browser does not support voice speech. You can type in the box instead.")
      return
    }

    // Stop any existing instance
    stopVoiceAssistant()

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = navigator.language || "en-IN"

      recognition.onstart = () => {
        setIsListening(true)
        setVoiceTranscript("")
        setVoiceAnalyzed(null)
      }

      recognition.onresult = (event: any) => {
        let interim = ""
        let final = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript
          } else {
            interim += event.results[i][0].transcript
          }
        }
        const text = final || interim
        if (text) {
          setVoiceTranscript(text)
          setMagicInput(text)
          const parsed = parseNaturalExpense(text, userCategories)
          if (parsed) {
            setVoiceAnalyzed(parsed)
            setFormData(prev => ({
              ...prev,
              amount: parsed.amount || prev.amount,
              category: parsed.category || prev.category,
              paymentMethod: parsed.paymentMethod || prev.paymentMethod,
              description: parsed.description || prev.description,
              date: parsed.date || prev.date,
              notes: text.trim()
            }))
            setMagicParsed(true)
          }
        }
      }

      recognition.onerror = (event: any) => {
        setIsListening(false)
        if (event.error !== "no-speech") {
          notify.error("Voice Error", `Microphone error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e: any) {
      setIsListening(false)
      notify.error("Microphone Access", e.message || "Failed to start microphone.")
    }
  }, [stopVoiceAssistant, userCategories])

  // Reset modal state on open
  useEffect(() => {
    if (open) {
      setMagicInput("")
      setMagicParsed(false)
      setVoiceTranscript("")
      setVoiceAnalyzed(null)
      setIsListening(false)
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

      // Auto start voice if requested
      if (autoStartVoice) {
        setTimeout(() => {
          startVoiceAssistant()
        }, 300)
      }
    } else {
      stopVoiceAssistant()
    }
  }, [open, autoStartVoice, startVoiceAssistant, stopVoiceAssistant])

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
        // Learn user habit: remember frequently used category
        try {
          const current = JSON.parse(localStorage.getItem("billbrain_frequent_categories") || "[]")
          if (!current.includes(formData.category)) {
            const updated = [formData.category, ...current].slice(0, 15)
            localStorage.setItem("billbrain_frequent_categories", JSON.stringify(updated))
          }
        } catch {}

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
      <DialogContent className="sm:max-w-[490px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-bold pr-6">
            <span>Add Expense</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isListening ? stopVoiceAssistant : startVoiceAssistant}
              className={`h-8 px-2.5 rounded-full text-xs font-semibold transition-all ${
                isListening 
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse hover:bg-rose-600" 
                  : "border-primary/30 text-primary hover:bg-primary/10"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5 mr-1" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 mr-1 text-primary" />
                  <span>Voice Note</span>
                </>
              )}
            </Button>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Speak or type in your own words, review details, and save.
          </DialogDescription>
        </DialogHeader>

        {/* Live Voice Listening Indicator */}
        {isListening && (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span>Listening to your voice... Speak naturally</span>
            </div>

            <p className="text-xs text-muted-foreground italic max-w-sm">
              "{voiceTranscript || "e.g. Spent 350 for lunch with friends using Google Pay..."}"
            </p>

            <Button
              type="button"
              size="sm"
              onClick={stopVoiceAssistant}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-7 px-3 rounded-lg"
            >
              Done Speaking
            </Button>
          </div>
        )}

        {/* Voice Auto-Analyzed Preview Card — User Decides! */}
        {voiceAnalyzed && !isListening && (
          <div className="bg-gradient-to-br from-emerald-500/10 via-primary/5 to-background border-2 border-emerald-500/30 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Voice Analyzed Automatically</span>
              </div>
              <button
                type="button"
                onClick={startVoiceAssistant}
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
                title="Speak again"
              >
                <RotateCcw className="w-3 h-3" /> Re-speak
              </button>
            </div>

            {/* Analyzed Pills Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background/80 p-2 rounded-xl border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Amount</span>
                <span className="text-sm font-extrabold text-foreground">
                  ₹{formData.amount || "0.00"}
                </span>
              </div>

              <div className="bg-background/80 p-2 rounded-xl border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Category</span>
                <span className="text-xs font-bold text-primary truncate block">
                  {formData.category || "Unassigned"}
                </span>
              </div>

              <div className="bg-background/80 p-2 rounded-xl border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Method</span>
                <span className="text-xs font-semibold text-foreground truncate block">
                  {formData.paymentMethod || "UPI"}
                </span>
              </div>

              <div className="bg-background/80 p-2 rounded-xl border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Description</span>
                <span className="text-xs font-medium text-foreground truncate block">
                  {formData.description || "Manual Entry"}
                </span>
              </div>
            </div>

            {/* User Decision Action: 1-click confirm or edit below */}
            <div className="pt-1 flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                You decide: Review/edit fields below or save now.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={loading}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />}
                Save Now
              </Button>
            </div>
          </div>
        )}

        {/* Magic "In Your Own Words" One-Liner Box */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 p-3 sm:p-3.5 rounded-2xl border border-primary/20 space-y-2 mt-1">
          <div className="flex items-center justify-between">
            <label htmlFor="magicInput" className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Type or Speak in your own words</span>
            </label>
            {magicInput && (
              <button 
                type="button" 
                onClick={() => {
                  setMagicInput("")
                  setMagicParsed(false)
                  setVoiceAnalyzed(null)
                }} 
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative flex items-center">
            <Input
              id="magicInput"
              value={magicInput}
              onChange={(e) => handleMagicInputChange(e.target.value)}
              placeholder="e.g. 350 biryani lunch UPI, or petrol 500 cash..."
              className="bg-background text-sm pr-16 border-primary/30 focus-visible:ring-primary shadow-xs rounded-xl"
              autoFocus={!autoStartVoice}
            />

            <div className="absolute right-1.5 flex items-center gap-1">
              {/* Mic Trigger inside input */}
              <button
                type="button"
                onClick={isListening ? stopVoiceAssistant : startVoiceAssistant}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? "text-rose-600 bg-rose-500/20 animate-pulse"
                    : "text-muted-foreground hover:text-primary hover:bg-muted"
                }`}
                title="Tap to speak your expense"
              >
                <Mic className="w-4 h-4" />
              </button>

              {magicParsed && (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mr-1" title="Fields auto-filled">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
              )}
            </div>
          </div>

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

        {/* Existing Full Form Fields (User has full edit & decision control) */}
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
                {Array.from(new Set([...userCategories, ...CATEGORIES])).map(c => (
                  <option key={c} value={c} />
                ))}
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

          {/* Notes / Spoken sentence */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground">Notes / Spoken Words</Label>
            <Input 
              id="notes" 
              placeholder="e.g. Full speech transcript or personal notes..."
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
