'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload } from "lucide-react"
import { ImageUploader } from "@/components/image-uploader"
import Image from "next/image"

export function SettingsForm({ tenant }: { tenant: any }) {
    const [loading, setLoading] = useState(false)
    const [logoUrl, setLogoUrl] = useState(tenant?.logo_url || '')
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        // Safety check to ensure we have a tenant ID to update
        if (!tenant || !tenant.id) {
            toast.error("Error: No business profile found. Please try refreshing the page.")
            setLoading(false)
            return
        }

        const formData = new FormData(e.currentTarget)
        const businessName = formData.get("businessName") as string
        const phone = formData.get("phone") as string
        const address = formData.get("address") as string
        const slogan = formData.get("slogan") as string

        // [1] Capture bank fields (Account 1 + optional Account 2)
        const bankName = formData.get("bankName") as string
        const accountName = formData.get("accountName") as string
        const accountNumber = formData.get("accountNumber") as string
        const bankName2 = formData.get("bankName2") as string
        const accountName2 = formData.get("accountName2") as string
        const accountNumber2 = formData.get("accountNumber2") as string

        const { error } = await supabase
            .from('tenants')
            .update({
                business_name: businessName,
                phone: phone,
                address: address,
                logo_url: logoUrl,
                bank_name: bankName,
                account_name: accountName,
                account_number: accountNumber,
                bank_name_2: bankName2 || null,
                account_name_2: accountName2 || null,
                account_number_2: accountNumber2 || null,
                slogan: slogan
            })
            .eq('id', tenant.id)

        if (error) {
            toast.error('Error updating settings')
            console.error(error)
        } else {
            toast.success('Settings saved successfully!')
            window.location.reload()
        }

        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-6 border p-4 rounded-lg bg-muted/50">
                    {logoUrl ? (
                        <div className="relative h-20 w-20 border rounded-md bg-background overflow-hidden">
                            <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" />
                            <button
                                type="button"
                                onClick={() => setLogoUrl('')}
                                className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="h-20 w-20 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground bg-background">
                            <Upload className="h-6 w-6" />
                        </div>
                    )}

                    <div className="flex-1">
                        <ImageUploader
                            onUploadComplete={(urls) => setLogoUrl(urls[0])}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Recommended: Square PNG image, transparent background.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                        id="businessName"
                        name="businessName"
                        defaultValue={tenant?.business_name}
                        required
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="slogan">Business Slogan</Label>
                    <Input
                        id="slogan"
                        name="slogan"
                        defaultValue={tenant?.slogan}
                        placeholder="e.g. Your Style, Our Passion"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            name="phone"
                            defaultValue={tenant?.phone}
                            placeholder="+234 800 000 0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Business Address</Label>
                        <Textarea
                            id="address"
                            name="address"
                            defaultValue={tenant?.address}
                            placeholder="123 Fashion Street, Lagos..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Payment Information — up to 2 accounts */}
                <div className="pt-4 border-t mt-2 space-y-6">
                    <div>
                        <h3 className="font-semibold mb-1 text-sm text-foreground">Payment Information</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Shown on invoices and receipts. You can add up to 2 bank accounts.
                        </p>

                        <div className="space-y-4 rounded-lg border p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account 1</p>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bankName">Bank Name</Label>
                                        <Input
                                            id="bankName"
                                            name="bankName"
                                            defaultValue={tenant?.bank_name}
                                            placeholder="e.g. GTBank"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accountNumber">Account Number</Label>
                                        <Input
                                            id="accountNumber"
                                            name="accountNumber"
                                            defaultValue={tenant?.account_number}
                                            placeholder="0123456789"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountName">Account Name</Label>
                                    <Input
                                        id="accountName"
                                        name="accountName"
                                        defaultValue={tenant?.account_name}
                                        placeholder="Account Name"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-lg border p-4 mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Account 2 <span className="font-normal normal-case tracking-normal">(optional)</span>
                            </p>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bankName2">Bank Name</Label>
                                        <Input
                                            id="bankName2"
                                            name="bankName2"
                                            defaultValue={tenant?.bank_name_2 || ''}
                                            placeholder="e.g. Access Bank"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accountNumber2">Account Number</Label>
                                        <Input
                                            id="accountNumber2"
                                            name="accountNumber2"
                                            defaultValue={tenant?.account_number_2 || ''}
                                            placeholder="0123456789"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountName2">Account Name</Label>
                                    <Input
                                        id="accountName2"
                                        name="accountName2"
                                        defaultValue={tenant?.account_name_2 || ''}
                                        placeholder="Account Name"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </form>
    )
}