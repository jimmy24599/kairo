'use client'

import { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'

interface Tab {
  id: string
  chatId: string | null
  name: string
  isActive: boolean
}

interface Chat {
  id: string
  name: string
  description?: string
  projectName?: string
  createdAt: Date
  lastMessageAt: Date
  messageCount: number
}

interface ChatTabsProps {
  tabs: Tab[]
  chats: Chat[]
  currentChatId: string | null
  onSwitchTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onNewChat: () => void
  onPreviousChat: (chatId: string) => void
}

export default function ChatTabs({
  tabs,
  chats,
  currentChatId,
  onSwitchTab,
  onCloseTab,
  onNewChat,
  onPreviousChat
}: ChatTabsProps) {
  const [isAddChatDropdownOpen, setIsAddChatDropdownOpen] = useState(false)
  const [isPreviousChatsDropdownOpen, setIsPreviousChatsDropdownOpen] = useState(false)

  return (
    <div className="flex items-center pl-3 pt-2 flex-shrink-0 overflow-x-auto overflow-y-visible">
      {/* Render all tabs */}
      {tabs.map((tab) => (
        <div key={tab.id} className="flex items-center">
          <div
            onClick={() => onSwitchTab(tab.id)}
            className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
              tab.isActive 
                ? 'text-white border-blue-500'
                : 'text-neutral-300 border-transparent hover:text-white hover:border-neutral-600'
            }`}
            role="button"
            tabIndex={0}
          >
            <span className="truncate max-w-32">{tab.name}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
                className="ml-1 p-1 rounded text-neutral-400 group-hover:text-white"
                title="Close tab"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
      
      {/* Add Chat Button */}
      <div className="relative add-chat-dropdown">
        <button 
          onClick={() => setIsAddChatDropdownOpen(!isAddChatDropdownOpen)}
          className="flex items-center justify-center w-8 h-8 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        {/* Add Chat Dropdown */}
        {isAddChatDropdownOpen && (
          <div className="fixed w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-[9999]" style={{
            top: '120px',
            left: '20px',
            backgroundColor: '#1f2937',
            border: '2px solid #374151'
          }}>
            <button
              onClick={() => {
                onNewChat()
                setIsAddChatDropdownOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-xs text-white hover:bg-neutral-700 flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              New Chat
            </button>
            
            {/* Previous Chats Section */}
            <div className="border-t border-neutral-700">
              <div 
                className="relative"
                onMouseEnter={() => setIsPreviousChatsDropdownOpen(true)}
                onMouseLeave={() => setIsPreviousChatsDropdownOpen(false)}
              >
                <div className="px-3 py-2 text-xs text-neutral-400 cursor-pointer hover:bg-neutral-700 flex items-center justify-between">
                  <span>Previous Chats</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
                
                {/* Previous Chats Dropdown */}
                {isPreviousChatsDropdownOpen && (
                  <div className="absolute left-full top-0 mt-0 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto previous-chats-dropdown">
                    {chats.filter(chat => chat.id !== currentChatId).map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          onPreviousChat(chat.id)
                          setIsAddChatDropdownOpen(false)
                          setIsPreviousChatsDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-white hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{chat.name}</div>
                          <div className="text-neutral-400 text-[10px] truncate">
                            {new Date(chat.lastMessageAt).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    ))}
                    {chats.filter(chat => chat.id !== currentChatId).length === 0 && (
                      <div className="px-3 py-2 text-xs text-neutral-500">
                        No previous chats
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
