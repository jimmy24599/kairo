'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Send, 
  Bot, 
  Code, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Download,
  Play,
  Settings,
  FileText,
  FolderOpen,
  Terminal
} from 'lucide-react'
import CodeEditor from './CodeEditor'
import FileExplorer from './FileExplorer'
import TerminalPanel from './TerminalPanel'

interface AgentModeProps {
  isOpen: boolean
  onClose: () => void
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  status?: 'thinking' | 'generating' | 'complete' | 'error'
}

interface GeneratedFile {
  name: string
  content: string
  language: string
  path: string
}

export default function AgentMode({ isOpen, onClose }: AgentModeProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'files' | 'terminal'>('chat')
  const [projectStructure, setProjectStructure] = useState<any>(null)

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      status: 'thinking'
    }

    setMessages(prev => [...prev, userMessage, aiMessage])
    setInput('')
    setIsGenerating(true)

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, status: 'generating' }
          : msg
      ))

      setTimeout(() => {
        const response = generateAIResponse(input)
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: response, status: 'complete' }
            : msg
        ))
        setIsGenerating(false)
        
        // Generate sample files
        if (input.toLowerCase().includes('app') || input.toLowerCase().includes('website')) {
          generateSampleFiles()
        }
      }, 2000)
    }, 1000)
  }

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      "I'll help you build that! Let me analyze your requirements and create a modern web application with the best practices.",
      "Perfect! I'm generating a full-stack application with authentication, database integration, and a beautiful UI.",
      "Great idea! I'm creating a responsive web app with TypeScript, Next.js, and Tailwind CSS for optimal performance.",
      "Excellent! I'll build a production-ready application with proper error handling, SEO optimization, and deployment configuration."
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const generateSampleFiles = () => {
    const files: GeneratedFile[] = [
      {
        name: 'package.json',
        content: `{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0"
  }
}`,
        language: 'json',
        path: '/package.json'
      },
      {
        name: 'app/page.tsx',
        content: `import { useState } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Welcome to Your App
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-2xl mb-4">Count: {count}</p>
          <button
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Increment
          </button>
        </div>
      </div>
    </div>
  )
}`,
        language: 'typescript',
        path: '/app/page.tsx'
      },
      {
        name: 'tailwind.config.js',
        content: `module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
        language: 'javascript',
        path: '/tailwind.config.js'
      }
    ]
    setGeneratedFiles(files)
    setProjectStructure({
      name: 'my-app',
      files: files.map(f => ({ name: f.name, path: f.path }))
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="absolute inset-4 bg-white rounded-2xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">Agent Mode</h2>
                  <p className="text-sm text-secondary-600">AI-powered web app builder</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-600" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-secondary-200">
              {[
                { id: 'chat', label: 'Chat', icon: Bot },
                { id: 'code', label: 'Code', icon: Code },
                { id: 'files', label: 'Files', icon: FolderOpen },
                { id: 'terminal', label: 'Terminal', icon: Terminal }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.type === 'user'
                              ? 'bg-primary-600 text-white'
                              : 'bg-secondary-100 text-secondary-900'
                          }`}
                        >
                          {message.status === 'thinking' && (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          )}
                          {message.status === 'generating' && (
                            <div className="flex items-center space-x-2">
                              <Zap className="w-4 h-4 animate-pulse" />
                              <span>Generating your app...</span>
                            </div>
                          )}
                          {message.status === 'complete' && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{message.content}</span>
                            </div>
                          )}
                          {!message.status && message.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-6 border-t border-secondary-200">
                    <div className="flex space-x-4">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Describe the web app you want to build..."
                        className="flex-1 input-field resize-none h-12"
                        rows={1}
                        disabled={isGenerating}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isGenerating}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'code' && (
                <div className="h-full">
                  {generatedFiles.length > 0 ? (
                    <CodeEditor files={generatedFiles} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-secondary-600">
                      <div className="text-center">
                        <Code className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
                        <p>No code generated yet. Start a conversation to build your app!</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'files' && (
                <FileExplorer 
                  projectStructure={projectStructure} 
                  files={generatedFiles}
                />
              )}

              {activeTab === 'terminal' && (
                <TerminalPanel />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

