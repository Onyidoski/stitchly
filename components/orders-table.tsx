'use client'

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Calendar, Search, Scissors } from "lucide-react"
import { DeleteOrderButton } from "@/components/delete-order-button" // [1] IMPORT HERE

export function OrdersTable({ orders }: { orders: any[] }) {
    const [search, setSearch] = useState("")

    // Filter orders
    const filteredOrders = orders.filter((order) => {
        const query = search.toLowerCase()
        const clientName = order.clients?.name?.toLowerCase() || ""
        const fabric = order.fabric_description?.toLowerCase() || ""

        return clientName.includes(query) || fabric.includes(query)
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
            case 'ready': return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
            case 'processing': return 'bg-amber-100 text-amber-700 hover:bg-amber-100'
            case 'cancelled': return 'bg-red-100 text-red-700 hover:bg-red-100'
            default: return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
        }
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg bg-white">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Scissors className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No orders yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                    Create your first order to start tracking production.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 pt-4 pb-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search orders..."
                        className="pl-9 h-9 bg-slate-50 border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredOrders.length}</strong> orders
                </div>
            </div>

            <div className="rounded-md border overflow-hidden max-w-[calc(100vw-2rem)] md:max-w-full">
                <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-6 w-[250px]">Client / Order</TableHead>
                                <TableHead>Style Detail</TableHead>
                                <TableHead>Delivery</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="group hover:bg-slate-50/80 transition-colors border-0">
                                        <TableCell className="pl-6 font-medium">
                                            <Link href={`/clients/${order.client_id}`} className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                                                    {/* @ts-ignore */}
                                                    {order.clients?.name?.[0]?.toUpperCase() || 'C'}
                                                </div>
                                                <div>
                                                    {/* @ts-ignore */}
                                                    <div className="text-base font-semibold text-foreground">{order.clients?.name || 'Unknown Client'}</div>
                                                    <div className="text-xs text-muted-foreground">#{order.id.slice(0, 6).toUpperCase()}</div>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="max-w-[180px]">
                                            <span className="text-sm text-foreground truncate block font-medium">
                                                {order.fabric_description || 'No description'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(order.delivery_date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={`${getStatusColor(order.status)} capitalize shadow-none border-0 px-2.5 py-0.5`}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-base text-foreground">
                                                    ₦{order.total_amount?.toLocaleString()}
                                                </span>
                                                {order.payment_status === 'paid' ? (
                                                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-red-500 font-medium">
                                                        Unpaid
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {/* [2] ADD BUTTON HERE */}
                                            <div className="flex justify-end pr-2">
                                                <DeleteOrderButton orderId={order.id} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No orders found matching "{search}"
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}