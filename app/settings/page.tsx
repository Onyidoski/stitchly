import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from '@/components/settings-form'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, tenants(*)')
        .eq('id', user.id)
        .single()

    // FIX: Explicitly cast to 'any' to fix the "business_name" error
    // @ts-ignore
    const tenant: any = profile?.tenants

    // Safely check if tenant is an array (sometimes happens with Supabase joins)
    const tenantData = Array.isArray(tenant) ? tenant[0] : tenant

    return (
        <NavShell 
            businessName={tenantData?.business_name || 'Stitchly'} 
            userEmail={user.email || ''} 
            activeOrdersCount={0}
        >
            <div className="flex flex-col gap-6 max-w-2xl">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Manage your business profile and branding.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Business Profile</CardTitle>
                        <CardDescription>
                            This information will appear on your Invoices and Receipts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SettingsForm tenant={tenantData} />
                    </CardContent>
                </Card>
            </div>
        </NavShell>
    )
}