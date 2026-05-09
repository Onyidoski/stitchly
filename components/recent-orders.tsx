// components/recent-orders.tsx
'use client'

import { useRouter } from "next/navigation"
import { useTopLoader } from "nextjs-toploader"

interface RecentOrdersProps {
    orders: any[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
    const router = useRouter()
    const { start } = useTopLoader()

    const handleNavigate = (url: string) => {
        start()
        router.push(url)
    }

    if (orders.length === 0) {
        return (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                No recent orders found.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => {
                const clientName = Array.isArray(order.clients)
                    ? order.clients[0]?.name
                    : order.clients?.name || 'Unknown'

                const isPositive = order.status !== 'cancelled'

                return (
                    <div
                        key={order.id}
                        // [FIX] Changed hover:bg-slate-50 to hover:bg-accent for dark mode support
                        className="flex items-center justify-between p-2 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleNavigate(`/clients/${order.client_id}`)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                {clientName[0]}
                            </div>
                            <div>
                                <div className="font-medium text-sm text-foreground">
                                    {clientName}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    #{order.id.slice(0, 4)} • {order.status}
                                </div>
                            </div>
                        </div>

                        <div className={`text-sm font-bold block ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {isPositive ? '+' : '-'}₦{order.total_amount?.toLocaleString()}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}