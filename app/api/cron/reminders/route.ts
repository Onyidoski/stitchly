import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

// Prevent this route from being cached
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 1. Calculate "Tomorrow" (YYYY-MM-DD)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateString = tomorrow.toISOString().split('T')[0] // e.g. "2023-10-25"

  try {
    // 2. Find Orders due tomorrow (that aren't delivered yet)
    // We also fetch the client name to make the message personal
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, 
        delivery_date, 
        tenant_id,
        clients (name)
      `)
      .eq('delivery_date', dateString)
      .neq('status', 'delivered')

    if (orderError) throw orderError
    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'No orders due tomorrow.' })
    }

    console.log(`Found ${orders.length} orders due on ${dateString}`)

    // 3. Configure Web Push
    webpush.setVapidDetails(
      'mailto:admin@stitchly.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    let sentCount = 0

    // 4. Loop through orders and notify the owner
    for (const order of orders) {
      // Find the users (designers) for this tenant
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', order.tenant_id)

      if (!users) continue

      // For each designer in the tenant, find their push subscriptions
      for (const user of users) {
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id)

        if (!subscriptions) continue

        // Send notification to all of this user's devices
        for (const sub of subscriptions) {
            try {
                const client = order.clients as { name?: string } | { name?: string }[] | null
                const clientName = Array.isArray(client) ? client[0]?.name : client?.name
                const payload = JSON.stringify({
                    title: 'Order Due Tomorrow!',
                    body: `Order for ${clientName || 'Client'} is due on ${order.delivery_date}.`,
                    url: `/orders`
                })

                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, payload)
                
                sentCount++
            } catch (err: unknown) {
                // If 410 Gone, the subscription is invalid (user blocked/uninstalled)
                const statusCode = typeof err === 'object' && err !== null && 'statusCode' in err
                    ? Number(err.statusCode)
                    : undefined
                if (statusCode === 410) {
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                }
                console.error('Failed to send push:', err)
            }
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount, message: `Sent ${sentCount} reminders` })

  } catch (error: unknown) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cron job failed' }, { status: 500 })
  }
}
