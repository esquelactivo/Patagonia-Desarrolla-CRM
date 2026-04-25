'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Push a history entry when sidebar opens so back button can intercept it
  useEffect(() => {
    if (sidebarOpen) {
      history.pushState({ sidebarOpen: true }, '')
    }
  }, [sidebarOpen])

  // Back button closes sidebar instead of navigating away
  useEffect(() => {
    const onPopState = () => {
      setSidebarOpen(false)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const closeSidebar = () => {
    setSidebarOpen(false)
    // If we pushed a sidebar state, pop it so history stays clean
    if (window.history.state?.sidebarOpen) {
      history.back()
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
