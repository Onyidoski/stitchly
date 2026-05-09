'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Loader2, Banknote } from "lucide-react"
import { toast } from "sonner"

interface Order {
    id: string
    total_amount: number
    paid_amount: number
    delivery_date: string
    [key: string]: any
}

interface RecordBulkPaymentProps {
    selectedOrders: Order[]
    onSuccess?: () => void
}

export function RecordBulkPaymentDialog({ selectedOrders, onSuccess }: RecordBulkPaymentProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const totalDue = selectedOrders.reduce((sum, o) => sum + (o.total_amount - (o.paid_amount || 0)), 0)
    const [amount, setAmount] = useState<string>(totalDue.toString())

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const payment = Number(amount)

        if (payment <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        if (payment > totalDue) {
            toast.error("Payment cannot exceed total amount due")
            return
        }

        setLoading(true)

        try {
            // Sort orders by delivery date (earliest first) to pay off oldest/most urgent first
            const sortedOrders = [...selectedOrders].sort((a, b) => 
                new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime()
            )

            let remainingPayment = payment
            const updates = []

            for (const order of sortedOrders) {
                if (remainingPayment <= 0) break

                const amountDue = order.total_amount - (order.paid_amount || 0)
                if (amountDue <= 0) continue

                const amountToApply = Math.min(amountDue, remainingPayment)
                const newPaidAmount = (order.paid_amount || 0) + amountToApply
                const newPaymentStatus = newPaidAmount >= order.total_amount ? 'paid' : 'deposit'

                updates.push({
                    id: order.id,
                    paid_amount: newPaidAmount,
                    payment_status: newPaymentStatus
                })

                remainingPayment -= amountToApply
            }

            // Update all affected orders
            await Promise.all(
                updates.map(u => 
                    supabase
                        .from('orders')
                        .update({ 
                            paid_amount: u.paid_amount, 
                            payment_status: u.payment_status 
                        })
                        .eq('id', u.id)
                )
            )

            toast.success(`Successfully applied ₦${payment.toLocaleString()} across ${updates.length} orders`)
            setOpen(false)
            if (onSuccess) onSuccess()
            router.refresh()
        } catch (error) {
            console.error("Error applying bulk payment", error)
            toast.error("Failed to apply payment")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button size="sm" variant="secondary" className="gap-2 rounded-xl shadow-sm whitespace-nowrap">
                    <Banknote className="h-4 w-4" />
                    <span>Record Payment</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[400px]">
                <SheetHeader>
                    <SheetTitle>Record Bulk Payment</SheetTitle>
                    <SheetDescription>
                        Distribute a single payment across the selected orders. The payment will be applied to the most urgent orders first.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <div className="bg-muted p-3 rounded-lg flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Balance Due:</span>
                            <span className="font-bold text-foreground">₦{totalDue.toLocaleString()}</span>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Payment Amount (₦)</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="1"
                                max={totalDue}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <SheetFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || Number(amount) <= 0 || Number(amount) > totalDue}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply Payment
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
