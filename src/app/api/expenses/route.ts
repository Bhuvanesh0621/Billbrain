import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
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

    const url = new URL(req.url)
    const limit = url.searchParams.get("limit")
    const category = url.searchParams.get("category")
    const dateFrom = url.searchParams.get("dateFrom")
    const dateTo = url.searchParams.get("dateTo")

    const whereClause: any = { userId: user.id }
    
    if (category) {
      whereClause.category = category
    }

    if (dateFrom || dateTo) {
      whereClause.date = {}
      if (dateFrom) whereClause.date.gte = new Date(dateFrom)
      if (dateTo) whereClause.date.lte = new Date(dateTo)
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Failed to fetch expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const body = await req.json()
    const { amount, category, description, date, paymentMethod, isRecurring, recurrenceRule, notes, receiptUrl } = body

    if (!amount || !category || !date) {
      return NextResponse.json({ error: "Amount, category, and date are required" }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a valid positive number" }, { status: 400 })
    }

    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        amount: Math.round(parsedAmount * 100) / 100,
        category: category.trim(),
        description: description ? description.trim() : null,
        date: parsedDate,
        paymentMethod: paymentMethod ? paymentMethod.trim() : "UPI",
        isRecurring: Boolean(isRecurring),
        recurrenceRule: recurrenceRule || null,
        receiptUrl: receiptUrl || null,
        notes: notes ? notes.trim() : null
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Failed to create expense:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
