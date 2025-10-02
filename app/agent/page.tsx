'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Lock, 
  Eye, 
  Code, 
  Search, 
  Download, 
  Github, 
  Crown, 
  Play,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus,
  Mic,
  Square,
  MessageCircle,
  Command,
  Cpu,
  Code2,
  ChevronRight,
  RefreshCw,
  ChevronLeft,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Upload,
  Save,
  File,
  Folder,
  FolderOpen,
  Check,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { WebSocketClient } from '@/lib/websocketClient'
import { api } from '@/lib/config'
import ChatTabs from '@/components/ChatTabs'
import MessagesContainer from '@/components/MessagesContainer'
import ChatInput from '@/components/ChatInput'

// FileTree component for hierarchical file display
const FileTree = ({ files, selectedFile, onFileSelect, level = 0 }: {
  files: any[],
  selectedFile: string,
  onFileSelect: (filePath: string) => void,
  level?: number
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath)
      } else {
        newSet.add(folderPath)
      }
      return newSet
    })
  }

  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.')
    return parts.length > 1 ? (parts.pop() || '').toLowerCase() : ''
  }

  const FileTypeIcon = ({ fileName }: { fileName: string }) => {
    const ext = getFileExtension(fileName)
    const baseClass = 'w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[8px] leading-none border'

    switch (ext) {
      case 'js':
        return <div className={`${baseClass} bg-yellow-400/10 text-yellow-400 border-yellow-400/30`}>JS</div>
      case 'ts':
        return <div className={`${baseClass} bg-blue-400/10 text-blue-400 border-blue-400/30`}>TS</div>
      case 'tsx':
        return <div className={`${baseClass} bg-cyan-400/10 text-cyan-400 border-cyan-400/30`}>TSX</div>
      case 'jsx':
        return <div className={`${baseClass} bg-cyan-400/10 text-cyan-400 border-cyan-400/30`}>JSX</div>
      case 'json':
        return <div className={`${baseClass} bg-yellow-400/10 text-yellow-400 border-yellow-400/30`}>{'{}'}</div>
      case 'html':
        return <div className={`${baseClass} bg-orange-400/10 text-orange-400 border-orange-400/30`}>{'<> '}</div>
      case 'css':
        return <div className={`${baseClass} bg-indigo-400/10 text-indigo-400 border-indigo-400/30`}>CSS</div>
      case 'md':
      case 'markdown':
        return <div className={`${baseClass} bg-slate-400/10 text-slate-300 border-slate-400/30`}>MD</div>
      case 'yml':
      case 'yaml':
        return <div className={`${baseClass} bg-amber-400/10 text-amber-300 border-amber-400/30`}>YML</div>
      case 'xml':
        return <div className={`${baseClass} bg-purple-400/10 text-purple-300 border-purple-400/30`}>XML</div>
      case 'sql':
        return <div className={`${baseClass} bg-emerald-400/10 text-emerald-300 border-emerald-400/30`}>SQL</div>
      case 'py':
        return <div className={`${baseClass} bg-yellow-400/10 text-yellow-300 border-yellow-400/30`}>PY</div>
      case 'java':
        return <div className={`${baseClass} bg-red-400/10 text-red-300 border-red-400/30`}>JAVA</div>
      case 'rb':
        return <div className={`${baseClass} bg-rose-400/10 text-rose-300 border-rose-400/30`}>RB</div>
      case 'go':
        return <div className={`${baseClass} bg-sky-400/10 text-sky-300 border-sky-400/30`}>GO</div>
      case 'rs':
        return <div className={`${baseClass} bg-orange-400/10 text-orange-300 border-orange-400/30`}>RS</div>
      case 'c':
      case 'h':
      case 'cpp':
        return <div className={`${baseClass} bg-zinc-400/10 text-zinc-300 border-zinc-400/30`}>C</div>
      case 'php':
        return <div className={`${baseClass} bg-violet-400/10 text-violet-300 border-violet-400/30`}>PHP</div>
      case 'sh':
        return <div className={`${baseClass} bg-green-400/10 text-green-300 border-green-400/30`}>SH</div>
      case 'env':
        return <div className={`${baseClass} bg-green-400/10 text-green-300 border-green-400/30`}>ENV</div>
      case 'txt':
        return <div className={`${baseClass} bg-neutral-500/10 text-neutral-300 border-neutral-500/30`}>TXT</div>
      case 'svg':
        return <div className={`${baseClass} bg-fuchsia-400/10 text-fuchsia-300 border-fuchsia-400/30`}>SVG</div>
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        return <div className={`${baseClass} bg-teal-400/10 text-teal-300 border-teal-400/30`}>IMG</div>
      default:
        return <File className="w-4 h-4 text-neutral-400" />
    }
  }

  return (
    <div className="space-y-1">
      {files.map((file, index) => (
        <div key={index} className="text-sm">
          {file.type === 'directory' ? (
            <div>
              <div 
                className="flex items-center gap-2 text-neutral-300 hover:text-white cursor-pointer py-1"
                style={{ paddingLeft: `${level * 12}px` }}
                onClick={() => toggleFolder(file.path)}
              >
                {expandedFolders.has(file.path) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <FolderOpen className="w-4 h-4" />
                <span>{file.name}</span>
              </div>
              {expandedFolders.has(file.path) && file.children && (
                <FileTree 
                  files={file.children} 
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                  level={level + 1}
                />
              )}
            </div>
          ) : (
            <div 
              className={`flex items-center gap-2 cursor-pointer py-1 ${
                selectedFile === file.path ? 'text-blue-400' : 'text-neutral-400 hover:text-white'
              }`}
              style={{ paddingLeft: `${(level + 1) * 12}px` }}
              onClick={() => onFileSelect(file.path)}
            >
              <FileTypeIcon fileName={file.name} />
              <span>{file.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


export default function AgentPage() {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(true)
  const [viewMode, setViewMode] = useState<'viewer' | 'code'>('viewer')
  const [chatInput, setChatInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [borderOffset, setBorderOffset] = useState(0)
  const [currentShadowIndex, setCurrentShadowIndex] = useState(0)
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'mobile' | 'tablet'>('desktop')
  const [isDevServerRunning, setIsDevServerRunning] = useState(false)
  const [devServerPort, setDevServerPort] = useState<number | null>(null)
  const [isStartingServer, setIsStartingServer] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [currentAgentThought, setCurrentAgentThought] = useState('')
  // Chat management state
  const [chats, setChats] = useState<Array<{
    id: string
    name: string
    description?: string
    projectName?: string
    createdAt: Date
    lastMessageAt: Date
    messageCount: number
  }>>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  
  // Tab management state
  const [tabs, setTabs] = useState<Array<{
    id: string
    chatId: string | null
    name: string
    isActive: boolean
  }>>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{
    id: string
    role: 'user' | 'agent'
    content: string
    timestamp: Date
    isStep?: boolean
    messageType?: 'text' | 'todo' | 'step' | 'tasks' | 'todoList'
    stepData?: {
      id: string
      description: string
      filePath?: string
      status: 'pending' | 'active' | 'completed' | 'error'
      linesAdded?: number
      linesRemoved?: number
      error?: string
    } | {
      tasks: Array<{
        id: number
        text: string
        status: 'pending' | 'active' | 'completed' | 'error'
      }>
      currentThought: string
      progress: {
        completed: number
        total: number
        percent: number
      }
    }
    tasks?: Array<{
      tool: string
      explanation: string
      status: 'pending' | 'running' | 'done' | 'failed'
    }>
    todoListTasks?: Array<{
      taskId: number
      text: string
      status: 'pending' | 'running' | 'done' | 'failed'
      tool: string
    }> // For todoList messages - Array of task objects
  }>>([])
  const [isAgentProcessing, setIsAgentProcessing] = useState(false)
  const [agentStatus, setAgentStatus] = useState('ready')
  
  // Chat UI state
  const [isAddChatDropdownOpen, setIsAddChatDropdownOpen] = useState(false)
  const [isPreviousChatsDropdownOpen, setIsPreviousChatsDropdownOpen] = useState(false)
  
  
  const [projects, setProjects] = useState<Array<{name: string, displayName: string, path: string}>>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [hasProjectFromUrl, setHasProjectFromUrl] = useState<boolean>(false)
  const [projectFiles, setProjectFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [fileContent, setFileContent] = useState<string>('')
  const [isFileModified, setIsFileModified] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [agentTasks, setAgentTasks] = useState<Array<{
    id: string
    description?: string
    text?: string
    filePath?: string
    status: 'pending' | 'active' | 'completed' | 'error'
    linesAdded?: number
    linesRemoved?: number
    error?: string
    subtasks?: Array<{
      id: string
      text: string
      tool: string
      parameters: any
      status: 'pending' | 'active' | 'done' | 'error'
    }>
  }>>([])
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1)
  const [isAllTasksDone, setIsAllTasksDone] = useState(false)
  
  // New todo and subtask state management
  const [todos, setTodos] = useState<Array<{
    _id: string
    taskName: string
    order: number
    status: 'pending' | 'running' | 'done' | 'failed'
    subtask?: string
  }>>([])
  
  const [subtasks, setSubtasks] = useState<Map<string, {
    _id: string
    todoId: string
    tasksName: Map<string, {
      name: string
      tool: string
      parameters: any
      status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
    }>
  }>>(new Map())

  // Removed real-time task progress state - now using MongoDB-based todo messages
  
  // Function to fetch todos from MongoDB
  const fetchTodos = async (chatId: string) => {
    try {
      const response = await fetch(`/api/todos/chat/${chatId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setTodos(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error)
    }
  }

  // Function to fetch subtasks
  const fetchSubtasks = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const subtask = data.data
          // Convert tasksName object to Map with proper typing
          const tasksNameMap = new Map<string, {
            name: string
            tool: string
            parameters: any
            status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
          }>()
          
          Object.entries(subtask.tasksName).forEach(([key, value]: [string, any]) => {
            tasksNameMap.set(key, {
              name: value.name,
              tool: value.tool,
              parameters: value.parameters,
              status: value.status
            })
          })
          
          const subtaskData = {
            _id: subtask._id,
            todoId: subtask.todoId,
            tasksName: tasksNameMap
          }
          setSubtasks(prev => new Map(prev).set(subtaskId, subtaskData))
        }
      }
    } catch (error) {
      console.error('Failed to fetch subtasks:', error)
    }
  }
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null)
  const shadowColors = ['rgb(255, 138, 26)', 'rgb(80, 148, 242)', 'rgb(248, 55, 115)', 'rgb(255, 134, 33)']

  // Fetch todos when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      fetchTodos(currentChatId)
    }
  }, [currentChatId])

  // Get the prompt and project from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const promptFromUrl = urlParams.get('prompt')
    const projectFromUrl = urlParams.get('project')
    
    console.log('🔗 URL parameters:', { promptFromUrl, projectFromUrl })
    
    if (promptFromUrl) {
      setPrompt(decodeURIComponent(promptFromUrl))
      setChatInput(decodeURIComponent(promptFromUrl))
    }
    
    if (projectFromUrl) {
      console.log('🔗 Setting project from URL:', projectFromUrl)
      setSelectedProject(projectFromUrl)
      setHasProjectFromUrl(true)
    }
    
    // Simulate processing completion after 3 seconds
    setTimeout(() => {
      setIsProcessing(false)
    }, 3000)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 12 * 16 // 12rem in pixels (assuming 16px base)
      
      if (scrollHeight <= maxHeight) {
        textareaRef.current.style.height = scrollHeight + 'px'
      } else {
        textareaRef.current.style.height = maxHeight + 'px'
      }
    }
  }, [chatInput])

  // Load projects via WebSocket
  const loadProjects = () => {
    if (wsClient) {
      console.log('🔄 Requesting projects via WebSocket')
      wsClient.getProjects()
    }
  }

  // Load project files
  const loadProjectFiles = async (projectName: string) => {
    try {
      const response = await fetch(api.projects.files(projectName))
      const data = await response.json()
      if (data.success) {
        setProjectFiles(data.files)
      }
    } catch (error) {
      console.error('Error loading project files:', error)
    }
  }

  // Load file content
  const loadFileContent = async (projectName: string, filePath: string) => {
    try {
      const response = await fetch(`${api.projects.file(projectName)}?path=${encodeURIComponent(filePath)}`)
      const data = await response.json()
      if (data.success) {
        setFileContent(data.content)
        setSelectedFile(filePath)
        setIsFileModified(false)
      }
    } catch (error) {
      console.error('Error loading file content:', error)
    }
  }

  // Save file
  const saveFile = async () => {
    if (!selectedProject || !selectedFile) {
      console.error('Missing project or file selection')
      return
    }
    
    try {
      console.log('Saving file:', { selectedProject, selectedFile, contentLength: fileContent.length })
      
      const response = await fetch(`/api/projects/${selectedProject}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: selectedFile,
          content: fileContent
        })
      })
      
      const data = await response.json()
      console.log('Save response:', data)
      
      if (data.success) {
        setIsFileModified(false)
        console.log('File saved successfully')
      } else {
        console.error('Save failed:', data.error)
      }
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  // Get language from file extension
  const getLanguageFromFile = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'tsx':
      case 'ts':
        return 'typescript'
      case 'jsx':
      case 'js':
        return 'javascript'
      case 'css':
        return 'css'
      case 'html':
        return 'html'
      case 'json':
        return 'json'
      case 'md':
        return 'markdown'
      case 'py':
        return 'python'
      case 'java':
        return 'java'
      case 'cpp':
      case 'c':
        return 'cpp'
      case 'php':
        return 'php'
      case 'rb':
        return 'ruby'
      case 'go':
        return 'go'
      case 'rs':
        return 'rust'
      case 'sql':
        return 'sql'
      case 'yaml':
      case 'yml':
        return 'yaml'
      case 'xml':
        return 'xml'
      default:
        return 'plaintext'
    }
  }

  // Load projects and chats on mount
  useEffect(() => {
    loadChats()
    
    // Create initial "New Chat" tab
    if (tabs.length === 0) {
      const initialTabId = `tab-${Date.now()}`
      const initialTab = {
        id: initialTabId,
        chatId: null, // No chat ID until first message is sent
        name: 'New Chat',
        isActive: true
      }
      setTabs([initialTab])
      setActiveTabId(initialTabId)
    }
  }, [])

  // Load projects when WebSocket is ready
  useEffect(() => {
    if (wsClient) {
      loadProjects()
    }
  }, [wsClient])

  // Auto-send initial message when coming from homepage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const promptFromUrl = urlParams.get('prompt')
    const projectFromUrl = urlParams.get('project')
    
    // Only auto-send if we have both prompt and project, and WebSocket is ready
    if (promptFromUrl && projectFromUrl && wsClient && !isProcessing && !isAgentProcessing) {
      const decodedPrompt = decodeURIComponent(promptFromUrl)
      
      // Set the chat input and auto-send the message
      setChatInput(decodedPrompt)
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        sendMessage()
      }, 1000)
      
      // Clean up URL parameters to prevent re-sending
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('prompt')
      newUrl.searchParams.delete('project')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [wsClient, isProcessing, isAgentProcessing])

  // Note: Removed automatic chat creation on page load
  // Chats will only be created when user sends their first message

  // Load project files when project changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectFiles(selectedProject)
    }
  }, [selectedProject])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (isDropdownOpen && !target.closest('.project-dropdown')) {
        setIsDropdownOpen(false)
      }
      
      if (isAddChatDropdownOpen && !target.closest('.add-chat-dropdown')) {
        setIsAddChatDropdownOpen(false)
      }
      
      if (isPreviousChatsDropdownOpen && !target.closest('.previous-chats-dropdown')) {
        setIsPreviousChatsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, isAddChatDropdownOpen, isPreviousChatsDropdownOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        if (selectedFile && isFileModified) {
          saveFile()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedFile, isFileModified])

  // Initialize WebSocket client
  useEffect(() => {
    console.log('🔌 Creating WebSocket client...')
    const client = new WebSocketClient()
    
    // Set up message handlers for iterative agent
    client.onMessage('start', (data) => {
      setIsAgentProcessing(true)
      setAgentStatus('Starting agent...')
      setAgentTasks([])
      setCurrentTaskIndex(-1)
      setCompletedTasks([])
      setIsAllTasksDone(false)
      // Don't reset real-time mode - let completed tasks stay as messages
    })
    
    client.onMessage('iteration', (data) => {
      setAgentStatus(`Iteration ${data.iteration}/${data.maxIterations}`)
    })
    
    client.onMessage('agent_reasoning', (data) => {
      // Handle agent reasoning updates
      setCurrentAgentThought(data.thought)
    })
    
    client.onMessage('todo', (data) => {
      // Handle initial todo list creation
      setCurrentAgentThought(data.currentThought)
      setAgentTasks(data.tasks || [])
    })
    
    client.onMessage('updateTodo', (data) => {
      // Handle todo list updates with progress
      setCurrentAgentThought(data.currentThought)
      setAgentTasks(data.tasks || [])
      
      // Update the existing todo message in the messages array
      setMessages(prev => prev.map(msg => {
        if (msg.messageType === 'todo' && msg.stepData && 'tasks' in msg.stepData) {
          return {
            ...msg,
            content: data.currentThought,
            stepData: {
              ...msg.stepData,
              tasks: data.tasks || [],
              currentThought: data.currentThought,
              progress: data.progress || { completed: 0, total: 0, percent: 0 }
            },
            timestamp: new Date()
          }
        }
        return msg
      }))
    })
    
    client.onMessage('updateTask', (data) => {
      // Handle main task updates
      setCurrentAgentThought(data.currentThought)
    })
    
    client.onMessage('updateSubtask', (data) => {
      // Handle subtask updates
      setCurrentAgentThought(data.currentThought)
    })

    // MongoDB-based todoList message handlers
    console.log('🔌 Registering todoList_updated handler')
    client.onMessage('todoList_updated', (message) => {
      // Handle todoList message updates from MongoDB
      console.log('🔌 Received todoList_updated:', message)
      console.log('🔌 Current chatId:', currentChatId)
      console.log('🔌 Message chatId:', message.chatId)
      
      // Refresh messages to get the latest todoList updates
      refreshCurrentChat()
    })
    
    // Handle new message creation
    console.log('🔌 Registering message_created handler')
    client.onMessage('message_created', (message) => {
      // Handle new message creation from MongoDB
      console.log('🔌 Received message_created:', message)
      console.log('🔌 Current chatId:', currentChatId)
      console.log('🔌 Message chatId:', message.chatId)
      
      // Refresh messages to show the new message
      if (currentChatId && message.chatId === currentChatId) {
        console.log('🔌 Refreshing messages for new message in current chat')
        refreshCurrentChat()
      } else if (currentChatId) {
        console.log('🔌 New message in different chat, not refreshing')
      } else {
        console.log('⚠️ No current chatId, cannot refresh messages')
      }
    })
    
    // Handle subtask status updates from backend
    client.onMessage('subtask_status', (data) => {
      console.log('Received subtask_status update:', data)
      // Update the specific subtask status in the subtasks Map
      setSubtasks(prev => {
        const newSubtasks = new Map(prev)
        const subtask = newSubtasks.get(data.todoId)
        if (subtask) {
          const updatedTasksName = new Map(subtask.tasksName)
          const taskEntry = Array.from(updatedTasksName.entries()).find(([key]) => key === data.order.toString())
          if (taskEntry) {
            const [key, task] = taskEntry
            updatedTasksName.set(key, { ...task, status: data.status })
            newSubtasks.set(data.todoId, { ...subtask, tasksName: updatedTasksName })
          }
        }
        return newSubtasks
      })
    })
    
    // Handle todo status updates from backend
    client.onMessage('todo_status', (data) => {
      console.log('Received todo_status update:', data)
      // Update the specific todo status
      setTodos(prev => prev.map(todo => 
        todo._id === data.todoId 
          ? { ...todo, status: data.status }
          : todo
      ))
    })
    
    // Handle todo list updates (when new todos are created)
    client.onMessage('todos_updated', (data) => {
      console.log('Received todos_updated:', data)
      if (currentChatId) {
        fetchTodos(currentChatId)
      }
    })
    
    client.onMessage('tool_code', (data) => {
      console.log('Frontend received tool_code:', data)
      setAgentStatus(`Executing: ${data.tool} - ${data.explanation}`)
      
      // Add step as a permanent chat message
      const stepMessage = {
        id: `step-${Date.now()}`,
        role: 'agent' as const,
        content: `**${data.tool}**: ${data.explanation}`,
        timestamp: new Date(),
        isStep: true,
        messageType: 'step' as const,
        stepData: {
          id: `step-${Date.now()}`,
          description: `${data.tool}: ${data.explanation}`,
          filePath: data.parameters?.path || data.parameters?.filePath,
          status: 'active' as const,
          linesAdded: 0,
          linesRemoved: 0
        }
      }
      setMessages(prev => [...prev, stepMessage])
      
      setCurrentTaskIndex(prev => prev + 1)
    })
    
    client.onMessage('tool_result', (data) => {
      console.log('Frontend received tool_result:', data)
      const isSuccess = data.result?.success !== false
      const resultSummary = isSuccess ? '✓' : '✗'
      console.log(`Tool ${data.tool} completed with success: ${isSuccess}`)
      setAgentStatus(`${resultSummary} ${data.tool} completed`)
      
      // Update the current task with results
      setAgentTasks(prev => {
        const updatedTasks = [...prev]
        // Find the task that matches this tool
        const taskIndex = updatedTasks.findIndex(task => {
          if (!task || task.status !== 'active') return false
          
          // Handle both old and new task structures
          const description = task.description || task.text || ''
          return description.startsWith(`${data.tool}:`) || description.includes(data.tool)
        })
        
        if (taskIndex !== -1) {
          const currentTask = updatedTasks[taskIndex]
          // Check if result has success property, otherwise assume success for read/list operations
          const isSuccess = data.result?.success !== false
          currentTask.status = isSuccess ? 'completed' : 'error'
          currentTask.linesAdded = data.result?.linesAdded || 0
          currentTask.linesRemoved = data.result?.linesRemoved || 0
          currentTask.error = data.result?.error
        }
        
        return updatedTasks
      })
      
      // Update the step message in chat
      setMessages(prev => prev.map(msg => {
        if (msg.isStep && msg.stepData && 'description' in msg.stepData) {
          const description = msg.stepData.description || ''
          if (description.startsWith(`${data.tool}:`) || description.includes(data.tool)) {
            // Check if result has success property, otherwise assume success for read/list operations
            const isSuccess = data.result?.success !== false
            return {
              ...msg,
              stepData: {
                ...msg.stepData,
                status: isSuccess ? 'completed' : 'error',
                linesAdded: data.result?.linesAdded || 0,
                linesRemoved: data.result?.linesRemoved || 0,
                error: data.result?.error
              }
            }
          }
        }
        return msg
      }))
      
      // Refresh project files if a file was modified
      if (isSuccess && (data.tool === 'write_file' || data.tool === 'create_file' || data.tool === 'delete_file' || data.tool === 'rename_file')) {
        if (selectedProject) {
          loadProjectFiles(selectedProject)
          
          // If the currently open file was modified, refresh its content
          const modifiedFilePath = data.parameters?.path || data.parameters?.filePath
          if (modifiedFilePath && selectedFile === modifiedFilePath) {
            loadFileContent(selectedProject, modifiedFilePath)
          }
        }
      }
      
      // Mark current task as completed
      setCompletedTasks(prev => [...prev, prev.length])
    })
    
    client.onMessage('tool_retry', (data) => {
      setAgentStatus(`Retrying ${data.tool} (attempt ${data.attempt}/${data.maxRetries})`)
    })
    
    client.onMessage('complete', (data) => {
      setIsAgentProcessing(false)
      setAgentStatus('Task completed')
      setIsAllTasksDone(true)
      setCurrentAgentThought('') // Clear agent thought when complete
      // Don't add completion message - TasksComponent shows the progress
    })
    
    client.onMessage('error', (data) => {
      setIsAgentProcessing(false)
      setAgentStatus(`Error: ${data.message}`)
    })
    
    client.onMessage('stopped', (data) => {
      setIsAgentProcessing(false)
      setAgentStatus('Agent stopped')
      setCurrentAgentThought('') // Clear agent thought when stopped
    })
    
    client.onMessage('projects', (data) => {
      console.log('📁 Received projects from WebSocket:', data)
      const transformedProjects = data.projects.map((name: string) => ({
        name,
        displayName: name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        path: name
      }))
      console.log('📁 Transformed projects:', transformedProjects)
      setProjects(transformedProjects)
      
      // Check if there's a project from URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const projectFromUrl = urlParams.get('project')
      
      if (projectFromUrl && transformedProjects.some(p => p.name === projectFromUrl)) {
        // Use project from URL if it exists in the projects list
        console.log('📁 Selecting project from URL:', projectFromUrl)
        setSelectedProject(projectFromUrl)
      } else if (transformedProjects.length > 0 && !selectedProject && !hasProjectFromUrl) {
        // Auto-select first project if none selected and no URL project
        console.log('📁 Auto-selecting first project:', transformedProjects[0].name)
        setSelectedProject(transformedProjects[0].name)
      }
    })
    
    client.onMessage('project_files', (data) => {
      setProjectFiles(data.files)
    })
    
    client.onMessage('file_content', (data) => {
      setFileContent(data.content)
      setSelectedFile(data.filePath)
      setIsFileModified(false)
    })
    
    client.onMessage('file_saved', (data) => {
      setIsFileModified(false)
      setAgentStatus('File saved successfully')
    })
    
    // Connect to backend
    console.log('🔌 Connecting to WebSocket...')
    client.connect().then(() => {
      console.log('🔌 WebSocket connected successfully')
      setWsClient(client)
      // Load initial data
      client.getProjects()
    }).catch((error) => {
      console.error('❌ WebSocket connection failed:', error)
    })
    
    return () => {
      client.disconnect()
    }
  }, [])

  // Send message to agent
  const sendMessage = async () => {
    if (!chatInput.trim() || isAgentProcessing || !wsClient) return

    // Get the active tab
    const activeTab = tabs.find(tab => tab.isActive)
    if (!activeTab) return

    // Create a new chat if this is the first message and no chat exists
    let chatId = activeTab.chatId
    console.log('🔍 Current activeTab:', activeTab)
    console.log('🔍 Current chatId:', chatId)
    console.log('🔍 All tabs:', tabs)
    console.log('🔍 currentChatId state:', currentChatId)
    
    if (!chatId) {
      console.log('🔍 No chatId found, creating new chat...')
      chatId = await createNewChat()
      console.log('🔍 Created new chatId:', chatId)
      if (chatId) {
        // Update the active tab with the new chatId
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === activeTab.id 
              ? { ...tab, chatId: chatId }
              : tab
          )
        )
        setCurrentChatId(chatId)
        console.log('🔍 Updated tab with new chatId:', chatId)
        console.log('🔍 Updated currentChatId state to:', chatId)
      }
    } else {
      console.log('🔍 Using existing chatId:', chatId)
    }

    // If this is the first message in a "New Chat", generate a name based on the message
    if (chatId && messages.length === 0) {
      const chatName = generateChatName(chatInput)
      // Update the chat name in the database
      try {
        await fetch(api.chats.update(chatId), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: chatName,
            description: chatInput.substring(0, 100)
          })
        })
        // Update local state
        setChats(prev => prev.map(chat => 
          chat.id === chatId ? { ...chat, name: chatName } : chat
        ))
        
        // Update the tab name as well
        setTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === activeTab.id 
              ? { ...tab, name: chatName }
              : tab
          )
        )
      } catch (error) {
        console.error('Error updating chat name:', error)
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: chatInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsAgentProcessing(true)
    setAgentStatus('processing')
    // Don't reset real-time mode - let completed tasks stay as messages

    try {
      // Use WebSocket client with chatId
      console.log('🔍 Sending WebSocket message with chatId:', chatId)
      wsClient.sendMessage('process_request', {
        userInput: chatInput,
        projectName: selectedProject,
        chatId: chatId
      })

      // WebSocket message handling is done in the useEffect above
      // No need for streaming response handling here

    } catch (error) {
      console.error('Agent error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
      setAgentStatus('ready')
    } finally {
      setIsAgentProcessing(false)
    }
  }

  // Stop agent processing
  const stopAgent = async () => {
    if (!wsClient) return
    
    try {
      console.log('🛑 Stopping agent...')
      wsClient.stopAgent()
    } catch (error) {
      console.error('Error stopping agent:', error)
    }
  }

  // Animated border effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBorderOffset(prev => (prev + 0.5) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Focus shadow animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShadowIndex(prev => (prev + 1) % shadowColors.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [shadowColors.length])


  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [chatInput])

  // Chat management functions
  const loadChats = async () => {
    try {
      const response = await fetch(api.chats.list())
      const data = await response.json()
      if (data.success) {
        // Map _id to id for consistency
        const chatsWithId = data.data.map((chat: any) => ({
          ...chat,
          id: chat._id
        }))
        setChats(chatsWithId)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    }
  }

  const createNewChat = async (name: string = 'New Chat', description: string = '') => {
    try {
      const response = await fetch(api.chats.create(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          projectName: selectedProject || null
        })
      })
      const data = await response.json()
      if (data.success) {
        const newChat = data.data
        const chatWithId = { ...newChat, id: newChat._id }
        setChats(prev => [chatWithId, ...prev])
        setCurrentChatId(newChat._id)
        setMessages([])
        return newChat._id
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    }
    return null
  }

  const loadChatMessages = async (chatId: string) => {
    try {
      console.log('🔄 Loading messages for chat:', chatId)
      const response = await fetch(api.messages.list(chatId))
      const data = await response.json()
      
      if (data.success) {
        const messages = data.data
        console.log('🔍 Loaded messages from API:', messages)
        console.log('🔍 All message types:', messages.map((msg: any) => ({ id: msg._id, type: msg.messageType })))
        console.log('🔍 Todo messages:', messages.filter((msg: any) => msg.messageType === 'todo'))
        console.log('🔍 TodoList messages:', messages.filter((msg: any) => msg.messageType === 'todoList'))
        
        // Check if any message has todoListTasks
        const messagesWithTodoListTasks = messages.filter((msg: any) => msg.todoListTasks)
        console.log('🔍 Messages with todoListTasks:', messagesWithTodoListTasks)
        
        const mappedMessages = messages.map((msg: any) => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          messageType: msg.messageType || 'text',
          isStep: msg.messageType === 'step',
          stepData: msg.stepData ? {
            // For step messages
            id: msg._id,
            description: msg.stepData.explanation,
            filePath: msg.stepData.filePath,
            status: msg.stepData.status,
            linesAdded: msg.stepData.linesAdded,
            linesRemoved: msg.stepData.linesRemoved,
            error: msg.stepData.error,
            // For todo messages
            tasks: msg.stepData.tasks,
            currentThought: msg.stepData.currentThought,
            progress: msg.stepData.progress
          } : undefined,
          // For todoList messages
          todoListTasks: msg.todoListTasks
        }))
        
        console.log('🔍 Mapped messages:', mappedMessages)
        console.log('🔍 Mapped todoList messages:', mappedMessages.filter((msg: any) => msg.messageType === 'todoList'))
        
        setMessages(mappedMessages)
        console.log('✅ Messages updated in state')
      } else {
        console.error('❌ Failed to load messages:', data.error)
      }
    } catch (error) {
      console.error('❌ Error loading chat messages:', error)
    }
  }

  // Global refresh function for real-time updates
  const refreshCurrentChat = () => {
    if (currentChatId) {
      console.log('🔄 Refreshing current chat:', currentChatId)
      loadChatMessages(currentChatId)
    } else {
      console.log('⚠️ No current chat to refresh')
    }
  }

  // Periodic refresh as fallback (every 5 seconds when agent is processing)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    if (currentChatId && isAgentProcessing) {
      console.log('🔄 Starting periodic refresh for real-time updates')
      intervalId = setInterval(() => {
        console.log('🔄 Periodic refresh triggered')
        refreshCurrentChat()
      }, 5000) // Refresh every 5 seconds
    }
    
    return () => {
      if (intervalId) {
        console.log('🔄 Stopping periodic refresh')
        clearInterval(intervalId)
      }
    }
  }, [currentChatId, isAgentProcessing])

  const generateChatName = (userMessage: string): string => {
    // Simple logic to generate a brief description
    const words = userMessage.toLowerCase().split(' ').slice(0, 5)
    const filteredWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'may', 'use', 'her', 'many', 'some', 'very', 'when', 'much', 'then', 'them', 'can', 'only', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    )
    return filteredWords.slice(0, 3).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'New Chat'
  }

  const handleNewChat = () => {
    // Create a new tab without creating a chat in MongoDB
    const newTabId = `tab-${Date.now()}`
    const newTab = {
      id: newTabId,
      chatId: null, // No chat ID until first message is sent
      name: 'New Chat',
      isActive: true
    }
    
    setTabs(prevTabs => {
      // Deactivate all existing tabs
      const updatedTabs = prevTabs.map(tab => ({ ...tab, isActive: false }))
      return [...updatedTabs, newTab]
    })
    
    setActiveTabId(newTabId)
    setCurrentChatId(null)
    setMessages([])
    setIsAddChatDropdownOpen(false)
  }

  // Tab management functions
  const createNewTab = (chatId: string, chatName: string) => {
    const tabId = `tab-${Date.now()}`
    const newTab = {
      id: tabId,
      chatId: chatId,
      name: chatName,
      isActive: true
    }
    
    setTabs(prevTabs => {
      // Deactivate all existing tabs
      const updatedTabs = prevTabs.map(tab => ({ ...tab, isActive: false }))
      return [...updatedTabs, newTab]
    })
    
    setActiveTabId(tabId)
    setCurrentChatId(chatId)
    return tabId
  }

  const switchToTab = async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      setTabs(prevTabs => 
        prevTabs.map(t => ({ ...t, isActive: t.id === tabId }))
      )
      setActiveTabId(tabId)
      setCurrentChatId(tab.chatId)
      
      // Only load messages if the tab has a chatId
      if (tab.chatId) {
        await loadChatMessages(tab.chatId)
      } else {
        // Clear messages for new chat tabs
        setMessages([])
      }
    }
  }

  const closeTab = (tabId: string) => {
    const tabToClose = tabs.find(t => t.id === tabId)
    if (!tabToClose) return

    setTabs(prevTabs => {
      const remainingTabs = prevTabs.filter(t => t.id !== tabId)
      
      // If we're closing the active tab, switch to another tab
      if (tabToClose.isActive && remainingTabs.length > 0) {
        const newActiveTab = remainingTabs[remainingTabs.length - 1]
        newActiveTab.isActive = true
        setActiveTabId(newActiveTab.id)
        setCurrentChatId(newActiveTab.chatId)
        if (newActiveTab.chatId) {
          loadChatMessages(newActiveTab.chatId)
        } else {
          setMessages([])
        }
      } else if (remainingTabs.length === 0) {
        // No tabs left, clear everything
        setActiveTabId(null)
        setCurrentChatId(null)
        setMessages([])
      }
      
      return remainingTabs
    })
  }

  const handlePreviousChat = async (chatId: string) => {
    if (!chatId) {
      console.error('chatId is undefined or null')
      return
    }
    
    // Check if this chat is already open in a tab
    const existingTab = tabs.find(tab => tab.chatId === chatId)
    
    if (existingTab) {
      // Switch to existing tab
      await switchToTab(existingTab.id)
    } else {
      // Create new tab for this chat
      const chat = chats.find(c => c.id === chatId)
      const chatName = chat?.name || 'Previous Chat'
      const newTabId = createNewTab(chatId, chatName)
      
      // Load messages for this chat
      await loadChatMessages(chatId)
    }
    
    setIsAddChatDropdownOpen(false)
    setIsPreviousChatsDropdownOpen(false)
  }

  const handleStartDevServer = async () => {
    if (!selectedProject) {
      alert('Please select a project first')
      return
    }

    setIsStartingServer(true)
    try {
      // 1) Check if there's already a running dev server for this project
      const statusRes = await fetch(`/api/dev-server/status?projectName=${encodeURIComponent(selectedProject)}`)
      if (statusRes.ok) {
        const status = await statusRes.json()
        if (status.running && status.port) {
          setDevServerPort(status.port)
          setIsDevServerRunning(true)
          return
        }
      }

      // 2) If none running, start a new one
      const startRes = await fetch('/api/dev-server/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName: selectedProject }),
      })

      if (startRes.ok) {
        const data = await startRes.json()
        setDevServerPort(data.port)
        setIsDevServerRunning(true)
      } else {
        const error = await startRes.json()
        console.error('Dev server error response:', error)
        const errorMessage = error.error || error.message || error.details || 'Unknown error'
        alert(`Failed to start dev server: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error starting dev server:', error)
      alert('Failed to start dev server')
    } finally {
      setIsStartingServer(false)
    }
  }

  const handleReloadIframe = () => {
    if (iframeRef.current && isDevServerRunning) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const injectZoomCSS = () => {
    if (iframeRef.current && isDevServerRunning) {
      try {
        const iframe = iframeRef.current
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        
        if (iframeDoc) {
          // Remove existing zoom style if any
          const existingStyle = iframeDoc.getElementById('zoom-style')
          if (existingStyle) {
            existingStyle.remove()
          }
          
          // Create and inject zoom CSS
          const style = iframeDoc.createElement('style')
          style.id = 'zoom-style'
          style.textContent = `
            body {
              transform: scale(0.8) !important;
              transform-origin: top left !important;
              width: 125% !important;
              height: 125% !important;
            }
          `
          iframeDoc.head.appendChild(style)
        }
      } catch (error) {
        console.log('Cannot inject CSS due to CORS policy')
      }
    }
  }

  const handleBackIframe = () => {
    if (iframeRef.current && isDevServerRunning) {
      try {
        iframeRef.current.contentWindow?.history.back()
      } catch (error) {
        console.error('Error navigating back in iframe:', error)
      }
    }
  }

  const handleGoBack = () => {
    router.push('/')
  }


  const sampleCode = `'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Image, 
  Zap, 
  Lock, 
  Unlock,
  Mic, 
  RefreshCw,
  ArrowRight,
  Loader2,
  Sparkles,
  ChevronDown,
  Plus
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import AgentMode from '@/components/AgentMode'
import AgentTasks from '@/components/AgentTasks'

export default function Home() {
  const router = useRouter()
  const [isAgentModeOpen, setIsAgentModeOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isConnectingSupabase, setIsConnectingSupabase] = useState(false)
  const [isPrivateProject, setIsPrivateProject] = useState(true)
  const [isRotating, setIsRotating] = useState(false)

  // ... rest of the component code
}`

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/g2.avif)' }}
    >

      {/* Agent Workspace Container */}
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-7xl h-[90vh] bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden">
          {/* Top Bar */}
          <header className="bg-neutral-900 border-b border-neutral-800">
            <div className="flex items-center justify-between px-6 py-2 relative">
              {/* Left side - Logo, Brand, Project info */}
              <div className="flex items-center gap-2">
                {/* Logo with gradient background */}
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-orange-400 via-blue-400 to-sky-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="12" height="12" viewBox="0 0 512 512">
                    <path d="M0 0 C3.31548061 1.38707072 4.85421798 2.79591027 6.8125 5.7890625 C7.32425781 6.55734375 7.83601562 7.325625 8.36328125 8.1171875 C8.90339844 8.94476563 9.44351563 9.77234375 10 10.625 C14.17539424 16.88337873 18.42614587 23.02620453 23 29 C27.95268626 35.49181366 32.57338443 42.16916508 37.14453125 48.93359375 C40.62945331 54.06532862 44.23880082 59.06776783 48 64 C52.95133225 70.49290799 57.57332126 77.1690716 62.14453125 83.93359375 C65.62945331 89.06532862 69.23880082 94.06776783 73 99 C77.95133225 105.49290799 82.57332126 112.1690716 87.14453125 118.93359375 C90.62945331 124.06532862 94.23880082 129.06776783 98 134 C102.95133225 140.49290799 107.57332126 147.1690716 112.14453125 153.93359375 C115.62945331 159.06532862 119.23880082 164.06776783 123 169 C127.95133225 175.49290799 132.57332126 182.1690716 137.14453125 188.93359375 C140.62945331 194.06532862 144.23880082 199.06776783 148 204 C152.95133225 210.49290799 157.57332126 217.1690716 162.14453125 223.93359375 C165.62945331 229.06532862 169.23880082 234.06776783 173 239 C177.95133225 245.49290799 182.57332126 252.1690716 187.14453125 258.93359375 C190.62945331 264.06532862 194.23880082 269.06776783 198 274 C202.3566042 279.71301395 206.4772241 285.54736679 210.5 291.5 C214.548718 297.48851556 218.69217759 303.36669358 223.0625 309.125 C227.35514285 314.80257479 231.63082681 320.48995318 235.8125 326.25 C236.34689697 326.96559082 236.88129395 327.68118164 237.43188477 328.41845703 C237.91455811 329.08989746 238.39723145 329.76133789 238.89453125 330.453125 C239.32612549 331.04254883 239.75771973 331.63197266 240.20239258 332.23925781 C241 334 241 334 240.97265625 336.00219727 C239.512313 339.00169245 237.42593229 339.88210014 234.54296875 341.51171875 C233.97739258 341.83681931 233.41181641 342.16191986 232.82910156 342.49687195 C231.60085006 343.20119352 230.36927926 343.89975079 229.13485718 344.59320068 C226.47932516 346.08545229 223.84019478 347.60565648 221.20002747 349.12487793 C219.82839141 349.91405944 218.45597395 350.70188428 217.08280945 351.48840332 C210.37855131 355.33453687 203.77924774 359.33934277 197.1875 363.375 C187.16995221 369.49373991 177.10213194 375.5220115 167 381.5 C156.96290768 387.44031075 146.9582 393.4283432 137 399.5 C126.36671155 405.98326787 115.6763327 412.36477342 104.95898438 418.70800781 C95.60315969 424.24705071 86.28309988 429.83996139 77 435.5 C65.71339304 442.3816055 54.36764899 449.15868528 42.97900391 455.87011719 C36.25437169 459.83923289 29.57515353 463.86474776 22.9609375 468.015625 C21.67073886 468.81992771 20.38037729 469.62396914 19.08984375 470.42773438 C16.66647009 471.93722732 14.25788246 473.46719522 11.85546875 475.00976562 C10.77652344 475.68201172 9.69757813 476.35425781 8.5859375 477.046875 C7.6479834 477.64338867 6.7100293 478.23990234 5.74365234 478.85449219 C2.27236016 480.30379837 0.58610365 480.05353468 -3 479 C-5.74365234 477.62744141 -5.74365234 477.62744141 -8.5859375 475.8515625 C-9.66488281 475.18576172 -10.74382812 474.51996094 -11.85546875 473.83398438 C-12.42700684 473.47522217 -12.99854492 473.11645996 -13.58740234 472.74682617 C-16.05225642 471.19998043 -18.53026363 469.67480085 -21.00787354 468.14849854 C-22.3217643 467.33907547 -23.63502711 466.5286323 -24.94769287 465.71722412 C-31.57773882 461.62474993 -38.27633236 457.65141859 -44.98516846 453.68988037 C-56.27418991 447.02302771 -67.5150251 440.2831247 -78.70898438 433.45800781 C-88.09842559 427.73548064 -97.53738361 422.10060119 -107 416.5 C-117.61130098 410.21953143 -128.18099227 403.877075 -138.70898438 397.45800781 C-148.09843074 391.7354775 -157.53758594 386.10094959 -167 380.5 C-180.53931916 372.48407721 -194.00622637 364.35670738 -207.44140625 356.16748047 C-213.23821702 352.63522616 -219.04242387 349.11513645 -224.84558105 345.59332275 C-227.85041734 343.76963886 -230.85488192 341.94534301 -233.859375 340.12109375 C-235.35162598 339.21508423 -235.35162598 339.21508423 -236.87402344 338.29077148 C-237.5755957 337.86481689 -238.27716797 337.4388623 -239 337 C-238.39972294 334.01415322 -237.50849464 331.99024954 -235.734375 329.5234375 C-235.26322266 328.86214844 -234.79207031 328.20085937 -234.30664062 327.51953125 C-233.79294922 326.81183594 -233.27925781 326.10414063 -232.75 325.375 C-232.21568359 324.62863281 -231.68136719 323.88226563 -231.13085938 323.11328125 C-229.42722586 320.73731739 -227.71462242 318.36804308 -226 316 C-224.91133811 314.4922743 -223.82279443 312.98446324 -222.734375 311.4765625 C-221.11040032 309.22801992 -219.48558746 306.98010453 -217.85839844 304.73388672 C-214.20142688 299.68186437 -210.58728073 294.60170003 -207 289.5 C-202.33863251 282.87077288 -197.61055569 276.29271463 -192.85546875 269.73046875 C-189.20004412 264.67917792 -185.58642038 259.60047648 -182 254.5 C-177.33863251 247.87077288 -172.61055569 241.29271463 -167.85546875 234.73046875 C-164.20004412 229.67917792 -160.58642038 224.60047648 -157 219.5 C-152.33863251 212.87077288 -147.61055569 206.29271463 -142.85546875 199.73046875 C-139.20004412 194.67917792 -135.58642038 189.60047648 -132 184.5 C-127.33863251 177.87077288 -122.61055569 171.29271463 -117.85546875 164.73046875 C-114.20004412 159.67917792 -110.58642038 154.60047648 -107 149.5 C-102.33863251 142.87077288 -97.61055569 136.29271463 -92.85546875 129.73046875 C-89.20004412 124.67917792 -85.58642038 119.60047648 -82 114.5 C-77.33863251 107.87077288 -72.61055569 101.29271463 -67.85546875 94.73046875 C-64.20004412 89.67917792 -60.58642038 84.60047648 -57 79.5 C-52.33863251 72.87077288 -47.61055569 66.29271463 -42.85546875 59.73046875 C-39.20004412 54.67917792 -35.58642038 49.60047648 -32 44.5 C-27.34740403 37.88324743 -22.62932662 31.31675215 -17.88183594 24.76782227 C-13.43245083 18.62135296 -9.04874099 12.43018319 -4.69335938 6.21679688 C-1.10099546 1.10099546 -1.10099546 1.10099546 0 0 Z M-20 99 C-21.79576354 101.24470443 -23.5334364 103.50795414 -25.25 105.8125 C-25.78431641 106.52664062 -26.31863281 107.24078125 -26.86914062 107.9765625 C-31.46897523 114.17750368 -35.81901319 120.53314429 -40.14160156 126.92895508 C-44.08579799 132.73777683 -48.22374393 138.35936869 -52.48046875 143.94140625 C-56.3246482 149.0165303 -59.93563965 154.22542399 -63.5 159.5 C-67.98072059 166.13061503 -72.62847475 172.57876504 -77.48046875 178.94140625 C-81.3246482 184.0165303 -84.93563965 189.22542399 -88.5 194.5 C-92.98072059 201.13061503 -97.62847475 207.57876504 -102.48046875 213.94140625 C-106.3246482 219.0165303 -109.93563965 224.22542399 -113.5 229.5 C-117.98072059 236.13061503 -122.62847475 242.57876504 -127.48046875 248.94140625 C-131.3246482 254.0165303 -134.93563965 259.22542399 -138.5 264.5 C-142.52263875 270.45274095 -146.64361272 276.28682301 -151 282 C-155.97714183 288.53136674 -160.65017427 295.23554069 -165.2565918 302.0324707 C-170.05344711 309.10785051 -174.99331353 316.07201172 -180 323 C-177.03581182 326.21693815 -174.03722408 328.33784972 -170.25 330.51171875 C-169.68866867 330.83681931 -169.12733734 331.16191986 -168.54899597 331.49687195 C-167.33701567 332.198256 -166.12347346 332.89694668 -164.90853882 333.59320068 C-161.61457936 335.48185893 -158.33318468 337.39213242 -155.05078125 339.30078125 C-154.37582108 339.69269653 -153.7008609 340.08461182 -153.00544739 340.48840332 C-146.34555132 344.36349127 -139.76237431 348.35749441 -133.1875 352.375 C-123.1686301 358.4916133 -113.10216771 364.52199033 -103 370.5 C-91.8290865 377.11134674 -80.70880127 383.79873583 -69.62646484 390.55737305 C-58.96476087 397.04813307 -48.23117865 403.41574098 -37.48046875 409.7578125 C-36.82565521 410.14490891 -36.17084167 410.53200531 -35.4961853 410.93083191 C-33.72298223 411.97900762 -31.94868898 413.02533846 -30.17431641 414.0715332 C-27.98259242 415.40305357 -25.82966808 416.799834 -23.71240234 418.24682617 C-21.25833113 420.18094478 -21.25833113 420.18094478 -19 420 C-19 314.07 -19 208.14 -19 99 C-19.33 99 -19.66 99 -20 99 Z " fill="#FFFFFF" transform="translate(255,16)"/>
                  </svg>
                </div>
                
                
                {/* Project info */}
                <div className="flex items-center gap-2 relative project-dropdown">
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-neutral-800 px-2 py-1 rounded"
                    onClick={() => {
                      console.log('🖱️ Project dropdown clicked')
                      console.log('📁 Current projects:', projects)
                      console.log('📁 Projects length:', projects.length)
                      console.log('📁 isDropdownOpen:', isDropdownOpen)
                      setIsDropdownOpen(!isDropdownOpen)
                    }}
                  >
                    <span className="text-neutral-300 font-bold text-sm">
                      {selectedProject ? projects.find(p => p.name === selectedProject)?.displayName || selectedProject : 'Select Project'}
                    </span>
                    <Lock className="w-3 h-3 text-neutral-400" />
                    <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {/* Project Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-50 min-w-48">
                      {console.log('🔍 Rendering dropdown with projects:', projects)}
                      {projects.length === 0 ? (
                        <div className="px-3 py-2 text-neutral-400 text-sm">
                          No projects found
                        </div>
                      ) : (
                        projects.map((project) => (
                          <div
                            key={project.name}
                            className="px-3 py-2 hover:bg-neutral-700 cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              console.log('🖱️ Project selected:', project.name)
                              setSelectedProject(project.name)
                              setIsDropdownOpen(false)
                            }}
                          >
                            <Folder className="w-4 h-4 text-neutral-400" />
                            <span className="text-neutral-300 text-sm">{project.displayName}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {isAgentProcessing ? (
                  <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 text-orange-400 px-2 py-1 rounded-lg">
                    <div className="w-2.5 h-2.5 bg-orange-400 rounded-full relative">
                      <div className="absolute inset-0 w-2.5 h-2.5 bg-orange-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-xs font-medium">Processing</span>
                    <div className="w-4 h-4 animate-spin text-orange-400">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-green-600/20 border border-green-500/30 text-green-400 px-2 py-1 rounded-lg">
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full relative">
                      <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-xs font-medium">Ready</span>
                    <Cpu className="w-3 h-3 text-green-400 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Center - View mode toggles */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <button 
                    onClick={() => setViewMode('viewer')}
                    className={`px-2 h-6 rounded-lg flex items-center gap-1 transition-all duration-200 ${
                      viewMode === 'viewer' 
                        ? 'bg-neutral-700 text-white' 
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                    }`}
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">Preview</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('code')}
                    className={`px-2 h-6 rounded-lg flex items-center gap-1 transition-all duration-200 ${
                      viewMode === 'code' 
                        ? 'bg-neutral-700 text-white' 
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                    }`}
                    title="Workspace"
                  >
                    <Code2 className="w-4 h-4" />
                    <span className="text-xs">Workspace</span>
                  </button>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-2">
                {/* Back to Home button */}
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-white/90 hover:text-white transition-colors px-4 py-2 rounded-lg text-[10px] font-medium shadow-lg hover:shadow-xl backdrop-blur-md bg-white/10 border border-white/10"
                >
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex h-[90%] overflow-hidden">
            {/* Left Panel - Chat */}
            <div className="w-80 bg-neutral-950 flex flex-col h-full overflow-visible">
                {/* Chat Tabs */}
                <ChatTabs
                  tabs={tabs}
                  chats={chats}
                  currentChatId={currentChatId}
                  onSwitchTab={switchToTab}
                  onCloseTab={closeTab}
                  onNewChat={handleNewChat}
                  onPreviousChat={handlePreviousChat}
                />

              {/* Chat Messages */}
              <MessagesContainer
                messages={messages}
                agentTasks={agentTasks}
                todos={todos}
                subtasks={subtasks}
                currentAgentThought={currentAgentThought}
                isAgentProcessing={isAgentProcessing}
                onFetchSubtasks={fetchSubtasks}
              />
              <ChatInput
                chatInput={chatInput}
                setChatInput={setChatInput}
                isFocused={isFocused}
                setIsFocused={setIsFocused}
                isProcessing={isProcessing}
                isAgentProcessing={isAgentProcessing}
                onSendMessage={sendMessage}
                onStopAgent={stopAgent}
              />
            </div>

            {/* Right Panel - Viewer/Code */}
            <div className="flex-1 p-2 bg-neutral-950">
              {viewMode === 'viewer' ? (
                /* Viewer Mode */
                <div className="h-full flex flex-col border-t border-r border-l border-b border-neutral-700 rounded-2xl overflow-hidden">
                  {/* Browser-like header */}
                  <div className="bg-neutral-900 p-2">
                    <div className="flex items-center gap-2">
                      {/* Back button */}
                      <button 
                        onClick={handleBackIframe}
                        disabled={!isDevServerRunning}
                        className="p-1 hover:bg-neutral-800 disabled:bg-neutral-600 disabled:cursor-not-allowed rounded transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      
                      {/* Reload button */}
                      <button 
                        onClick={handleReloadIframe}
                        disabled={!isDevServerRunning}
                        className="p-1 hover:bg-neutral-800 disabled:bg-neutral-600 disabled:cursor-not-allowed rounded transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 text-white" />
                      </button>
                      
                      {/* URL bar */}
                      <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-2 py-1">
                        <div className="w-3 h-3 bg-neutral-600 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                        <span className="text-xs text-neutral-300 font-medium">
                          {isDevServerRunning && devServerPort 
                            ? `localhost:${devServerPort}/` 
                            : 'localhost:3000/'
                          }
                        </span>
                      </div>
                      
                      {/* Device options */}
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedDevice('desktop')}
                          className={`p-2 rounded transition-colors flex flex-col items-center gap-1 ${
                            selectedDevice === 'desktop' 
                              ? 'bg-neutral-700' 
                              : 'hover:bg-neutral-800'
                          }`}
                          title="Desktop (2560×1440)"
                        >
                          <Monitor className="w-4 h-4 text-white" />
                        </button>
                        <button 
                          onClick={() => setSelectedDevice('mobile')}
                          className={`p-2 rounded transition-colors flex flex-col items-center gap-1 ${
                            selectedDevice === 'mobile' 
                              ? 'bg-neutral-700' 
                              : 'hover:bg-neutral-800'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-white" />
                        </button>
                        <button 
                          onClick={() => setSelectedDevice('tablet')}
                          className={`p-2 rounded transition-colors flex flex-col items-center gap-1 ${
                            selectedDevice === 'tablet' 
                              ? 'bg-neutral-700' 
                              : 'hover:bg-neutral-800'
                          }`}
                        >
                          <Tablet className="w-4 h-4 text-white" />
                        </button>
                        <button 
                          onClick={handleStartDevServer}
                          disabled={isStartingServer || !selectedProject}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-600 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1"
                        >
                          {isStartingServer ? (
                            <RefreshCw className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 text-white" />
                          )}
                          <span className="text-xs text-white font-medium">
                            {isStartingServer ? 'Starting...' : 'Preview'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview Area */}
                  <div className="flex-1">
                    {isDevServerRunning && devServerPort ? (
                      <div className="w-full h-full bg-gray-100 relative">
                        {/* Device indicator */}
                        
                        <div 
                          className="w-full h-full bg-white shadow-lg transition-all duration-300 relative"
                        >
                          <iframe
                            ref={iframeRef}
                            src={`http://localhost:${devServerPort}`}
                            className="w-full h-full border-0"
                            title="Project Preview"
                            onLoad={injectZoomCSS}
                            style={{
                              border: 'none',
                              borderRadius: selectedDevice === 'mobile' ? '8px' : '0px',
                              zoom: '0.8'
                            }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                /* Code Mode */
                <div className="h-full flex">
                  {/* File Explorer */}
                  <div className="w-64 bg-neutral-900 border-r border-neutral-800 p-4 overflow-y-auto">
                    <h3 className="font-medium mb-4 text-white">Files</h3>
                    <div className="space-y-1">
                      {projectFiles.length === 0 ? (
                        <div className="text-neutral-500 text-sm">No files found</div>
                      ) : (
                        <FileTree 
                          files={projectFiles} 
                          selectedFile={selectedFile}
                          onFileSelect={(filePath) => {
                            if (selectedProject) {
                              loadFileContent(selectedProject, filePath)
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 bg-neutral-950 flex flex-col">
                    {/* Editor Header */}
                    <div className="bg-neutral-900 border-neutral-800 px-4 py-2 flex items-center justify-between">
                      <span className="text-sm text-neutral-400">
                        {selectedFile || 'No file selected'}
                      </span>
                      {selectedFile && (
                        <button
                          onClick={saveFile}
                          disabled={!isFileModified}
                          className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
                            isFileModified 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800' 
                              : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                          }`}
                          title={isFileModified ? 'Save file (Ctrl+S)' : 'No changes to save'}
                        >
                          <Save className="w-3 h-3" />
                          {isFileModified ? 'Save' : 'Saved'}
                        </button>
                      )}
                    </div>
                    
                    {/* Monaco Editor */}
                    <div className="flex-1">
                      {selectedFile ? (
                        <Editor
                          height="100%"
                          defaultLanguage="typescript"
                          language={getLanguageFromFile(selectedFile)}
                          value={fileContent}
                          onChange={(value) => {
                            setFileContent(value || '')
                            setIsFileModified(true)
                          }}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 12,
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'on',
                            tabSize: 2,
                            insertSpaces: true,
                            renderWhitespace: 'selection',
                            cursorBlinking: 'blink',
                            cursorStyle: 'line',
                            selectOnLineNumbers: true,
                            glyphMargin: false,
                            folding: true,
                            lineDecorationsWidth: 10,
                            lineNumbersMinChars: 3,
                            renderLineHighlight: 'line',
                            bracketPairColorization: { enabled: true },
                            guides: {
                              bracketPairs: true,
                              indentation: true
                            },
                            // Disable validation to reduce errors
                            readOnly: false
                          }}
                          onMount={(editor, monaco) => {
                            // Configure TypeScript compiler options
                            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                              target: monaco.languages.typescript.ScriptTarget.ES2020,
                              allowNonTsExtensions: true,
                              moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                              module: monaco.languages.typescript.ModuleKind.CommonJS,
                              noEmit: true,
                              esModuleInterop: true,
                              jsx: monaco.languages.typescript.JsxEmit.React,
                              reactNamespace: 'React',
                              allowJs: true,
                              typeRoots: ['node_modules/@types']
                            })
                            
                            // Disable diagnostics to reduce error messages
                            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                              noSemanticValidation: true,
                              noSyntaxValidation: true,
                              noSuggestionDiagnostics: true
                            })
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-neutral-500">
                          Select a file to view its content
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

