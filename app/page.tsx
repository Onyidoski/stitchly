import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Scissors, AlertCircle, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { PendingPaymentsSheet } from '@/components/pending-payments-sheet' 
import { RecentOrders } from '@/components/recent-orders'
import { RevenueChart } from '@/components/revenue-chart' // <--- IMPORT THIS

export default async function Dashboard() {
  const supabase = await createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Please log in</div>

  // 2. Get Tenant Info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, tenant_id, tenants(business_name)')
    .eq('id', user.id)
    .single()

  // @ts-ignore
  const businessName = profile?.tenants?.business_name || 'My Business'
  const tenantId = profile?.tenant_id

  // 3. Fetch Real Data
  const [clientsResult, activeOrdersResult, completedOrdersResult, financialResult, recentOrdersResult, allOrdersResult] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).neq('status', 'delivered'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'delivered'),
    supabase
      .from('orders')
      .select('id, total_amount, paid_amount, clients(name)')
      .eq('tenant_id', tenantId)
      .neq('payment_status', 'paid')
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*, clients(name, email)') 
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5),
    // F. Fetch ALL orders for the Chart
    supabase
        .from('orders')
        .select('created_at, paid_amount')
        .eq('tenant_id', tenantId)
  ])

  const totalClients = clientsResult.count || 0
  const activeOrders = activeOrdersResult.count || 0
  const completedOrders = completedOrdersResult.count || 0
  const pendingOrders = (financialResult.data || []) as any 
  const recentOrders = recentOrdersResult.data || []

  // --- CHART DATA PROCESSING ---
  const allOrders = allOrdersResult.data || []
  
  // 1. Initialize months
  const monthlyData = [
    { name: "Jan", total: 0 }, { name: "Feb", total: 0 }, { name: "Mar", total: 0 },
    { name: "Apr", total: 0 }, { name: "May", total: 0 }, { name: "Jun", total: 0 },
    { name: "Jul", total: 0 }, { name: "Aug", total: 0 }, { name: "Sep", total: 0 },
    { name: "Oct", total: 0 }, { name: "Nov", total: 0 }, { name: "Dec", total: 0 },
  ]

  // 2. Aggregate data
  allOrders.forEach(order => {
    const date = new Date(order.created_at)
    const monthIndex = date.getMonth() // 0 = Jan, 1 = Feb...
    const amount = order.paid_amount || 0
    
    // Only count current year? (Optional: remove this if if you want all-time by month)
    if (date.getFullYear() === new Date().getFullYear()) {
        monthlyData[monthIndex].total += amount
    }
  })
  // -----------------------------

  return (
    <NavShell businessName={businessName} userEmail={user.email || ''}>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        
        {/* METRIC CARDS */}
        <Link href="/clients" className="block">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalClients}</div>
                <p className="text-xs text-muted-foreground">Saved profiles</p>
            </CardContent>
            </Card>
        </Link>

        <Link href="/orders" className="block">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full border-l-4 border-l-blue-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{activeOrders}</div>
                <p className="text-xs text-muted-foreground">In production</p>
            </CardContent>
            </Card>
        </Link>

        <Link href="/orders" className="block">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full border-l-4 border-l-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{completedOrders}</div>
                <p className="text-xs text-muted-foreground">Delivered jobs</p>
            </CardContent>
            </Card>
        </Link>

        <PendingPaymentsSheet orders={pendingOrders} />

      </div>

      {/* CHARTS & RECENT ORDERS SECTION */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-7 mt-4">
         
         {/* CHART (Takes up 4 columns) */}
         <div className="xl:col-span-4">
            <RevenueChart data={monthlyData} />
         </div>

         {/* RECENT ORDERS (Takes up 3 columns) */}
         <Card className="xl:col-span-3 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="grid gap-2">
                <CardTitle>Recent Orders</CardTitle>
                <p className="text-sm text-muted-foreground">Latest transactions.</p>
              </div>
              <Link href="/clients">
                <Badge variant="outline" className="flex items-center gap-1 cursor-pointer">
                    View All <ArrowUpRight className="h-3 w-3" />
                </Badge>
              </Link>
            </CardHeader>
            <CardContent>
               <RecentOrders orders={recentOrders} />
            </CardContent>
         </Card>
      </div>
    </NavShell>
  )
}