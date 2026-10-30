import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { calculateNextDueDate, getDaysDifference } from "@/lib/recurringUtils"

export const dynamic = "force-dynamic"

export async function POST() {
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

    // Fetch recurring items
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        isRecurring: true
      }
    })

    const today = new Date()
    const processed: any[] = []

    for (const exp of recurringExpenses) {
      // Find latest child instance if any
      const latestInstance = await prisma.expense.findFirst({
        where: {
          userId: user.id,
          notes: { contains: exp.id }
        },
        orderBy: { date: "desc" }
      })

      const baseDate = latestInstance ? new Date(latestInstance.date) : new Date(exp.date)
      const nextDue = calculateNextDueDate(baseDate, exp.recurrenceRule || "MONTHLY")
      const daysDiff = getDaysDifference(nextDue, today)

      // If next due is today or in the past, process the new cycle
      if (daysDiff <= 0) {
        // Double check not to create multiple entries for the same day
        const alreadyCreatedToday = await prisma.expense.findFirst({
          where: {
            userId: user.id,
            notes: { contains: exp.id },
            date: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
          }
        })

        if (!alreadyCreatedToday) {
          const newExpense = await prisma.expense.create({
            data: {
              userId: user.id,
              amount: exp.amount,
              category: exp.category,
              description: exp.description ? `${exp.description} (Recurring)` : "Recurring Payment",
              paymentMethod: exp.paymentMethod || "UPI",
              date: today,
              isRecurring: false,
              receiptUrl: exp.receiptUrl,
              notes: `Auto-logged recurring cycle (Ref: ${exp.id})`
            }
          })
          processed.push(newExpense)
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: processed.length,
      processed
    })
  } catch (error) {
    console.error("Failed to process recurring bills:", error)
    return NextResponse.json({ error: "Failed to process recurring bills" }, { status: 500 })
  }
}
