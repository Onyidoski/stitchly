import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt } from "lucide-react"
import Link from "next/link"
import { Search } from '@/components/search'
import { getOrderBalance, getOrderNet } from '@/lib/order-money'

export default async function ReceiptsPage({
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

    // Fetch orders that have at least some payment (paid_amount > 0)
    const { data: orders } = await supabase
        .from('orders')
        .select('*, clients(name, email)')
        .eq('tenant_id', tenantId)
        .gt('paid_amount', 0)
        .order('created_at', { ascending: false })

    // Server-side filtering
    const filteredOrders = query
        // @ts-ignore
        ? orders?.filter(o => o.clients?.name?.toLowerCase().includes(query.toLowerCase()) || o.id.includes(query))
        : orders

    // Calculate active orders for sidebar badge
    const { data: allOrders } = await supabase
        .from('orders')
        .select('status')
        .eq('tenant_id', tenantId)

    const activeOrdersCount = (allOrders || []).filter(o => o.status !== 'delivered' && o.status !== 'ready').length

    return (
        <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={activeOrdersCount}>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Receipts</h2>
                        <p className="text-muted-foreground">View and print payment receipts for your orders.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Search placeholder="Search by client or ID..." />
                </div>

                <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[80px] hidden xs:table-cell">Receipt #</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead className="hidden md:table-cell">Total Amount</TableHead>
                                <TableHead>Amount Paid</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders?.map((order) => {
                                const balance = getOrderBalance(order)
                                const isPaid = balance <= 0
                                const net = getOrderNet(order)
                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs hidden xs:table-cell">
                                            #{order.id.slice(0, 6).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/clients/${order.client_id}`}
                                                className="hover:underline hover:text-primary transition-colors"
                                            >
                                                {/* @ts-ignore */}
                                                {order.clients?.name || 'Unknown'}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">₦{Math.round(net).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <span className="text-emerald-600 font-bold text-xs sm:text-sm">
                                                ₦{order.paid_amount?.toLocaleString() || '0'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline"
                                                className={`scale-90 sm:scale-100 whitespace-nowrap ${isPaid
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800"
                                                        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800"
                                                    }`}>
                                                {isPaid ? 'Fully Paid' : 'Partial'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/receipts/${order.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Receipt className="h-4 w-4 text-muted-foreground" />
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
