'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[Stitchly Error Boundary]', error)
    }, [error])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
                    <p className="text-muted-foreground text-sm">
                        An unexpected error occurred. Your data is safe — please try refreshing or go back to the dashboard.
                    </p>
                    {error?.digest && (
                        <p className="text-xs text-muted-foreground/60 font-mono mt-2">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={reset} variant="default" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/">
                            <Home className="h-4 w-4" />
                            Go to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
