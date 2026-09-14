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
    const q = searchParams.get("q")?.toLowerCase() || ""

    if (!q) {
      return NextResponse.json({ results: [], totalAmount: 0 })
    }

    // Search Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        OR: [
          { category: { contains: q } },
          { description: { contains: q } },
          { paymentMethod: { contains: q } }
        ]
      },
      orderBy: { date: 'desc' }
    })

    // Search Incomes
    const incomes = await prisma.income.findMany({
      where: {
        userId: user.id,
        OR: [
          { source: { contains: q } }
        ]
      },
      orderBy: { date: 'desc' }
    })

    // Format all results into a unified array
    const results = [
      ...expenses.map(e => ({
        id: `exp-${e.id}`,
        type: 'Expense',
        title: e.description || e.category,
        category: e.category,
        amount: e.amount,
        date: e.date,
        method: e.paymentMethod,
        icon: 'receipt',
        isIncome: false
      })),
      ...incomes.map(i => ({
        id: `inc-${i.id}`,
        type: 'Income',
        title: i.source || 'Manual Entry',
        category: 'Income',
        amount: i.amount,
        date: i.date,
        method: '-',
        icon: 'arrow-down-to-line',
        isIncome: true
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate total amount (Incomes as positive, Expenses as negative... wait, if it's total searched amount maybe they want sum of matching. Let's just sum it all as positive, or keep Incomes positive and Expenses negative for net balance).
    // The previous implementation summed everything up. The user might be searching "Petrol" to see "How much I spent".
    // I will sum them absolute.
    const totalAmount = results.reduce((sum, item) => sum + item.amount, 0)

    return NextResponse.json({ results, totalAmount })
    
  } catch (error: any) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 })
  }
}
