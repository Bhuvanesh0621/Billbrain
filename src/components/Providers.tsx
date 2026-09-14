"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./theme/theme-provider"

import { LanguageProvider } from "@/components/providers/LanguageProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
