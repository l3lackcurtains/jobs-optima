"use client"

import * as React from "react"
import Link from "next/link"
import {
  FileText,
  Briefcase,
  Home,
  ClipboardList,
  Search,
  User,
  Settings,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"

// Jobs Optima navigation data
const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Resumes",
    url: "/resumes",
    icon: FileText,
  },
  {
    title: "Profiles",
    url: "/profiles",
    icon: User,
  },
  {
    title: "Jobs", 
    url: "/jobs",
    icon: Briefcase,
  },
  {
    title: "Job Scanner",
    url: "/job-scanner",
    icon: Search,
  },
  {
    title: "Applications",
    url: "/applications",
    icon: ClipboardList,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

function AppHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href="/dashboard">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <FileText className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Jobs Optima</span>
                <span className="truncate text-xs">AI-Powered Job Search</span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  return (
    <Sidebar collapsible="icon" {...props}>
      <AppHeader />
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser 
          user={{
            name: session?.user?.name || `${session?.user?.firstName} ${session?.user?.lastName}` || 'User',
            email: session?.user?.email || '',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || session?.user?.email || 'User')}&background=000&color=fff`,
          }} 
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}