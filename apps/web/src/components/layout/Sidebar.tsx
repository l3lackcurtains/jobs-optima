'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GhostButton } from '@/components/custom/Button';
import { 
  FileText, 
  Briefcase, 
  Zap, 
  BarChart3,
  Home,
  ClipboardList,
  Search,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
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
  {
    name: 'Job Scanner',
    href: '/job-scanner',
    icon: Search,
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: ClipboardList,
  },
  {
    name: 'Optimize',
    href: '/optimize',
    icon: Zap,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn('pb-12 w-64', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <GhostButton
                key={item.name}
                className={cn(
                  'w-full justify-start',
                  pathname.startsWith(item.href) && 'bg-secondary'
                )}
                asChild
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
    </div>
  );
}