'use client';

import { IconButton } from '@/components/custom/Button';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUIStore } from '@/stores/uiStore';

export function Header() {
  const { data: session } = useSession();
  const { toggleSidebar } = useUIStore();

  const userInitials = session?.user ? 
    `${session.user.firstName?.[0] || session.user.name?.split(' ')[0]?.[0] || 'U'}${session.user.lastName?.[0] || session.user.name?.split(' ')[1]?.[0] || ''}` 
    : 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <IconButton
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </IconButton>
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-semibold">Jobs Optima</h1>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name || `${session.user.firstName} ${session.user.lastName}`}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}