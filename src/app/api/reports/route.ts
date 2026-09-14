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

    const { searchParams } = new URL(req.url)
    const startDateParam = searchParams.get("start")
    const endDateParam = searchParams.get("end")

    if (!startDateParam || !endDateParam) {
        return NextResponse.json({ error: "Start and End dates are required" }, { status: 400 })
    }

    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)
    // Extend end date to the end of the day
    endDate.setHours(23, 59, 59, 999)

    const dateFilter = {
      gte: startDate,
      lte: endDate,
    }

    // Fetch Expenses
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id, date: dateFilter },
      orderBy: { date: 'desc' }
    })

    // Fetch Incomes
    const incomes = await prisma.income.findMany({
      where: { userId: user.id, date: dateFilter },
      orderBy: { date: 'desc' }
    })

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
    const netBalance = totalIncome - totalExpense

    // Merge for timeline
    const transactions = [
        ...expenses.map(e => ({
            id: e.id,
            type: "Expense",
            amount: e.amount,
            category: e.category,
            description: e.description,
            date: e.date,
            method: e.paymentMethod
        })),
        ...incomes.map(i => ({
            id: i.id,
            type: "Income",
            amount: i.amount,
            category: "Income",
            description: i.source,
            date: i.date,
            method: "N/A"
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ 
        summary: { totalExpense, totalIncome, netBalance },
        transactions 
    })
    
  } catch (error: any) {
    console.error("Reports API Error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
