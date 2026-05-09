import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import { InvoiceActions } from '@/components/invoice-actions'

export default async function InvoiceDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: order } = await supabase
        .from('orders')
        .select('*, clients(*)')
        .eq('id', id)
        .single()

    if (!order) return <div>Invoice not found</div>

    // Fetch tenant details including the new bank fields
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', order.tenant_id)
        .single()

    const businessName = tenant?.business_name || 'Fashion Brand'
    const logoUrl = tenant?.logo_url || null

    const balance = (order.total_amount || 0) - (order.paid_amount || 0)
    const isPaid = balance <= 0
    const invoiceDate = new Date(order.created_at).toLocaleDateString()
    const dueDate = new Date(order.delivery_date).toLocaleDateString()

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
                                <img
                                    src={logoUrl}
                                    alt="Logo"
                                    className="absolute inset-0 w-full h-full object-contain p-1"
                                    crossOrigin="anonymous"
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
                        <h2 className="text-2xl md:text-3xl font-light text-muted-foreground/40 uppercase tracking-widest">Invoice</h2>
                        <div className="mt-4 space-y-1">
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Invoice #</span>
                                <span className="font-mono font-medium">{order.id.slice(0, 6).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Date</span>
                                <span className="font-medium">{invoiceDate}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-muted-foreground">Due Date</span>
                                <span className="font-medium">{dueDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CLIENT INFO */}
                <div className="p-6 md:p-8 pb-4">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bill To</div>
                    <h3 className="text-lg font-semibold text-foreground">{order.clients?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {order.clients?.email}
                        <br />
                        {order.clients?.phone}
                    </p>
                </div>

                {/* 3. ORDER ITEMS */}
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

                {/* 4. TOTALS */}
                <div className="p-6 md:p-8 pt-0 flex flex-col sm:flex-row justify-end">
                    <div className="w-full sm:w-64 space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>₦{(order.total_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Paid</span>
                            <span>(₦{order.paid_amount?.toLocaleString() || '0'})</span>
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

                {/* 5. FOOTER */}
                <div className="p-6 md:p-8 bg-muted/30 border-t mt-8 print:bg-white print:border-t-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Payment Details</h4>
                            {/* DYNAMIC PAYMENT DETAILS */}
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
                            <p className="mt-4 font-handwriting text-xl text-foreground">Thank you for choosing {businessName}!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}