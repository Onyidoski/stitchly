import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { FinancesView } from '@/components/finances-view'

export default async function FinancesPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(business_name)')
        .eq('id', user.id)
        .single()

    // @ts-ignore
    const businessName = profile?.tenants?.business_name || 'Stitchly'
    const tenantId = profile?.tenant_id

    const [expensesResult, activeCountResult] = await Promise.all([
        supabase
            .from('expenses')
            .select('*, orders(fabric_description)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),

        supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .neq('status', 'delivered')
            .neq('status', 'ready'),
    ])

    return (
        <NavShell
            businessName={businessName}
            userEmail={user.email || ''}
            activeOrdersCount={activeCountResult.count || 0}
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Finances</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Track all your business expenses, including bulk purchases not tied to a single order.
                    </p>
                </div>

                <FinancesView initialExpenses={expensesResult.data || []} />
            </div>
        </NavShell>
    )
}
