'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { IosInstallPrompt } from "@/components/ios-install-prompt"

interface NavShellProps {
  children: React.ReactNode
  businessName: string
  userEmail: string
  activeOrdersCount: number
}

export default function NavShell({ 
  children, 
  businessName, 
  userEmail, 
  activeOrdersCount 
}: NavShellProps) {
  const pathname = usePathname()

  // Helper to generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    return paths.map((path, index) => {
      const href = `/${paths.slice(0, index + 1).join('/')}`
      const isLast = index === paths.length - 1
      const title = path.charAt(0).toUpperCase() + path.slice(1)

      return (
        <div key={path} className="flex items-center">
          <BreadcrumbItem className="hidden md:block">
            {isLast ? (
              <BreadcrumbPage>{title}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isLast && (
            <BreadcrumbSeparator className="hidden md:block" />
          )}
        </div>
      )
    })
  }

  return (
    <SidebarProvider>
      {/* Pass props to AppSidebar if your sidebar needs them 
         (e.g., to show the active orders badge or user email)
      */}
      <AppSidebar 
        businessName={businessName} 
        userEmail={userEmail} 
        activeOrdersCount={activeOrdersCount} 
      />
      
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                {pathname !== '/dashboard' && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
                {generateBreadcrumbs()}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>

        {/* [NEW] iOS PWA Prompt - Only shows on iPhone Safari */}
        <IosInstallPrompt />
        
      </SidebarInset>
    </SidebarProvider>
  )
}