'use client'

import { Button } from '@/components/ui/button'
import { 
  Upload, 
  MessageSquare, 
  Send,
  LogOut,
  Menu 
} from 'lucide-react'
import { useState } from 'react'

interface DashboardSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onSignOut: () => Promise<void>
}

export default function DashboardSidebar({ activeTab, setActiveTab, onSignOut }: DashboardSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const tabs = [
    { id: 'upload', label: 'Upload Contacts', icon: Upload },
    { id: 'compose', label: 'Compose Message', icon: MessageSquare },
    { id: 'send', label: 'Send SMS', icon: Send },
  ]

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-center mb-8">
            <h1 className="text-xl font-bold text-gray-800">SMS Platform Pro</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsMobileOpen(false)
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </Button>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}