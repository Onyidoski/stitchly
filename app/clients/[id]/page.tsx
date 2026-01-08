import { createClient } from '@/utils/supabase/server'
import NavShell from '@/components/nav-shell'
import { AddMeasurementSheet } from '@/components/add-measurement-sheet'
import { AddOrderSheet } from '@/components/add-order-sheet'
import { EditOrderSheet } from '@/components/edit-order-sheet'
import { EditMeasurementSheet } from '@/components/edit-measurement-sheet' // <--- Imported
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Phone, User, Calendar } from 'lucide-react'
import Image from "next/image"

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

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', profile?.tenant_id)
        .single()

    if (!client) {
        return <NavShell businessName={businessName} userEmail={user.email || ''}><div>Client not found</div></NavShell>
    }

    const { data: measurements } = await supabase
        .from('measurements')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })

    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', id)
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

    return (
        <NavShell businessName={businessName} userEmail={user.email || ''}>

            {/* HEADER */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl">{client.name[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{client.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {client.phone}</span>}
                            {client.gender && <span className="flex items-center gap-1 capitalize"><User className="h-3 w-3" /> {client.gender}</span>}
                        </div>
                    </div>
                </div>
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

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        {orders && orders.length > 0 ? (
                            orders.map((order) => (
                                <Card key={order.id} className="overflow-hidden flex flex-col">
                                    <CardHeader className="bg-muted/30 pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <CardTitle className="text-base font-semibold line-clamp-1 pr-2">
                                                    {order.fabric_description || 'Custom Order'}
                                                </CardTitle>
                                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    Due: {new Date(order.delivery_date).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge variant={order.status === 'ready' ? 'default' : 'outline'} className="capitalize">
                                                    {order.status}
                                                </Badge>
                                                <EditOrderSheet order={order} />
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-6 flex-1 flex flex-col gap-6">
                                        {order.style_image_urls && order.style_image_urls.length > 0 && (
                                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                                {order.style_image_urls.map((url: string, i: number) => (
                                                    <a
                                                        key={i}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="relative h-48 w-48 shrink-0 rounded-xl overflow-hidden border shadow-sm snap-start hover:opacity-95 transition-all bg-slate-100"
                                                    >
                                                        <Image
                                                            src={url}
                                                            alt="Style Reference"
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 192px, 192px"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-auto flex justify-between items-center text-sm border-t pt-3">
                                            <div className="grid gap-1">
                                                <span className="text-muted-foreground">Color: <span className="text-foreground">{order.color || 'N/A'}</span></span>
                                                <span className="text-muted-foreground">Qty: <span className="text-foreground">{order.quantity}</span></span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg flex items-center justify-end gap-1">
                                                    <span>₦{order.total_amount?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    {order.paid_amount > 0 && order.paid_amount < order.total_amount && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Pd: ₦{order.paid_amount.toLocaleString()}
                                                        </span>
                                                    )}
                                                    <Badge variant={order.payment_status === 'paid' ? 'secondary' : 'destructive'} className="text-xs capitalize">
                                                        {order.payment_status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                No orders yet.
                            </div>
                        )}
                    </div>
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
                                    {/* UPDATE: Card Header with Edit Button */}
                                    <CardHeader className="pb-2 border-b bg-muted/20">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-sm font-medium text-muted-foreground flex flex-col">
                                                <span>{new Date(m.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs font-normal">Measurement ID: {m.id.slice(0, 4)}</span>
                                            </CardTitle>

                                            <EditMeasurementSheet measurement={m} />
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

                                        {/* Sleeves Section (Side by Side) */}
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