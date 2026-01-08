'use client'

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Plus, Loader2 } from "lucide-react"

export function AddClientSheet() {
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

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // 2. Fetch tenant_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profile?.tenant_id) {
        // 3. Insert Client
        const { error } = await supabase.from('clients').insert({
          tenant_id: profile.tenant_id,
          name,
          phone,
          notes: email ? `Email: ${email}` : '', 
          gender
        })

        if (!error) {
          setOpen(false)
          router.refresh() // Refreshes the background page instantly
        }
      }
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </SheetTrigger>
      
      {/* UPDATE: Added className="sm:max-w-[500px] sm:px-8" for better spacing */}
      <SheetContent className="sm:max-w-[500px] sm:px-8">
        <SheetHeader>
          <SheetTitle>Add New Client</SheetTitle>
          <SheetDescription>
            Enter the client's basic details here. You can add measurements later.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-6 py-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-medium">Name</Label>
            <Input id="name" name="name" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right font-medium">Phone</Label>
            <Input id="phone" name="phone" type="tel" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right font-medium">Email</Label>
            <Input id="email" name="email" type="email" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gender" className="text-right font-medium">Gender</Label>
            <select 
              id="gender" 
              name="gender" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <SheetFooter className="mt-4">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Client
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}