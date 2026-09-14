"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, IndianRupee, FileText, Receipt, RefreshCw, ArrowDownToLine } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function SmartSearchPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchResults(query)
      } else {
        setResults([])
        setTotalAmount(0)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [query])

  const fetchResults = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results)
        setTotalAmount(data.totalAmount)
      }
    } catch (error) {
      console.error("Failed to search", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'receipt': return <Receipt className="h-5 w-5 text-blue-500" />
      case 'arrow-down-to-line': return <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
      default: return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">{t("smart_search")}</h1>
        <p className="text-muted-foreground text-lg">
          {t("instantly_find")}
        </p>
      </div>

      <div className="relative mb-12 shadow-sm group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder")}
          className="block w-full pl-12 pr-4 py-4 bg-background border-2 border-muted rounded-2xl text-lg focus:ring-0 focus:border-primary transition-colors"
          autoFocus
        />
      </div>

      {query && !isLoading && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">{t("no_records")} "{query}".</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-3xl p-8 flex flex-col items-center justify-center shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">{t("total_amount")}</p>
            <div className="flex items-center text-5xl font-black text-primary">
              <IndianRupee className="h-10 w-10 mr-1" />
              {totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-muted-foreground mt-2">{t("aggregated_from")} {results.length} {t("matched_items")}</p>
          </div>

          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="font-semibold text-lg">{t("matched_items")}</h3>
            </div>
            <div className="divide-y">
              {results.map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="flex items-center p-6 hover:bg-muted/30 transition-colors">
                  <div className="h-12 w-12 rounded-full bg-background border flex items-center justify-center shadow-sm mr-4 flex-shrink-0">
                    {getIcon(item.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate text-foreground">{item.title}</p>
                    <div className="flex items-center mt-1 space-x-2 text-sm text-muted-foreground">
                      <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${item.isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-secondary text-secondary-foreground'}`}>
                        {item.type}
                      </span>
                      <span>•</span>
                      <span className="truncate">{item.category}</span>
                      <span>•</span>
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${item.isIncome ? 'text-emerald-600' : 'text-foreground'}`}>
                      {item.isIncome ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {item.method || 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
