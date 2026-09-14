import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { read } = await req.json()

    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { read }
    })

    return NextResponse.json({ notification })
    
  } catch (error: any) {
    console.error("Notifications Update Error:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.notification.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error("Notifications Delete Error:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}
