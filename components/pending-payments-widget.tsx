'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { WhatsAppMessageButton } from "@/components/whatsapp-message-button"
import { getOrderBalance } from "@/lib/order-money"

interface PendingOrder {
    id: string
    total_amount: number
    paid_amount?: number | null
    fabric_description?: string | null
    delivery_date?: string | null
    status?: string
    discount_type?: string | null
    discount_value?: number | null
    clients:
        | { name: string; phone?: string | null }
        | { name: string; phone?: string | null }[]
        | null
}

export function PendingPaymentsWidget({
    orders,
    businessName,
}: {
    orders: PendingOrder[]
    businessName: string
}) {
    const totalPending = orders.reduce((acc, order) => {
        return acc + getOrderBalance(order)
    }, 0)

    const topOrders = orders.slice(0, 4)

    const getClient = (order: PendingOrder) => {
        if (!order.clients) return { name: 'Unknown', phone: null as string | null }
        if (Array.isArray(order.clients)) {
            return {
                name: order.clients[0]?.name || 'Unknown',
                phone: order.clients[0]?.phone ?? null,
            }
        }
        return {
            name: order.clients.name || 'Unknown',
            phone: order.clients.phone ?? null,
        }
    }

    return (
        <Card className="md:col-span-1 lg:col-span-2 shadow-sm border-none bg-card">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="text-2xl font-bold text-foreground">₦{totalPending.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total outstanding balance</p>
                </div>

                <div className="space-y-3">
                    {topOrders.map((order) => {
                        const balance = getOrderBalance(order)
                        const client = getClient(order)

                        return (
                            <div key={order.id} className="flex items-center justify-between gap-2 text-sm">
                                <div className="flex min-w-0 items-center gap-2">
                                    <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                    <span className="truncate font-medium text-muted-foreground">
                                        {client.name.split(' ')[0]}
                                    </span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <span className="font-bold text-red-600 dark:text-red-400">
                                        ₦{balance.toLocaleString()}
                                    </span>
                                    <WhatsAppMessageButton
                                        phone={client.phone}
                                        context={{
                                            clientName: client.name,
                                            businessName,
                                            orderName: order.fabric_description || 'your order',
                                            status: order.status,
                                            deliveryDate: order.delivery_date,
                                            totalAmount: order.total_amount,
                                            paidAmount: order.paid_amount ?? 0,
                                            discountType: order.discount_type,
                                            discountValue: order.discount_value ?? 0,
                                        }}
                                        templates={['payment_reminder', 'general']}
                                        size="icon"
                                        variant="ghost"
                                    />
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
