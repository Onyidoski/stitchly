'use client'

import Link from "next/link"
import Image from "next/image"
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
    userEmail,
    activeOrdersCount = 0
}: {
    children: React.ReactNode
    businessName: string
    userEmail: string
    activeOrdersCount?: number
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
        <div className="flex min-h-screen w-full bg-slate-50/50">
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden border-r bg-white w-[250px] flex-col md:flex fixed h-full inset-y-0 z-30">
                <div className="h-16 flex items-center px-6 border-b">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                        <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <Scissors className="h-5 w-5 text-primary" />
                        </div>
                        <span>Stitchly</span>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <nav className="grid gap-2 text-sm font-medium">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                    {item.name === 'Orders' && activeOrdersCount > 0 && (
                                        <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {activeOrdersCount}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col md:ml-[250px] min-h-screen">
                {/* HEADER */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-white px-6">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[280px]">
                            {/* Mobile Sidebar Content */}
                            <div className="h-full flex flex-col">
                                <div className="h-16 flex items-center px-6 border-b">
                                    <SheetTitle className="font-bold text-xl text-primary">Stitchly</SheetTitle>
                                </div>
                                <div className="flex-1 py-6 px-4">
                                    <nav className="grid gap-2 text-sm font-medium">
                                        {navItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${pathname === item.href
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-muted-foreground hover:bg-slate-100"
                                                    }`}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                {item.name}
                                                {/* FIX: Added badge logic here for mobile view */}
                                                {item.name === 'Orders' && activeOrdersCount > 0 && (
                                                    <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                        {activeOrdersCount}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* SEARCH BAR (Visible on Desktop) */}
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        <div className="relative hidden md:block w-96">
                            {/* Icons would go here */}
                        </div>
                    </div>

                    {/* RIGHT SIDE HEADER ACTIONS */}
                    <div className="ml-auto flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="hidden md:flex gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-slate-200 h-auto">
                            <span>Select Date</span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="rounded-full h-9 w-9">
                                    <Avatar className="h-9 w-9 border-2 border-white">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700">{userEmail?.[0]?.toUpperCase()}</AvatarFallback>
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

                {/* PAGE CONTENT */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
                    {children}
                </main>
            </div>
        </div>
    )
}