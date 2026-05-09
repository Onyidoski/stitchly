import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// Initialize web-push
webpush.setVapidDetails(
    'mailto:admin@stitchly.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
)

// We use the service role key to bypass RLS for cron jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Find all active orders due in 1 or 2 days, or overdue
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const inTwoDays = new Date(today)
        inTwoDays.setDate(today.getDate() + 2)

        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*, clients(name)')
            .neq('status', 'ready')
            .neq('status', 'delivered')

        if (ordersError) throw ordersError

        // Group notifications by tenant_id
        const tenantNotifications: Record<string, string[]> = {}

        orders.forEach(order => {
            const deliveryDate = new Date(order.delivery_date)
            deliveryDate.setHours(0, 0, 0, 0)
            
            const diffTime = deliveryDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            let message = null
            if (diffDays < 0) {
                message = `🔴 OVERDUE: ${order.clients?.name}'s order (${order.fabric_description}) was due ${Math.abs(diffDays)} days ago!`
            } else if (diffDays === 0) {
                message = `🚨 DUE TODAY: ${order.clients?.name}'s order (${order.fabric_description}) is due today!`
            } else if (diffDays === 1) {
                message = `⚠️ DUE TOMORROW: ${order.clients?.name}'s order (${order.fabric_description})`
            } else if (diffDays === 2) {
                message = `📅 DUE IN 2 DAYS: ${order.clients?.name}'s order (${order.fabric_description})`
            }

            if (message) {
                if (!tenantNotifications[order.tenant_id]) {
                    tenantNotifications[order.tenant_id] = []
                }
                tenantNotifications[order.tenant_id].push(message)
            }
        })

        // 2. Fetch subscriptions for tenants that have notifications
        let sentCount = 0
        const tenantIds = Object.keys(tenantNotifications)
        
        if (tenantIds.length > 0) {
            const { data: subscriptions, error: subError } = await supabase
                .from('push_subscriptions')
                .select('*')
                .in('tenant_id', tenantIds)

            if (subError) throw subError

            // 3. Send out push notifications
            const pushPromises = subscriptions.map(async (sub) => {
                const messages = tenantNotifications[sub.tenant_id]
                if (!messages || messages.length === 0) return

                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }

                // If multiple orders, combine them into one notification
                const title = messages.length > 1 ? `You have ${messages.length} urgent order updates!` : messages[0]
                const body = messages.length > 1 ? messages.join('\n') : "Tap to open Stitchly and check your orders."

                try {
                    await webpush.sendNotification(
                        pushSubscription,
                        JSON.stringify({ title, body })
                    )
                    sentCount++
                } catch (err: unknown) {
                    const statusCode = typeof err === 'object' && err !== null && 'statusCode' in err
                        ? Number(err.statusCode)
                        : undefined
                    console.error('Failed to send push to endpoint:', sub.endpoint, statusCode)
                    // If subscription is invalid/expired (410 or 404), delete it from DB
                    if (statusCode === 410 || statusCode === 404) {
                        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                    }
                }
            })

            await Promise.all(pushPromises)
        }

        return NextResponse.json({ success: true, sent: sentCount })

    } catch (error: unknown) {
        console.error('Cron Error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Cron Error' }, { status: 500 })
    }
}
