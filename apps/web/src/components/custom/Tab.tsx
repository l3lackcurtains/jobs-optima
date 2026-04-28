'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: string | React.ReactNode
  content: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

interface CustomTabProps {
  tabs: TabItem[]
  activeTab?: string
  onTabChange?: (value: string) => void
  className?: string
  tabsListClassName?: string
  tabsContentClassName?: string
  variant?: 'default' | 'grid'
}

export function CustomTab({
  tabs,
  activeTab,
  onTabChange,
  className,
  tabsListClassName,
  tabsContentClassName = 'space-y-6 mt-6',
  variant = 'default'
}: CustomTabProps) {
  const [internalActiveTab, setInternalActiveTab] = React.useState(tabs[0]?.value || '')
  
  const currentActiveTab = activeTab !== undefined ? activeTab : internalActiveTab
  
  const handleTabChange = (value: string) => {
    if (activeTab === undefined) {
      setInternalActiveTab(value)
    }
    onTabChange?.(value)
  }

  const getTabsListClassName = () => {
    if (variant === 'grid') {
      // Use fixed grid classes that Tailwind can detect
      const gridColsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      }[tabs.length] || 'grid-cols-3'
      
      return cn('grid w-full', gridColsClass, tabsListClassName)
    }
    
    return cn('w-fit', tabsListClassName)
  }

  const renderTabLabel = (tab: TabItem) => {
    if (typeof tab.label === 'string' && tab.badge) {
      return (
        <span className="flex items-center gap-2">
          {tab.label}
          <span className="bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded text-xs">
            {tab.badge}
          </span>
        </span>
      )
    }
    return tab.label
  }

  return (
    <Tabs 
      value={currentActiveTab} 
      onValueChange={handleTabChange} 
      className={cn('w-full', className)}
    >
      <TabsList className={getTabsListClassName()}>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value}
            disabled={tab.disabled}
          >
            {renderTabLabel(tab)}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent 
          key={tab.value} 
          value={tab.value} 
          className={tabsContentClassName}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}