'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GhostButton, IconButton } from '@/components/custom/Button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  FileText, 
  Briefcase, 
  Zap, 
  Upload,
  Home,
  Menu,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Resumes',
    href: '/resumes',
    icon: FileText,
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: Briefcase,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <IconButton className="md:hidden">
          <Menu className="h-5 w-5" />
        </IconButton>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
            <div className="space-y-1">
              {navigation.map((item) => (
                <GhostButton
                  key={item.name}
                  className={cn(
                    'w-full justify-start',
                    pathname === item.href && 'bg-secondary'
                  )}
                  asChild
                  onClick={() => setSidebarOpen(false)}
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </GhostButton>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}