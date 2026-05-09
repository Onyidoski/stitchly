import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import { DocumentActions } from '@/components/document-actions'
import type { ReactNode } from 'react'

function MeasurementRow({ label, value }: { label: string; value: ReactNode }) {
    if (!value && value !== 0) return null
    return (
        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
    )
}

export default async function MeasurementDocumentPage({
    params,
}: {
    params: Promise<{ id: string; measurementId: string }>
}) {
    const { id: clientId, measurementId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>Business profile not found</div>

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!client) return <div>Client not found</div>

    const { data: measurement } = await supabase
        .from('measurements')
        .select('*')
        .eq('id', measurementId)
        .eq('client_id', clientId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!measurement) return <div>Measurement not found</div>

    // Fetch tenant (for branding)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

    const businessName = tenant?.business_name || 'Fashion Brand'
    const logoUrl = tenant?.logo_url || null
    const m = measurement

    // Collect sleeve data
    const sleeves = [
        { label: 'Short', length: m.sleeve_length_short, round: m.round_sleeve_short },
        { label: 'Elbow', length: m.sleeve_length_elbow, round: m.round_sleeve_elbow },
        { label: '3/4', length: m.sleeve_length_3_4, round: m.round_sleeve_3_4 },
        { label: 'Full', length: m.sleeve_length_full, round: m.round_sleeve_full },
    ].filter(s => s.length || s.round)

    return (
        <div className="min-h-screen bg-muted/50 p-4 md:p-8 font-sans">

            <DocumentActions
                backHref={`/clients/${clientId}`}
                backLabel="Back to Client"
                filename={`measurement-${client.name.replace(/\s+/g, '-').toLowerCase()}.pdf`}
            />

            <div
                id="document-content"
                className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
                style={{ color: '#111' }}
            >

                {/* 1. HEADER */}
                <div className="p-6 md:p-8 border-b flex justify-between items-start bg-gray-50">
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden relative">
                            {logoUrl ? (
                                <Image
                                    src={logoUrl}
                                    alt="Logo"
                                    fill
                                    sizes="48px"
                                    className="object-contain p-1"
                                />
                            ) : (
                                businessName.charAt(0)
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {tenant?.address || 'Lagos, Nigeria'}
                                <br />
                                {tenant?.phone || ''}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h2 className="text-2xl md:text-3xl font-light text-gray-300 uppercase tracking-widest">Measurement</h2>
                        <div className="mt-4 space-y-1">
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-gray-500">Ref #</span>
                                <span className="font-mono font-medium text-gray-900">{m.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-end gap-4 text-sm">
                                <span className="text-gray-500">Date</span>
                                <span className="font-medium text-gray-900">{new Date(m.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CLIENT INFO */}
                <div className="p-6 md:p-8 pb-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client</div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">
                        {client.email && <>{client.email}<br /></>}
                        {client.phone}
                        {client.gender && (
                            <span className="ml-3 capitalize text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{client.gender}</span>
                        )}
                    </p>
                </div>

                {/* 3. BODY / TOP MEASUREMENTS */}
                <div className="p-6 md:p-8 pt-2">
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Body / Top</h4>
                        <div className="h-0.5 w-12 bg-indigo-600 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                        <MeasurementRow label="Round Shoulder" value={m.round_shoulder} />
                        <MeasurementRow label="Round Armhole" value={m.round_armhole} />
                        <MeasurementRow label="Upper Bust" value={m.round_upper_bust} />
                        <MeasurementRow label="Shoulder" value={m.shoulder} />
                        <MeasurementRow label="Bust Span" value={m.bust_span} />
                        <MeasurementRow label="Bust" value={m.bust} />
                        <MeasurementRow label="Bust Point" value={m.bust_point} />
                        <MeasurementRow label="Underbust" value={m.underbust} />
                        <MeasurementRow label="Underbust Point" value={m.underbust_point} />
                        <MeasurementRow label="Waist" value={m.waist} />
                        <MeasurementRow label="Waist Point" value={m.waist_point} />
                        <MeasurementRow label="Hips" value={m.hip} />
                        <MeasurementRow label="Hip Point" value={m.hip_point} />
                        <MeasurementRow label="Back Length" value={m.back_length} />
                        <MeasurementRow label="Knee Length" value={m.knee_length} />
                        <MeasurementRow label="Blouse Length" value={m.blouse_length} />
                        <MeasurementRow label="Full Length" value={m.full_length} />
                    </div>
                </div>

                {/* 4. SLEEVES */}
                {sleeves.length > 0 && (
                    <div className="p-6 md:p-8 pt-2">
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Sleeves</h4>
                            <div className="h-0.5 w-12 bg-indigo-600 rounded-full"></div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 border-b">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left font-medium">Type</th>
                                        <th className="px-4 py-2.5 text-center font-medium">Length</th>
                                        <th className="px-4 py-2.5 text-center font-medium">Round</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {sleeves.map((s) => (
                                        <tr key={s.label}>
                                            <td className="px-4 py-3 font-medium text-gray-900">{s.label}</td>
                                            <td className="px-4 py-3 text-center text-gray-700">{s.length || '-'}</td>
                                            <td className="px-4 py-3 text-center text-gray-700">{s.round || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 5. TROUSER / BOTTOM */}
                <div className="p-6 md:p-8 pt-2">
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Trouser / Bottom</h4>
                        <div className="h-0.5 w-12 bg-indigo-600 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                        <MeasurementRow label="Trouser Waist" value={m.trouser_waist} />
                        <MeasurementRow label="Trouser Hips" value={m.trouser_hips} />
                        <MeasurementRow label="Hip Point" value={m.trouser_hip_point} />
                        <MeasurementRow label="Thigh" value={m.thigh} />
                        <MeasurementRow label="Round Knee" value={m.round_knee} />
                        <MeasurementRow label="Ankle" value={m.ankle} />
                        <MeasurementRow label="Trouser Length" value={m.trouser_length} />
                        <MeasurementRow label="Pallazo Length" value={m.pallazo_length} />
                    </div>
                </div>

                {/* 6. NOTES */}
                {m.notes && (
                    <div className="px-6 md:px-8 pb-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Notes</h4>
                            <p className="text-sm text-amber-900">{m.notes}</p>
                        </div>
                    </div>
                )}

                {/* 7. FOOTER */}
                <div className="p-6 md:p-8 bg-gray-50 border-t mt-4">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400">
                            Generated by {businessName} · {new Date().toLocaleDateString()}
                        </p>
                        <p className="font-handwriting text-lg text-gray-900">Thank You!</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
