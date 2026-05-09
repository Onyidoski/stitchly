'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Download, Loader2, TrendingUp, TrendingDown, Users, ShoppingBag, Banknote, Receipt } from 'lucide-react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    cutting: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    sewing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    fitting: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    delivered: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

interface Order {
    id: string
    fabric_description: string | null
    delivery_date: string
    created_at: string
    status: string
    total_amount: number
    paid_amount: number
    payment_status: string
    client_id: string
    clients: { name: string; email: string | null } | null
}

interface Expense {
    id: string
    category: string
    description: string | null
    amount: number
    created_at: string
    order_id: string
}

export function ReportView({
    orders,
    expenses,
    businessName,
}: {
    orders: Order[]
    expenses: Expense[]
    businessName: string
}) {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth())
    const [year, setYear] = useState(today.getFullYear())
    const [downloading, setDownloading] = useState(false)
    const { resolvedTheme } = useTheme()

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    // Filter data for selected month
    const monthOrders = useMemo(() =>
        orders.filter(o => {
            const d = new Date(o.created_at)
            return d.getMonth() === month && d.getFullYear() === year
        }), [orders, month, year])

    const monthExpenses = useMemo(() =>
        expenses.filter(e => {
            const d = new Date(e.created_at)
            return d.getMonth() === month && d.getFullYear() === year
        }), [expenses, month, year])

    // Financial calculations
    const totalRevenue = monthOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalCollected = monthOrders.reduce((s, o) => s + (o.paid_amount || 0), 0)
    const totalOutstanding = totalRevenue - totalCollected
    const totalExpenses = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const grossProfit = totalCollected - totalExpenses
    const profitMargin = totalCollected > 0 ? ((grossProfit / totalCollected) * 100).toFixed(1) : '0'

    // Order status breakdown
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        monthOrders.forEach(o => {
            counts[o.status] = (counts[o.status] || 0) + 1
        })
        return counts
    }, [monthOrders])

    // Top clients by revenue
    const topClients = useMemo(() => {
        const clientMap: Record<string, { name: string; revenue: number; orders: number }> = {}
        monthOrders.forEach(o => {
            const name = o.clients?.name || 'Unknown'
            if (!clientMap[name]) clientMap[name] = { name, revenue: 0, orders: 0 }
            clientMap[name].revenue += o.total_amount || 0
            clientMap[name].orders += 1
        })
        return Object.values(clientMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    }, [monthOrders])

    // Expense breakdown by category
    const expenseByCategory = useMemo(() => {
        const catMap: Record<string, number> = {}
        monthExpenses.forEach(e => {
            catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount)
        })
        return Object.entries(catMap).sort((a, b) => b[1] - a[1])
    }, [monthExpenses])

    const CATEGORY_LABELS: Record<string, string> = {
        fabric: 'Fabric / Material', thread: 'Thread / Yarn', needles: 'Needles / Pins',
        buttons: 'Buttons / Zippers', lining: 'Lining', fuel: 'Fuel / Transport',
        labor: 'Labor', other: 'Other'
    }

    // PDF download
    const handleDownload = async () => {
        const element = document.getElementById('report-content')
        if (!element) return

        setDownloading(true)
        const wasDark = resolvedTheme === 'dark'

        try {
            if (wasDark) document.documentElement.classList.remove('dark')

            const container = document.createElement('div')
            container.style.position = 'fixed'
            container.style.top = '-10000px'
            container.style.left = '-10000px'
            container.style.width = '794px'
            container.style.zIndex = '-1000'
            document.body.appendChild(container)

            const clone = element.cloneNode(true) as HTMLElement
            clone.style.width = '100%'
            clone.style.maxWidth = 'none'
            clone.style.margin = '0'
            clone.style.boxShadow = 'none'
            clone.style.backgroundColor = '#ffffff'
            container.appendChild(clone)

            await new Promise(r => setTimeout(r, 150))

            const dataUrl = await toPng(clone, { quality: 1.0, pixelRatio: 2, backgroundColor: '#ffffff' })
            document.body.removeChild(container)

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfW = pdf.internal.pageSize.getWidth()
            const pdfH = pdf.internal.pageSize.getHeight()
            const imgProps = pdf.getImageProperties(dataUrl)
            const imgH = (imgProps.height * pdfW) / imgProps.width

            if (imgH <= pdfH) {
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, imgH)
            } else {
                let left = imgH
                const pos = 0
                pdf.addImage(dataUrl, 'PNG', 0, pos, pdfW, imgH)
                left -= pdfH
                while (left >= 0) {
                    pdf.addPage()
                    pdf.addImage(dataUrl, 'PNG', 0, -(pdfH - 10), pdfW, imgH)
                    left -= pdfH
                }
            }

            pdf.save(`${businessName.replace(/\s+/g, '-')}-report-${MONTHS[month]}-${year}.pdf`)
            toast.success("Report saved!")

            if (wasDark) document.documentElement.classList.add('dark')
        } catch {
            toast.error("Failed to generate PDF")
            if (wasDark) document.documentElement.classList.add('dark')
        }
        setDownloading(false)
    }

    return (
        <div>
            {/* Month Navigation + Download */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-bold min-w-[160px] text-center">
                        {MONTHS[month]} {year}
                    </h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Button size="sm" className="gap-2" onClick={handleDownload} disabled={downloading}>
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {downloading ? 'Processing...' : 'Save PDF'}
                </Button>
            </div>

            {/* REPORT DOCUMENT */}
            <div
                id="report-content"
                className="bg-card border rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-none"
            >
                {/* Report Header */}
                <div className="p-6 md:p-8 bg-muted/30 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold">{businessName}</h1>
                            <p className="text-sm text-muted-foreground mt-1">Monthly Business Report</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-light text-muted-foreground/40 uppercase tracking-widest">Report</h2>
                            <p className="text-sm font-semibold mt-2">{MONTHS[month]} {year}</p>
                            <p className="text-xs text-muted-foreground">Generated {today.toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="p-6 md:p-8">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Financial Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border rounded-xl p-4 space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Banknote className="h-4 w-4" />
                                <span className="text-xs font-medium">Revenue</span>
                            </div>
                            <p className="text-xl font-bold">₦{totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="border rounded-xl p-4 space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Banknote className="h-4 w-4" />
                                <span className="text-xs font-medium">Collected</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₦{totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="border rounded-xl p-4 space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Receipt className="h-4 w-4" />
                                <span className="text-xs font-medium">Expenses</span>
                            </div>
                            <p className="text-xl font-bold text-red-500">₦{totalExpenses.toLocaleString()}</p>
                        </div>
                        <div className="border rounded-xl p-4 space-y-1">
                            <div className="flex items-center gap-2">
                                {grossProfit >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-xs font-medium text-muted-foreground">Profit</span>
                            </div>
                            <p className={`text-xl font-bold ${grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                ₦{grossProfit.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{profitMargin}% margin</p>
                        </div>
                    </div>

                    {totalOutstanding > 0 && (
                        <div className="mt-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-amber-700 dark:text-amber-400">Outstanding payments</span>
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">₦{totalOutstanding.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {/* Orders Overview */}
                <div className="px-6 md:px-8 pb-6 md:pb-8">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Orders ({monthOrders.length})</h3>

                    {monthOrders.length > 0 ? (
                        <>
                            {/* Status Breakdown */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {Object.entries(statusCounts).map(([status, count]) => (
                                    <div
                                        key={status}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
                                    >
                                        {status}: {count}
                                    </div>
                                ))}
                            </div>

                            {/* Orders Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-muted-foreground border-b">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left font-medium">Order</th>
                                            <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Client</th>
                                            <th className="px-4 py-2.5 text-center font-medium">Status</th>
                                            <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                                            <th className="px-4 py-2.5 text-right font-medium hidden sm:table-cell">Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {monthOrders.map(order => (
                                            <tr key={order.id}>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium truncate max-w-[150px]">{order.fabric_description || 'Custom Order'}</p>
                                                    <p className="text-xs text-muted-foreground sm:hidden">{order.clients?.name}</p>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{order.clients?.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || ''}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">₦{order.total_amount?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">₦{order.paid_amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            No orders created in {MONTHS[month]}.
                        </div>
                    )}
                </div>

                {/* Two-Column: Top Clients + Expense Breakdown */}
                <div className="px-6 md:px-8 pb-6 md:pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Clients */}
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                            <Users className="h-3.5 w-3.5 inline mr-1.5" />
                            Top Clients
                        </h3>
                        {topClients.length > 0 ? (
                            <div className="space-y-2">
                                {topClients.map((client, i) => (
                                    <div key={client.name} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-medium">{client.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{client.orders} order{client.orders !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold">₦{client.revenue.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No clients this month.</p>
                        )}
                    </div>

                    {/* Expense Breakdown */}
                    <div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                            <Receipt className="h-3.5 w-3.5 inline mr-1.5" />
                            Expense Breakdown
                        </h3>
                        {expenseByCategory.length > 0 ? (
                            <div className="space-y-2">
                                {expenseByCategory.map(([category, amount]) => {
                                    const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(0) : '0'
                                    return (
                                        <div key={category}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="font-medium capitalize">{CATEGORY_LABELS[category] || category}</span>
                                                <span className="font-bold text-red-500">₦{amount.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground text-right mt-0.5">{pct}%</p>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No expenses recorded this month.</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 bg-muted/30 border-t">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Generated by {businessName} · Stitchly</span>
                        <span>{MONTHS[month]} {year} Report</span>
                    </div>
                </div>
            </div>

            {/* Downloading Overlay */}
            {downloading && (
                <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-card border shadow-lg rounded-xl p-6 flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                            <p className="text-lg font-semibold">Generating Report</p>
                            <p className="text-sm text-muted-foreground">Preparing your PDF...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
