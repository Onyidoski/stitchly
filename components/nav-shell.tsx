'use client'

import Link from "next/link"
import Image from "next/image" // Import Image for the logo
import { usePathname, useRouter } from "next/navigation"
import { Menu, Users, Scissors, FileText, LayoutDashboard, LogOut, Package2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"

export default function NavShell({
    children,
    businessName,
    userEmail
}: {
    children: React.ReactNode
    businessName: string
    userEmail: string
}) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [isOpen, setIsOpen] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Clients', href: '/clients', icon: Users },
        { name: 'Orders', href: '/orders', icon: Scissors },
        { name: 'Invoices', href: '/invoices', icon: FileText },
    ]

    return (
        <div className="flex min-h-screen w-full flex-col">
            {/* HEADER / TOP NAV */}
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
                <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                    {/* DESKTOP LOGO AREA */}
                    <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                        {/* Try to load logo.png, fallback to Icon if missing */}
                        <div className="relative h-16 w-16 overflow-hidden rounded-md">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                className="object-cover"
                                onError={(e) => {
                                    
                                }}
                            />
                        </div>
                        

                        
                    </Link>

                    {/* NAVIGATION LINKS */}
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`transition-colors hover:text-foreground ${pathname === item.href ? "text-foreground font-bold" : "text-muted-foreground"
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* MOBILE MENU (SHEET) */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        <nav className="grid gap-6 text-lg font-medium">
                            <Link href="#" className="flex items-center gap-2 text-lg font-semibold">
                                <Package2 className="h-6 w-6" />
                                <span>{businessName}</span>
                            </Link>
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-4 hover:text-foreground ${pathname === item.href ? "text-foreground font-bold" : "text-muted-foreground"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>

                {/* USER DROPDOWN (RIGHT SIDE) */}
                <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                    <div className="ml-auto flex-1 sm:flex-initial">
                        {/* Search bar placeholder */}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" />
                                    <AvatarFallback>{userEmail?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{businessName}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" /> Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
                {children}
            </main>
        </div>
    )
}