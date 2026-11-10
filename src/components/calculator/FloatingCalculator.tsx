"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Calculator, 
  X, 
  Copy, 
  Check, 
  Delete, 
  Percent, 
  Minus, 
  Plus, 
  Equal,
  RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false)
  const [display, setDisplay] = useState("0")
  const [equation, setEquation] = useState("")
  const [hasEvaluated, setHasEvaluated] = useState(false)
  const [copied, setCopied] = useState(false)
  const calcRef = useRef<HTMLDivElement>(null)

  // Safe arithmetic evaluator (avoids unsafe eval)
  const safeEvaluate = (expr: string): string => {
    try {
      // Clean and sanitize expression: only allow numbers, operators, decimals, spaces
      const sanitized = expr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/[^0-9+\-*/.%]/g, "")

      if (!sanitized) return "0"

      // Handle percentage: e.g. "500 * 18%" -> "500 * 0.18"
      const withPercents = sanitized.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")

      // Evaluate safely with Function constructor with restricted scope
      const result = new Function(`"use strict"; return (${withPercents})`)()

      if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
        return "Error"
      }

      // Format clean decimals: maximum 8 decimals without trailing zeros
      const formatted = parseFloat(result.toFixed(8)).toString()
      return formatted
    } catch {
      return "Error"
    }
  }

  const handleDigit = useCallback((digit: string) => {
    setDisplay((prev) => {
      if (hasEvaluated) {
        setHasEvaluated(false)
        setEquation("")
        return digit
      }
      if (prev === "0" || prev === "Error") {
        return digit
      }
      // Max 14 digits to fit on display
      if (prev.length >= 14) return prev
      return prev + digit
    })
  }, [hasEvaluated])

  const handleDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (hasEvaluated) {
        setHasEvaluated(false)
        setEquation("")
        return "0."
      }
      if (prev.includes(".")) return prev
      return prev + "."
    })
  }, [hasEvaluated])

  const handleOperator = useCallback((op: string) => {
    setHasEvaluated(false)
    const currentNum = display === "Error" ? "0" : display

    setEquation((prevEq) => {
      if (hasEvaluated) {
        return `${currentNum} ${op} `
      }
      if (prevEq && prevEq.trim().endsWith(op)) {
        return prevEq
      }
      // If there's an existing equation, evaluate running total or append
      if (prevEq) {
        const fullExpr = `${prevEq}${currentNum}`
        const intermediate = safeEvaluate(fullExpr)
        if (intermediate !== "Error") {
          setDisplay(intermediate)
          return `${intermediate} ${op} `
        }
      }
      return `${currentNum} ${op} `
    })

    setDisplay("0")
  }, [display, hasEvaluated])

  const handlePercent = useCallback(() => {
    setDisplay((prev) => {
      const num = parseFloat(prev)
      if (isNaN(num)) return "0"
      return (num / 100).toString()
    })
  }, [])

  const handleClear = useCallback(() => {
    setDisplay("0")
    setEquation("")
    setHasEvaluated(false)
  }, [])

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (hasEvaluated || prev === "Error" || prev.length <= 1) {
        return "0"
      }
      return prev.slice(0, -1)
    })
  }, [hasEvaluated])

  const handleEquals = useCallback(() => {
    if (!equation) return
    const fullExpr = `${equation}${display}`
    const result = safeEvaluate(fullExpr)

    setEquation(`${fullExpr} =`)
    setDisplay(result)
    setHasEvaluated(true)
  }, [equation, display])

  const handleCopy = () => {
    if (display === "Error") return
    navigator.clipboard.writeText(display)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Keyboard navigation support while calculator is open
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing inside an input or textarea
      const target = e.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === ".") {
        e.preventDefault()
        handleDecimal()
      } else if (e.key === "+") {
        e.preventDefault()
        handleOperator("+")
      } else if (e.key === "-") {
        e.preventDefault()
        handleOperator("-")
      } else if (e.key === "*") {
        e.preventDefault()
        handleOperator("×")
      } else if (e.key === "/") {
        e.preventDefault()
        handleOperator("÷")
      } else if (e.key === "%") {
        e.preventDefault()
        handlePercent()
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault()
        handleEquals()
      } else if (e.key === "Backspace") {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setIsOpen(false)
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleDigit, handleDecimal, handleOperator, handlePercent, handleEquals, handleBackspace, handleClear])

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`h-12 w-12 sm:h-13 sm:w-13 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            isOpen
              ? "bg-foreground text-background rotate-90 scale-100"
              : "bg-primary text-primary-foreground hover:bg-primary/95 hover:scale-105 active:scale-95 ring-4 ring-primary/20"
          }`}
          title={isOpen ? "Close Calculator" : "Quick Calculator"}
          aria-label={isOpen ? "Close Calculator" : "Quick Calculator"}
        >
          {isOpen ? (
            <X className="h-5 w-5 sm:h-6 sm:w-6 transition-transform" />
          ) : (
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6 transition-transform" />
          )}
        </button>
      </div>

      {/* Floating Calculator Window */}
      {isOpen && (
        <div 
          ref={calcRef}
          className="fixed bottom-36 right-4 md:bottom-22 md:right-6 z-50 w-[280px] sm:w-[300px] bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Calculator className="w-3.5 h-3.5 text-primary" />
              <span>BillBrain Calc</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                disabled={display === "Error"}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copy result"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Calculator Display Screen */}
          <div className="p-4 bg-muted/20 border-b border-border/40 text-right">
            <div className="text-[11px] font-medium text-muted-foreground h-4 overflow-hidden text-ellipsis whitespace-nowrap">
              {equation || "\u00A0"}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate mt-1">
              {display}
            </div>
          </div>

          {/* Keypad Grid */}
          <div className="p-3 grid grid-cols-4 gap-2 bg-card">
            {/* Row 1 */}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-muted/70 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-sm transition-all active:scale-95"
            >
              AC
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-muted/70 hover:bg-muted text-foreground font-semibold text-sm transition-all active:scale-95 flex items-center justify-center"
              title="Backspace"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePercent}
              className="h-11 rounded-xl bg-muted/70 hover:bg-muted text-foreground font-semibold text-sm transition-all active:scale-95 flex items-center justify-center"
            >
              <Percent className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOperator("÷")}
              className="h-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-base transition-all active:scale-95 flex items-center justify-center"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => handleDigit("7")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleDigit("8")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleDigit("9")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleOperator("×")}
              className="h-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-base transition-all active:scale-95 flex items-center justify-center"
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => handleDigit("4")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleDigit("5")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleDigit("6")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleOperator("-")}
              className="h-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-base transition-all active:scale-95 flex items-center justify-center"
            >
              -
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => handleDigit("1")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleDigit("2")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleDigit("3")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleOperator("+")}
              className="h-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-base transition-all active:scale-95 flex items-center justify-center"
            >
              +
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={() => handleDigit("0")}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDecimal}
              className="h-11 rounded-xl bg-background hover:bg-muted border border-border/50 text-foreground font-bold text-base transition-all active:scale-95 shadow-2xs"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="h-11 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-medium text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
              title="Copy result"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px]">Copy</span>
            </button>
            <button
              type="button"
              onClick={handleEquals}
              className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-lg transition-all active:scale-95 shadow-md flex items-center justify-center"
            >
              =
            </button>
          </div>
        </div>
      )}
    </>
  )
}
