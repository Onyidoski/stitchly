'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
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

        const formData = new FormData(e.currentTarget)
        const businessName = formData.get("businessName") as string
        const phone = formData.get("phone") as string
        const address = formData.get("address") as string

        const { error } = await supabase
            .from('tenants')
            .update({
                business_name: businessName,
                phone: phone,
                address: address,
                logo_url: logoUrl
            })
            .eq('id', tenant.id)

        if (error) {
            alert('Error updating settings')
            console.error(error)
        } else {
            alert('Settings saved successfully!')
            window.location.reload() 
        }

        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            
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
                    <Input 
                        id="businessName" 
                        name="businessName" 
                        defaultValue={tenant?.business_name} 
                        required 
                    />
                </div>

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

            <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </form>
    )
}