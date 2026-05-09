import { createClient } from '@/utils/supabase/server'
import { ReceiptActions } from '@/components/receipt-actions'
import { redirect } from 'next/navigation'

// Convert an image URL to a base64 data URL on the server.
async function logoToBase64(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return null
        const buffer = await res.arrayBuffer()
        const contentType = res.headers.get('content-type') || 'image/png'
        const base64 = Buffer.from(buffer).toString('base64')
        return `data:${contentType};base64,${base64}`
    } catch {
        return null
    }
}

export default async function CombinedReceiptPage({
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>Business profile not found</div>

    // Fetch client
    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!client) return <div>Client not found</div>

    // Fetch all selected orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .eq('client_id', clientId)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (!orders || orders.length === 0) return <div>No orders found</div>

    // Fetch tenant details (business info)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

    const businessName = tenant?.business_name || 'Fashion Brand'
    const logoUrl = tenant?.logo_url || null
    const logoBase64 = logoUrl ? await logoToBase64(logoUrl) : null

    // Calculate totals across all orders
    const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const totalPaid = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0)
    const balance = totalAmount - totalPaid
    const isPaid = balance <= 0

    const receiptDate = new Date().toLocaleDateString()

    const receiptNumber = `R-${clientId.slice(0, 4).toUpperCase()}${orders[0].id.slice(0, 4).toUpperCase()}`

    return (
        <div className="min-h-screen bg-muted/50 p-4 md:p-8 font-sans">

            <ReceiptActions />

            <div
                id="receipt-content"
                className="max-w-3xl mx-auto bg-card shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:bg-white"
            >

                {/* 1. HEADER */}
                <div className="p-6 md:p-8 border-b flex justify-between items-start bg-muted/30 print:bg-white">
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl overflow-hidden relative">
                            {(logoBase64 || logoUrl) ? (
                                <img
                                    src={logoBase64 || logoUrl!}
                                    alt="Logo"
                                    className="absolute inset-0 w-full h-full object-contain p-1"
                                />
                            ) : (
                                businessName.charAt(0)
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{businessName}</h1>
                            {tenant?.slogan && (
                                <p className="text-xs text-muted-foreground/80 italic -mt-0.5 mb-1">{tenant.slogan}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                                {tenant?.address || 'Lagos, Nigeria'}
                                <br />
                                {tenant?.phone || ''}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h2 className="text-2xl md:text-3xl font-light text-emerald-500/60 uppercase tracking-widest">Receipt</h2>
                        <div className="mt-4 space-y-1">
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Receipt #</span>
                                <span className="font-mono font-medium">{receiptNumber}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Date Issued</span>
                                <span className="font-medium">{receiptDate}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Orders</span>
                                <span className="font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CLIENT INFO */}
                <div className="p-6 md:p-8 pb-4">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Received From</div>
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
                                    <th className="px-4 py-3 w-24 md:w-32 text-right">Paid</th>
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
                                        <td className="px-4 py-4 text-right text-emerald-600 font-medium">
                                            ₦{(order.paid_amount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. PAYMENT SUMMARY */}
                <div className="p-6 md:p-8 pt-0 flex flex-col sm:flex-row justify-end">
                    <div className="w-full sm:w-72 space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Order Total ({orders.length} item{orders.length !== 1 ? 's' : ''})</span>
                            <span>₦{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between items-center">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">Total Paid</span>
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                ₦{totalPaid.toLocaleString()}
                            </span>
                        </div>
                        {balance > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Outstanding Balance</span>
                                <span className="text-red-600 font-semibold">₦{balance.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <div className={`px-4 py-1 border-2 rounded uppercase text-xs font-bold tracking-widest rotate-[-10deg] ${isPaid
                                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                                    : 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                                }`}>
                                {isPaid ? 'PAID IN FULL' : 'PARTIAL PAYMENT'}
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
                                                <span className="text-xs text-emerald-600 font-medium">
                                                    Pd: ₦{(order.paid_amount || 0).toLocaleString()}
                                                </span>
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
                            <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Payment Information</h4>
                            <p className="text-sm text-muted-foreground">
                                Bank Name: <span className="font-medium text-foreground">{tenant?.bank_name || 'Not set'}</span><br />
                                Account Name: <span className="font-medium text-foreground">{tenant?.account_name || tenant?.business_name}</span><br />
                                Account No: <span className="font-medium text-foreground">{tenant?.account_number || 'Not set'}</span>
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Note</h4>
                            <p className="text-xs text-muted-foreground">
                                This receipt confirms the payment(s) received for the above order(s).
                                Please retain this document for your records.
                                {balance > 0 && (
                                    <> The outstanding balance of ₦{balance.toLocaleString()} is due upon final fitting and before pickup.</>
                                )}
                            </p>
                            <p className="mt-4 font-handwriting text-xl text-foreground">Thank you for choosing {businessName}!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
