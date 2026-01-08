import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersTable } from '@/components/orders-table' // <--- Now using the smart table component

export default async function OrdersPage() {
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

  return (
    <NavShell businessName={businessName} userEmail={user.email || ''}>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track all production.</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="all">All Orders ({allOrders.length})</TabsTrigger>
        </TabsList>

        {/* ACTIVE ORDERS TAB */}
        <TabsContent value="active" className="space-y-4">
           {/* Now uses the search-enabled table */}
           <OrdersTable orders={activeOrders} />
        </TabsContent>

        {/* COMPLETED ORDERS TAB */}
        <TabsContent value="completed" className="space-y-4">
           <OrdersTable orders={completedOrders} />
        </TabsContent>

        {/* ALL ORDERS TAB */}
        <TabsContent value="all" className="space-y-4">
           <OrdersTable orders={allOrders} />
        </TabsContent>
      </Tabs>
    </NavShell>
  )
}