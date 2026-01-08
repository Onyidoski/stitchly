import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { PendingPaymentsSheet } from '@/components/pending-payments-sheet'
import { RecentOrders } from '@/components/recent-orders'
import { RevenueChart } from '@/components/revenue-chart'
import { PendingPaymentsWidget } from '@/components/pending-payments-widget'
import { DashboardStats } from '@/components/dashboard-stats'
import { Button } from "@/components/ui/button"
import { ChevronDown, RefreshCw, MoreHorizontal, Scissors, ArrowUpRight } from 'lucide-react'

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
  // Calculate counts for passing to components
  const activeOrdersCount = activeOrders;

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

    // Only count current year?
    if (date.getFullYear() === new Date().getFullYear()) {
      monthlyData[monthIndex].total += amount
    }
  })
  // -----------------------------

  return (
    <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={activeOrdersCount}>
      <div className="flex flex-col gap-6">

        {/* TOP HEADER / WELCOME */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!</h2>
            <p className="text-muted-foreground">Here is your daily activity.</p>
          </div>
          {/* Right side header actions if any */}
        </div>

        {/* METRIC CARDS ROW */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardStats
            totalRevenue={monthlyData.reduce((acc, curr) => acc + curr.total, 0)}
            activeOrders={activeOrders}
            completedOrders={completedOrders}
            totalClients={totalClients || 0}
          />
        </div>

        {/* CHARTS ROW */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-7 h-full">
          {/* Main Chart */}
          <div className="md:col-span-2 lg:col-span-5">
            <RevenueChart data={monthlyData} />
          </div>

          {/* Pending Payments Widget (Replaces Sales Map) */}
          <PendingPaymentsWidget orders={pendingOrders} />
        </div>

        {/* BOTTOM ROW (Recent Orders only) */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <Link href="/orders">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer">
                  View All
                </Badge>
              </Link>
            </CardHeader>
            <CardContent className="px-2">
              <RecentOrders orders={recentOrders} />
            </CardContent>
          </Card>
        </div>
      </div>
    </NavShell>
  )
}