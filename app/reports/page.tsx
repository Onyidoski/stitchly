import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { ReportView } from '@/components/report-view'

export default async function ReportsPage() {
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

    // Fetch all data in parallel
    const [ordersResult, expensesResult, activeCountResult] = await Promise.all([
        // All orders with client info
        supabase
            .from('orders')
            .select('*, clients(name, email)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),

        // All expenses
        supabase
            .from('expenses')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),

        // Active orders count for sidebar
        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .neq('status', 'delivered')
            .neq('status', 'ready'),
    ])

    return (
        <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={activeCountResult.count || 0}>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
                    <p className="text-muted-foreground text-sm">Monthly business performance overview.</p>
                </div>

                <ReportView
                    orders={ordersResult.data || []}
                    expenses={expensesResult.data || []}
                    businessName={businessName}
                />
            </div>
        </NavShell>
    )
}
