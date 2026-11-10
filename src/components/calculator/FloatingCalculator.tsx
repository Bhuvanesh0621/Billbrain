"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Calculator, 
  X, 
  Copy, 
  Check, 
  Delete, 
  Percent
} from "lucide-react"

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false)
  const [display, setDisplay] = useState("0")
  const [equation, setEquation] = useState("")
  const [hasEvaluated, setHasEvaluated] = useState(false)
  const [copied, setCopied] = useState(false)
  const calcRef = useRef<HTMLDivElement>(null)

  // Safe arithmetic evaluator
  const safeEvaluate = (expr: string): string => {
    try {
      const sanitized = expr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/[^0-9+\-*/.%]/g, "")

      if (!sanitized) return "0"
      const withPercents = sanitized.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
      const result = new Function(`"use strict"; return (${withPercents})`)()

      if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
        return "Error"
      }
      return parseFloat(result.toFixed(6)).toString()
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
      if (prev === "0" || prev === "Error") return digit
      if (prev.length >= 12) return prev
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
      if (hasEvaluated || prev === "Error" || prev.length <= 1) return "0"
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
    setTimeout(() => setCopied(false), 1500)
  }

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
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
      {/* Sleek, Comfortable FAB */}
      <div className="fixed bottom-20 right-3.5 md:bottom-5 md:right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
            isOpen
              ? "bg-foreground text-background rotate-90 scale-95"
              : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-primary/20"
          }`}
          title={isOpen ? "Close Calculator" : "Calculator"}
          aria-label="Calculator"
        >
          {isOpen ? (
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>
      </div>

      {/* Comfortable, Professional Calculator Window */}
      {isOpen && (
        <div 
          ref={calcRef}
          className="fixed bottom-32 right-3.5 md:bottom-18 md:right-5 z-50 w-[240px] sm:w-[255px] bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/50 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Calculator className="w-3.5 h-3.5 text-primary" />
              <span>Calc</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                disabled={display === "Error"}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Copy result"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Display */}
          <div className="p-3 bg-muted/15 border-b border-border/40 text-right">
            <div className="text-[10px] font-medium text-muted-foreground h-3.5 overflow-hidden text-ellipsis whitespace-nowrap">
              {equation || "\u00A0"}
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate mt-0.5">
              {display}
            </div>
          </div>

          {/* Keypad */}
          <div className="p-2.5 grid grid-cols-4 gap-1.5 bg-card">
            <button
              type="button"
              onClick={handleClear}
              className="h-8.5 sm:h-9 rounded-lg bg-muted/70 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all active:scale-95"
            >
              AC
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-8.5 sm:h-9 rounded-lg bg-muted/70 hover:bg-muted text-foreground font-semibold text-xs transition-all active:scale-95 flex items-center justify-center"
              title="Backspace"
            >
              <Delete className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handlePercent}
              className="h-8.5 sm:h-9 rounded-lg bg-muted/70 hover:bg-muted text-foreground font-semibold text-xs transition-all active:scale-95 flex items-center justify-center"
            >
              <Percent className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleOperator("÷")}
              className="h-8.5 sm:h-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
            >
              ÷
            </button>

            <button
              type="button"
              onClick={() => handleDigit("7")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleDigit("8")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleDigit("9")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleOperator("×")}
              className="h-8.5 sm:h-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
            >
              ×
            </button>

            <button
              type="button"
              onClick={() => handleDigit("4")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleDigit("5")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleDigit("6")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleOperator("-")}
              className="h-8.5 sm:h-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
            >
              -
            </button>

            <button
              type="button"
              onClick={() => handleDigit("1")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleDigit("2")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleDigit("3")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleOperator("+")}
              className="h-8.5 sm:h-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
            >
              +
            </button>

            <button
              type="button"
              onClick={() => handleDigit("0")}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDecimal}
              className="h-8.5 sm:h-9 rounded-lg bg-background hover:bg-muted border border-border/50 text-foreground font-semibold text-sm transition-all active:scale-95"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="h-8.5 sm:h-9 rounded-lg bg-muted/50 hover:bg-muted text-foreground font-medium text-[11px] transition-all active:scale-95 flex items-center justify-center"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleEquals}
              className="h-8.5 sm:h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all active:scale-95 shadow-sm flex items-center justify-center"
            >
              =
            </button>
          </div>
        </div>
      )}
    </>
  )
}
