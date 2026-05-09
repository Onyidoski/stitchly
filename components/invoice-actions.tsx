'use client'

import { Button } from "@/components/ui/button"
import { Download, Mail, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toJpeg } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from "sonner"
import { useTheme } from "next-themes"

// Fetches an image URL and returns a base64 data URL via canvas
// This bypasses html-to-image's CORS restriction on external images (e.g. Supabase logos)
async function imageUrlToDataUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, { cache: 'no-store' })
        const blob = await response.blob()
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

export function InvoiceActions() {
    const [downloading, setDownloading] = useState(false)
    const { resolvedTheme } = useTheme()

    const handleDownload = async () => {
        try {
            const element = document.getElementById('invoice-content')
            if (!element) {
                toast.error("Error: Invoice content not found")
                return
            }

            setDownloading(true)

            // Detect iOS — must happen before any DOM manipulation
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

            // Force light mode for capture
            const wasDark = resolvedTheme === 'dark'
            await new Promise(resolve => setTimeout(resolve, 50))
            if (wasDark) {
                document.documentElement.classList.remove('dark')
            }

            let dataUrl: string

            if (isIOS) {
                // ─── iOS PATH ──────────────────────────────────────────────────
                // On iOS Safari, off-screen elements (even visibility:hidden ones)
                // show through or cause blank captures due to compositing quirks.
                // Instead, capture the ORIGINAL element — it's already rendered,
                // already in the viewport, and images are already decoded.

                // Pre-warm: force all images in the original element to decode
                const originalImgs = element.querySelectorAll('img')
                await Promise.all(Array.from(originalImgs).map(async (img) => {
                    try { await (img as any).decode() } catch { }
                }))

                // Short settle time
                await new Promise(resolve => setTimeout(resolve, 300))

                dataUrl = await toJpeg(element, {
                    quality: 0.88,
                    cacheBust: true,
                    pixelRatio: 1.2,        // lower on iOS to stay within canvas memory limit
                    backgroundColor: '#ffffff',
                    height: element.scrollHeight,
                    style: { overflow: 'visible', boxShadow: 'none' }
                })

            } else {
                // ─── PC / DESKTOP PATH ─────────────────────────────────────────
                // Clone into a fixed-width A4 container off-screen.
                // Chrome/Edge paints off-screen fixed elements, so this is safe.
                const container = document.createElement('div')
                container.style.position = 'fixed'
                container.style.top = '-10000px'
                container.style.left = '-10000px'
                container.style.width = '794px'   // A4 at 96 DPI
                container.style.zIndex = '-1'
                container.style.pointerEvents = 'none'
                document.body.appendChild(container)

                const clone = element.cloneNode(true) as HTMLElement
                clone.style.transform = 'scale(1)'
                clone.style.width = '100%'
                clone.style.maxWidth = 'none'
                clone.style.margin = '0'
                clone.style.boxShadow = 'none'
                clone.style.height = 'auto'
                clone.style.backgroundColor = '#ffffff'
                container.appendChild(clone)

                // Replace any remaining external image URLs with data URLs (fallback)
                const cloneImgs = clone.querySelectorAll('img')
                await Promise.all(Array.from(cloneImgs).map(async (img) => {
                    const src = img.getAttribute('src')
                    if (src && !src.startsWith('data:')) {
                        const fetched = await imageUrlToDataUrl(src)
                        if (fetched) {
                            img.src = fetched
                            img.removeAttribute('srcset')
                        }
                    }
                    try { await (img as any).decode() } catch { }
                }))

                await new Promise(resolve => setTimeout(resolve, 400))

                dataUrl = await toJpeg(clone, {
                    quality: 0.88,
                    cacheBust: true,
                    pixelRatio: 1.5,
                    backgroundColor: '#ffffff',
                    height: clone.scrollHeight,
                    style: { overflow: 'visible' }
                })

                document.body.removeChild(container)
            }

            // ─── BUILD PDF ────────────────────────────────────────────────────
            const tempPdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = tempPdf.internal.pageSize.getWidth()
            const a4Height = tempPdf.internal.pageSize.getHeight()

            const imgProps = tempPdf.getImageProperties(dataUrl)
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width
            const pdfHeight = Math.max(a4Height, imgHeight)

            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [pdfWidth, pdfHeight] })
            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, imgHeight)
            pdf.save('invoice.pdf')
            toast.success("Invoice saved successfully")

            // Restore dark mode
            if (wasDark) {
                document.documentElement.classList.add('dark')
            }

            setDownloading(false)

        } catch (error: any) {
            console.error("PDF generation failed", error)
            toast.error("Failed to generate PDF.")
            setDownloading(false)
            if (resolvedTheme === 'dark') {
                document.documentElement.classList.add('dark')
            }
        }
    }


    return (
        <div className="max-w-3xl mx-auto mb-6 px-4 flex items-center justify-between print:hidden">
            <Link href="/invoices">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Invoices
                </Button>
            </Link>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.href = 'mailto:?subject=Invoice'}>
                    <Mail className="h-4 w-4" /> Email
                </Button>
                <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleDownload}
                    disabled={downloading}
                >
                    {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {downloading ? "Processing..." : "Save PDF"}
                </Button>
            </div>

            {downloading && (
                <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all duration-200">
                    <div className="bg-card border shadow-lg rounded-xl p-6 flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                            <p className="text-lg font-semibold">Generating PDF</p>
                            <p className="text-sm text-muted-foreground">Preparing your document...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}