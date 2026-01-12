// components/dashboard-stats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Scissors, Info } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import Link from "next/link"

const sparkData1 = [ { value: 10 }, { value: 25 }, { value: 15 }, { value: 30 }, { value: 20 }, { value: 50 }, { value: 40 } ]
const sparkData2 = [ { value: 20 }, { value: 15 }, { value: 25 }, { value: 40 }, { value: 30 }, { value: 50 }, { value: 60 } ]

export function DashboardStats({
    totalRevenue,
    activeOrders,
    completedOrders,
    totalClients
}: {
    totalRevenue: number
    activeOrders: number
    completedOrders: number
    totalClients: number
}) {
    return (
        <>
            {/* 1. Total Revenue Card */}
            {/* [FIX] Changed bg-white to bg-card */}
            <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden relative">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        {/* [FIX] Icon bg for dark mode */}
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

            {/* 2. Active Jobs Card */}
            <Link href="/orders?tab=active" className="block cursor-pointer transition-transform hover:scale-[1.02]">
                {/* [FIX] Changed bg-white to bg-card */}
                <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden relative h-full">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
                            {/* [FIX] Icon bg for dark mode */}
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

            {/* 3. Completed Jobs Card */}
            <Link href="/orders?tab=completed" className="block cursor-pointer transition-transform hover:scale-[1.02]">
                {/* [FIX] Changed bg-white to bg-card */}
                <Card className="rounded-3xl border-none shadow-sm bg-card h-full">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                            {/* [FIX] Icon bg for dark mode */}
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

            {/* 4. Total Clients Card */}
            <Link href="/orders?tab=all" className="block cursor-pointer transition-transform hover:scale-[1.02]">
                {/* [FIX] Changed bg-white to bg-card */}
                <Card className="rounded-3xl border-none shadow-sm bg-card h-full">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                            {/* [FIX] Icon bg for dark mode */}
                            <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/40">
                                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-1">{totalClients}</div>
                        <div className="text-xs text-muted-foreground">
                            All profiles
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </>
    )
}