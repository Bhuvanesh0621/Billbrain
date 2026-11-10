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
  Globe
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
  "350 Biryani lunch UPI",
  "Petrol ku 500 cash",
  "Kaikari 250 gpay",
  "Tea snacks 40 cash",
  "பெட்ரோல் 500 ஜிபே",
  "Mobile recharge 299 UPI"
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

  // Word-based number recognition for common Tanglish / Tamil amounts
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

  // 3. User usage adaptive category matching: check user's saved/frequent categories first
  if (userCategories && userCategories.length > 0) {
    for (const customCat of userCategories) {
      if (customCat && new RegExp(`\\b${customCat.toLowerCase()}\\b`, "i").test(lower)) {
        detectedCategory = customCat
        break
      }
    }
  }

  // Fallback to built-in category keywords (English, Tanglish & Tamil)
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

  // 4. Date detection: "yesterday", "today", "innaiku", "nethu", "இன்று", "நேற்று"
  if (/(yesterday|nethu|naethu|நேற்று|நேத்து)/i.test(lower)) {
    const y = new Date()
    y.setDate(y.getDate() - 1)
    detectedDate = y.toISOString().split("T")[0]
  } else if (/(today|innaiku|inniku|இன்று|இன்னைக்கு)/i.test(lower)) {
    detectedDate = new Date().toISOString().split("T")[0]
  }

  // 5. Clean Description: remove numbers, payment words, connectors
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

  // Auto-set voice language if app language is Tamil
  useEffect(() => {
    if (language === "ta") {
      setVoiceLang("ta-IN")
    } else {
      setVoiceLang("en-IN") // en-IN handles Tanglish & Indian English
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
      notify.info("Voice Not Supported", "Your browser does not support voice speech. You can type in Tanglish/Tamil in the box instead.")
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
  }, [stopVoiceAssistant, userCategories, voiceLang])

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
      <DialogContent className="sm:max-w-[500px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold">
              <span>Add Expense</span>
            </DialogTitle>

            <div className="flex items-center gap-1.5">
              {/* Voice Language Selector */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-[11px]">
                <button
                  type="button"
                  onClick={() => setVoiceLang("en-IN")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                    voiceLang === "en-IN"
                      ? "bg-background text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Recognize Tanglish & English"
                >
                  Tanglish
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang("ta-IN")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                    voiceLang === "ta-IN"
                      ? "bg-background text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Recognize தமிழ் (Tamil)"
                >
                  தமிழ்
                </button>
              </div>

              {/* Voice Note Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={isListening ? stopVoiceAssistant : startVoiceAssistant}
                className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all ${
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
                    <span>Voice</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogDescription className="text-xs sm:text-sm">
            Speak or type in English, Tanglish, or தமிழ் — auto-analyzed instantly.
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
              <span>Listening ({voiceLang === 'ta-IN' ? 'தமிழ்' : 'Tanglish / English'})... Speak now</span>
            </div>

            <p className="text-xs text-muted-foreground italic max-w-sm">
              "{voiceTranscript || (voiceLang === 'ta-IN' ? 'எ.கா. பெட்ரோல் 500 ரூபாய் ஜிபே...' : 'e.g. Petrol ku 500 cash, or biryani 350 gpay...')}"
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
                <span>Analyzed from {voiceLang === 'ta-IN' ? 'தமிழ்' : 'Tanglish / English'}</span>
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
                Review/edit fields below, or save now:
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
              <span>English / Tanglish / தமிழ் Quick Note</span>
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
              placeholder="e.g. Petrol ku 500 cash, or 350 biryani UPI, or காய்கறி 200..."
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
                title="Tap to speak in English, Tanglish, or தமிழ்"
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

          {/* Quick Tanglish & Tamil Examples */}
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
