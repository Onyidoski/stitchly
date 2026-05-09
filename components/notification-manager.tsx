'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)

  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (error) {
      console.error("Service Worker registration failed:", error)
    }
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [registerServiceWorker])

  async function subscribeToPush() {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready

      // REPLACE THIS WITH YOUR GENERATED PUBLIC VAPID KEY
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_PUBLIC_KEY_HERE'

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      })

      setSubscription(sub)

      // Save to Database
      await saveSubscriptionToDb(sub)
      toast.success("Notifications enabled!")
    } catch (error) {
      console.error("Failed to subscribe:", error)
      toast.error("Failed to enable notifications. Check console for details.")
    }
    setLoading(false)
  }

  async function saveSubscriptionToDb(sub: PushSubscription) {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })

    if (!response.ok) {
      throw new Error('Failed to save push subscription')
    }
  }

  if (!isSupported) {
    return <div className="text-sm text-muted-foreground">Push notifications are not supported on this device.</div>
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="space-y-0.5">
        <h3 className="font-medium text-base">Order Reminders</h3>
        <p className="text-sm text-muted-foreground">
          {subscription
            ? "You are receiving notifications for due orders."
            : "Get notified when orders are due."}
        </p>
      </div>

      <Button
        onClick={subscribeToPush}
        disabled={loading || !!subscription}
        variant={subscription ? "outline" : "default"}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
          subscription ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />
        }
        {subscription ? "Enabled" : "Enable"}
      </Button>
    </div>
  )
}
