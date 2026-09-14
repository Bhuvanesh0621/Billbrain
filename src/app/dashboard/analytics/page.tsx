"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function AnalyticsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch('/api/expenses')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        setExpenses(data)
      } catch (error) {
        console.error("Error fetching expenses:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchExpenses()
  }, [])

  const exportToCSV = () => {
    if (expenses.length === 0) return;
    
    // Create CSV headers
    const headers = ['Date', 'Category', 'Amount', 'Description'];
    
    // Create CSV rows
    const rows = expenses.map(exp => {
      const date = new Date(exp.date).toLocaleDateString();
      // Description is not on the interface but it's returned by the API
      // Let's safely extract it or default to empty
      const description = (exp as any).description ? `"${(exp as any).description}"` : '""';
      return `${date},${exp.category},${exp.amount},${description}`;
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `billbrain_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process Category Data for Pie Chart
  const categoryData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by highest
  }, [expenses]);

  // Process Monthly Data for Bar Chart
  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthTotals = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const monthStr = monthNames[date.getMonth()];
      acc[monthStr] = (acc[monthStr] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Ensure we show at least the last 5 months even if empty
    const result = [];
    const currentMonth = new Date().getMonth();
    for (let i = 4; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      const monthStr = monthNames[m];
      result.push({
        name: monthStr,
        amount: monthTotals[monthStr] || 0
      });
    }
    return result;
  }, [expenses]);

  // Process Prediction Data
  const predictionData = useMemo(() => {
    if (monthlyData.length === 0) return [];
    const avgAmount = monthlyData.reduce((sum, d) => sum + d.amount, 0) / monthlyData.length;
    return [...monthlyData, { name: 'Next (Est)', amount: Math.round(avgAmount) }];
  }, [monthlyData]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Analytics Data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expense Analytics</h1>
          <p className="text-slate-500">Deep dive into your actual spending patterns.</p>
        </div>
        <Button onClick={exportToCSV} disabled={expenses.length === 0} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export to CSV
        </Button>
      </div>

      {expenses.length === 0 ? (
        <Card className="p-8 text-center bg-slate-50 border-dashed">
          <p className="text-slate-500">You haven't logged any expenses yet.</p>
          <p className="text-sm text-slate-400 mt-2">Go to the Dashboard to add your first expense!</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>Your total expenses over the last 5 months.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Where your money goes overall.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-4 max-h-12 overflow-y-auto w-full">
                {categoryData.map((entry, index) => (
                  <div key={index} className="flex items-center text-xs text-slate-600">
                    <div className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                    {entry.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Expense Predictor</CardTitle>
              <CardDescription>Historical vs. Predicted future trajectory based on your data.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
