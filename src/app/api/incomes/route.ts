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

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const incomes = await prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" }
    })

    return NextResponse.json(incomes)
  } catch (error) {
    console.error("Failed to fetch incomes:", error)
    return NextResponse.json({ error: "Failed to fetch incomes" }, { status: 500 })
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

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await req.json()
    const { amount, source, date, isRecurring } = body

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Income amount must be a positive number" }, { status: 400 })
    }

    let parsedDate = new Date()
    if (date) {
      parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
      }
    }
    
    const income = await prisma.income.create({
      data: {
        amount: Math.round(parsedAmount * 100) / 100,
        source: source ? source.trim() : "Manual Entry",
        date: parsedDate,
        isRecurring: Boolean(isRecurring),
        userId: user.id
      }
    })

    return NextResponse.json(income, { status: 201 })
  } catch (error) {
    console.error("Failed to create income:", error)
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 })
  }
}
