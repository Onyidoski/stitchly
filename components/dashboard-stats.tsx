// components/dashboard-stats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Scissors, Info, TrendingUp, Wallet, ArrowDownRight } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import Link from "next/link"

const sparkData1 = [ { value: 10 }, { value: 25 }, { value: 15 }, { value: 30 }, { value: 20 }, { value: 50 }, { value: 40 } ]
const sparkData2 = [ { value: 20 }, { value: 15 }, { value: 25 }, { value: 40 }, { value: 30 }, { value: 50 }, { value: 60 } ]

export function DashboardStats({
    totalRevenue,
    totalExpenses,
    activeOrders,
    completedOrders,
    totalClients
}: {
    totalRevenue: number
    totalExpenses: number
    activeOrders: number
    completedOrders: number
    totalClients: number
}) {
    const profit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(0) : '0'
    const expenseRatio = totalRevenue > 0 ? Math.min((totalExpenses / totalRevenue) * 100, 100) : 0

    return (
        <>
            {/* 1. Total Revenue Card */}
            <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden relative">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold mb-1">₦{totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                        All time income
                    </div>

                    <div className="h-[60px] w-full absolute bottom-0 left-0 right-0 opacity-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData1}>
                                <defs>
                                    <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#colorGradient1)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Net Profit Card — NEW DESIGN */}
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden relative bg-gradient-to-br from-emerald-50 via-card to-emerald-50/30 dark:from-emerald-950/40 dark:via-card dark:to-emerald-950/20">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                        <div className={`p-1 rounded-full ${profit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                            {profit >= 0 ? (
                                <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={`text-3xl font-bold mb-1 ${profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        ₦{profit.toLocaleString()}
                    </div>

                    {totalExpenses > 0 ? (
                        <div className="space-y-2">
                            {/* Visual bar showing revenue split */}
                            <div className="w-full h-2 rounded-full bg-emerald-200/60 dark:bg-emerald-900/40 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-red-400 dark:bg-red-500 transition-all duration-500"
                                    style={{ width: `${expenseRatio}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-red-500 font-medium flex items-center gap-1">
                                    <Wallet className="h-2.5 w-2.5" />
                                    ₦{totalExpenses.toLocaleString()} spent
                                </span>
                                <span className={`font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                                    {profitMargin}% margin
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground">
                            No expenses logged yet
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 3. Active Jobs Card */}
            <Link href="/orders?tab=active" className="block cursor-pointer transition-transform hover:scale-[1.02]">
                <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden relative h-full">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
                            <div className="p-1 rounded-full bg-orange-100 dark:bg-orange-900/40">
                                <Scissors className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-1">{activeOrders}</div>
                        <div className="text-xs text-muted-foreground">
                            In Production
                        </div>
                         {/* Sparkline remains the same... */}
                         <div className="h-[60px] w-full absolute bottom-0 left-0 right-0 opacity-20">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sparkData2}>
                                    <defs>
                                        <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#f97316" fill="url(#colorGradient2)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* 4. Completed Jobs Card */}
            <Link href="/orders?tab=completed" className="block cursor-pointer transition-transform hover:scale-[1.02]">
                <Card className="rounded-3xl border-none shadow-sm bg-card h-full">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                            <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-1">{completedOrders}</div>
                        <div className="text-xs text-muted-foreground">
                            Jobs Delivered
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* 5. Total Clients Card — expanded layout on mobile */}
            <Link href="/clients" className="block cursor-pointer transition-transform hover:scale-[1.02] col-span-2 lg:col-span-1">
                <Card className="rounded-3xl border-none shadow-sm bg-card h-full">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                            <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/40">
                                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            {/* Left: Main stat */}
                            <div>
                                <div className="text-3xl font-bold mb-1">{totalClients}</div>
                                <div className="text-xs text-muted-foreground">
                                    All profiles
                                </div>
                            </div>

                            {/* Right: Quick stats — only visible on mobile where card is full-width */}
                            <div className="flex gap-4 lg:hidden">
                                <div className="text-right">
                                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{activeOrders}</div>
                                    <div className="text-[10px] text-muted-foreground">Active</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completedOrders}</div>
                                    <div className="text-[10px] text-muted-foreground">Done</div>
                                </div>
                                {totalRevenue > 0 && (
                                    <div className="text-right">
                                        <div className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{profitMargin}%</div>
                                        <div className="text-[10px] text-muted-foreground">Margin</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </>
    )
}