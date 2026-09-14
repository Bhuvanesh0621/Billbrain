"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Sparkles, Calendar as CalendarIcon, Target, TrendingUp, IndianRupee, Wallet, CheckCircle2, ArrowUpRight, ArrowDownRight, Plus, Loader2, Receipt } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { LiveClock } from "@/components/dashboard/LiveClock"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenses, setExpenses] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [incomes, setIncomes] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [resExpenses, resBudgets, resInsights, resIncomes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/budgets"),
        fetch("/api/insights"),
        fetch("/api/incomes")
      ])
      if (resExpenses.ok) setExpenses(await resExpenses.json())
      if (resBudgets.ok) setBudgets(await resBudgets.json())
      if (resInsights.ok) setInsights(await resInsights.json())
      if (resIncomes.ok) setIncomes(await resIncomes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const today = new Date()
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const currentMonthExpenses = expenses
    .filter(e => new Date(e.date) >= startOfMonth)
    
  const currentWeekExpenses = expenses
    .filter(e => new Date(e.date) >= startOfWeek)

  const currentMonthIncomes = incomes
    .filter(i => new Date(i.date) >= startOfMonth)
    
  const totalIncomeThisMonth = currentMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0)

  const currentMonthBudget = budgets
    .filter(b => b.period === 'monthly')
    .reduce((acc, curr) => acc + curr.amount, 0)
    
  const todayExpensesList = expenses.filter(e => new Date(e.date).toDateString() === today.toDateString())

  const spentToday = todayExpensesList.reduce((acc, curr) => acc + curr.amount, 0)
  const spentThisWeek = currentWeekExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  const spentThisMonth = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0)

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - today.getDate()
  
  // Balance calculation
  const remainingBalance = totalIncomeThisMonth > 0 ? (totalIncomeThisMonth - spentThisMonth) : 0
  const recommendedDaily = daysLeft > 0 ? remainingBalance / daysLeft : remainingBalance
  const spentPercentage = totalIncomeThisMonth > 0 ? (spentThisMonth / totalIncomeThisMonth) * 100 : 0

  const dailyData = currentMonthExpenses.reduce((acc: any, e) => {
    const d = new Date(e.date)
    const day = d.getDate()
    acc[day] = (acc[day] || 0) + e.amount
    return acc
  }, {})

  const chartData = Array.from({ length: today.getDate() }, (_, i) => ({
    name: `${i + 1}`,
    amount: dailyData[i + 1] || 0
  }))

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // 1. Professional Header Background
    doc.setFillColor(109, 40, 217); // Premium Purple
    doc.rect(0, 0, 210, 40, 'F');
    
    // 2. Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("BILLBRAIN", 14, 22);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Monthly Financial Report", 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 130, 30);
    
    // Reset Text Color for Body
    doc.setTextColor(40, 40, 40);

    // 3. Financial Summary at the Top
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, 55);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Income:  INR ${totalIncomeThisMonth.toLocaleString('en-US')}`, 14, 65);
    doc.text(`Total Spent:   INR ${spentThisMonth.toLocaleString('en-US')}`, 14, 72);
    
    doc.setFont("helvetica", "bold");
    const balanceColor = remainingBalance >= 0 ? [34, 197, 94] : [239, 68, 68];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(`Net Balance:   INR ${remainingBalance.toLocaleString('en-US')}`, 14, 79);
    doc.setTextColor(40, 40, 40); // reset
    
    // 4. Clean Table Data (Fixing Unicode / Tamil Characters)
    // jsPDF standard fonts only support ASCII. We must strip Unicode to prevent mangled strings like '¹'
    const safeText = (str: string) => (str || '').replace(/[^\x20-\x7E]/g, '').trim() || '-';

    const tableData = [
      ...incomes.map(i => [
        new Date(i.date).toLocaleDateString('en-US'),
        "Income",
        safeText(i.source || 'General'),
        "-",
        `+ INR ${i.amount.toLocaleString('en-US')}`
      ]),
      ...expenses.map(e => [
        new Date(e.date).toLocaleDateString('en-US'),
        "Expense",
        safeText(e.category || 'General'),
        safeText(e.description || '-'),
        `- INR ${e.amount.toLocaleString('en-US')}`
      ])
    ];

    // 5. Render Beautiful Table
    autoTable(doc, {
      startY: 90,
      head: [['Date', 'Type', 'Category / Source', 'Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 250] },
      styles: { fontSize: 10, cellPadding: 5, textColor: [60, 60, 60] },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // 6. Footer
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("End of report. Generated securely by BillBrain AI.", 14, finalY + 15);

    doc.save(`billbrain_financial_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center space-x-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading dashboard...</span>
      </div>
    )
  }

  const currentHour = new Date().getHours()
  let greetingKey = "good_evening"
  if (currentHour < 12) greetingKey = "good_morning"
  else if (currentHour < 17) greetingKey = "good_afternoon"

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <AddExpenseModal open={expenseModalOpen} onOpenChange={(open) => {
        setExpenseModalOpen(open)
        if (!open) fetchData()
      }} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t(greetingKey)}, {session?.user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">{t("how_money_moving")}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setExpenseModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hidden md:flex">
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
          {/* We will add an Income modal later if needed, for now just a simple prompt or link */}
          <Button onClick={() => {
            const amount = prompt("Enter income amount (₹):")
            if (amount && !isNaN(Number(amount))) {
              fetch("/api/incomes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, source: "Manual Entry" })
              }).then(() => fetchData())
            }
          }} variant="outline" className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hidden md:flex">
            <Plus className="w-4 h-4 mr-2" /> Add Income
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 hidden md:flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export PDF
          </Button>
          <div className="hidden lg:block">
            <LiveClock />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Income (This Month)"
          amount={`₹${totalIncomeThisMonth.toLocaleString()}`} 
          trend={`${currentMonthIncomes.length} sources`}
          trendUp={false}
          icon={TrendingUp} 
        />
        <MetricCard 
          title="Spent (This Month)"
          amount={`₹${spentThisMonth.toLocaleString()}`} 
          trend={`${currentMonthExpenses.length} transactions`}
          trendUp={spentThisMonth > totalIncomeThisMonth}
          icon={Wallet} 
        />
        <MetricCard 
          title="Spent Today"
          amount={`₹${spentToday.toLocaleString()}`} 
          trend={spentToday > recommendedDaily ? "Over safe daily limit" : "On track"}
          trendUp={spentToday > recommendedDaily}
          icon={IndianRupee} 
        />
        <MetricCard 
          title="Remaining Balance"
          amount={`₹${remainingBalance.toLocaleString()}`} 
          trend={`Safe to spend: ₹${Math.round(recommendedDaily).toLocaleString()}/day`}
          trendUp={remainingBalance < 0}
          icon={Target} 
          progressValue={spentPercentage}
        />
      </div>



      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-8">
        
        {/* Transactions Card - Now Priority/Wider */}
        <Card className="md:col-span-4 lg:col-span-5 shadow-sm border-border/50 flex flex-col order-2 lg:order-1 glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("recent_transactions")}</CardTitle>
                <CardDescription>Your latest expenses</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-8">
                <Link href="/dashboard/expenses">{t("view_all")}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="space-y-4 mt-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-70">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{t("no_transactions")}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setExpenseModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> {t("quick_add")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.slice(0, 10).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4 overflow-hidden">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{expense.category}</p>
                        <p className="text-xs text-muted-foreground truncate">{expense.description || expense.paymentMethod || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 ml-4">
                      <div className="font-bold text-base">
                        ₹{expense.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart Card - Now Smaller/Secondary */}
        <Card className="md:col-span-3 lg:col-span-3 shadow-sm border-border/50 flex flex-col order-1 lg:order-2 glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("daily_spending")}</CardTitle>
                <CardDescription>This Month</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <div className="h-full w-full mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`₹${value}`, 'Spent']}
                    />
                    <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index + 1 === today.getDate() ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function MetricCard({ title, amount, trend, icon: Icon, trendUp, progressValue }: any) {
  return (
    <Card className="relative overflow-hidden glass-card group flex flex-col p-1">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/15 transition-all duration-700 ease-in-out" />
      <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10 shadow-inner">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col">
        <div className="text-3xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">{amount}</div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center font-medium">
          {trendUp === true && <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-destructive stroke-[3]" />}
          {trendUp === false && <ArrowDownRight className="w-3.5 h-3.5 mr-1 text-emerald-500 stroke-[3]" />}
          <span className={trendUp === true ? "text-destructive" : trendUp === false ? "text-emerald-500" : ""}>
            {trend}
          </span>
        </p>
        {progressValue !== undefined && (
          <div className="w-full h-2 bg-muted/50 rounded-full mt-5 overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${progressValue > 90 ? 'bg-gradient-to-r from-red-500 to-rose-600' : progressValue > 75 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`} 
              style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
