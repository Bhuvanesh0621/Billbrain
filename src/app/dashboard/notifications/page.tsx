"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Bell, BellOff } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <p className="text-slate-500">Your recent alerts, anomalies, and insights.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <BellOff className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">You're all caught up!</h2>
          <p className="text-slate-500 max-w-sm mt-1">
            We will notify you here when we detect unusual charges, upcoming due dates, or new savings opportunities.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
