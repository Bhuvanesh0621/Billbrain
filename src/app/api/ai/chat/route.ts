import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI, FunctionDeclaration, Tool, SchemaType } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy")

const queryDatabaseDeclaration: FunctionDeclaration = {
  name: "query_database",
  description: "Queries the user's financial database (Expenses, Incomes, Budgets). Use this to fetch required data to answer the user's question.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      tables: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING, enum: ["Expense", "Income", "Budget"] },
        description: "The database tables to query. You can query multiple tables at once."
      },
      startDate: {
        type: SchemaType.STRING,
        description: "Optional. Filter records from this date onwards (ISO format YYYY-MM-DD)."
      },
      endDate: {
        type: SchemaType.STRING,
        description: "Optional. Filter records up to this date (ISO format YYYY-MM-DD)."
      },
      category: {
        type: SchemaType.STRING,
        description: "Optional. Filter by a specific category (e.g., Food, Transport)."
      },
      paymentMethod: {
        type: SchemaType.STRING,
        description: "Optional. Filter by a specific payment method (e.g., UPI, Cash)."
      }
    },
    required: ["tables"]
  }
}

const dbTool: Tool = {
  functionDeclarations: [queryDatabaseDeclaration]
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

    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("dummy")) {
      return NextResponse.json({ 
        reply: "Hello! I am the Universal BillBrain AI Assistant. To query your live database, please ensure a valid GEMINI_API_KEY is configured in your environment variables!" 
      })
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [dbTool],
      systemInstruction: `You are the Universal BillBrain AI Assistant. You have direct access to the user's financial database via the 'query_database' tool. 
- You MUST use the 'query_database' tool to fetch data before answering any question about their spending, income, or budgets.
- Answer accurately based ONLY on the data returned by the tool. If the data is empty, explicitly state that no records were found.
- You must support queries in English, Tamil, and Tanglish. Reply in the same language the user uses.
- Format responses beautifully in markdown with bullet points and bold text where appropriate.`
    })

    const formattedHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    const chat = model.startChat({ history: formattedHistory })
    const lastMessage = messages[messages.length - 1].content

    // 1. Send the user's message to the model
    let result;
    try {
      result = await chat.sendMessage(lastMessage)
    } catch (e: any) {
      console.error("Gemini API Error:", e)
      return NextResponse.json({ reply: "I encountered an error connecting to my AI brain. Please check your API key." })
    }
    
    let responseText = ""
    
    // 2. Check if the model wants to call a function
    const functionCalls = result.response.functionCalls()
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]
      if (call.name === "query_database") {
        const { tables, startDate, endDate, category, paymentMethod } = call.args as any
        
        let fetchedData: any = {}
        
        // Build Prisma where clause
        const whereClause: any = { userId: user.id }
        if (startDate || endDate) {
          whereClause.date = {}
          if (startDate) whereClause.date.gte = new Date(startDate)
          if (endDate) whereClause.date.lte = new Date(endDate)
        }
        if (category) whereClause.category = { contains: category, mode: 'insensitive' }
        if (paymentMethod) whereClause.paymentMethod = { contains: paymentMethod, mode: 'insensitive' }

        // Execute queries dynamically based on requested tables
        if (tables.includes("Expense")) {
          fetchedData.expenses = await prisma.expense.findMany({ where: whereClause, orderBy: { date: 'desc' } })
        }
        if (tables.includes("Income")) {
          const incomeWhere = { ...whereClause }
          delete incomeWhere.category // Incomes use 'source' instead of 'category'
          fetchedData.incomes = await prisma.income.findMany({ where: incomeWhere, orderBy: { date: 'desc' } })
        }
        if (tables.includes("Budget")) {
          fetchedData.budgets = await prisma.budget.findMany({ where: { userId: user.id } })
        }

        // 3. Send the database results back to the model so it can formulate an answer
        const functionResponse = await chat.sendMessage([{
          functionResponse: {
            name: "query_database",
            response: fetchedData
          }
        }])
        
        responseText = functionResponse.response.text()
      }
    } else {
      // Model answered without needing to query DB
      responseText = result.response.text()
    }

    return NextResponse.json({ reply: responseText })
    
  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
