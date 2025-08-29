'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardSidebar from '@/components/DashboardSidebar'
import UploadContactsTab from '@/components/tabs/UploadContactsTab'
import ComposeMessageTab from '@/components/tabs/ComposeMessageTab'
import SendSMSTab from '@/components/tabs/SendSMSTab'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('upload')
  const { signOut } = useAuth()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadContactsTab />
      case 'compose':
        return <ComposeMessageTab />
      case 'send':
        return <SendSMSTab />
      default:
        return <UploadContactsTab />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSignOut={signOut}
      />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {renderTabContent()}
        </div>
      </main>
    </div>
  )
}