export interface RecurringStatus {
  id: string
  amount: number
  category: string
  description?: string | null
  paymentMethod?: string | null
  receiptUrl?: string | null
  recurrenceRule: string
  originalDate: string
  nextDueDate: string
  isDue: boolean
  daysUntilDue: number
}

/**
 * Calculates the next due date based on the transaction date and recurrence frequency.
 */
export function calculateNextDueDate(startDate: Date, rule: string = "MONTHLY"): Date {
  const next = new Date(startDate)
  const frequency = rule.toUpperCase()

  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1)
      break
    case "WEEKLY":
      next.setDate(next.getDate() + 7)
      break
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1)
      break
    case "MONTHLY":
    default:
      next.setMonth(next.getMonth() + 1)
      break
  }

  return next
}

/**
 * Returns how many days until the given date (negative if past due).
 */
export function getDaysDifference(targetDate: Date, fromDate: Date = new Date()): number {
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime()
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime()
  const diffTime = target - start
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}
