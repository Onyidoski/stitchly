'use client'

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RevenueChartProps {
    data: {
        name: string
        total: number
        expenses: number
        profit: number
    }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    const hasRevenue = data && data.some(item => item.total > 0)
    const hasExpenses = data && data.some(item => item.expenses > 0)

    if (!data || data.length === 0 || !hasRevenue) {
        return (
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>Monthly revenue breakdown.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                        No revenue data available yet.
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                    {hasExpenses
                        ? 'Monthly revenue vs profit for the current year.'
                        : 'Monthly revenue for the current year.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₦${value}`}
                        />
                        <Tooltip
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                backgroundColor: 'hsl(var(--card))',
                                color: 'hsl(var(--card-foreground))',
                            }}
                            formatter={(value: any, name?: string) => {
                                const labels: Record<string, string> = {
                                    total: 'Revenue',
                                    profit: 'Profit',
                                }
                                return [`₦${Number(value).toLocaleString()}`, labels[name || ''] || name]
                            }}
                        />
                        {hasExpenses && (
                            <Legend
                                verticalAlign="top"
                                align="right"
                                height={36}
                                formatter={(value: string) => {
                                    const labels: Record<string, string> = {
                                        total: 'Revenue',
                                        profit: 'Profit',
                                    }
                                    return labels[value] || value
                                }}
                            />
                        )}

                        {/* Revenue area */}
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            name="total"
                        />

                        {/* Profit area — only shown when expenses exist */}
                        {hasExpenses && (
                            <Area
                                type="monotone"
                                dataKey="profit"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                strokeDasharray="6 3"
                                fillOpacity={1}
                                fill="url(#colorProfit)"
                                name="profit"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}