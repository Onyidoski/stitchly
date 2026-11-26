// Shared helpers for the invoice / receipt "Save PDF" capture.

/**
 * Fetch an image and return it as a base64 data URL, or null if it can't be read.
 * Only accepts real images, so an error page (e.g. a 401/404 body) is never mistaken for a logo.
 */
export async function imageUrlToDataUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) return null
        const blob = await response.blob()
        if (!blob.type.startsWith('image/')) return null
        return await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

/**
 * True on iPhone/iPad (every iOS browser uses WebKit) and desktop Safari.
 * WebKit is known to leave images out of the FIRST html-to-image capture of a page,
 * so callers render once and throw that result away before the capture they keep.
 */
export function isWebKit(): boolean {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    const iOS =
        /iPad|iPhone|iPod/.test(ua) ||
        // iPadOS reports itself as a Mac
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const desktopSafari = /Safari/.test(ua) && !/Chrome|Chromium|Android/.test(ua)
    return iOS || desktopSafari
}
