"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2, AlertTriangle, CalendarClock, RefreshCw, X, Loader2 } from "lucide-react"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })
    } catch (error) {
      console.error("Failed to mark as read", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(notifications.filter(n => n.id !== id))
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error("Failed to delete", error)
    }
  }

  const getIcon = (title: string, type: string) => {
    if (title.includes("Overdue")) return <AlertTriangle className="h-6 w-6 text-red-500" />
    if (type === "subscription") return <RefreshCw className="h-6 w-6 text-blue-500" />
    if (type === "due_date") return <CalendarClock className="h-6 w-6 text-orange-500" />
    return <Bell className="h-6 w-6 text-primary" />
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Bell className="mr-3 h-8 w-8 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">Smart alerts for bills, subscriptions, and budgets.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/10">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-foreground">You're all caught up!</h3>
          <p className="text-muted-foreground mt-1">No pending alerts or overdue bills right now.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {notifications.map((n) => (
            <Card key={n.id} className={`overflow-hidden transition-all duration-200 border-l-4 ${!n.read ? 'border-l-primary bg-primary/5 shadow-md' : 'border-l-transparent bg-card opacity-70 hover:opacity-100'}`}>
              <CardContent className="p-0">
                <div className="flex items-start p-6">
                  <div className="flex-shrink-0 mr-4 mt-1 bg-background p-2 rounded-full shadow-sm border">
                    {getIcon(n.title, n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-lg font-semibold truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {n.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm ${!n.read ? 'text-foreground' : 'text-muted-foreground'} pr-8`}>
                      {n.message}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    {!n.read && (
                      <Button variant="outline" size="sm" onClick={() => markAsRead(n.id)} className="h-8 text-xs font-semibold">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Read
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(n.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
