import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Serves the signed-in business's logo from OUR OWN address.
 *
 * Invoices and receipts used to embed the logo as a huge base64 string in the page and,
 * if that failed, fall back to the raw storage URL. That fallback only works when the
 * storage host allows the site's address (CORS), and it left the logo missing on some
 * browsers/addresses, notably iPhones. A same-origin image has neither problem, keeps the
 * page small, and the browser can cache it.
 */

// Only plain raster images. SVG is deliberately excluded: served from our own address it could run scripts.
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']

// SSRF guard: logo_url is editable by the user, so only ever fetch from our own image storage.
function isAllowedLogoHost(hostname: string): boolean {
    const configured = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
    if (configured) {
        try {
            if (new URL(configured).hostname === hostname) return true
        } catch {
            // ignore a malformed env value and fall through to the default rule
        }
    }
    return hostname.endsWith('.r2.dev')
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    if (!profile?.tenant_id) return new NextResponse('Not found', { status: 404 })

    const { data: tenant } = await supabase
        .from('tenants')
        .select('logo_url')
        .eq('id', profile.tenant_id)
        .single()

    const logoUrl = tenant?.logo_url
    if (!logoUrl) return new NextResponse('No logo', { status: 404 })

    let target: URL
    try {
        target = new URL(logoUrl)
    } catch {
        return new NextResponse('Invalid logo URL', { status: 404 })
    }
    if (target.protocol !== 'https:' || !isAllowedLogoHost(target.hostname)) {
        console.warn('logo route: refusing to fetch logo from an unexpected host', target.hostname)
        return new NextResponse('Logo host not allowed', { status: 404 })
    }

    try {
        const upstream = await fetch(target.toString(), {
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
        })
        const type = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()

        if (!upstream.ok || !ALLOWED_TYPES.includes(type)) {
            // Make the failure visible in the logs (the old code swallowed it silently),
            // then let the browser try the storage URL directly as a last resort.
            console.error('logo route: upstream did not return a usable image', upstream.status, type)
            return NextResponse.redirect(target.toString(), 302)
        }

        return new NextResponse(await upstream.arrayBuffer(), {
            headers: {
                'Content-Type': type,
                // Pages add ?v=<file name>, so a newly uploaded logo gets a new URL and is never stale.
                'Cache-Control': 'private, max-age=86400',
                'X-Content-Type-Options': 'nosniff',
            },
        })
    } catch (error) {
        console.error('logo route: fetching the logo failed', error)
        return NextResponse.redirect(target.toString(), 302)
    }
}
