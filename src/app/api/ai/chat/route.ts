import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

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

    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    const userMessage = messages[messages.length - 1].content

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        reply: "⚠️ **Missing API Key!** Please add your GEMINI_API_KEY to your `.env` file." 
      })
    }

    const [expenses, incomes, budgets, bills, subscriptions, payments] = await Promise.all([
      prisma.expense.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } }),
      prisma.income.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } }),
      prisma.budget.findMany({ where: { userId: user.id } }),
      prisma.bill.findMany({ where: { userId: user.id }, include: { items: true }, orderBy: { dueDate: 'asc' } }),
      prisma.subscription.findMany({ where: { userId: user.id } }),
      prisma.payment.findMany({ 
        where: { bill: { userId: user.id } },
        include: { bill: true },
        orderBy: { paymentDate: 'desc' }
      })
    ])

    const expenseData = expenses.map(e => `${new Date(e.date).toISOString().split('T')[0]},${e.amount},${e.category},${e.paymentMethod || 'Unknown'},${e.description || 'none'}`).join('\n')
    const incomeData = incomes.map(i => `${new Date(i.date).toISOString().split('T')[0]},${i.amount},${i.source}`).join('\n')
    const budgetData = budgets.map(b => `${b.category},${b.amount},${b.period}`).join('\n')
    const billData = bills.map(b => `${b.id},${b.provider},${b.category},${b.amount},${b.status},${b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : 'None'}`).join('\n')
    const subData = subscriptions.map(s => `${s.provider},${s.amount},${s.frequency},${s.status},${s.nextDueDate ? new Date(s.nextDueDate).toISOString().split('T')[0] : 'None'}`).join('\n')
    const payData = payments.map(p => `${new Date(p.paymentDate).toISOString().split('T')[0]},${p.amount},${p.method || 'Unknown'},${p.status},For Bill: ${p.bill.provider}`).join('\n')

    const systemPrompt = `You are BillBrain AI, a highly intelligent financial assistant. 
You have direct access to the user's personal financial database records.
Analyze the provided data and answer the user's question accurately.

CRITICAL RULES:
1. Do NOT invent or hallucinate data. Only use the data provided below.
2. If the user asks for information not present in the data, clearly state that it is unavailable.
3. Perform all necessary math (sums, averages) accurately based on the data.
4. Format your response beautifully using markdown (bolding, lists, tables).
5. Do NOT mention that you are reading CSV data. Act like a smart agent querying a database.
6. You understand English, Tamil, and Tanglish. If the user asks in Tanglish/Tamil, reply in the same format.

--- EXPENSES (Date, Amount, Category, Payment Method, Description) ---
${expenseData || 'No expenses recorded yet.'}

--- INCOMES (Date, Amount, Source) ---
${incomeData || 'No incomes recorded yet.'}

--- BUDGETS (Category, Amount, Period) ---
${budgetData || 'No budgets set.'}

--- BILLS (ID, Provider, Category, Amount, Status, Due Date) ---
${billData || 'No bills recorded yet.'}

--- SUBSCRIPTIONS (Provider, Amount, Frequency, Status, Next Due Date) ---
${subData || 'No subscriptions recorded yet.'}

--- PAYMENTS (Date, Amount, Method, Status, Bill Provider) ---
${payData || 'No payments recorded yet.'}

USER QUESTION: "${userMessage}"
`

    // Generate Answer using Native Fetch to support AQ.-prefixed Keys (NOT treated as OAuth)
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    }

    const payload = {
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: { temperature: 0.2 }
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(JSON.stringify(data))
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I processed your request but could not generate a response."

    return NextResponse.json({ reply })
    
  } catch (error: any) {
    console.error("AI Chat error:", error)
    return NextResponse.json({ error: "Failed to generate AI response", details: error.message }, { status: 500 })
  }
}
