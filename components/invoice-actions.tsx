'use client'

import { Button } from "@/components/ui/button"
import { Download, Mail, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from "sonner" 

export function InvoiceActions() {
    const [downloading, setDownloading] = useState(false)

    const handleDownload = async () => {
        try {
            const element = document.getElementById('invoice-content')
            if (!element) {
                toast.error("Error: Invoice content not found")
                return
            }

            setDownloading(true)

            // 1. Capture the element as an image
            // cacheBust: true forces the browser to fetch a fresh version of images (fixes some CORS issues)
            const dataUrl = await toPng(element, { 
                quality: 0.95,
                cacheBust: true, 
                pixelRatio: 2, // 2x resolution for clear text
                backgroundColor: '#ffffff'
            })

            // 2. Generate PDF
            // 'p' = portrait, 'mm' = millimeters, 'a4' = paper size
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()
            
            // Calculate image dimensions to fit A4 width perfectly
            const imgProps = pdf.getImageProperties(dataUrl)
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width
            
            // Add image to PDF
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight)
            
            // 3. Save
            pdf.save('invoice.pdf')
            toast.success("Invoice saved successfully")
            setDownloading(false)

        } catch (error: any) {
            console.error("PDF generation failed", error)
            toast.error("Failed to generate PDF.")
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
                    {downloading ? "Saving..." : "Save PDF"}
                </Button>
            </div>
        </div>
    )
}