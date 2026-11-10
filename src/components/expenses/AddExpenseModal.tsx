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
  IndianRupee,
  Calendar,
  CreditCard,
  Tag
} from "lucide-react"
import { compressImageToDataUrl } from "@/lib/imageUtils"
import { notify } from "@/components/ui/toast"
import { useLanguage } from "@/components/providers/LanguageProvider"

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
  "350 Biryani UPI",
  "Petrol ku 500 cash",
  "Kaikari 250 gpay",
  "Tea 40 cash",
  "பெட்ரோல் 500 ஜிபே"
]

function parseNaturalExpense(input: string, userCategories: string[] = []) {
  if (!input.trim()) return null

  let text = input.trim()
  let detectedAmount = ""
  let detectedPaymentMethod = ""
  let detectedCategory = ""
  let detectedDate = ""

  // 1. Amount detection: numbers with Rs, ₹, rooba, roova, kaasu, panam, ரூபாய்
  const amountMatch = text.match(/(?:₹|rs\.?|inr|rupees?|rooba|roova|kaasu|panam|ரூபாய்|ரூ\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)(?:\s*(?:rs|inr|rupees?|rooba|roova|kaasu|panam|ரூபாய்|ரூ|\/-))?/i)
  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/,/g, "")
    const num = parseFloat(rawNum)
    if (!isNaN(num) && num > 0) {
      detectedAmount = rawNum
    }
  }

  // Word-based numbers in Tanglish / Tamil
  const lower = text.toLowerCase()
  if (!detectedAmount) {
    if (/\b(aayiram|ஆயிரம்)\b/i.test(lower)) detectedAmount = "1000"
    else if (/\b(ainooru|ஐநூறு)\b/i.test(lower)) detectedAmount = "500"
    else if (/\b(irunooru|இருநூறு)\b/i.test(lower)) detectedAmount = "200"
    else if (/\b(nooru|நூறு)\b/i.test(lower)) detectedAmount = "100"
    else if (/\b(ambathu|ஐம்பது)\b/i.test(lower)) detectedAmount = "50"
  }

  // 2. Payment method detection (English, Tanglish, Tamil)
  if (/(?:via|using|through|by|with|la)?\s*(upi|gpay|google\s*pay|phonepe|paytm|bhim|online|online\s*la|ஜிபே|கூகுள்\s*பே|யுபிஐ)/i.test(text)) {
    detectedPaymentMethod = "UPI"
  } else if (/(?:via|using|through|by|with|la)?\s*(cash|hand\s*cash|kai\s*kaasu|kaasu|kaasa|panam|panama|ரொக்கம்|பணம்|கை\s*காசு)/i.test(text)) {
    detectedPaymentMethod = "Cash"
  } else if (/(?:via|using|through|by|with|la)?\s*(card|credit\s*card|debit\s*card|pos|swipe|கார்டு|அட்டை)/i.test(text)) {
    detectedPaymentMethod = "Card"
  } else if (/(?:via|using|through|by|with|la)?\s*(net\s*banking|netbanking|bank\s*transfer|neft|imps|account\s*la|வங்கி)/i.test(text)) {
    detectedPaymentMethod = "Net Banking"
  }

  // 3. Category matching (User custom > Built-in > Tanglish/Tamil)
  if (userCategories && userCategories.length > 0) {
    for (const customCat of userCategories) {
      if (customCat && new RegExp(`\\b${customCat.toLowerCase()}\\b`, "i").test(lower)) {
        detectedCategory = customCat
        break
      }
    }
  }

  if (!detectedCategory) {
    if (/(petrol|fuel|diesel|gasoline|cng|vandi\s*petrol|bike\s*petrol|car\s*petrol|பெட்ரோல்|டீசல்|எரிபொருள்|வண்டி)/i.test(lower)) {
      detectedCategory = "Petrol"
    } else if (/(food|lunch|dinner|breakfast|biryani|briyani|pizza|burger|snack|snacks|tea|chai|coffee|kaapi|restaurant|hotel|swiggy|zomato|cafe|dosa|idli|meals|parotta|sapadu|saapadu|sappadu|kudichen|saaptom|saapten|tiffin|சாப்பாடு|உணவு|தேநீர்|காபி|ஹோட்டல்|டிபன்)/i.test(lower)) {
      detectedCategory = "Food"
    } else if (/(groceries|grocery|vegetable|vegetables|fruits|milk|paal|dmart|d-mart|supermarket|rice|arisi|provision|kirana|kaikari|kaaikari|maligai|maligai\s*saman|veetuku\s*saman|kadai|மளிகை|காய்கறி|பால்|பழங்கள்|அரிசி)/i.test(lower)) {
      detectedCategory = "Groceries"
    } else if (/(shopping|dress|clothes|shirt|pant|shoes|amazon|flipkart|myntra|zara|thuni|seruppu|vaanginen|துணி|ஆடைகள்|ஷாப்பிங்)/i.test(lower)) {
      detectedCategory = "Shopping"
    } else if (/(electricity|eb\s*bill|current\s*bill|tneb|power|eb\s*kattinen|current\s*kattinen|மின்சாரம்|மின்\s*கட்டணம்|மின்வாரி)/i.test(lower)) {
      detectedCategory = "Electricity"
    } else if (/(internet|wifi|broadband|fiber|act|airtel\s*fiber|jio\s*fiber|inthaneyam|இணையம்|வைஃபை)/i.test(lower)) {
      detectedCategory = "Internet"
    } else if (/(mobile|recharge|jio|airtel|vi|phone\s*bill|recharge\s*panninen|ரீசார்ஜ்|மொபைல்|செல்போன்)/i.test(lower)) {
      detectedCategory = "Mobile"
    } else if (/(insurance|lic|health\s*insurance|term\s*insurance|kaappidu|காப்பீடு)/i.test(lower)) {
      detectedCategory = "Insurance"
    } else if (/(emi|loan|mortgage|credit\s*card\s*bill|kadan|vatti|thavanai|கடன்|வட்டி|தவணை)/i.test(lower)) {
      detectedCategory = "EMI / Loans"
    } else if (/(education|school|college|fees|tuition|books|stationery|course|exam|padippu|kalvi|fees\s*kattinen|கல்வி|கல்லூரி|பள்ளி|கட்டணம்)/i.test(lower)) {
      detectedCategory = "Education"
    } else if (/(healthcare|hospital|medicine|medical|doctor|pharmacy|clinic|tablets|apollo|marunthu|maruthuvam|மருந்து|மருத்துவம்|மருத்துவர்|மருத்துவமனை)/i.test(lower)) {
      detectedCategory = "Healthcare"
    } else if (/(travel|trip|flight|train|irctc|bus|cab|taxi|uber|ola|auto|flight|toll|fastag|ooruku|oorukku|payanam|டிக்கெட்|பயணம்|ஆட்டோ|பேருந்து|ரயில்)/i.test(lower)) {
      detectedCategory = "Travel"
    } else if (/(movie|cinema|theatre|film|netflix|prime|hotstar|popcorn|padam|cinema\s*ticket|திரைப்படம்|படம்|சினிமா)/i.test(lower)) {
      detectedCategory = "Personal"
    }
  }

  // 4. Date detection
  if (/(yesterday|nethu|naethu|நேற்று|நேத்து)/i.test(lower)) {
    const y = new Date()
    y.setDate(y.getDate() - 1)
    detectedDate = y.toISOString().split("T")[0]
  } else if (/(today|innaiku|inniku|இன்று|இன்னைக்கு)/i.test(lower)) {
    detectedDate = new Date().toISOString().split("T")[0]
  }

  // 5. Clean Description
  let cleanDesc = text
    .replace(/(?:₹|rs\.?|inr|rupees?|rooba|roova|kaasu|panam|ரூபாய்|ரூ\.?)?\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:rs|inr|rupees?|rooba|roova|kaasu|panam|ரூபாய்|ரூ|\/-))?/gi, "")
    .replace(/\b(upi|gpay|google\s*pay|phonepe|paytm|bhim|cash|card|credit\s*card|debit\s*card|net\s*banking|netbanking|ஜிபே|கூகுள்\s*பே|யுபிஐ|ரொக்கம்|பணம்)\b/gi, "")
    .replace(/\b(yesterday|today|nethu|innaiku|paid|spend|spent|bought|buy|via|using|through|by|with|for|at|rupees|rupee|rooba|roova|ku|la|kattinen|vaanginen|panninen|potten)\b/gi, "")
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
  const { language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [magicInput, setMagicInput] = useState("")
  const [magicParsed, setMagicParsed] = useState(false)

  // Voice Assistant states
  const [isListening, setIsListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState<"en-IN" | "ta-IN">("en-IN")
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const recognitionRef = useRef<any>(null)

  const [showExtras, setShowExtras] = useState(false)
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

  useEffect(() => {
    if (language === "ta") {
      setVoiceLang("ta-IN")
    } else {
      setVoiceLang("en-IN")
    }
  }, [language])

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

  const stopVoiceAssistant = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const startVoiceAssistant = useCallback(() => {
    const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

    if (!SpeechRecognition) {
      notify.info("Voice Input", "Speech recognition not supported in this browser. Please type in the box.")
      return
    }

    stopVoiceAssistant()

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = voiceLang

      recognition.onstart = () => {
        setIsListening(true)
        setVoiceTranscript("")
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
      notify.error("Microphone", e.message || "Failed to start microphone.")
    }
  }, [stopVoiceAssistant, userCategories, voiceLang])

  useEffect(() => {
    if (open) {
      setMagicInput("")
      setMagicParsed(false)
      setVoiceTranscript("")
      setIsListening(false)
      setShowExtras(false)
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

      if (autoStartVoice) {
        setTimeout(() => {
          startVoiceAssistant()
        }, 250)
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      notify.error("Invalid Amount", "Please enter an amount greater than 0.")
      return
    }
    if (!formData.category.trim()) {
      notify.error("Category Required", "Please enter or select a category.")
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
      <DialogContent className="sm:max-w-[430px] p-4 sm:p-5 max-h-[90vh] overflow-y-auto rounded-2xl">
        {/* Compact Header */}
        <DialogHeader className="pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              Add Expense
            </DialogTitle>
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[10px]">
              <button
                type="button"
                onClick={() => setVoiceLang("en-IN")}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  voiceLang === "en-IN"
                    ? "bg-background text-primary font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tanglish
              </button>
              <button
                type="button"
                onClick={() => setVoiceLang("ta-IN")}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  voiceLang === "ta-IN"
                    ? "bg-background text-primary font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Sleek Smart Input Bar (Voice + Magic in one neat line) */}
        <div className="pt-1 space-y-1.5">
          <div className={`relative flex items-center rounded-xl border transition-all ${
            isListening 
              ? "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20" 
              : "border-primary/30 bg-primary/5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:bg-background"
          }`}>
            <button
              type="button"
              onClick={isListening ? stopVoiceAssistant : startVoiceAssistant}
              className={`p-2 transition-transform active:scale-90 ${
                isListening ? "text-rose-600 animate-pulse" : "text-primary hover:text-primary/80"
              }`}
              title={isListening ? "Stop listening" : "Tap to speak your expense"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={isListening ? voiceTranscript || "Listening... speak now" : magicInput}
              onChange={(e) => handleMagicInputChange(e.target.value)}
              placeholder="e.g. 350 biryani UPI, or Petrol ku 500 cash..."
              className="w-full bg-transparent text-xs sm:text-sm py-2 pr-7 focus:outline-none placeholder:text-muted-foreground"
              autoFocus={!autoStartVoice}
            />

            {(magicInput || magicParsed) && !isListening && (
              <button
                type="button"
                onClick={() => {
                  setMagicInput("")
                  setMagicParsed(false)
                }}
                className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clean Quick Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide text-[10px]">
            <span className="text-muted-foreground shrink-0 font-medium">Try:</span>
            {QUICK_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => handleMagicInputChange(ex)}
                className="shrink-0 px-2 py-0.5 rounded-md bg-muted/40 hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Clean, Comfortable Form Grid */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Row 1: Amount & Category */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="amount" className="text-[11px] font-semibold text-muted-foreground">Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="pl-6 h-9 text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="category" className="text-[11px] font-semibold text-muted-foreground">Category</Label>
              <Input 
                id="category" 
                list="category-suggestions"
                required 
                placeholder="e.g. Food, Petrol..."
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="h-9 text-xs sm:text-sm"
              />
              <datalist id="category-suggestions">
                {Array.from(new Set([...userCategories, ...CATEGORIES])).map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 2: Payment Method & Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="paymentMethod" className="text-[11px] font-semibold text-muted-foreground">Payment Method</Label>
              <select 
                id="paymentMethod"
                className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.paymentMethod} 
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="date" className="text-[11px] font-semibold text-muted-foreground">Date</Label>
              <Input 
                id="date" 
                type="date" 
                required
                suppressHydrationWarning
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="h-9 text-xs"
              />
            </div>
          </div>
          
          {/* Row 3: Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-[11px] font-semibold text-muted-foreground">Description</Label>
            <Input 
              id="description" 
              placeholder="e.g. Grocery run or Lunch with friends"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="h-9 text-xs"
            />
          </div>

          {/* Optional Extras (Receipt & Recurring) - Neat compact collapsible */}
          <div className="pt-1 border-t border-border/40">
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowExtras(!showExtras)}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>{showExtras ? "Hide Extra Details" : "+ Attach Receipt / Recurring"}</span>
              </button>

              {formData.receiptUrl && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Receipt Attached
                </span>
              )}
            </div>

            {showExtras && (
              <div className="mt-2.5 space-y-2.5 p-2.5 rounded-xl bg-muted/20 border border-border/50 animate-in fade-in-50 text-xs">
                {/* Notes */}
                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-[10px] font-semibold text-muted-foreground">Notes / Spoken Memo</Label>
                  <Input 
                    id="notes" 
                    placeholder="e.g. Memo details or speech transcript..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Receipt Upload */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={compressing}
                    >
                      <Paperclip className="w-3 h-3 mr-1" />
                      {formData.receiptUrl ? "Change Receipt" : "Attach Photo"}
                    </Button>
                    {formData.receiptUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveReceipt}
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Recurring Check */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-[11px] font-medium text-muted-foreground">Recurring</span>
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="pt-1">
                    <select
                      value={formData.recurrenceRule}
                      onChange={(e) => setFormData({ ...formData, recurrenceRule: e.target.value })}
                      className="h-7 w-full rounded border border-input bg-background px-2 text-[11px]"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="YEARLY">Yearly</option>
                      <option value="DAILY">Daily</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <DialogFooter className="pt-2 flex flex-row items-center justify-end gap-2 border-t border-border/40">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm"
              disabled={loading || compressing} 
              className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
