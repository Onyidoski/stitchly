import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { OrdersTable } from '@/components/orders-table'

// FIX: Added interface to accept searchParams (URL query strings)
interface OrdersPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    // Await the params to get the 'tab' value
    const params = await searchParams
    const currentTab = (typeof params.tab === 'string' ? params.tab : 'active')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(business_name)')
        .eq('id', user.id)
        .single()

    // @ts-ignore
    const businessName = profile?.tenants?.business_name || 'Stitchly'
    const tenantId = profile?.tenant_id

    // Fetch ALL orders with client details
    const { data: orders } = await supabase
        .from('orders')
        .select('*, clients(name, email)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    const allOrders = orders || []

    // Filter into groups
    const activeOrders = allOrders.filter(o => o.status !== 'delivered' && o.status !== 'ready')
    const completedOrders = allOrders.filter(o => o.status === 'delivered' || o.status === 'ready')

    // Calculate active count for sidebar
    const activeOrdersCount = activeOrders.length

    return (
        <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={activeOrdersCount}>

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
                        <p className="text-muted-foreground">Manage and track all production.</p>
                    </div>
                </div>

                {/* FIX: Set defaultValue to the tab from URL */}
                <Tabs defaultValue={currentTab} className="space-y-4">
                    {/* FIX: Added w-fit to prevent background stretching */}
                    <TabsList className="bg-card p-1 rounded-xl w-fit flex-wrap h-auto justify-start">
                        <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 sm:flex-none">Active ({activeOrders.length})</TabsTrigger>
                        <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 sm:flex-none">Completed ({completedOrders.length})</TabsTrigger>
                        <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1 sm:flex-none">All ({allOrders.length})</TabsTrigger>
                    </TabsList>

                    {/* ACTIVE ORDERS TAB */}
                    <TabsContent value="active">
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                            <CardContent className="p-0">
                                <OrdersTable orders={activeOrders} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* COMPLETED ORDERS TAB */}
                    <TabsContent value="completed">
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                            <CardContent className="p-0">
                                <OrdersTable orders={completedOrders} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ALL ORDERS TAB */}
                    <TabsContent value="all">
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                            <CardContent className="p-0">
                                <OrdersTable orders={allOrders} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </NavShell>
    )
}