import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ status: "error", message: "GEMINI_API_KEY is not set in environment variables." }, { status: 500 })
    }

    const isOAuth = apiKey.startsWith("AQ.")
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    }

    let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    if (isOAuth) {
      headers["Authorization"] = `Bearer ${apiKey}`
    } else {
      url += `?key=${apiKey}`
    }

    const payload = {
      contents: [{ role: "user", parts: [{ text: "Say 'OK'" }] }],
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

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response"

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
