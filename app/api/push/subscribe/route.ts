import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    try {
        const subscription = await request.json()
        const supabase = await createClient()

        // Verify auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get tenant ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
        }

        // Save subscription
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                tenant_id: profile.tenant_id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            }, {
                onConflict: 'endpoint' // Ensure we don't have duplicate endpoints
            })

        if (error) {
            console.error('Supabase Error:', error)
            return NextResponse.json({ error: error.message || 'Failed to save subscription' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Subscription Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
