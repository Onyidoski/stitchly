'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { getOrderBalance, getOrderNet } from "@/lib/order-money"

// Updated Interface: More flexible to prevent TypeScript errors
export interface PendingOrder {
    id: string
    total_amount: number
    paid_amount: number | null
    discount_type?: string | null
    discount_value?: number | null
    clients: any // Set to 'any' to handle both objects and arrays from Supabase
}

interface PendingPaymentsSheetProps {
    orders: PendingOrder[]
}

export function PendingPaymentsSheet({ orders }: PendingPaymentsSheetProps) {
    // Calculate total owed
    const totalPending = orders.reduce((acc, order) => {
        return acc + getOrderBalance(order)
    }, 0)

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Card className="cursor-pointer hover:bg-slate-50 transition-colors border-l-4 border-l-destructive/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{totalPending.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {orders.length} invoice{orders.length !== 1 && 's'} with balance
                        </p>
                    </CardContent>
                </Card>
            </SheetTrigger>

            <SheetContent className="sm:max-w-[700px] sm:px-8 overflow-y-auto px-6">
                <SheetHeader>
                    <SheetTitle>Pending Payments Details</SheetTitle>
                    <SheetDescription>
                        The following clients have outstanding balances.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Total Price</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right font-bold text-destructive">Remaining</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length > 0 ? (
                                orders.map((order) => {
                                    const balance = getOrderBalance(order)
                                    const net = getOrderNet(order)
                                    // Handle if clients is an array or object
                                    const clientName = Array.isArray(order.clients)
                                        ? order.clients[0]?.name
                                        : order.clients?.name

                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                {clientName || 'Unknown'}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                ₦{Math.round(net).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                ₦{order.paid_amount?.toLocaleString() || '0'}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-destructive">
                                                ₦{balance.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No pending payments.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </SheetContent>
        </Sheet>
    )
}