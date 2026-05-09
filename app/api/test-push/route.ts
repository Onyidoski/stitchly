import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

// 1. Add 'request' parameter to the function
export async function GET(request: Request) {
  const supabase = await createClient()
  
  // 2. Automatically get the current domain (e.g., http://localhost:3000 or https://stitchly.vercel.app)
  const origin = new URL(request.url).origin
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  const { data: subscription } = await supabase
    .from('push_subscriptions') //
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'No subscription found. Please enable notifications in Settings first.' }, { status: 404 })
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys are missing in .env file' }, { status: 500 })
  }

  webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  try {
    const payload = JSON.stringify({
      title: 'Stitchly Test',
      body: 'Success! Your device can receive notifications.',
      // 3. Use the detected origin to create the correct link dynamically
      url: `${origin}/orders` 
    })

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