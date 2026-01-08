import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Scissors, AlertCircle } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()

  // If no user, the middleware will redirect, but we return null/placeholder here to be safe
  if (!user) {
    return <div>Please log in</div>
  }

  // 2. Get Tenant Info (Business Name)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, tenants(business_name)')
    .eq('id', user.id)
    .single()

  // Safely extract business name with fallback
  // @ts-ignore
  const businessName = profile?.tenants?.business_name || 'My Business'

  return (
    <NavShell businessName={businessName} userEmail={user.email || ''}>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        
        {/* TOTAL CLIENTS CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active customers</p>
          </CardContent>
        </Card>

        {/* ACTIVE ORDERS CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">In production</p>
          </CardContent>
        </Card>

        {/* PENDING PAYMENTS CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Unpaid invoices</p>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
         {/* RECENT ORDERS PLACEHOLDER */}
         <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Recent Orders</CardTitle>
                <p className="text-sm text-muted-foreground">Recent transactions from your store.</p>
              </div>
            </CardHeader>
            <CardContent>
               <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                 No orders yet.
               </div>
            </CardContent>
         </Card>
      </div>
    </NavShell>
  )
}