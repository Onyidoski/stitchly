'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellRing, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function PushNotificationToggle() {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            checkSubscription()
        } else {
            setLoading(false)
        }
    }, [])

    async function checkSubscription() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        } catch (error) {
            console.error('Error checking subscription:', error)
        }
        setLoading(false)
    }

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    async function subscribeToPush() {
        setLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            
            // Ask for permission explicitly first
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                toast.error('Permission denied. Please click the padlock icon in your URL bar to allow notifications.')
                setLoading(false)
                return
            }

            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidPublicKey) {
                toast.error('VAPID public key not found in environment variables.')
                setLoading(false)
                return
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })

            // Send subscription to our server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            })

            if (!response.ok) {
                const errText = await response.text()
                console.error("Server error response:", errText)
                throw new Error(`Failed to save subscription: ${errText}`)
            }

            setIsSubscribed(true)
            toast.success('Push notifications enabled!')

        } catch (error) {
            console.error('Failed to subscribe:', error)
            toast.error('Failed to enable push notifications.')
        }
        setLoading(false)
    }

    if (!isSupported) return null

    return (
        <Button
            variant={isSubscribed ? "outline" : "default"}
            size="sm"
            onClick={isSubscribed ? () => toast.info('You are already subscribed on this device.') : subscribeToPush}
            disabled={loading || isSubscribed}
            className="w-full justify-start gap-3 mt-4"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
                <BellRing className="h-4 w-4 text-emerald-500" />
            ) : (
                <Bell className="h-4 w-4" />
            )}
            {isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
        </Button>
    )
}
