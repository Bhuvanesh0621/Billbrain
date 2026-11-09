"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  Search, 
  Loader2, 
  IndianRupee, 
  FileText, 
  Receipt, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  X, 
  Filter, 
  Calendar, 
  CreditCard, 
  Tag, 
  Paperclip, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  Sparkles,
  SlidersHorizontal
} from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { ReceiptModal } from "@/components/expenses/ReceiptModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SearchItem {
  id: string
  rawId: string
  type: "Expense" | "Income"
  title: string
  category: string
  description: string | null
  amount: number
  date: string
  method: string
  paymentMethod: string | null
  notes: string | null
  receiptUrl: string | null
  isRecurring: boolean
  recurrenceRule: string | null
  icon: string
  isIncome: boolean
}

const QUICK_CHIPS = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "UPI",
  "Cash",
  "Rent",
  "Salary",
  "500",
  "1000"
]

function SearchContent() {
  const { t, language } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalIncomes, setTotalIncomes] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [filterType, setFilterType] = useState<"all" | "expenses" | "incomes" | "receipts">("all")
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc")

  // Receipt Modal state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; title: string; subtitle?: string } | null>(null)

  // Sync state if URL query changes externally
  useEffect(() => {
    const qFromUrl = searchParams.get("q") || ""
    if (qFromUrl !== query) {
      setQuery(qFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim()
      if (trimmed) {
        fetchResults(trimmed)
        // Keep URL in sync without full reload
        const newUrl = `/dashboard/search?q=${encodeURIComponent(trimmed)}`
        window.history.replaceState(null, "", newUrl)
      } else {
        setResults([])
        setTotalAmount(0)
        setTotalExpenses(0)
        setTotalIncomes(0)
        window.history.replaceState(null, "", `/dashboard/search`)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const fetchResults = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
        setTotalAmount(data.totalAmount || 0)
        setTotalExpenses(data.totalExpenses || 0)
        setTotalIncomes(data.totalIncomes || 0)
      }
    } catch (error) {
      console.error("Failed to perform search:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenReceipt = (item: SearchItem) => {
    if (!item.receiptUrl) return
    setSelectedReceipt({
      url: item.receiptUrl,
      title: item.title,
      subtitle: `${item.category} • ₹${item.amount.toLocaleString('en-IN')}`
    })
    setReceiptModalOpen(true)
  }

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    let list = [...results]
    if (filterType === "expenses") {
      list = list.filter(item => !item.isIncome)
    } else if (filterType === "incomes") {
      list = list.filter(item => item.isIncome)
    } else if (filterType === "receipts") {
      list = list.filter(item => Boolean(item.receiptUrl))
    }

    list.sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === "amount-desc") return b.amount - a.amount
      if (sortBy === "amount-asc") return a.amount - b.amount
      return 0
    })

    return list
  }, [results, filterType, sortBy])

  const expensesCount = results.filter(i => !i.isIncome).length
  const incomesCount = results.filter(i => i.isIncome).length
  const receiptsCount = results.filter(i => Boolean(i.receiptUrl)).length

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return ""
    }
  }

  return (
    <div className="flex-1 p-3 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">
      {/* Receipt Viewer Modal */}
      <ReceiptModal 
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        receiptUrl={selectedReceipt?.url || null}
        title={selectedReceipt?.title}
        subtitle={selectedReceipt?.subtitle}
      />

      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Financial Search</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("smart_search")}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-xl">
            {language === 'ta' 
              ? "வகை, விளக்கம், குறிப்புகள், தொகை (எ.கா. 500) மற்றும் கட்டண முறையின் அடிப்படையில் உங்கள் அனைத்து பதிவுகளையும் உடனடியாகக் கண்டறியவும்." 
              : "Search across all your saved records by category, notes, exact amount, receipt, or payment method."}
          </p>
        </div>

        {results.length > 0 && (
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50 text-xs">
            <span className="text-muted-foreground font-medium px-2">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-background border border-border/70 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-4 group">
        <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder")}
          className="block w-full pl-11 sm:pl-12 pr-10 py-3 sm:py-3.5 bg-card border-2 border-border/80 focus:border-primary rounded-2xl text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:ring-0 transition-all shadow-xs"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Search Chips */}
      <div className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
        <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-1 mr-1">
          <Tag className="w-3 h-3" /> Quick:
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setQuery(chip)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all shrink-0 ${
              query.toLowerCase() === chip.toLowerCase()
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Filter Tabs when results exist */}
      {results.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-border/60 pb-3">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterType === "all"
                ? "bg-foreground text-background shadow-xs"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.2 rounded-full bg-background/20 text-[10px]">
              {results.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType("expenses")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterType === "expenses"
                ? "bg-rose-500 text-white shadow-xs"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>Expenses</span>
            <span className="px-1.5 py-0.2 rounded-full bg-background/20 text-[10px]">
              {expensesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType("incomes")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterType === "incomes"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>Incomes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-background/20 text-[10px]">
              {incomesCount}
            </span>
          </button>

          {receiptsCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType("receipts")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterType === "receipts"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Paperclip className="w-3 h-3" />
              <span>With Receipts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-background/20 text-[10px]">
                {receiptsCount}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Aggregate Overview Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-primary/10 via-background to-muted/20 border border-primary/20 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Filtered</p>
            <div className="flex items-center text-xl sm:text-2xl font-black text-foreground mt-1">
              <IndianRupee className="h-5 w-5 mr-0.5 text-primary" />
              {totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{filteredResults.length} records matching</p>
          </div>

          <div className="bg-card border border-rose-500/20 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-medium uppercase tracking-wider text-rose-500">Total Expenses</p>
            <div className="flex items-center text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              -₹{totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{expensesCount} expense records</p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-card border border-emerald-500/20 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Incomes</p>
            <div className="flex items-center text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              +₹{totalIncomes.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{incomesCount} income sources</p>
          </div>
        </div>
      )}

      {/* Empty States */}
      {query && !isLoading && results.length === 0 && (
        <div className="text-center py-12 sm:py-16 bg-muted/20 border border-dashed rounded-3xl p-6">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {t("no_records")} "{query}"
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Try searching for another keyword, category (e.g. Food, Fuel, Rent), payment method (Cash, UPI), or exact amount (e.g. 500).
          </p>
        </div>
      )}

      {!query && (
        <div className="text-center py-10 sm:py-14 bg-muted/10 border border-border/50 rounded-3xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Find Anything Saved in BillBrain
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto mb-6">
            Type anything into the search box above to instantly find your records with all notes, receipts, payment modes, and exact timestamps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left text-xs">
            <div className="p-3 rounded-xl bg-card border border-border/60">
              <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <Tag className="w-3.5 h-3.5 text-primary" /> Category & Source
              </span>
              <p className="text-muted-foreground">Find "Food", "Groceries", "Salary", "Petrol", or custom categories.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/60">
              <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Mode & Notes
              </span>
              <p className="text-muted-foreground">Search "UPI", "Cash", "Card", or any specific note you typed.</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/60">
              <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <IndianRupee className="w-3.5 h-3.5 text-amber-500" /> Exact Amounts
              </span>
              <p className="text-muted-foreground">Search "500", "1200", or "25000" to find transactions of that cost.</p>
            </div>
          </div>
        </div>
      )}

      {/* Results List displaying all saved details */}
      {filteredResults.length > 0 && (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-3.5 border-b bg-muted/20 flex items-center justify-between">
            <h3 className="font-semibold text-sm sm:text-base text-foreground">
              {t("matched_items")} ({filteredResults.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Saved Details View
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {filteredResults.map((item, index) => (
              <div 
                key={`${item.type}-${item.id}-${index}`} 
                className="p-4 sm:p-5 hover:bg-muted/30 transition-colors flex flex-col gap-3"
              >
                {/* Top Row: Icon, Title, Badges, Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                      item.isIncome 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      {item.isIncome ? (
                        <ArrowDownToLine className="h-5 w-5" />
                      ) : item.receiptUrl ? (
                        <Receipt className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          item.isIncome 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {item.type}
                        </span>

                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                          {item.category}
                        </span>

                        {item.paymentMethod && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {item.paymentMethod}
                          </span>
                        )}

                        {item.isRecurring && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Recurring
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(item.date)}
                        </span>
                        {formatTime(item.date) && (
                          <>
                            <span>•</span>
                            <span>{formatTime(item.date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount & Receipt Button */}
                  <div className="text-right shrink-0">
                    <p className={`text-base sm:text-lg font-black tracking-tight ${
                      item.isIncome 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-foreground'
                    }`}>
                      {item.isIncome ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                    </p>

                    {item.receiptUrl && (
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md mt-1 transition-colors"
                        title="View Receipt"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: User Notes if saved */}
                {item.notes && (
                  <div className="mt-1 bg-muted/40 border border-border/50 rounded-xl p-2.5 text-xs text-foreground/90 flex items-start gap-2">
                    <span className="text-muted-foreground font-semibold shrink-0">📝 Notes:</span>
                    <p className="whitespace-pre-wrap break-words">{item.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SmartSearchPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
