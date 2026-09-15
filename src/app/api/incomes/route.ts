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
    
    const income = await prisma.income.create({
      data: {
        amount: parseFloat(body.amount),
        source: body.source,
        date: body.date ? new Date(body.date) : new Date(),
        isRecurring: body.isRecurring || false,
        userId: user.id
      }
    })

    return NextResponse.json(income)
  } catch (error) {
    console.error("Failed to create income:", error)
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 })
  }
}
