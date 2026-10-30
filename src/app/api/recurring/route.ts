import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { calculateNextDueDate, getDaysDifference } from "@/lib/recurringUtils"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch all recurring expenses for the user
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        isRecurring: true
      },
      orderBy: { date: "desc" }
    })

    const today = new Date()

    const formatted = await Promise.all(
      recurringExpenses.map(async (exp) => {
        // Find the latest child generated instance if any
        const latestInstance = await prisma.expense.findFirst({
          where: {
            userId: user.id,
            notes: { contains: exp.id }
          },
          orderBy: { date: "desc" }
        })

        const baseDate = latestInstance ? new Date(latestInstance.date) : new Date(exp.date)
        const nextDue = calculateNextDueDate(baseDate, exp.recurrenceRule || "MONTHLY")
        const daysDiff = getDaysDifference(nextDue, today)

        return {
          id: exp.id,
          amount: exp.amount,
          category: exp.category,
          description: exp.description || "Recurring Bill",
          paymentMethod: exp.paymentMethod,
          receiptUrl: exp.receiptUrl,
          recurrenceRule: exp.recurrenceRule || "MONTHLY",
          originalDate: exp.date.toISOString(),
          lastLoggedDate: baseDate.toISOString(),
          nextDueDate: nextDue.toISOString(),
          isDue: daysDiff <= 0,
          daysUntilDue: daysDiff
        }
      })
    )

    const totalMonthlyCommitment = formatted.reduce((sum, item) => {
      let monthlyMultiplier = 1
      if (item.recurrenceRule === "WEEKLY") monthlyMultiplier = 4.33
      else if (item.recurrenceRule === "YEARLY") monthlyMultiplier = 1 / 12
      else if (item.recurrenceRule === "DAILY") monthlyMultiplier = 30
      return sum + item.amount * monthlyMultiplier
    }, 0)

    const dueCount = formatted.filter(item => item.isDue).length

    return NextResponse.json({
      items: formatted,
      totalMonthlyCommitment: Math.round(totalMonthlyCommitment),
      dueCount
    })
  } catch (error) {
    console.error("Failed to fetch recurring bills:", error)
    return NextResponse.json({ error: "Failed to fetch recurring items" }, { status: 500 })
  }
}
