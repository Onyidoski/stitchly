import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from '@/components/settings-form'
import { NotificationManager } from '@/components/notification-manager'
import { ThemeSelector } from '@/components/theme-selector' // [1] Import ThemeSelector

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

                {/* 1. BUSINESS PROFILE SETTINGS */}
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

                {/* 2. PUSH NOTIFICATION SETTINGS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            Manage how you receive alerts for upcoming deliveries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NotificationManager />
                    </CardContent>
                </Card>

                {/* 3. APPEARANCE SETTINGS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>
                            Customize the interface theme.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg bg-card">
                            <div className="space-y-0.5">
                                <h3 className="font-medium text-base">Theme Preferences</h3>
                                <p className="text-sm text-muted-foreground">
                                    Choose your preferred interface appearance.
                                </p>
                            </div>
                            <ThemeSelector />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </NavShell>
    )
}