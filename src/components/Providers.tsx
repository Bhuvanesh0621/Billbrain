"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./theme/theme-provider"

import { LanguageProvider } from "@/components/providers/LanguageProvider"
import { Toaster } from "@/components/ui/toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
