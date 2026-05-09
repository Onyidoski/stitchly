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
  ChevronUp,
  CalendarDays,
  BarChart3,
  Receipt,
} from "lucide-react"
import { PushNotificationToggle } from "@/components/push-notification-toggle"
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
import { useEffect, useState, forwardRef } from "react"

const UserProfileButton = forwardRef<
  HTMLButtonElement,
  {
    businessName: string
    userEmail: string
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ businessName, userEmail, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className="w-full h-12 p-2 flex items-center justify-start gap-3 rounded-xl transition-all group cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      {...props}
    >
      <Avatar className="h-8 w-8 border border-border shadow-sm">
        <AvatarImage src="" />
        <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
          {userEmail?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start text-left min-w-0 flex-1">
        <span className="text-sm font-semibold text-sidebar-foreground truncate w-full leading-none mb-1">
          {businessName}
        </span>
        <span className="text-xs text-muted-foreground truncate w-full leading-none font-normal">
          {userEmail}
        </span>
      </div>
      <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
    </button>
  )
})
UserProfileButton.displayName = "UserProfileButton"

function UserProfileSection({
  businessName,
  userEmail,
  onSignOut,
  isMobile = false,
  mounted = true,
}: {
  businessName: string
  userEmail: string
  onSignOut: () => void
  isMobile?: boolean
  mounted?: boolean
}) {
  return (
    <div className={`p-4 border-t border-sidebar-border bg-sidebar ${isMobile ? "mt-auto" : ""}`}>
      {mounted ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <UserProfileButton businessName={businessName} userEmail={userEmail} />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side={isMobile ? "top" : "right"}
            sideOffset={isMobile ? 10 : 20}
            className="w-[260px] p-2 rounded-2xl shadow-xl border-border z-[9999]"
          >
            <div className="flex items-center gap-3 p-2 mb-2 bg-muted/50 rounded-xl border border-border">
              <Avatar className="h-10 w-10 border border-background shadow-sm">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {userEmail?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-foreground truncate">{businessName}</span>
                <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
              </div>
            </div>

            <DropdownMenuGroup>
              <DropdownMenuItem
                asChild
                className="rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground"
              >
                <Link href="/settings" className="flex items-center gap-2.5 py-2.5">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1 bg-border" />

            <DropdownMenuItem
              onClick={onSignOut}
              className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 py-2.5"
            >
              <LogOut className="h-4 w-4 mr-2.5" />
              <span className="font-medium">Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="w-full h-12 p-2 flex items-center justify-start gap-3 rounded-xl">
          <Avatar className="h-8 w-8 border border-border shadow-sm">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
              {userEmail?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left min-w-0 flex-1">
            <span className="text-sm font-semibold text-sidebar-foreground truncate w-full leading-none mb-1">
              {businessName}
            </span>
            <span className="text-xs text-muted-foreground truncate w-full leading-none font-normal">
              {userEmail}
            </span>
          </div>
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export default function NavShell({
  children,
  businessName,
  userEmail,
  activeOrdersCount = 0,
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Orders', href: '/orders', icon: Scissors },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Receipts', href: '/receipts', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ]

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground w-[260px] flex-col md:flex fixed h-full inset-y-0 z-30 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-sidebar-foreground">
            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shadow-primary/20">
              <Scissors className="h-5 w-5" />
            </div>
            <span>Stitchly</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          <nav className="grid gap-1.5 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                    }`}
                  />
                  {item.name}
                  {item.name === 'Orders' && activeOrdersCount > 0 && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {activeOrdersCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="px-4 pb-4">
          <PushNotificationToggle />
        </div>
        <UserProfileSection
          businessName={businessName}
          userEmail={userEmail}
          onSignOut={handleSignOut}
          mounted={mounted}
        />
      </aside>

      <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen transition-all bg-background/50">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-6 justify-between md:justify-end">
          {mounted ? (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="p-0 w-[280px] flex flex-col bg-sidebar border-sidebar-border text-sidebar-foreground"
              >
                <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                  <SheetTitle className="flex items-center gap-2 font-bold text-xl text-sidebar-foreground">
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
                          className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                          {item.name === 'Orders' && activeOrdersCount > 0 && (
                            <span
                              className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? "bg-primary-foreground/20"
                                  : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                              }`}
                            >
                              {activeOrdersCount}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                <div className="px-4 pb-4">
                  <PushNotificationToggle />
                </div>
                <UserProfileSection
                  businessName={businessName}
                  userEmail={userEmail}
                  onSignOut={handleSignOut}
                  isMobile={true}
                  mounted={mounted}
                />
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground" disabled>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          )}

          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground" />
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
