"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "ta"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "dashboard": "Dashboard",
    "bills": "Bills",
    "analytics": "Analytics",
    "predictions": "Predictions",
    "subscriptions": "Subscriptions",
    "savings": "Savings",
    "calendar": "Calendar",
    "household": "Household",
    "ai_assistant": "BillBrain AI",
    "track_expense": "Track Expense",
    "spent_today": "Spent Today",
    "this_week": "This Week",
    "this_month": "This Month",
    "remaining_budget": "Remaining Budget",
    "daily_limit": "Recommended Daily Limit",
    "good_evening": "Good evening",
    "good_morning": "Good morning",
    "good_afternoon": "Good afternoon",
    "how_money_moving": "Here's how your money is moving today.",
    "quick_add": "Quick Add",
    "recent_transactions": "Recent Transactions",
    "view_all": "View All",
    "no_transactions": "No transactions found.",
    "expense_timeline": "Expense Timeline",
    "daily_spending": "Daily Spending",
  },
  ta: {
    "dashboard": "டேஷ்போர்டு (Dashboard)",
    "bills": "பில்கள் (Bills)",
    "analytics": "பகுப்பாய்வு (Analytics)",
    "predictions": "கணிப்புகள் (Predictions)",
    "subscriptions": "சந்தாக்கள் (Subscriptions)",
    "savings": "சேமிப்பு (Savings)",
    "calendar": "நாட்காட்டி (Calendar)",
    "household": "குடும்பம் (Household)",
    "ai_assistant": "AI உதவியாளர்",
    "track_expense": "செலவைச் சேர் (Add Expense)",
    "spent_today": "இன்று செலவு (Spent Today)",
    "this_week": "இந்த வாரம் (This Week)",
    "this_month": "இந்த மாதம் (This Month)",
    "remaining_budget": "மீதமுள்ள பட்ஜெட்",
    "daily_limit": "தினசரி வரம்பு (Daily Limit)",
    "good_evening": "மாலை வணக்கம்",
    "good_morning": "காலை வணக்கம்",
    "good_afternoon": "மதிய வணக்கம்",
    "how_money_moving": "இன்று உங்கள் பணம் எப்படி நகர்கிறது.",
    "quick_add": "விரைவாகச் சேர்",
    "recent_transactions": "சமீபத்திய பரிவர்த்தனைகள்",
    "view_all": "அனைத்தையும் பார்",
    "no_transactions": "பரிவர்த்தனைகள் ஏதுமில்லை.",
    "expense_timeline": "செலவு காலவரிசை",
    "daily_spending": "தினசரி செலவுகள்",
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    // Run on client side only to prevent hydration mismatches
    const saved = localStorage.getItem("billbrain_lang") as Language
    if (saved && (saved === "en" || saved === "ta")) {
      setTimeout(() => setLanguage(saved), 0)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("billbrain_lang", lang)
  }

  const t = (key: string) => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
