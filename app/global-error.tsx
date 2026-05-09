'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[Stitchly Global Error]', error)
    }, [error])

    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#09090b', color: '#fafafa' }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    flexDirection: 'column',
                    gap: '16px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: 'rgba(239,68,68,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32
                    }}>⚠️</div>

                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Stitchly ran into a problem</h1>
                    <p style={{ color: '#a1a1aa', fontSize: 14, margin: 0, maxWidth: 360 }}>
                        A critical error occurred. Please refresh the page. If this keeps happening, contact support.
                    </p>

                    <button
                        onClick={reset}
                        style={{
                            marginTop: 8, padding: '10px 24px', borderRadius: 8,
                            background: '#2563eb', color: '#fff', border: 'none',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            </body>
        </html>
    )
}
