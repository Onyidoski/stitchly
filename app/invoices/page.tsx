import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText } from "lucide-react"
import Link from "next/link"
import { Search } from '@/components/search' // Import the new component

export default async function InvoicesPage({
    searchParams,
}: {
    searchParams: Promise<{ q: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(business_name)')
        .eq('id', user.id)
        .single()

    // @ts-ignore
    const businessName = profile?.tenants?.business_name || 'Stitchly'
    const tenantId = profile?.tenant_id

    const params = await searchParams
    const query = params.q || ''

    // Fetch orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*, clients(name, email)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    // Server-side filtering (MVP approach)
    const filteredOrders = query
        // @ts-ignore
        ? orders?.filter(o => o.clients?.name?.toLowerCase().includes(query.toLowerCase()) || o.id.includes(query))
        : orders

    // Calculate active orders for sidebar badge
    const activeOrdersCount = (orders || []).filter(o => o.status !== 'delivered' && o.status !== 'ready').length

    return (
        <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={activeOrdersCount}>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
                        <p className="text-muted-foreground">View and print invoices for your orders.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* FIX: Use the client-side Search component */}
                    <Search placeholder="Search by client or ID..." />
                </div>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                {/* Hide Invoice # on very small screens */}
                                <TableHead className="w-[80px] hidden xs:table-cell">Invoice #</TableHead>
                                {/* Hide Date on mobile */}
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead>Client</TableHead>
                                {/* Hide Total & Paid on mobile, just show Balance */}
                                <TableHead className="hidden md:table-cell">Total Amount</TableHead>
                                <TableHead className="hidden md:table-cell">Paid</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders?.map((order) => {
                                const balance = order.total_amount - (order.paid_amount || 0)
                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs hidden xs:table-cell">
                                            #{order.id.slice(0, 6).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {/* FIX: Link to Client Profile */}
                                            <Link 
                                                href={`/clients/${order.client_id}`} 
                                                className="hover:underline hover:text-primary transition-colors"
                                            >
                                                {/* @ts-ignore */}
                                                {order.clients?.name || 'Unknown'}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">₦{order.total_amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-muted-foreground hidden md:table-cell">
                                            ₦{order.paid_amount?.toLocaleString() || '0'}
                                        </TableCell>
                                        <TableCell>
                                            {balance > 0 ? (
                                                <span className="text-red-600 font-bold text-xs sm:text-sm">₦{balance.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-emerald-600 text-xs font-medium">Cleared</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" 
                                                className={`scale-90 sm:scale-100 whitespace-nowrap ${
                                                    order.payment_status === 'paid' 
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                                    : "bg-orange-50 text-orange-700 border-orange-200"
                                                }`}>
                                                {order.payment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/invoices/${order.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </NavShell>
    )
}