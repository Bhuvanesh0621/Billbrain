import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import nodemailer from "nodemailer"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || !user.email) return NextResponse.json({ error: "User or email not found" }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const { start, end } = body

    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const startDate = start ? new Date(start) : thirtyDaysAgo
    const endDate = end ? new Date(end) : today
    endDate.setHours(23, 59, 59, 999)

    const dateFilter = {
      gte: startDate,
      lte: endDate,
    }

    // Fetch user expenses and incomes
    const [expenses, incomes] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: user.id, date: dateFilter },
        orderBy: { date: "desc" }
      }),
      prisma.income.findMany({
        where: { userId: user.id, date: dateFilter },
        orderBy: { date: "desc" }
      })
    ])

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
    const netBalance = totalIncome - totalExpense

    // Group expenses by category
    const categoryTotals = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const topExpenses = [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const timeframeStr = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`

    // Generate HTML Email Template
    const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
        .header { background: linear-gradient(135deg, #6d28d9, #4f46e5); padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
        .content { padding: 24px; }
        .summary-grid { display: table; width: 100%; margin-bottom: 24px; }
        .summary-col { display: table-cell; width: 33.33%; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center; }
        .summary-col.middle { border-left: 8px solid transparent; border-right: 8px solid transparent; }
        .stat-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
        .stat-val { font-size: 18px; font-weight: 700; }
        .income-val { color: #10b981; }
        .expense-val { color: #f43f5e; }
        .balance-val { color: ${netBalance >= 0 ? '#38bdf8' : '#f43f5e'}; }
        .section-title { font-size: 16px; font-weight: 700; margin: 24px 0 12px; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
        th { text-align: left; padding: 10px; color: #94a3b8; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.1); }
        td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1; }
        .text-right { text-align: right; }
        .badge { background: rgba(109,40,217,0.2); color: #a78bfa; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .footer { background: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BillBrain</h1>
          <p>Financial Audit Summary &bull; ${timeframeStr}</p>
        </div>
        <div class="content">
          <p style="margin-top: 0; color: #cbd5e1; font-size: 14px;">Hello <strong>${user.name || "there"}</strong>, here is your requested financial summary:</p>
          
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="width: 32%; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 14px; text-align: center;">
                <div class="stat-label">Total Income</div>
                <div class="stat-val income-val">&#8377;${totalIncome.toLocaleString("en-IN")}</div>
              </td>
              <td style="width: 2%;"></td>
              <td style="width: 32%; background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2); border-radius: 12px; padding: 14px; text-align: center;">
                <div class="stat-label">Total Spent</div>
                <div class="stat-val expense-val">&#8377;${totalExpense.toLocaleString("en-IN")}</div>
              </td>
              <td style="width: 2%;"></td>
              <td style="width: 32%; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.2); border-radius: 12px; padding: 14px; text-align: center;">
                <div class="stat-label">Net Balance</div>
                <div class="stat-val balance-val">&#8377;${netBalance.toLocaleString("en-IN")}</div>
              </td>
            </tr>
          </table>

          <div class="section-title">Top Spending Categories</div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th class="text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              ${topCategories.length === 0 ? '<tr><td colspan="2" style="text-align: center; color: #64748b;">No expenses recorded</td></tr>' : topCategories.map(([cat, amt]) => `
                <tr>
                  <td><span class="badge">${cat}</span></td>
                  <td class="text-right" style="font-weight: 600; color: #f8fafc;">&#8377;${amt.toLocaleString("en-IN")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Recent Top Transactions</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category / Note</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${topExpenses.length === 0 ? '<tr><td colspan="3" style="text-align: center; color: #64748b;">No expenses recorded</td></tr>' : topExpenses.map(e => `
                <tr>
                  <td>${new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td><strong>${e.category}</strong>${e.description ? ` &bull; <span style="color: #94a3b8;">${e.description}</span>` : ''}</td>
                  <td class="text-right" style="color: #f43f5e; font-weight: 700;">-&#8377;${e.amount.toLocaleString("en-IN")}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding: 14px; background: rgba(109,40,217,0.1); border: 1px solid rgba(109,40,217,0.2); border-radius: 10px; font-size: 13px; color: #cbd5e1;">
            💡 <strong>Smart Financial Insight:</strong> ${
              netBalance >= 0 
                ? `You saved &#8377;${netBalance.toLocaleString("en-IN")} in this period! Keep up the disciplined spending.`
                : `Your expenses exceeded income by &#8377;${Math.abs(netBalance).toLocaleString("en-IN")}. Review your top categories to optimize your budget.`
            }
          </div>
        </div>
        <div class="footer">
          Sent securely by <strong>BillBrain</strong> to ${user.email}.<br>
          Your smart AI financial management dashboard.
        </div>
      </div>
    </body>
    </html>
    `

    // SMTP Configuration
    let transporter: nodemailer.Transporter

    if (process.env.SMTP_SERVER && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVER,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      })
    } else {
      // Fallback: Generate an ephemeral Ethereal testing transporter
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"BillBrain" <notifications@billbrain.app>',
      to: user.email,
      subject: `📊 Your BillBrain Financial Report (${timeframeStr})`,
      html: htmlEmail,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info as any)

    return NextResponse.json({
      success: true,
      message: `Financial report emailed to ${user.email}`,
      previewUrl: previewUrl || null
    })

  } catch (error: any) {
    console.error("Email report error:", error)
    return NextResponse.json({ 
      error: error?.message || "Failed to send email report" 
    }, { status: 500 })
  }
}
