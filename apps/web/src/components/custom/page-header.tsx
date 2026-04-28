'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string | React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 mb-6", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Link
            href="/dashboard"
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1" />
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn(
                  index === breadcrumbs.length - 1 && "text-foreground font-medium"
                )}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Page Title and Actions */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}