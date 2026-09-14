"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, Database, Moon, Sun, Monitor, AlertTriangle } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-8 pb-10 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage your account preferences, appearance, and security.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8 bg-muted/50 p-1 rounded-xl flex flex-wrap h-auto">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <User className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <Moon className="w-4 h-4 mr-2" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <Bell className="w-4 h-4 mr-2" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <Shield className="w-4 h-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
            <Database className="w-4 h-4 mr-2" /> Data & Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50 bg-muted/5 pb-4">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center space-x-6 mb-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                  DU
                </div>
                <div>
                  <Button variant="outline" className="mb-2 shadow-sm">Upload new avatar</Button>
                  <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Demo User" className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="user@example.com" disabled className="bg-muted/50 cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                <Button className="bg-primary hover:bg-primary/90 shadow-sm">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50 bg-muted/5 pb-4">
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>Customize the look and feel of BillBrain.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {mounted && (
                  <>
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'}`}
                    >
                      <Sun className="h-8 w-8 mb-3 text-amber-500" />
                      <span className="font-medium text-foreground">Light Mode</span>
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'}`}
                    >
                      <Moon className="h-8 w-8 mb-3 text-indigo-400" />
                      <span className="font-medium text-foreground">Dark Mode</span>
                    </button>
                    <button 
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 hover:bg-muted/30'}`}
                    >
                      <Monitor className="h-8 w-8 mb-3 text-slate-500" />
                      <span className="font-medium text-foreground">System Default</span>
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50 bg-muted/5 pb-4">
              <CardTitle>Regional & Currency</CardTitle>
              <CardDescription>Set your local currency format and region.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="currency">Default Currency</Label>
                <Select defaultValue="inr">
                  <SelectTrigger id="currency" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="usd">US Dollar ($)</SelectItem>
                    <SelectItem value="eur">Euro (€)</SelectItem>
                    <SelectItem value="gbp">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4 border-t border-border/50">
                <Button className="shadow-sm">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50 bg-muted/5 pb-4">
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input id="current" type="password" placeholder="••••••••" className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input id="new" type="password" placeholder="••••••••" className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input id="confirm" type="password" placeholder="••••••••" className="bg-muted/30" />
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                <Button className="shadow-sm">Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-destructive/30 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-destructive"></div>
            <CardHeader className="bg-destructive/5 pb-4 border-b border-destructive/10">
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-foreground/70">Export or delete your data permanently.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 bg-background">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-border/50 rounded-xl bg-muted/20">
                <div className="mb-4 sm:mb-0">
                  <p className="font-medium text-foreground">Export Account Data</p>
                  <p className="text-sm text-muted-foreground mt-1">Download all your bills, insights, and settings as a CSV.</p>
                </div>
                <Button variant="outline" className="shrink-0 shadow-sm">Export Data</Button>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-destructive/20 rounded-xl bg-destructive/5">
                <div className="mb-4 sm:mb-0">
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <Button variant="destructive" className="shrink-0 shadow-sm">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
