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

    const expense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (expense.userId !== user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Failed to fetch expense:", error)
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 })
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

    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    if (existingExpense.userId !== user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { amount, category, description, date, paymentMethod, isRecurring, recurrenceRule, notes, receiptUrl } = body

    const updateData: any = {
      category,
      description,
      paymentMethod,
      isRecurring: isRecurring !== undefined ? isRecurring : undefined,
      recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : undefined,
      notes
    }

    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (date !== undefined) updateData.date = new Date(date)
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl || null

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Failed to update expense:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
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

    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    if (existingExpense.userId !== user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.expense.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete expense:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
