import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { AddMeasurementSheet } from '@/components/add-measurement-sheet'
import { AddOrderSheet } from '@/components/add-order-sheet'
import { EditMeasurementSheet } from '@/components/edit-measurement-sheet'
import { OrderSelectionWrapper } from '@/components/order-selection-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Phone, User } from 'lucide-react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { WhatsAppMessageButton } from '@/components/whatsapp-message-button'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ClientDetailsPage({ params }: PageProps) {
    const { id } = await params

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

    // 1. Fetch Client
    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()

    if (!client) {
        return <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={0}><div>Client not found</div></NavShell>
    }

    // 2. Fetch Active Orders Count
    const { count: activeOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .neq('status', 'delivered')
        .neq('status', 'ready')

    // 3. Fetch Measurements & Orders for Client
    const { data: measurements } = await supabase
        .from('measurements')
        .select('*')
        .eq('client_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    // Helper to render simple measurement blocks
    const MBlock = ({ label, value }: { label: string, value: any }) => {
        if (!value) return null
        return (
            <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
                <span className="font-semibold text-sm">{value}</span>
            </div>
        )
    }

    const activeOrder =
        orders?.find((o) => o.status !== 'delivered' && o.status !== 'ready') ?? orders?.[0]

    const clientWhatsAppContext = {
        clientName: client.name,
        businessName,
        orderName: activeOrder?.fabric_description ?? undefined,
        status: activeOrder?.status,
        deliveryDate: activeOrder?.delivery_date,
        totalAmount: activeOrder?.total_amount,
        paidAmount: activeOrder?.paid_amount,
    }

    return (
        <NavShell businessName={businessName} userEmail={user.email || ''} activeOrdersCount={activeOrdersCount || 0}>

            {/* HEADER */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl">{client.name[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{client.name}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2.5">
                            {client.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {client.phone}
                                </span>
                            )}
                            {client.gender && (
                                <span className="flex items-center gap-1 capitalize">
                                    <User className="h-3 w-3" /> {client.gender}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <WhatsAppMessageButton
                    phone={client.phone}
                    context={clientWhatsAppContext}
                    label="Message on WhatsApp"
                    className="w-full sm:w-auto"
                />
            </div>

            <Tabs defaultValue="orders" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="measurements">Measurements</TabsTrigger>
                </TabsList>

                {/* ORDERS TAB */}
                <TabsContent value="orders" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Order History</h3>
                        <AddOrderSheet clientId={client.id} />
                    </div>

                    {orders && orders.length > 0 ? (
                        <OrderSelectionWrapper
                            orders={orders}
                            clientId={client.id}
                            clientName={client.name}
                            clientPhone={client.phone}
                            businessName={businessName}
                        />
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            No orders yet.
                        </div>
                    )}
                </TabsContent>

                {/* MEASUREMENTS TAB */}
                <TabsContent value="measurements" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Measurement History</h3>
                        <AddMeasurementSheet clientId={client.id} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-1">
                        {measurements && measurements.length > 0 ? (
                            measurements.map((m) => (
                                <Card key={m.id}>
                                    <CardHeader className="pb-2 border-b bg-muted/20">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-sm font-medium text-muted-foreground flex flex-col">
                                                <span>{new Date(m.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs font-normal">Measurement ID: {m.id.slice(0, 4)}</span>
                                            </CardTitle>

                                            <div className="flex items-center gap-1">
                                                <Link href={`/clients/${client.id}/measurements/${m.id}`}>
                                                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer transition-colors" title="View Document">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                </Link>
                                                <EditMeasurementSheet measurement={m} />
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-4 space-y-6">

                                        {/* Body Section */}
                                        <div>
                                            <h4 className="font-semibold text-xs text-primary mb-3 uppercase tracking-wider">Body / Top</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-2">
                                                <MBlock label="Round Shoulder" value={m.round_shoulder} />
                                                <MBlock label="Round Armhole" value={m.round_armhole} />
                                                <MBlock label="Upper Bust" value={m.round_upper_bust} />
                                                <MBlock label="Shoulder" value={m.shoulder} />
                                                <MBlock label="Bust Span" value={m.bust_span} />
                                                <MBlock label="Bust" value={m.bust} />
                                                <MBlock label="Bust Point" value={m.bust_point} />
                                                <MBlock label="Underbust" value={m.underbust} />
                                                <MBlock label="Underbust Pt" value={m.underbust_point} />
                                                <MBlock label="Waist" value={m.waist} />
                                                <MBlock label="Waist Pt" value={m.waist_point} />
                                                <MBlock label="Hips" value={m.hip} />
                                                <MBlock label="Hip Pt" value={m.hip_point} />
                                                <MBlock label="Back Length" value={m.back_length} />
                                                <MBlock label="Knee Length" value={m.knee_length} />
                                                <MBlock label="Blouse Length" value={m.blouse_length} />
                                                <MBlock label="Full Length" value={m.full_length} />
                                            </div>
                                        </div>

                                        <div className="border-t"></div>

                                        {/* Sleeves Section */}
                                        <div>
                                            <h4 className="font-semibold text-xs text-primary mb-3 uppercase tracking-wider">Sleeves</h4>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-md">
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase">Length</div>
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase">Round</div>

                                                {(m.sleeve_length_short || m.round_sleeve_short) && (
                                                    <>
                                                        <div className="text-sm font-medium">{m.sleeve_length_short || '-'} <span className="text-xs font-normal text-muted-foreground">(Short)</span></div>
                                                        <div className="text-sm font-medium">{m.round_sleeve_short || '-'}</div>
                                                    </>
                                                )}
                                                {(m.sleeve_length_elbow || m.round_sleeve_elbow) && (
                                                    <>
                                                        <div className="text-sm font-medium">{m.sleeve_length_elbow || '-'} <span className="text-xs font-normal text-muted-foreground">(Elbow)</span></div>
                                                        <div className="text-sm font-medium">{m.round_sleeve_elbow || '-'}</div>
                                                    </>
                                                )}
                                                {(m.sleeve_length_3_4 || m.round_sleeve_3_4) && (
                                                    <>
                                                        <div className="text-sm font-medium">{m.sleeve_length_3_4 || '-'} <span className="text-xs font-normal text-muted-foreground">(3/4)</span></div>
                                                        <div className="text-sm font-medium">{m.round_sleeve_3_4 || '-'}</div>
                                                    </>
                                                )}
                                                {(m.sleeve_length_full || m.round_sleeve_full) && (
                                                    <>
                                                        <div className="text-sm font-medium">{m.sleeve_length_full || '-'} <span className="text-xs font-normal text-muted-foreground">(Full)</span></div>
                                                        <div className="text-sm font-medium">{m.round_sleeve_full || '-'}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t"></div>

                                        {/* Trouser Section */}
                                        <div>
                                            <h4 className="font-semibold text-xs text-primary mb-3 uppercase tracking-wider">Trouser / Bottom</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-2">
                                                <MBlock label="Tr. Waist" value={m.trouser_waist} />
                                                <MBlock label="Tr. Hips" value={m.trouser_hips} />
                                                <MBlock label="Hip Pt" value={m.trouser_hip_point} />
                                                <MBlock label="Thigh" value={m.thigh} />
                                                <MBlock label="Round Knee" value={m.round_knee} />
                                                <MBlock label="Ankle" value={m.ankle} />
                                                <MBlock label="Tr. Length" value={m.trouser_length} />
                                                <MBlock label="Pallazo" value={m.pallazo_length} />
                                            </div>
                                        </div>

                                        {m.notes && (
                                            <div className="mt-3 text-xs text-muted-foreground bg-muted p-3 rounded">
                                                <span className="font-bold">Note:</span> {m.notes}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                No measurements recorded yet.
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </NavShell>
    )
}
