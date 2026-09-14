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

    const lastMessage = messages[messages.length - 1].content.toLowerCase()
    
    // =========================================================================
    // 🧠 BILLBRAIN NLP DEMO ENGINE (No API Key Required)
    // =========================================================================
    
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    let responseText = "I'm currently in **Demo Mode**! I didn't quite catch that, but try asking me about your spending this month, your biggest expense, or your spending on food!"

    // Query 1: Total spending this month (English + Tamil)
    if (lastMessage.includes("total") && (lastMessage.includes("month") || lastMessage.includes("spend panniruken"))) {
      const expenses = await prisma.expense.findMany({ 
        where: { userId: user.id, date: { gte: startOfMonth } } 
      })
      const total = expenses.reduce((acc, curr) => acc + curr.amount, 0)
      
      if (lastMessage.includes("panniruken")) {
        responseText = `Neenga intha month total-ah **₹${total.toLocaleString('en-IN')}** spend pannirukinga across ${expenses.length} transactions.`
      } else {
        responseText = `You have spent a total of **₹${total.toLocaleString('en-IN')}** so far this month across ${expenses.length} transactions.`
      }
    }
    
    // Query 2: Biggest expense ever
    else if (lastMessage.includes("biggest expense") || lastMessage.includes("highest") || lastMessage.includes("maximum")) {
      const biggestExpense = await prisma.expense.findFirst({
        where: { userId: user.id },
        orderBy: { amount: 'desc' }
      })
      if (biggestExpense) {
        responseText = `Your biggest expense on record is **₹${biggestExpense.amount.toLocaleString('en-IN')}** for **${biggestExpense.category}** on ${new Date(biggestExpense.date).toLocaleDateString('en-US')}.\n\n*(Description: ${biggestExpense.description || 'N/A'})*`
      } else {
        responseText = "You don't have any expenses recorded yet!"
      }
    }

    // Query 3: Specific category and payment method (e.g. "food using UPI")
    else if (lastMessage.includes("food") || lastMessage.includes("petrol") || lastMessage.includes("shopping")) {
      const isUpi = lastMessage.includes("upi")
      const isCash = lastMessage.includes("cash")
      
      let category = "Food"
      if (lastMessage.includes("petrol")) category = "Petrol"
      if (lastMessage.includes("shopping")) category = "Shopping"

      const whereClause: any = { 
        userId: user.id, 
        category: { contains: category } 
      }
      
      if (isUpi) whereClause.paymentMethod = { contains: "UPI" }
      if (isCash) whereClause.paymentMethod = { contains: "Cash" }

      const expenses = await prisma.expense.findMany({ where: whereClause })
      const total = expenses.reduce((acc, curr) => acc + curr.amount, 0)
      
      const paymentStr = isUpi ? "using UPI" : isCash ? "using Cash" : "in total"
      
      if (expenses.length > 0) {
        responseText = `You have spent **₹${total.toLocaleString('en-IN')}** on **${category}** ${paymentStr}.\n\n`
        responseText += `### Recent Transactions:\n`
        expenses.slice(0, 3).forEach(e => {
          responseText += `- ₹${e.amount} on ${new Date(e.date).toLocaleDateString()} (${e.description || 'No description'})\n`
        })
      } else {
        responseText = `I couldn't find any expenses for ${category} ${paymentStr}.`
      }
    }

    // Query 4: Find expenses above ₹X
    else if (lastMessage.includes("above") || lastMessage.includes("greater than") || lastMessage.includes(">")) {
      const amountMatch = lastMessage.match(/\d+(?:,\d+)?/);
      if (amountMatch) {
        const amountStr = amountMatch[0].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        
        const expenses = await prisma.expense.findMany({
          where: { userId: user.id, amount: { gt: amount } },
          orderBy: { amount: 'desc' }
        })

        if (expenses.length > 0) {
          responseText = `I found **${expenses.length} expenses** above ₹${amount.toLocaleString('en-IN')}:\n\n`
          expenses.slice(0, 5).forEach(e => {
            responseText += `- **₹${e.amount.toLocaleString('en-IN')}** - ${e.category} (${new Date(e.date).toLocaleDateString()})\n`
          })
        } else {
          responseText = `You have no expenses recorded above ₹${amount.toLocaleString('en-IN')}. Good job keeping costs down!`
        }
      }
    }

    // Query 5: Summary of financial activity
    else if (lastMessage.includes("summary") || lastMessage.includes("overview")) {
      const expenses = await prisma.expense.findMany({ where: { userId: user.id } })
      const incomes = await prisma.income.findMany({ where: { userId: user.id } })
      
      const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0)
      const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0)
      const balance = totalIncome - totalExpense

      responseText = `### 📊 Lifetime Financial Summary\n\n` +
                     `- **Total Income:** ₹${totalIncome.toLocaleString('en-IN')}\n` +
                     `- **Total Expenses:** ₹${totalExpense.toLocaleString('en-IN')}\n` +
                     `- **Net Balance:** ₹${balance.toLocaleString('en-IN')}\n\n` +
                     `You have tracked a total of ${expenses.length} expenses and ${incomes.length} income records.`
    }

    // Return the dynamically generated response
    return NextResponse.json({ reply: responseText })
    
  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
