'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
    Menu, 
    Users, 
    Scissors, 
    FileText, 
    LayoutDashboard, 
    LogOut, 
    Settings, 
    ChevronUp 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"

// [FIX] Defined OUTSIDE the main component to prevent hydration errors and re-mounting issues
const UserProfileSection = ({ 
    businessName, 
    userEmail, 
    onSignOut,
    isMobile = false 
}: { 
    businessName: string
    userEmail: string
    onSignOut: () => void
    isMobile?: boolean 
}) => (
    <div className={`p-4 border-t bg-white ${isMobile ? 'mt-auto' : ''}`}>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    className="w-full h-12 p-2 flex items-center justify-start gap-3 hover:bg-slate-100 rounded-xl transition-all group"
                >
                    <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-indigo-600 text-white font-medium text-xs">
                            {userEmail?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                        <span className="text-sm font-semibold text-slate-900 truncate w-full leading-none mb-1">{businessName}</span>
                        <span className="text-xs text-slate-500 truncate w-full leading-none font-normal">{userEmail}</span>
                    </div>
                    <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
                align="start" 
                side={isMobile ? "top" : "right"} 
                sideOffset={isMobile ? 10 : 20}
                className="w-[260px] p-2 rounded-2xl shadow-xl border-slate-200"
            >
                <div className="flex items-center gap-3 p-2 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                        <Avatar className="h-10 w-10 border border-white shadow-sm">
                        <AvatarFallback className="bg-indigo-600 text-white font-bold">
                            {userEmail?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-900 truncate">{businessName}</span>
                        <span className="text-xs text-slate-500 truncate">{userEmail}</span>
                    </div>
                </div>

                <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-slate-600 focus:text-indigo-600 focus:bg-indigo-50">
                            <Link href="/settings" className="flex items-center gap-2.5 py-2.5">
                            <Settings className="h-4 w-4" /> 
                            <span className="font-medium">Settings</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-1 bg-slate-100" />

                <DropdownMenuItem onClick={onSignOut} className="rounded-lg cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 py-2.5">
                    <LogOut className="h-4 w-4 mr-2.5" />
                    <span className="font-medium">Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
)

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
            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden border-r bg-white w-[260px] flex-col md:flex fixed h-full inset-y-0 z-30 shadow-sm">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                        <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shadow-primary/20">
                            <Scissors className="h-5 w-5" />
                        </div>
                        <span>Stitchly</span>
                    </Link>
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto py-6 px-3">
                    <nav className="grid gap-1.5 text-sm font-medium">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        }`}
                                >
                                    <item.icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    {item.name}
                                    {item.name === 'Orders' && activeOrdersCount > 0 && (
                                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            {activeOrdersCount}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Profile Section (Bottom) - [FIX] Passed props instead of closure */}
                <UserProfileSection 
                    businessName={businessName}
                    userEmail={userEmail}
                    onSignOut={handleSignOut}
                />
            </aside>

            {/* --- MAIN CONTENT WRAPPER --- */}
            <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen transition-all">
                {/* HEADER */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-6 justify-between md:justify-end">
                    
                    {/* Mobile Menu Trigger */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-slate-500">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[280px] flex flex-col">
                            {/* Mobile Sidebar Content */}
                            <div className="h-16 flex items-center px-6 border-b">
                                <SheetTitle className="flex items-center gap-2 font-bold text-xl text-slate-900">
                                    <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                                        <Scissors className="h-5 w-5" />
                                    </div>
                                    <span>Stitchly</span>
                                </SheetTitle>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto py-6 px-3">
                                <nav className="grid gap-1.5 text-sm font-medium">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-3 rounded-lg ${isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                {item.name}
                                                {item.name === 'Orders' && activeOrdersCount > 0 && (
                                                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-primary-foreground/20' : 'bg-orange-100 text-orange-600'}`}>
                                                        {activeOrdersCount}
                                                    </span>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </nav>
                            </div>

                            {/* Mobile Profile Section (Bottom of Sheet) */}
                            <UserProfileSection 
                                businessName={businessName}
                                userEmail={userEmail}
                                onSignOut={handleSignOut}
                                isMobile={true} 
                            />
                        </SheetContent>
                    </Sheet>

                    {/* Desktop Header Content */}
                    <div className="hidden md:flex items-center text-sm font-medium text-slate-500">
                       {/* Space for future breadcrumbs or top-bar actions */}
                    </div>

                </header>

                {/* PAGE CONTENT */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
                    <div className="max-w-6xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}