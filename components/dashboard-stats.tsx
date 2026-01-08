'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Scissors, Info } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"

// --- Mock Data for Sparklines ---
const sparkData1 = [
    { value: 10 }, { value: 25 }, { value: 15 }, { value: 30 }, { value: 20 }, { value: 50 }, { value: 40 }
]
const sparkData2 = [
    { value: 20 }, { value: 15 }, { value: 25 }, { value: 40 }, { value: 30 }, { value: 50 }, { value: 60 }
]

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
            <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden relative">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <div className="p-1 rounded-full bg-slate-100">
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold mb-1">₦{totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                        All time income
                    </div>

                    {/* Tiny Chart Background Effect */}
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
            <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden relative">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
                        <div className="p-1 rounded-full bg-orange-100">
                            <Scissors className="h-3 w-3 text-orange-600" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold mb-1">{activeOrders}</div>
                    <div className="text-xs text-muted-foreground">
                        In Production
                    </div>

                    {/* Tiny Chart Background Effect */}
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

            {/* 3. Completed Jobs Card */}
            <Card className="rounded-3xl border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        <div className="p-1 rounded-full bg-emerald-100">
                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
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

            {/* 4. Total Clients Card (Redesigned) */}
            <Card className="rounded-3xl border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                        <div className="p-1 rounded-full bg-blue-100">
                            <Info className="h-3 w-3 text-blue-600" />
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
        </>
    )
}
