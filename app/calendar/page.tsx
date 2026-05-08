import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { CalendarView } from '@/components/calendar-view'

export default async function CalendarPage() {
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

    // Fetch all orders with client names
    const { data: orders } = await supabase
        .from('orders')
        .select('*, clients(name, email)')
        .eq('tenant_id', tenantId)
        .order('delivery_date', { ascending: true })

    // Active orders count for sidebar badge
    const activeOrders = (orders || []).filter(
        o => o.status !== 'delivered' && o.status !== 'ready'
    )

    return (
        <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={activeOrders.length}>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
                    <p className="text-muted-foreground text-sm">Track delivery deadlines at a glance.</p>
                </div>

                <CalendarView orders={orders || []} />
            </div>
        </NavShell>
    )
}
