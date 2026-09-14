import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const [expenses, budgets] = await Promise.all([
      prisma.expense.findMany({ where: { userId: user.id } }),
      prisma.budget.findMany({ where: { userId: user.id } })
    ])

    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const currentMonthExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth)
    const spentThisMonth = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0)
    
    // Calculate total budget
    const overallBudget = budgets.find(b => b.category === "Overall")?.amount || 0
    const TOTAL_BUDGET = overallBudget > 0 ? overallBudget : budgets.reduce((acc, curr) => acc + curr.amount, 0) || 30000

    const percentage = (spentThisMonth / TOTAL_BUDGET) * 100
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const currentDay = today.getDate()
    const expectedPercentage = (currentDay / daysInMonth) * 100

    const insights = []

    // 1. Budget Pace Insight
    if (percentage > expectedPercentage + 10) {
      insights.push({
        id: "insight-1",
        type: "anomaly",
        severity: "high",
        confidence: 0.9,
        message: `You have used ${Math.round(percentage)}% of your monthly budget, but we are only ${Math.round(expectedPercentage)}% through the month. Your spending pace is high.`
      })
    } else if (percentage < expectedPercentage - 10) {
      insights.push({
        id: "insight-2",
        type: "saving",
        severity: "low",
        confidence: 0.85,
        message: `Great job! You have only spent ${Math.round(percentage)}% of your budget so far. You are pacing well to save money this month.`
      })
    } else {
      insights.push({
        id: "insight-3",
        type: "prediction",
        severity: "low",
        confidence: 0.95,
        message: `You are exactly on track with your budget. You've spent ₹${spentThisMonth.toLocaleString()} of your ₹${TOTAL_BUDGET.toLocaleString()} limit.`
      })
    }

    // 2. Category Anomaly Insight (find highest spending category)
    const categoryTotals = currentMonthExpenses.reduce((acc: any, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})

    let highestCat = ""
    let highestAmt = 0
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if ((amt as number) > highestAmt) {
        highestAmt = amt as number
        highestCat = cat
      }
    }

    if (highestCat) {
      insights.push({
        id: "insight-4",
        type: "anomaly",
        severity: "medium",
        confidence: 0.8,
        message: `${highestCat} is your highest expense category this month at ₹${highestAmt.toLocaleString()}.`
      })
    }

    // Combine with DB stored insights (like bills)
    const storedInsights = await prisma.aiInsight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 2
    })

    return NextResponse.json([...insights, ...storedInsights])
  } catch (error) {
    console.error("Failed to fetch insights:", error)
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 })
  }
}
