'use client'

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Calendar, Search, Scissors } from "lucide-react"

export function OrdersTable({ orders }: { orders: any[] }) {
  const [search, setSearch] = useState("")

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase()
    const clientName = order.clients?.name?.toLowerCase() || ""
    const fabric = order.fabric_description?.toLowerCase() || ""
    
    return clientName.includes(query) || fabric.includes(query)
  })

  if (orders.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-slate-50">
            <Scissors className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-lg font-medium">No orders found</h3>
            <p className="text-sm text-muted-foreground">This list is empty.</p>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <CardTitle className="text-lg">Order List</CardTitle>
                <CardDescription>Manage and track production.</CardDescription>
            </div>
            <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="pl-6">Client</TableHead>
                    <TableHead>Style/Fabric</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <TableRow key={order.id} className="group hover:bg-muted/50">
                            <TableCell className="pl-6 font-medium">
                                <Link href={`/clients/${order.client_id}`} className="flex items-center gap-2 hover:underline decoration-slate-400 underline-offset-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                        {/* @ts-ignore */}
                                        {order.clients?.name?.[0] || 'C'}
                                    </div>
                                    <div>
                                        {/* @ts-ignore */}
                                        <div className="text-sm">{order.clients?.name || 'Unknown'}</div>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                {order.fabric_description}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    {new Date(order.delivery_date).toLocaleDateString()}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={order.status === 'delivered' ? 'secondary' : 'default'} className="capitalize shadow-none">
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <div className="flex flex-col items-end">
                                    <span className="font-medium tabular-nums text-sm">
                                        ₦{order.total_amount?.toLocaleString()}
                                    </span>
                                    {order.payment_status !== 'paid' && (
                                        <span className="text-[10px] text-red-500 font-medium">
                                            Unpaid
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            No orders found matching "{search}"
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}