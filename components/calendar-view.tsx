'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface Order {
    id: string
    fabric_description: string | null
    delivery_date: string
    status: string
    color: string | null
    quantity: number
    total_amount: number
    paid_amount: number
    payment_status: string
    client_id: string
    clients: {
        name: string
        email: string | null
    } | null
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500',
    cutting: 'bg-orange-500',
    sewing: 'bg-blue-500',
    fitting: 'bg-purple-500',
    ready: 'bg-emerald-500',
    delivered: 'bg-gray-400',
}

const STATUS_BADGE_VARIANTS: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    cutting: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    sewing: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    fitting: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    delivered: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}

function formatDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function CalendarView({ orders }: { orders: Order[] }) {
    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    // Group orders by delivery date
    const ordersByDate = useMemo(() => {
        const map: Record<string, Order[]> = {}
        orders.forEach(order => {
            const d = new Date(order.delivery_date)
            const key = formatDateKey(d)
            if (!map[key]) map[key] = []
            map[key].push(order)
        })
        return map
    }, [orders])

    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const todayKey = formatDateKey(today)

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(y => y - 1)
        } else {
            setCurrentMonth(m => m - 1)
        }
        setSelectedDate(null)
    }

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(y => y + 1)
        } else {
            setCurrentMonth(m => m + 1)
        }
        setSelectedDate(null)
    }

    const goToToday = () => {
        setCurrentMonth(today.getMonth())
        setCurrentYear(today.getFullYear())
        setSelectedDate(todayKey)
    }

    // Build calendar grid cells
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    // Selected date orders
    const selectedOrders = selectedDate ? (ordersByDate[selectedDate] || []) : []

    // Stats for current month
    const monthOrders = useMemo(() => {
        return orders.filter(o => {
            const d = new Date(o.delivery_date)
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
    }, [orders, currentMonth, currentYear])

    const overdueCount = monthOrders.filter(o => {
        const d = new Date(o.delivery_date)
        return d < today && o.status !== 'delivered' && o.status !== 'ready'
    }).length

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* CALENDAR GRID */}
            <div className="flex-1">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold tracking-tight">
                            {MONTHS[currentMonth]} {currentYear}
                        </h2>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
                        Today
                    </Button>
                </div>

                {/* Month Stats */}
                <div className="flex gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
                        <span className="text-muted-foreground">Due this month:</span>
                        <span className="font-bold">{monthOrders.length}</span>
                    </div>
                    {overdueCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                            <span className="text-red-600 dark:text-red-400">Overdue:</span>
                            <span className="font-bold text-red-600 dark:text-red-400">{overdueCount}</span>
                        </div>
                    )}
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-1">
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-t border-l rounded-xl overflow-hidden">
                    {cells.map((day, i) => {
                        if (day === null) {
                            return <div key={`empty-${i}`} className="border-r border-b bg-muted/20 min-h-[72px] md:min-h-[90px]" />
                        }

                        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const dayOrders = ordersByDate[dateKey] || []
                        const isToday = dateKey === todayKey
                        const isSelected = dateKey === selectedDate
                        const isPast = new Date(dateKey) < new Date(todayKey)
                        const hasOverdue = dayOrders.some(o => isPast && o.status !== 'delivered' && o.status !== 'ready')

                        return (
                            <div
                                key={dateKey}
                                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                                className={`border-r border-b min-h-[72px] md:min-h-[90px] p-1.5 md:p-2 cursor-pointer transition-colors relative group ${
                                    isSelected
                                        ? 'bg-primary/5 ring-2 ring-inset ring-primary'
                                        : isToday
                                            ? 'bg-primary/5'
                                            : 'hover:bg-muted/50'
                                }`}
                            >
                                {/* Day Number */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                        isToday
                                            ? 'bg-primary text-primary-foreground'
                                            : isPast
                                                ? 'text-muted-foreground'
                                                : 'text-foreground'
                                    }`}>
                                        {day}
                                    </span>
                                    {dayOrders.length > 0 && (
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                            {dayOrders.length}
                                        </span>
                                    )}
                                </div>

                                {/* Order Dots / Previews */}
                                <div className="flex flex-col gap-0.5">
                                    {dayOrders.slice(0, 3).map((order) => (
                                        <div
                                            key={order.id}
                                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate ${
                                                hasOverdue && order.status !== 'delivered' && order.status !== 'ready'
                                                    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-muted/60'
                                            }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[order.status] || 'bg-gray-400'}`} />
                                            <span className="truncate hidden md:inline">
                                                {order.clients?.name?.split(' ')[0] || 'Order'}
                                            </span>
                                        </div>
                                    ))}
                                    {dayOrders.length > 3 && (
                                        <span className="text-[10px] text-muted-foreground pl-1">+{dayOrders.length - 3} more</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Status Legend */}
                <div className="flex flex-wrap gap-3 mt-4">
                    {Object.entries(STATUS_COLORS).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${color}`} />
                            <span className="capitalize">{status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* SIDE PANEL — Order Details */}
            <div className="lg:w-80 shrink-0">
                <div className="sticky top-24">
                    {selectedDate ? (
                        <div className="border rounded-xl overflow-hidden">
                            <div className="bg-muted/30 px-4 py-3 border-b">
                                <h3 className="font-semibold text-sm">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} due
                                </p>
                            </div>

                            {selectedOrders.length > 0 ? (
                                <div className="divide-y max-h-[60vh] overflow-y-auto">
                                    {selectedOrders.map(order => {
                                        const balance = order.total_amount - (order.paid_amount || 0)
                                        const isOverdue = new Date(order.delivery_date) < today && order.status !== 'delivered' && order.status !== 'ready'
                                        return (
                                            <Link
                                                key={order.id}
                                                href={`/clients/${order.client_id}`}
                                                className="block px-4 py-3 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium truncate">
                                                            {order.fabric_description || 'Custom Order'}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                                            <User className="h-3 w-3" />
                                                            <span className="truncate">{order.clients?.name || 'Unknown'}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE_VARIANTS[order.status] || ''}`}>
                                                        {order.status}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        ₦{order.total_amount?.toLocaleString()}
                                                        {balance > 0 && (
                                                            <span className="text-red-500 ml-1">
                                                                (₦{balance.toLocaleString()} due)
                                                            </span>
                                                        )}
                                                    </span>
                                                    {isOverdue && (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                                                            <Clock className="h-3 w-3" />
                                                            OVERDUE
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    No orders due on this date.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="border rounded-xl px-4 py-8 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Clock className="h-8 w-8 opacity-40" />
                                <p className="text-sm font-medium">Select a date</p>
                                <p className="text-xs">Click on any day to see orders due</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
