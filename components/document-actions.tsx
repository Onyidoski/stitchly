'use client'

import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from "sonner"
import { useTheme } from "next-themes"

export function DocumentActions({
    backHref,
    backLabel = "Back",
    filename = "document.pdf",
}: {
    backHref: string
    backLabel?: string
    filename?: string
}) {
    const [downloading, setDownloading] = useState(false)
    const { resolvedTheme } = useTheme()

    const handleDownload = async () => {
        try {
            const element = document.getElementById('document-content')
            if (!element) {
                toast.error("Error: Document content not found")
                return
            }

            setDownloading(true)

            const wasDark = resolvedTheme === 'dark'

            await new Promise(resolve => setTimeout(resolve, 50))

            if (wasDark) {
                document.documentElement.classList.remove('dark')
            }

            const container = document.createElement('div')
            container.style.position = 'fixed'
            container.style.top = '-10000px'
            container.style.left = '-10000px'
            container.style.width = '794px'
            container.style.zIndex = '-1000'
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

            await new Promise(resolve => setTimeout(resolve, 100))

            const dataUrl = await toPng(clone, {
                quality: 1.0,
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            })

            document.body.removeChild(container)

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()
            const imgProps = pdf.getImageProperties(dataUrl)
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width

            if (imgHeight <= pdfHeight) {
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight)
            } else {
                let heightLeft = imgHeight
                let position = 0
                pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight)
                heightLeft -= pdfHeight
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight
                    pdf.addPage()
                    pdf.addImage(dataUrl, 'PNG', 0, -(pdfHeight - 10), pdfWidth, imgHeight)
                    heightLeft -= pdfHeight
                }
            }

            pdf.save(filename)
            toast.success("Document saved successfully")

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
            <Link href={backHref}>
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> {backLabel}
                </Button>
            </Link>
            <div className="flex gap-2">
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
