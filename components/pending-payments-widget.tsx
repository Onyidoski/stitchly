'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, AlertCircle } from "lucide-react"

export function PendingPaymentsWidget({ orders }: { orders: any[] }) {
    const totalPending = orders.reduce((acc, order) => {
        return acc + (order.total_amount - (order.paid_amount || 0))
    }, 0)

    const topOrders = orders.slice(0, 4)

    return (
        <Card className="md:col-span-1 lg:col-span-2 shadow-sm border-none bg-white">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-3 w-3 text-red-600" />
                        </div>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="text-2xl font-bold text-foreground">₦{totalPending.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total outstanding balance</p>
                </div>

                <div className="space-y-3">
                    {topOrders.map((order) => {
                        const balance = order.total_amount - (order.paid_amount || 0)
                        const clientName = Array.isArray(order.clients)
                            ? order.clients[0]?.name
                            : order.clients?.name || 'Unknown'

                        return (
                            <div key={order.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                    <span className="font-medium text-muted-foreground">{clientName.split(' ')[0]}</span>
                                </div>
                                <div className="font-bold text-red-600">
                                    -₦{balance.toLocaleString()}
                                </div>
                            </div>
                        )
                    })}
                    {orders.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-2">
                            No pending payments!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
