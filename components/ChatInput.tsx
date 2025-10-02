'use client'

import { useRef, useEffect } from 'react'
import { Plus, Mic, Square } from 'lucide-react'

interface ChatInputProps {
  chatInput: string
  setChatInput: (value: string) => void
  isFocused: boolean
  setIsFocused: (focused: boolean) => void
  isProcessing: boolean
  isAgentProcessing: boolean
  onSendMessage: () => void
  onStopAgent?: () => void
}

export default function ChatInput({
  chatInput,
  setChatInput,
  isFocused,
  setIsFocused,
  isProcessing,
  isAgentProcessing,
  onSendMessage,
  onStopAgent
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      const maxHeight = 12 * 16 // 12rem in pixels
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = newHeight + 'px'
    }
  }, [chatInput])

  return (
    <div className="p-3 flex-shrink-0 bg-neutral-950">
      <div className="relative">
        <div className="flex items-start gap-2 bg-neutral-800 rounded-lg p-2 relative">
          <div className="flex flex-col gap-1 flex-shrink-0">
            <div className="w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3 text-neutral-300" />
            </div>
            <div className="w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center">
              <Mic className="w-3 h-3 text-neutral-300" />
            </div>
          </div>
          <textarea 
            ref={textareaRef}
            placeholder="Ask Kairo..." 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none border-none resize-none overflow-y-auto"
            rows={3}
            style={{
              minHeight: '3.75rem',
              maxHeight: '12rem',
              outline: 'none',
              border: 'none',
              boxShadow: 'none'
            }}
          />
          {isAgentProcessing ? (
            <button 
              onClick={onStopAgent}
              className="w-6 h-6 bg-red-600 rounded-md flex items-center justify-center hover:bg-red-700 transition-colors mt-1 flex-shrink-0"
              title="Stop agent"
            >
              <Square className="w-3 h-3 text-white" />
            </button>
          ) : (
            <button 
              onClick={onSendMessage}
              disabled={!chatInput.trim() || isAgentProcessing}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors relative mt-1 flex-shrink-0 ${
                chatInput ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-700'
              } ${(!chatInput.trim() || isAgentProcessing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {chatInput && (
                <div 
                  className="pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position] motion-safe:animate-shine"
                  style={{
                    '--border-width': '2px',
                    '--duration': '8s',
                    backgroundImage: 'radial-gradient(transparent, transparent, rgb(255, 120, 37), rgb(225, 20, 231), transparent, transparent)',
                    backgroundSize: '300% 300%',
                    mask: 'linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px) content-box exclude, linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px)',
                    padding: 'var(--border-width)'
                  } as any}
                />
              )}
              <svg className="h-3 w-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M5 12l14 0" strokeDasharray="50%" strokeDashoffset="0%"></path>
                <path d="M13 18l6 -6"></path>
                <path d="M13 6l6 6"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
