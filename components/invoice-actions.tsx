'use client'

import { Button } from "@/components/ui/button"
import { Printer, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function InvoiceActions() {
    
    const handlePrint = () => {
        window.print()
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
                    onClick={handlePrint}
                >
                    <Printer className="h-4 w-4" />
                    Print / Save PDF
                </Button>
            </div>
        </div>
    )
}