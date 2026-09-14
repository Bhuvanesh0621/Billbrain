"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown, FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="text-slate-500">Generate and download financial reports.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-indigo-600" />
              Monthly Bill Report
            </CardTitle>
            <CardDescription>Comprehensive breakdown of expenses, anomalies, and AI savings insights for the current month.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-emerald-600" />
              Annual Tax Summary
            </CardTitle>
            <CardDescription>Categorized list of deductible bills (like internet or rent if applicable) for tax preparation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              <FileDown className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
