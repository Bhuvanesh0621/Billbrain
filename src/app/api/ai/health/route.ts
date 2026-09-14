import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ status: "error", message: "GEMINI_API_KEY is not set in environment variables." }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Perform a tiny test generation
    const result = await model.generateContent("Say 'OK'")
    const text = result.response.text()

    return NextResponse.json({ 
        status: "success", 
        message: "Gemini API is connected and working!",
        response: text
    })
  } catch (error: any) {
    console.error("AI Health error:", error)
    return NextResponse.json({ 
        status: "error", 
        message: "Failed to connect to Gemini API", 
        error: error.message 
    }, { status: 500 })
  }
}
