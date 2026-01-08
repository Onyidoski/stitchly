'use client'

import { Button } from "@/components/ui/button"
import { Download, Mail, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

export function InvoiceActions() {
    const [downloading, setDownloading] = useState(false)

    const handleDownload = async () => {
        try {
            const element = document.getElementById('invoice-content')
            if (!element) {
                alert("Error: Could not find the invoice content. Please refresh the page.")
                return
            }

            setDownloading(true)

            // 1. Clone the element
            const clone = element.cloneNode(true) as HTMLElement

            // 2. Create a "Hidden" Container
            // Instead of moving the clone far away (which causes blank pages),
            // we put it in a fixed container that is hidden behind everything else.
            const container = document.createElement('div')
            container.style.position = 'fixed'
            container.style.top = '0'
            container.style.left = '0'
            container.style.width = '100%'
            container.style.height = '0' // Zero height but visible overflow
            container.style.overflow = 'visible'
            container.style.zIndex = '-9999' // Behind everything
            container.style.pointerEvents = 'none' // Non-clickable
            
            // 3. Style the clone for Desktop A4
            clone.style.width = '794px' // A4 width at 96 DPI
            clone.style.minHeight = '1123px' // A4 height
            clone.style.backgroundColor = '#ffffff'
            clone.style.transform = 'scale(1)' // Ensure no mobile scaling
            clone.className = clone.className
                .replace('shadow-lg', '')
                .replace('max-w-3xl', '')
                .replace('mx-auto', '') 
            
            // Add clone to container, and container to body
            container.appendChild(clone)
            document.body.appendChild(container)

            // 4. Wait a moment for images/fonts to render
            await new Promise((resolve) => setTimeout(resolve, 500))

            // 5. Capture
            const imgData = await toPng(clone, { 
                quality: 1.0,
                pixelRatio: 2, // 2x resolution for clear text
                cacheBust: true,
                backgroundColor: '#ffffff' // Force white background
            })

            // Clean up DOM
            document.body.removeChild(container)

            // 6. Generate PDF
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()
            
            const imgProps = new Image()
            imgProps.src = imgData
            
            imgProps.onload = () => {
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight)
                pdf.save('invoice.pdf')
                setDownloading(false)
            }

        } catch (error: any) {
            console.error("PDF generation failed", error)
            alert(`Generation failed: ${error.message || 'Unknown error'}`)
            setDownloading(false)
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
                    Save PDF
                </Button>
            </div>
        </div>
    )
}