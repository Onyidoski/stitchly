'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditOrderSheet } from '@/components/edit-order-sheet'
import { DeleteOrderButton } from '@/components/delete-order-button'
import { ExpenseManager } from '@/components/expense-manager'
import { Calendar, FileText, X } from 'lucide-react'
import Image from "next/image"

interface Order {
    id: string
    fabric_description: string | null
    delivery_date: string
    status: string
    color: string | null
    quantity: number
    total_amount: number
    paid_amount: number
    payment_status: string
    style_image_urls: string[] | null
    client_id: string
    [key: string]: any
}

export function OrderSelectionWrapper({
    orders,
    clientId,
}: {
    orders: Order[]
    clientId: string
}) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const router = useRouter()

    const toggleOrder = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const selectAll = () => {
        if (selectedIds.size === orders.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(orders.map(o => o.id)))
        }
    }

    const generateCombinedInvoice = () => {
        const orderIds = Array.from(selectedIds).join(',')
        router.push(`/invoices/client/${clientId}?orders=${orderIds}`)
    }

    const selectedCount = selectedIds.size
    const isAllSelected = selectedCount === orders.length && orders.length > 0

    // Calculate totals for selected orders
    const selectedOrders = orders.filter(o => selectedIds.has(o.id))
    const selectedTotal = selectedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const selectedPaid = selectedOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0)
    const selectedBalance = selectedTotal - selectedPaid

    return (
        <>
            {/* Select All / Deselect All toggle */}
            {orders.length > 1 && (
                <div className="flex items-center gap-3">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={selectAll}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectAll() }}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-xs hover:bg-accent hover:text-accent-foreground cursor-pointer select-none transition-colors"
                    >
                        <div className={`h-3.5 w-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${
                            isAllSelected
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-input'
                        }`}>
                            {isAllSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </div>
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                    </div>
                    {selectedCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
                        </span>
                    )}
                </div>
            )}

            {/* Order Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {orders.map((order) => {
                    const isSelected = selectedIds.has(order.id)
                    return (
                        <Card
                            key={order.id}
                            className={`overflow-hidden flex flex-col transition-all duration-200 cursor-pointer ${
                                isSelected
                                    ? 'ring-2 ring-primary shadow-md shadow-primary/10'
                                    : 'hover:shadow-sm'
                            }`}
                        >
                            <CardHeader className="bg-muted/30 pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3 flex-1">
                                        {/* Checkbox */}
                                        <div
                                            className="pt-0.5"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleOrder(order.id)
                                            }}
                                        >
                                            <div className={`h-4 w-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                                                isSelected
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'border-input'
                                            }`}>
                                                {isSelected && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className="flex-1"
                                            onClick={() => toggleOrder(order.id)}
                                        >
                                            <CardTitle className="text-base font-semibold line-clamp-1 pr-2">
                                                {order.fabric_description || 'Custom Order'}
                                            </CardTitle>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                Due: {new Date(order.delivery_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge variant={order.status === 'ready' ? 'default' : 'outline'} className="capitalize">
                                            {order.status}
                                        </Badge>
                                        <EditOrderSheet order={order} />
                                        <DeleteOrderButton orderId={order.id} />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-6 flex-1 flex flex-col gap-6">
                                {order.style_image_urls && order.style_image_urls.length > 0 ? (
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                        {order.style_image_urls.map((url: string, i: number) => (
                                            <a
                                                key={i}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="relative h-48 w-48 shrink-0 rounded-xl overflow-hidden border shadow-sm snap-start hover:opacity-95 transition-all bg-muted"
                                            >
                                                <Image
                                                    src={url}
                                                    alt="Style Reference"
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 192px, 192px"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-6 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30">
                                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground/50">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                                <circle cx="9" cy="9" r="2"/>
                                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                            </svg>
                                            <span className="text-xs font-medium">No style reference</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto flex justify-between items-center text-sm border-t pt-3">
                                    <div className="grid gap-1">
                                        <span className="text-muted-foreground">Color: <span className="text-foreground">{order.color || 'N/A'}</span></span>
                                        <span className="text-muted-foreground">Qty: <span className="text-foreground">{order.quantity}</span></span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg flex items-center justify-end gap-1">
                                            <span>₦{order.total_amount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            {order.paid_amount > 0 && order.paid_amount < order.total_amount && (
                                                <span className="text-xs text-muted-foreground">
                                                    Pd: ₦{order.paid_amount.toLocaleString()}
                                                </span>
                                            )}
                                            <Badge variant={order.payment_status === 'paid' ? 'secondary' : 'destructive'} className="text-xs capitalize">
                                                {order.payment_status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* EXPENSE TRACKER */}
                                <ExpenseManager orderId={order.id} orderTotal={order.total_amount || 0} />
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Floating Action Bar — appears when orders are selected */}
            {selectedCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex items-center justify-between gap-3 bg-card border-t md:border shadow-2xl md:rounded-2xl px-4 py-3 md:px-5 md:py-3.5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-bold text-foreground whitespace-nowrap">
                                {selectedCount} selected
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap hidden xs:inline">·</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap truncate hidden xs:inline">
                                ₦{selectedTotal.toLocaleString()}
                                {selectedBalance > 0 && (
                                    <> due</>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                onClick={generateCombinedInvoice}
                                size="sm"
                                className="gap-2 rounded-xl shadow-md whitespace-nowrap"
                            >
                                <FileText className="h-4 w-4" />
                                <span>Invoice</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={() => setSelectedIds(new Set())}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
