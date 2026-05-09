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

export function ReceiptActions() {
    const [downloading, setDownloading] = useState(false)
    const { resolvedTheme } = useTheme()

    const handleDownload = async () => {
        try {
            const element = document.getElementById('receipt-content')
            if (!element) {
                toast.error("Error: Receipt content not found")
                return
            }

            setDownloading(true)

            // 0. Force light mode for capture if currently dark
            const wasDark = resolvedTheme === 'dark'
            await new Promise(resolve => setTimeout(resolve, 50))
            if (wasDark) {
                document.documentElement.classList.remove('dark')
            }

            // 1. Hidden off-screen container at A4 width
            const container = document.createElement('div')
            container.style.position = 'fixed'
            container.style.top = '-10000px'
            container.style.left = '-10000px'
            container.style.width = '794px'
            container.style.zIndex = '-1000'
            document.body.appendChild(container)

            // 2. Clone the receipt
            const clone = element.cloneNode(true) as HTMLElement
            clone.style.transform = 'scale(1)'
            clone.style.width = '100%'
            clone.style.maxWidth = 'none'
            clone.style.margin = '0'
            clone.style.boxShadow = 'none'
            clone.style.height = 'auto'
            clone.style.backgroundColor = '#ffffff'
            container.appendChild(clone)

            // 3. FIX LOGO: Replace external img src with a base64 data URL
            const images = clone.querySelectorAll('img')
            await Promise.all(Array.from(images).map(async (img) => {
                const pdfSrc = img.getAttribute('data-pdf-src')
                const src = pdfSrc || img.getAttribute('src')
                if (src?.startsWith('data:')) {
                    img.src = src
                    img.removeAttribute('srcset')
                } else if (src) {
                    const dataUrl = await imageUrlToDataUrl(src)
                    if (dataUrl) {
                        img.src = dataUrl
                        img.removeAttribute('srcset')
                    }
                }
            }))

            // 4. Wait for ALL images to be fully decoded & render-ready.
            await Promise.all(Array.from(images).map(async (img) => {
                try {
                    await img.decode()
                } catch {
                    // decode() can reject for broken/missing images — safe to ignore
                }
            }))

            // 5. Brief extra wait for layout to settle after decode
            await new Promise(resolve => setTimeout(resolve, 300))

            // 6. Capture as JPEG
            const dataUrl = await toJpeg(clone, {
                quality: 0.88,
                cacheBust: true,
                pixelRatio: 1.5,
                backgroundColor: '#ffffff',
                height: clone.scrollHeight,
                style: { overflow: 'visible' }
            })

            // 7. Clean up DOM
            document.body.removeChild(container)

            // 8. Build PDF
            const tempPdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = tempPdf.internal.pageSize.getWidth()
            const a4Height = tempPdf.internal.pageSize.getHeight()

            const imgProps = tempPdf.getImageProperties(dataUrl)
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width
            const pdfHeight = Math.max(a4Height, imgHeight)

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            })

            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, imgHeight)
            pdf.save('receipt.pdf')
            toast.success("Receipt saved successfully")

            // 9. Restore dark mode if needed
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
            <Link href="/receipts">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Receipts
                </Button>
            </Link>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.href = 'mailto:?subject=Payment Receipt'}>
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
                            <p className="text-sm text-muted-foreground">Preparing your receipt...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
