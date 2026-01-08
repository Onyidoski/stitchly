import { createClient } from '@/utils/supabase/server'
import Link from "next/link"
import NavShell from '@/components/nav-shell'
import { AddClientSheet } from '@/components/add-client-sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Please log in</div>

  // 1. Get Tenant Info for the Shell
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, tenants(business_name)')
    .eq('id', user.id)
    .single()
    
  // @ts-ignore
  const businessName = profile?.tenants?.business_name || 'Stitchly'
  const tenantId = profile?.tenant_id

  // 2. Fetch Clients for this Tenant
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
          {clients && clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{client.name[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell className="capitalize">{client.gender}</TableCell>
                    <TableCell className="text-right">
                        <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline text-sm">
  View
</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No clients found. Add your first client above.
            </div>
          )}
        </CardContent>
      </Card>
    </NavShell>
  )
}