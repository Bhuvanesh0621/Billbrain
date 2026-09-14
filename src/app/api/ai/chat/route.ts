import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

    // 1. API Key Validation
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.startsWith("AQ.")) {
      return NextResponse.json({ 
        reply: "⚠️ **Invalid API Key Detected!**\n\nI need a valid Google Gemini API Key to become fully intelligent and answer *any* database question dynamically.\n\nYou provided an OAuth Access Token (`AQ...`) instead of an API Key.\n\n**To fix this:**\n1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)\n2. Click 'Create API Key'\n3. Copy the key (it starts with `AIzaSy...`)\n4. Paste it in your `.env` file as `GEMINI_API_KEY=AIzaSy...`\n5. Restart the server!" 
      })
    }

    // 2. Fetch all user data to feed as Context (RAG)
    const [expenses, incomes, budgets] = await Promise.all([
      prisma.expense.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } }),
      prisma.income.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } }),
      prisma.budget.findMany({ where: { userId: user.id } })
    ])

    // Compress data into CSV format for Token efficiency
    const expenseData = expenses.map(e => `${new Date(e.date).toISOString().split('T')[0]},${e.amount},${e.category},${e.paymentMethod || 'Unknown'},${e.description || 'none'}`).join('\n')
    const incomeData = incomes.map(i => `${new Date(i.date).toISOString().split('T')[0]},${i.amount},${i.source}`).join('\n')
    const budgetData = budgets.map(b => `${b.category},${b.amount},${b.period}`).join('\n')

    const systemPrompt = `You are BillBrain AI, a highly intelligent financial assistant. 
You have direct access to the user's personal financial database records.
Analyze the provided data and answer the user's question accurately.
Do NOT mention that you are reading CSV data. Just act like a smart agent that knows their database.
Format your response beautifully using markdown (bolding, lists, tables).
You understand English, Tamil, and Tanglish. If the user asks in Tanglish/Tamil, reply in the same format.

Here is the user's database records:

--- EXPENSES (Date, Amount, Category, Payment Method, Description) ---
${expenseData || 'No expenses recorded yet.'}

--- INCOMES (Date, Amount, Source) ---
${incomeData || 'No incomes recorded yet.'}

--- BUDGETS (Category, Amount, Period) ---
${budgetData || 'No budgets set.'}

USER QUESTION: "${userMessage}"
`

    // 3. Generate Answer using Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent(systemPrompt)
    const reply = result.response.text()

    return NextResponse.json({ reply })
    
  } catch (error: any) {
    console.error("AI Chat error:", error)
    
    // Handle specific Google API Errors gracefully
    if (error.message?.includes("API key not valid")) {
      return NextResponse.json({ reply: "⚠️ **Invalid API Key!** Your GEMINI_API_KEY is not recognized by Google. Please get a new one from Google AI Studio and update your `.env` file." })
    }

    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
