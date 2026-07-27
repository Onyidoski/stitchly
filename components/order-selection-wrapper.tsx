'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditOrderSheet } from '@/components/edit-order-sheet'
import { DeleteOrderButton } from '@/components/delete-order-button'
import { ExpenseManager } from '@/components/expense-manager'
import { Calendar, FileText, X, Loader2, Receipt } from 'lucide-react'
import Image from "next/image"
import { RecordBulkPaymentDialog } from '@/components/record-bulk-payment-dialog'
import { WhatsAppMessageButton } from '@/components/whatsapp-message-button'
import type { WhatsAppMessageContext } from '@/lib/whatsapp'
import { getOrderBalance, getOrderNet, sumOrderNets } from '@/lib/order-money'

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
    clientName,
    clientPhone,
    businessName,
}: {
    orders: Order[]
    clientId: string
    clientName: string
    clientPhone: string | null
    businessName: string
}) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
    const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false)
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
        setIsGeneratingInvoice(true)
        const orderIds = Array.from(selectedIds).join(',')
        router.push(`/invoices/client/${clientId}?orders=${orderIds}`)
    }

    const generateCombinedReceipt = () => {
        setIsGeneratingReceipt(true)
        const orderIds = Array.from(selectedIds).join(',')
        router.push(`/receipts/client/${clientId}?orders=${orderIds}`)
    }

    const selectedCount = selectedIds.size
    const isAllSelected = selectedCount === orders.length && orders.length > 0

    // Calculate totals for selected orders
    const selectedOrders = orders.filter(o => selectedIds.has(o.id))
    const selectedTotal = sumOrderNets(selectedOrders)
    const selectedPaid = selectedOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0)
    const selectedBalance = selectedOrders.reduce((sum, o) => sum + getOrderBalance(o), 0)

    const shouldIgnoreCardClick = (target: EventTarget | null) => {
        return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, [role="button"], [data-slot="dropdown-menu"]'))
    }

    const buildMessageContext = (order: Order): WhatsAppMessageContext => ({
        clientName,
        businessName,
        orderName: order.fabric_description || 'Custom Order',
        status: order.status,
        deliveryDate: order.delivery_date,
        totalAmount: order.total_amount || 0,
        paidAmount: order.paid_amount || 0,
        discountType: order.discount_type,
        discountValue: order.discount_value ?? 0,
    })

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
                            onClick={(event) => {
                                if (shouldIgnoreCardClick(event.target)) return
                                toggleOrder(order.id)
                            }}
                            className={`gap-0 overflow-hidden py-0 flex flex-col transition-all duration-200 cursor-pointer ${
                                isSelected
                                    ? 'ring-2 ring-primary shadow-md shadow-primary/10'
                                    : 'hover:shadow-sm'
                            }`}
                        >
                            <div className="bg-muted/30 rounded-t-xl border-b border-border/40 px-5 pt-5 pb-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <div
                                            className="shrink-0 self-center"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleOrder(order.id)
                                            }}
                                        >
                                            <div
                                                className={`flex h-4 w-4 items-center justify-center rounded-[3px] border transition-colors ${
                                                    isSelected
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-input'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="h-3 w-3"
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-1 pr-2 text-base font-semibold leading-tight">
                                                {order.fabric_description || 'Custom Order'}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3 shrink-0" />
                                                Due: {new Date(order.delivery_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1 self-center">
                                        <WhatsAppMessageButton
                                            phone={clientPhone}
                                            context={buildMessageContext(order)}
                                            size="icon"
                                            variant="ghost"
                                        />
                                        <Badge
                                            variant={order.status === 'ready' ? 'default' : 'outline'}
                                            className="capitalize"
                                        >
                                            {order.status}
                                        </Badge>
                                        <EditOrderSheet
                                            order={order}
                                            clientName={clientName}
                                            clientPhone={clientPhone}
                                            businessName={businessName}
                                        />
                                        <DeleteOrderButton orderId={order.id} />
                                    </div>
                                </div>
                            </div>

                            <CardContent className="flex flex-1 flex-col gap-6 px-5 pb-5 pt-5">
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
                                    <div className="h-48 w-48 shrink-0 rounded-xl border border-muted/60 bg-gradient-to-br from-muted/10 to-muted/30 flex flex-col items-center justify-center gap-3 text-muted-foreground/50 shadow-inner">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 opacity-50">
                                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                            <circle cx="9" cy="9" r="2"/>
                                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                        </svg>
                                        <span className="text-[11px] font-semibold tracking-wider uppercase">No Reference</span>
                                    </div>
                                )}

                                <div className="mt-auto flex justify-between items-center text-sm border-t pt-3">
                                    <div className="grid gap-1">
                                        <span className="text-muted-foreground">Color: <span className="text-foreground">{order.color || 'N/A'}</span></span>
                                        <span className="text-muted-foreground">Qty: <span className="text-foreground">{order.quantity}</span></span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg flex items-center justify-end gap-1">
                                            <span>₦{Math.round(getOrderNet(order)).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            {order.paid_amount > 0 && getOrderBalance(order) > 0 && (
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
                                <ExpenseManager orderId={order.id} orderTotal={getOrderNet(order)} />
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Floating Action Bar — appears when orders are selected */}
            {selectedCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 bg-card border-t md:border shadow-2xl md:rounded-2xl px-4 py-3 md:px-5 md:py-3.5 backdrop-blur-sm">
                        {/* Info row */}
                        <div className="flex items-center justify-between md:justify-start gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                                    {selectedCount} selected
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">·</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap truncate">
                                    ₦{selectedTotal.toLocaleString()}
                                    {selectedBalance > 0 && (
                                        <> due</>
                                    )}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 md:hidden"
                                onClick={() => setSelectedIds(new Set())}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {/* Buttons row */}
                        <div className="flex items-center gap-2 shrink-0">
                            {selectedBalance > 0 && (
                                <RecordBulkPaymentDialog 
                                    selectedOrders={selectedOrders}
                                    onSuccess={() => setSelectedIds(new Set())}
                                />
                            )}
                            <Button
                                onClick={generateCombinedInvoice}
                                size="sm"
                                disabled={isGeneratingInvoice}
                                className="gap-1.5 rounded-xl shadow-md whitespace-nowrap flex-1 md:flex-none"
                            >
                                {isGeneratingInvoice ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileText className="h-4 w-4" />
                                )}
                                <span>{isGeneratingInvoice ? 'Loading...' : 'Invoice'}</span>
                            </Button>
                            <Button
                                onClick={generateCombinedReceipt}
                                size="sm"
                                variant="outline"
                                disabled={isGeneratingReceipt}
                                className="gap-1.5 rounded-xl shadow-md whitespace-nowrap flex-1 md:flex-none"
                            >
                                {isGeneratingReceipt ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Receipt className="h-4 w-4" />
                                )}
                                <span>{isGeneratingReceipt ? 'Loading...' : 'Receipt'}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 hidden md:flex"
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
