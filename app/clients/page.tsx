import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { AddClientSheet } from '@/components/add-client-sheet'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientsTable } from "@/components/clients-table" // <--- Import the new component

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

  return (
    <NavShell businessName={businessName} userEmail={user.email || ''}>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        <AddClientSheet />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {/* We simply pass the data to our interactive table component */}
          <ClientsTable clients={clients || []} />
        </CardContent>
      </Card>
    </NavShell>
  )
}