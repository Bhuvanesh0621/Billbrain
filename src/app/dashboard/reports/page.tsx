"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IndianRupee, ArrowDownCircle, ArrowUpCircle, Wallet, Loader2, Calendar as CalendarIcon, FileText } from "lucide-react"

export default function ReportsPage() {
  // Default to last 7 days
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)

  const [startDate, setStartDate] = useState(sevenDaysAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  
  const [reportData, setReportData] = useState<{
    summary: { totalExpense: number, totalIncome: number, netBalance: number },
    transactions: any[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [startDate, endDate])

  const fetchReport = async () => {
    if (!startDate || !endDate) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/reports?start=${startDate}&end=${endDate}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      }
    } catch (error) {
      console.error("Failed to fetch report", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Custom Audit Report</h1>
          <p className="text-muted-foreground">Select a date range to review all financial activity.</p>
        </div>

        <div className="flex items-center space-x-3 bg-card border p-2 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground ml-2" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            />
          </div>
          <span className="text-muted-foreground font-medium">to</span>
          <div className="flex items-center space-x-2">
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : reportData ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center">
                  <ArrowDownCircle className="mr-2 h-4 w-4" />
                  Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{reportData.summary.totalIncome.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300 flex items-center">
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  ₹{reportData.summary.totalExpense.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  Net Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${reportData.summary.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  ₹{reportData.summary.netBalance.toLocaleString('en-IN')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="shadow-sm border-muted">
            <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transaction Log</CardTitle>
                <CardDescription>All recorded financial activity between {new Date(startDate).toLocaleDateString()} and {new Date(endDate).toLocaleDateString()}.</CardDescription>
              </div>
              <button 
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + "Date,Type,Category,Description,Amount\n" 
                    + reportData.transactions.map(t => `${new Date(t.date).toLocaleDateString('en-GB')},${t.type},${t.category},${t.description || ''},${t.amount}`).join("\n")
                  const encodedUri = encodeURI(csvContent)
                  const link = document.createElement("a")
                  link.setAttribute("href", encodedUri)
                  link.setAttribute("download", `billbrain_report_${startDate}_to_${endDate}.csv`)
                  document.body.appendChild(link)
                  link.click()
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
              >
                <FileText className="mr-2 h-4 w-4" /> Download CSV
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {reportData.transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No transactions recorded in this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Category / Detail</th>
                        <th className="px-6 py-4 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reportData.transactions.map((t, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-foreground font-medium">
                            {new Date(t.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              t.type === 'Income' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            <span className="font-semibold text-foreground">{t.category}</span>
                            {t.description && <span> — {t.description}</span>}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${
                            t.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                          }`}>
                            {t.type === 'Income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      ) : null}
    </div>
  )
}
