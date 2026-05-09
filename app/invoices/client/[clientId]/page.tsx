import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import { InvoiceActions } from '@/components/invoice-actions'
import { redirect } from 'next/navigation'

export default async function CombinedInvoicePage({
    params,
    searchParams,
}: {
    params: Promise<{ clientId: string }>
    searchParams: Promise<{ orders?: string }>
}) {
    const { clientId } = await params
    const { orders: orderIdsParam } = await searchParams

    if (!orderIdsParam) {
        redirect(`/clients/${clientId}`)
    }

    const orderIds = orderIdsParam.split(',').filter(Boolean)

    if (orderIds.length === 0) {
        redirect(`/clients/${clientId}`)
    }

    const supabase = await createClient()

    // Fetch client
    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

    if (!client) return <div>Client not found</div>

    // Fetch all selected orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    if (!orders || orders.length === 0) return <div>No orders found</div>

    // Fetch tenant details (business info)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', orders[0].tenant_id)
        .single()

    const businessName = tenant?.business_name || 'Fashion Brand'
    const logoUrl = tenant?.logo_url || null

    // Calculate totals across all orders
    const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const totalPaid = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0)
    const balance = totalAmount - totalPaid
    const isPaid = balance <= 0

    const invoiceDate = new Date().toLocaleDateString()
    // Use the earliest due date from all orders
    const dueDates = orders.map(o => new Date(o.delivery_date).getTime())
    const earliestDue = new Date(Math.min(...dueDates)).toLocaleDateString()

    // Generate a combined invoice number from client ID + date
    const invoiceNumber = `C-${clientId.slice(0, 4).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`

    return (
        <div className="min-h-screen bg-muted/50 p-4 md:p-8 font-sans">

            <InvoiceActions />

            <div
                id="invoice-content"
                className="max-w-3xl mx-auto bg-card shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:bg-white"
            >

                {/* 1. HEADER */}
                <div className="p-6 md:p-8 border-b flex justify-between items-start bg-muted/30 print:bg-white">
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl overflow-hidden relative">
                            {logoUrl ? (
                                <Image
                                    src={logoUrl}
                                    alt="Logo"
                                    fill
                                    sizes="48px"
                                    className="object-contain p-1"
                                />
                            ) : (
                                businessName.charAt(0)
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{businessName}</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {tenant?.address || 'Lagos, Nigeria'}
                                <br />
                                {tenant?.phone || ''}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h2 className="text-2xl md:text-3xl font-light text-muted-foreground/40 uppercase tracking-widest">Invoice</h2>
                        <div className="mt-4 space-y-1">
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Invoice #</span>
                                <span className="font-mono font-medium">{invoiceNumber}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Date</span>
                                <span className="font-medium">{invoiceDate}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Due Date</span>
                                <span className="font-medium">{earliestDue}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Items</span>
                                <span className="font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CLIENT INFO */}
                <div className="p-6 md:p-8 pb-4">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bill To</div>
                    <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {client.email}
                        <br />
                        {client.phone}
                    </p>
                </div>

                {/* 3. ORDER ITEMS TABLE */}
                <div className="p-6 md:p-8">
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-4 py-3 w-8 text-center">#</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 w-16 md:w-24 text-center">Qty</th>
                                    <th className="px-4 py-3 w-24 md:w-32 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map((order, index) => (
                                    <tr key={order.id}>
                                        <td className="px-4 py-4 text-center text-muted-foreground">{index + 1}</td>
                                        <td className="px-4 py-4">
                                            <p className="font-medium text-foreground">
                                                {order.fabric_description || 'Custom Tailoring Service'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Color: {order.color || 'N/A'}
                                                <span className="mx-2">·</span>
                                                Due: {new Date(order.delivery_date).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-center">{order.quantity}</td>
                                        <td className="px-4 py-4 text-right">₦{order.total_amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. TOTALS */}
                <div className="p-6 md:p-8 pt-0 flex flex-col sm:flex-row justify-end">
                    <div className="w-full sm:w-72 space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal ({orders.length} item{orders.length !== 1 ? 's' : ''})</span>
                            <span>₦{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Total Paid</span>
                            <span>(₦{totalPaid.toLocaleString()})</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between items-center">
                            <span className="font-bold text-foreground">Total Due</span>
                            <span className={`text-xl font-bold ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                ₦{balance.toLocaleString()}
                            </span>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <div className={`px-4 py-1 border-2 rounded uppercase text-xs font-bold tracking-widest rotate-[-10deg] ${isPaid
                                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                {isPaid ? 'PAID IN FULL' : 'PAYMENT PENDING'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. PER-ORDER PAYMENT BREAKDOWN */}
                {orders.length > 1 && (
                    <div className="px-6 md:px-8 pb-6">
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/30 px-4 py-2.5 border-b">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Breakdown</h4>
                            </div>
                            <div className="divide-y">
                                {orders.map((order, index) => {
                                    const orderBalance = order.total_amount - (order.paid_amount || 0)
                                    const orderPaid = orderBalance <= 0
                                    return (
                                        <div key={order.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground font-mono">{index + 1}.</span>
                                                <span className="font-medium text-foreground line-clamp-1">
                                                    {order.fabric_description || 'Custom Order'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {order.paid_amount > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Pd: ₦{order.paid_amount.toLocaleString()}
                                                    </span>
                                                )}
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                    orderPaid
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {orderPaid ? 'Cleared' : `₦${orderBalance.toLocaleString()} due`}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. FOOTER */}
                <div className="p-6 md:p-8 bg-muted/30 border-t mt-8 print:bg-white print:border-t-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Payment Details</h4>
                            <p className="text-sm text-muted-foreground">
                                Bank Name: <span className="font-medium text-foreground">{tenant?.bank_name || 'Not set'}</span><br />
                                Account Name: <span className="font-medium text-foreground">{tenant?.account_name || tenant?.business_name}</span><br />
                                Account No: <span className="font-medium text-foreground">{tenant?.account_number || 'Not set'}</span>
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Terms & Conditions</h4>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                                <li>Payment confirms and validates your order.</li>
                                <li>A 70% deposit is required before work or production can commence.</li>
                                <li>The outstanding balance must be paid in full upon final fitting and before pickup.</li>
                                <li>Full payment is required before any order can be dispatched or delivered.</li>
                                <li>Orders may be collected via pickup or delivered at the client’s expense.</li>
                                <li>Once a bill or invoice has been created and finalized, its style or details can no longer be modified.</li>
                            </ul>
                            <p className="mt-4 font-handwriting text-xl text-foreground">Thank You!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
