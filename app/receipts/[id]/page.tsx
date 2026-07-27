import { createClient } from '@/utils/supabase/server'
import { ReceiptActions } from '@/components/receipt-actions'
import { PaymentAccountsFooter } from '@/components/payment-accounts-footer'
import {
    getDiscountLabel,
    getDiscountNaira,
    getOrderBalance,
    getOrderNet,
} from '@/lib/order-money'

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

export default async function ReceiptDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>Business profile not found</div>

    const { data: order } = await supabase
        .from('orders')
        .select('*, clients(*)')
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!order) return <div>Receipt not found</div>

    // Fetch tenant details
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

    const businessName = tenant?.business_name || 'Fashion Brand'
    const logoUrl = tenant?.logo_url || null
    const logoBase64 = logoUrl ? await logoToBase64(logoUrl) : null

    const totalPaid = order.paid_amount || 0
    const balance = getOrderBalance(order)
    const discount = getDiscountNaira(order)
    const net = getOrderNet(order)
    const discountLabel = getDiscountLabel(order)
    const isPaid = balance <= 0
    const receiptDate = new Date().toLocaleDateString()
    const orderDate = new Date(order.created_at).toLocaleDateString()

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
                                    data-pdf-src={logoBase64 || logoUrl}
                                    alt="Logo"
                                    crossOrigin="anonymous"
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
                                <span className="font-mono font-medium">{order.id.slice(0, 6).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Date Issued</span>
                                <span className="font-medium">{receiptDate}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Order Date</span>
                                <span className="font-medium">{orderDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CLIENT INFO */}
                <div className="p-6 md:p-8 pb-4">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Received From</div>
                    <h3 className="text-lg font-semibold text-foreground">{order.clients?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {order.clients?.email}
                        <br />
                        {order.clients?.phone}
                    </p>
                </div>

                {/* 3. PAYMENT DETAILS */}
                <div className="p-6 md:p-8">
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 w-16 md:w-24 text-center">Qty</th>
                                    <th className="px-4 py-3 w-24 md:w-32 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="px-4 py-4">
                                        <p className="font-medium text-foreground">
                                            {order.fabric_description || 'Custom Tailoring Service'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Color: {order.color || 'N/A'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4 text-center">{order.quantity}</td>
                                    <td className="px-4 py-4 text-right">₦{(order.total_amount || 0).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. PAYMENT SUMMARY */}
                <div className="p-6 md:p-8 pt-0 flex flex-col sm:flex-row justify-end">
                    <div className="w-full sm:w-64 space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Order Total</span>
                            <span>₦{(order.total_amount || 0).toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Discount</span>
                                <span className="text-emerald-600">−{discountLabel}</span>
                            </div>
                        )}
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Net</span>
                                <span>₦{Math.round(net).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="border-t pt-3 flex justify-between items-center">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">Amount Paid</span>
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                ₦{totalPaid.toLocaleString()}
                            </span>
                        </div>
                        {balance > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Outstanding Balance</span>
                                <span className="text-red-600 font-semibold">₦{Math.round(balance).toLocaleString()}</span>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <div className={`px-4 py-1 border-2 rounded uppercase text-xs font-bold tracking-widest rotate-[-10deg] ${isPaid
                                    ? 'border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300'
                                    : 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                                }`}>
                                {isPaid ? 'PAID IN FULL' : 'PARTIAL PAYMENT'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. FOOTER */}
                <div className="p-6 md:p-8 bg-muted/30 border-t mt-8 print:bg-white print:border-t-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <PaymentAccountsFooter tenant={tenant} title="Payment Information" />
                        <div>
                            <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Note</h4>
                            <p className="text-xs text-muted-foreground">
                                This receipt confirms the payment received for the above order.
                                Please retain this document for your records.
                                {balance > 0 && (
                                    <> The outstanding balance of ₦{Math.round(balance).toLocaleString()} is due upon final fitting and before pickup.</>
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
