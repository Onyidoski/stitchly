import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { AddClientSheet } from '@/components/add-client-sheet'
import { Card, CardContent } from "@/components/ui/card"
import { ClientsTable } from "@/components/clients-table"

export default async function ClientsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    // 1. Get Tenant Info
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(business_name)')
        .eq('id', user.id)
        .single()

    // @ts-ignore
    const businessName = profile?.tenants?.business_name || 'Stitchly'
    const tenantId = profile?.tenant_id

    // 2. Fetch Clients
    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    // 3. Fetch Active Orders Count (Consistent logic: Not Delivered AND Not Ready)
    const { count: activeOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .neq('status', 'delivered')
        .neq('status', 'ready')

    return (
        <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={activeOrdersCount || 0}>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
                        <p className="text-muted-foreground">Manage your customer database and measurements.</p>
                    </div>
                    <AddClientSheet />
                </div>

                <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        <ClientsTable clients={clients || []} />
                    </CardContent>
                </Card>
            </div>
        </NavShell>
    )
}