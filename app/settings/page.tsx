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

        if (!tenant || !tenant.id) {
            toast.error("Error: No business profile found.")
            setLoading(false)
            return
        }

        const formData = new FormData(e.currentTarget)
        const businessName = formData.get("businessName") as string
        const phone = formData.get("phone") as string
        const address = formData.get("address") as string
        
        // [1] Capture new bank fields
        const bankName = formData.get("bankName") as string
        const accountName = formData.get("accountName") as string
        const accountNumber = formData.get("accountNumber") as string

        const { error } = await supabase
            .from('tenants')
            .update({
                business_name: businessName,
                phone: phone,
                address: address,
                logo_url: logoUrl,
                // [2] Update database
                bank_name: bankName,
                account_name: accountName,
                account_number: accountNumber
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
            {/* ... (Logo section remains the same) ... */}
            
            <div className="space-y-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-6 border p-4 rounded-lg bg-slate-50">
                    {logoUrl ? (
                        <div className="relative h-20 w-20 border rounded-md bg-white overflow-hidden">
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
                        <div className="h-20 w-20 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground bg-white">
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
                    <Input id="businessName" name="businessName" defaultValue={tenant?.business_name} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" defaultValue={tenant?.phone} placeholder="+234..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Business Address</Label>
                        <Input id="address" name="address" defaultValue={tenant?.address} placeholder="Lagos, Nigeria" />
                    </div>
                </div>
                
                {/* [3] NEW: Payment Information Section */}
                <div className="pt-4 border-t mt-2">
                    <h3 className="font-semibold mb-4 text-sm text-slate-900">Payment Information</h3>
                    <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input id="bankName" name="bankName" defaultValue={tenant?.bank_name} placeholder="e.g. GTBank" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input id="accountNumber" name="accountNumber" defaultValue={tenant?.account_number} placeholder="0123456789" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accountName">Account Name</Label>
                            <Input id="accountName" name="accountName" defaultValue={tenant?.account_name} placeholder="Account Name" />
                        </div>
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
            </Button>
        </form>
    )
}