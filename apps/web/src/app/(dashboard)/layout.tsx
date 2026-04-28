'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ErrorBoundary } from '@/components/error-boundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
            <div className="ml-auto px-4">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 min-h-[calc(100vh-4rem)]">
            <div className="mx-auto w-full max-w-8xl">
              <div className="animate-in fade-in-0 duration-300">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}