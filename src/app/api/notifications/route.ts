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

    // --- AUTO-GENERATE NOTIFICATIONS ---
    const today = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(today.getDate() + 3)

    // 1. Check Unpaid Bills due in the next 3 days
    const upcomingBills = await prisma.bill.findMany({
      where: {
        userId: user.id,
        status: "pending",
        dueDate: {
          lte: threeDaysFromNow,
          gte: new Date(today.setHours(0,0,0,0)) // Ignore past due here, we can do a separate check for past due
        }
      }
    })

    for (const bill of upcomingBills) {
      const title = `Upcoming Bill: ${bill.provider}`
      // Check if we already created this notification recently to avoid spam
      const existing = await prisma.notification.findFirst({
        where: { userId: user.id, title, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "due_date",
            title,
            message: `Your bill for ₹${bill.amount} is due on ${bill.dueDate?.toLocaleDateString()}.`
          }
        })
      }
    }

    // 2. Check Overdue Bills
    const overdueBills = await prisma.bill.findMany({
      where: {
        userId: user.id,
        status: "pending",
        dueDate: { lt: new Date() }
      }
    })

    for (const bill of overdueBills) {
      const title = `⚠️ Overdue Bill: ${bill.provider}`
      const existing = await prisma.notification.findFirst({
        where: { userId: user.id, title, createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } } // notify every 3 days
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "due_date",
            title,
            message: `URGENT: Your bill for ₹${bill.amount} was due on ${bill.dueDate?.toLocaleDateString()}!`
          }
        })
      }
    }

    // 3. Subscriptions auto-renewing in next 3 days
    const upcomingSubs = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: "active",
        nextDueDate: {
          lte: threeDaysFromNow,
          gte: new Date(today.setHours(0,0,0,0))
        }
      }
    })

    for (const sub of upcomingSubs) {
      const title = `Subscription Renewal: ${sub.provider}`
      const existing = await prisma.notification.findFirst({
        where: { userId: user.id, title, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      })
      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "subscription",
            title,
            message: `Your ${sub.provider} subscription will auto-renew for ₹${sub.amount} on ${sub.nextDueDate?.toLocaleDateString()}.`
          }
        })
      }
    }

    // --- FETCH ALL NOTIFICATIONS ---
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false }
    })

    return NextResponse.json({ notifications, unreadCount })
    
  } catch (error: any) {
    console.error("Notifications API Error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
