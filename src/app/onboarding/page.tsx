"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
    else handleFinish()
  }

  const handleFinish = async () => {
    setLoading(true)
    // Normally we'd save these preferences to the user profile here via an API
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {step === 1 && "Welcome to BillBrain"}
            {step === 2 && "Select your categories"}
            {step === 3 && "Notification preferences"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Let's set up your account preferences."}
            {step === 2 && "What types of bills do you want to track?"}
            {step === 3 && "How would you like to be notified?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select defaultValue="in">
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">India</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select defaultValue="inr">
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inr">INR (₹)</SelectItem>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="target">Monthly spending target (Optional)</Label>
                <Input id="target" type="number" placeholder="e.g. 50000" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              {['Electricity', 'Water', 'Gas', 'Mobile', 'Internet', 'Rent', 'Insurance', 'Credit Card', 'Subscriptions', 'Other'].map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox id={category} defaultChecked={['Electricity', 'Mobile', 'Internet'].includes(category)} />
                  <label htmlFor={category} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {[
                { id: "due", label: "Due-date reminders", desc: "Get notified before a bill is due." },
                { id: "unusual", label: "Unusual bill alerts", desc: "Alerts when a bill is higher than average." },
                { id: "subs", label: "Subscription alerts", desc: "Notifications for recurring payments." },
                { id: "savings", label: "Savings insights", desc: "Automated recommendations to save money." }
              ].map((notif) => (
                <div key={notif.id} className="flex items-start space-x-3 space-y-0">
                  <Checkbox id={notif.id} defaultChecked />
                  <div className="space-y-1 leading-none">
                    <label htmlFor={notif.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {notif.label}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {notif.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1 || loading}>
            Back
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleNext} disabled={loading}>
            {loading ? "Finishing..." : step === 3 ? "Complete Setup" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
