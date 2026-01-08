'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User, Phone, Mail } from "lucide-react"

interface EditClientSheetProps {
    client: any
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function EditClientSheet({ client, trigger }: EditClientSheetProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const phone = formData.get("phone") as string
        const email = formData.get("email") as string
        const gender = formData.get("gender") as string

        // Update Client
        const { error } = await supabase
            .from('clients')
            .update({
                name,
                phone,
                email,
                gender
            })
            .eq('id', client.id)

        if (!error) {
            setOpen(false)
            router.refresh()
        } else {
            console.error("Error updating client:", error)
        }
        setLoading(false)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>

            <SheetContent className="sm:max-w-[500px] sm:px-8 w-full px-6">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl">Edit Client Details</SheetTitle>
                    <SheetDescription>
                        Update the client's information below.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="name" name="name" defaultValue={client.name} placeholder="e.g. Jane Doe" className="pl-9" required />
                        </div>
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="phone" name="phone" type="tel" defaultValue={client.phone} placeholder="e.g. 08012345678" className="pl-9" />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="email" name="email" type="email" defaultValue={client.email} placeholder="e.g. jane@example.com" className="pl-9" />
                        </div>
                    </div>

                    {/* Gender Field */}
                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select name="gender" defaultValue={client.gender || "female"}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <SheetFooter className="mt-8">
                        <Button type="submit" disabled={loading} className="w-full h-11 text-base">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
