import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

export async function GET() {
  const supabase = await createClient()
  
  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // 2. Get user's latest subscription from DB
  const { data: subscription } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'No subscription found. Please enable notifications in Settings first.' }, { status: 404 })
  }

  // 3. Configure Web Push
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys are missing in .env file' }, { status: 500 })
  }

  webpush.setVapidDetails(
    'mailto:test@example.com', // You can leave this as is or use your email
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  // 4. Send Notification
  try {
    const payload = JSON.stringify({
      title: 'Stitchly Test',
      body: 'Success! Your device can receive notifications.',
    })

    // Reconstruct the subscription object required by web-push library
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    await webpush.sendNotification(pushSubscription, payload)

    return NextResponse.json({ success: true, message: 'Notification sent successfully!' })
  } catch (error) {
    console.error('Error sending push:', error)
    return NextResponse.json({ error: 'Failed to send notification. Check server logs.' }, { status: 500 })
  }
}