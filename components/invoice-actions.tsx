'use client'

import { Button } from "@/components/ui/button"
import { Download, Mail, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from "sonner"
import { useTheme } from "next-themes" // [1] Import useTheme

export function InvoiceActions() {
    const [downloading, setDownloading] = useState(false)
    const { theme, setTheme, resolvedTheme } = useTheme() // [2] Use hook

    const handleDownload = async () => {
        try {
            const element = document.getElementById('invoice-content')
            if (!element) {
                toast.error("Error: Invoice content not found")
                return
            }

            setDownloading(true)

            // 0. CHECK THEME & FLICKER CONTROL
            // We use next-themes to toggle.
            // Capture current resolved theme (light/dark)
            const wasDark = resolvedTheme === 'dark'

            // Small delay to let the overlay render
            await new Promise(resolve => setTimeout(resolve, 50))

            if (wasDark) {
                // Force Light Mode for capture
                document.documentElement.classList.remove('dark')
                // We also manipulate the DOM class directly for speed, 
                // as setTheme might be async/debounced by React.
            }

            // 1. Create a "Hidden Container"
            // We use this to force the invoice to a specific width (A4 size) 
            // so it looks perfect regardless of your device (mobile/desktop).
            const container = document.createElement('div')
            container.style.position = 'fixed'
            container.style.top = '-10000px'
            container.style.left = '-10000px'
            container.style.width = '794px' // A4 Width at 96 DPI
            container.style.zIndex = '-1000'
            document.body.appendChild(container)

            // 2. Clone the invoice into the container
            const clone = element.cloneNode(true) as HTMLElement

            // 3. Reset styles on the clone to ensure it looks like a document
            // This removes any "responsive" mobile constraints
            clone.style.transform = 'scale(1)'
            clone.style.width = '100%'
            clone.style.maxWidth = 'none'
            clone.style.margin = '0'
            clone.style.boxShadow = 'none'
            clone.style.height = 'auto'
            clone.style.backgroundColor = '#ffffff'

            container.appendChild(clone)

            // 4. Wait briefly for images to render in the clone
            await new Promise(resolve => setTimeout(resolve, 100))

            // 5. Capture the CLONE (not the original element)
            const dataUrl = await toPng(clone, {
                quality: 1.0,
                cacheBust: true,
                pixelRatio: 2, // 2x resolution for clear text
                backgroundColor: '#ffffff'
            })

            // Clean up the DOM
            document.body.removeChild(container)

            // 6. Generate PDF
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()   // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight() // 297mm

            const imgProps = pdf.getImageProperties(dataUrl)
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width

            // Add the image
            // If the invoice is shorter than 1 page, just add it.
            if (imgHeight <= pdfHeight) {
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight)
            } else {
                // If the invoice is LONG (multi-page), we split it across pages
                let heightLeft = imgHeight
                let position = 0

                pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight)
                heightLeft -= pdfHeight

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight // Shift image up for next page
                    pdf.addPage()
                    pdf.addImage(dataUrl, 'PNG', 0, -pdfHeight + (heightLeft - imgHeight), pdfWidth, imgHeight)
                    // Note: Simplified multi-page logic often requires fine-tuning. 
                    // For now, this adds a new page.
                    // A simpler fallback for very long invoices is just adding it again with an offset:
                    pdf.addImage(dataUrl, 'PNG', 0, -(pdfHeight - 10), pdfWidth, imgHeight) // 10mm overlap
                    heightLeft -= pdfHeight
                }
            }

            pdf.save('invoice.pdf')
            pdf.save('invoice.pdf')
            toast.success("Invoice saved successfully")

            // 7. Restore Theme
            if (wasDark) {
                document.documentElement.classList.add('dark')
            }

            setDownloading(false)

        } catch (error: any) {
            console.error("PDF generation failed", error)
            toast.error("Failed to generate PDF.")
            setDownloading(false)

            // Safety check: Restore if needed
            if (resolvedTheme === 'dark') {
                document.documentElement.classList.add('dark')
            }
        }
    }

    // Helper to detect dark mode safely
    const isDarkMode = () => {
        if (typeof window === 'undefined') return false
        return document.documentElement.classList.contains('dark')
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

            {/* OVERLAY for smooth theme transition */}
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