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

    // Search Bills
    const bills = await prisma.bill.findMany({
      where: {
        userId: user.id,
        OR: [
          { provider: { contains: q } },
          { category: { contains: q } }
        ]
      },
      orderBy: { dueDate: 'asc' }
    })

    // Search Subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        provider: { contains: q }
      }
    })

    // Format all results into a unified array
    const results = [
      ...expenses.map(e => ({
        id: e.id,
        type: 'Expense',
        title: e.description || e.category,
        category: e.category,
        amount: e.amount,
        date: e.date,
        method: e.paymentMethod,
        icon: 'receipt'
      })),
      ...bills.map(b => ({
        id: b.id,
        type: 'Bill',
        title: b.provider,
        category: b.category,
        amount: b.amount,
        date: b.dueDate || b.createdAt,
        method: b.status,
        icon: 'file-text'
      })),
      ...subscriptions.map(s => ({
        id: s.id,
        type: 'Subscription',
        title: s.provider,
        category: 'Subscription',
        amount: s.amount,
        date: s.nextDueDate || s.createdAt,
        method: s.frequency,
        icon: 'refresh-cw'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate total amount across all matched items
    const totalAmount = results.reduce((sum, item) => sum + item.amount, 0)

    return NextResponse.json({ results, totalAmount })
    
  } catch (error: any) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 })
  }
}
