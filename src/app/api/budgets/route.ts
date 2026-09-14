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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: { category: "asc" }
    })

    return NextResponse.json(budgets)
  } catch (error) {
    console.error("Failed to fetch budgets:", error)
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 })
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
    const { category, amount, period } = body

    if (!category || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_period: {
          userId: user.id,
          category,
          period: period || "monthly"
        }
      },
      update: {
        amount: parseFloat(amount)
      },
      create: {
        userId: user.id,
        category,
        amount: parseFloat(amount),
        period: period || "monthly"
      }
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error("Failed to set budget:", error)
    return NextResponse.json({ error: "Failed to set budget" }, { status: 500 })
  }
}
