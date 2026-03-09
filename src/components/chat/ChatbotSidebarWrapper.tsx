'use client'

import { usePathname } from 'next/navigation'
import { ChatbotSidebar } from './ChatbotSidebar'

export function ChatbotSidebarWrapper() {
  const pathname = usePathname()
  if (pathname === '/chat') return null
  return <ChatbotSidebar />
}
