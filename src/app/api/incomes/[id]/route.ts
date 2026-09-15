import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = await params

    const income = await prisma.income.findUnique({
      where: { id }
    })

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (income.userId !== user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(income)
  } catch (error) {
    console.error("Failed to fetch income:", error)
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    const { id } = await params

    const existingIncome = await prisma.income.findUnique({
      where: { id }
    })

    if (!existingIncome) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    if (existingIncome.userId !== user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { amount, source, date, isRecurring } = body

    const updatedIncome = await prisma.income.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        source: source !== undefined ? source : undefined,
        date: date ? new Date(date) : undefined,
        isRecurring: isRecurring !== undefined ? isRecurring : undefined,
      }
    })

    return NextResponse.json(updatedIncome)
  } catch (error) {
    console.error("Failed to update income:", error)
    return NextResponse.json({ error: "Failed to update income" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    const { id } = await params

    const existingIncome = await prisma.income.findUnique({
      where: { id }
    })

    if (!existingIncome) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    if (existingIncome.userId !== user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.income.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete income:", error)
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 })
  }
}
