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
    const rawQ = searchParams.get("q")?.trim() || ""

    if (!rawQ) {
      return NextResponse.json({ 
        results: [], 
        totalAmount: 0, 
        totalExpenses: 0, 
        totalIncomes: 0 
      })
    }

    // Build conditions with case-insensitivity for Postgres
    const expenseOrConditions: any[] = [
      { category: { contains: rawQ, mode: 'insensitive' } },
      { description: { contains: rawQ, mode: 'insensitive' } },
      { paymentMethod: { contains: rawQ, mode: 'insensitive' } },
      { notes: { contains: rawQ, mode: 'insensitive' } }
    ]

    const incomeOrConditions: any[] = [
      { source: { contains: rawQ, mode: 'insensitive' } }
    ]

    // If query is a valid number, also search exact amount match
    const num = Number(rawQ)
    if (!isNaN(num) && num > 0) {
      expenseOrConditions.push({ amount: num })
      incomeOrConditions.push({ amount: num })
    }

    // Search Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        OR: expenseOrConditions
      },
      orderBy: { date: 'desc' }
    })

    // Search Incomes
    const incomes = await prisma.income.findMany({
      where: {
        userId: user.id,
        OR: incomeOrConditions
      },
      orderBy: { date: 'desc' }
    })

    // Format all results into a unified array retaining all saved fields
    const results = [
      ...expenses.map(e => ({
        id: `exp-${e.id}`,
        rawId: e.id,
        type: 'Expense',
        title: e.description || e.category,
        category: e.category,
        description: e.description,
        amount: e.amount,
        date: e.date,
        method: e.paymentMethod || 'Unknown',
        paymentMethod: e.paymentMethod,
        notes: e.notes,
        receiptUrl: e.receiptUrl,
        isRecurring: e.isRecurring,
        recurrenceRule: e.recurrenceRule,
        icon: e.receiptUrl ? 'receipt' : 'file-text',
        isIncome: false
      })),
      ...incomes.map(i => ({
        id: `inc-${i.id}`,
        rawId: i.id,
        type: 'Income',
        title: i.source || 'Manual Entry',
        category: 'Income',
        description: null,
        amount: i.amount,
        date: i.date,
        method: 'Direct Deposit',
        paymentMethod: 'Direct Deposit',
        notes: null,
        receiptUrl: null,
        isRecurring: i.isRecurring,
        recurrenceRule: null,
        icon: 'arrow-down-to-line',
        isIncome: true
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const totalExpenses = results.filter(r => !r.isIncome).reduce((sum, item) => sum + item.amount, 0)
    const totalIncomes = results.filter(r => r.isIncome).reduce((sum, item) => sum + item.amount, 0)
    const totalAmount = results.reduce((sum, item) => sum + item.amount, 0)

    return NextResponse.json({ 
      results, 
      totalAmount,
      totalExpenses,
      totalIncomes,
      count: results.length 
    })
    
  } catch (error: any) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 })
  }
}
