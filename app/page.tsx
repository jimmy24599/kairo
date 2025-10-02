'use client'

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
  ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import AgentMode from '@/components/AgentMode'
import AgentTasks from '@/components/AgentTasks'
import ProjectNameModal from '@/components/ProjectNameModal'

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
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const placeholderTexts = [
    "Build a portfolio website...",
    "Design a social media platform...",
    "Create an e-commerce store...",
    "Build a task management app...",
    "Design a landing page...",
    "Create a blog platform...",
    "Build a dashboard...",
    "Design a mobile app...",
    "Create a booking system...",
    "Build a chat application..."
  ]

  const suggestedProjects = [
    'Clone Spotify',
    'Mood Tracker', 
    'EliteFootwear',
    'AI Study Buddy'
  ]

  // Rotating placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex(prev => (prev + 1) % placeholderTexts.length)
    }, 3000) // Change placeholder every 3 seconds

    return () => clearInterval(interval)
  }, [])

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Supabase connection
  const handleConnectSupabase = async () => {
    setIsConnectingSupabase(true)
    // Simulate connection delay
    setTimeout(() => {
      setIsConnectingSupabase(false)
    }, 2000)
  }

  // Handle project visibility toggle
  const handleProjectVisibilityToggle = () => {
    setIsRotating(true)
    setTimeout(() => {
      setIsPrivateProject(!isPrivateProject)
      setIsRotating(false)
    }, 150) // Half of the animation duration
  }

  // Handle agent redirect
  const handleAgentRedirect = () => {
    if (inputValue.trim()) {
      setIsProjectModalOpen(true)
    }
  }

  // Handle project creation
  const handleProjectCreation = async (projectName: string) => {
    setIsCreatingProject(true)
    
    try {
      // Create the project via API
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: inputValue.trim(),
          template: 'nextjs'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const result = await response.json()
      
      // Close modal and redirect to agent with project
      setIsProjectModalOpen(false)
      const encodedPrompt = encodeURIComponent(inputValue.trim())
      router.push(`/agent?prompt=${encodedPrompt}&project=${projectName}`)
      
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setIsCreatingProject(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header onAgentModeClick={() => setIsAgentModeOpen(true)} />
      
      <main>
        {/* Hero Section */}
        <div>
          <main className="relative min-h-[90vh] overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img src="/hero.webp" alt="hero background" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-6 pb-20 pt-40">
              <div aria-hidden="true" className="bg-gradient-to-b from-transparent to-black absolute inset-0 z-10 from-75%"></div>
              <div className="max-w-3xl mx-auto space-y-12 z-10 pb-32">
                <h1 className="mb-8 max-w-[15ch] mx-auto text-center font-serif text-5xl/none font-light tracking-tighter text-white md:text-7xl lg:text-6xl">
                  Turn any idea into a working web app
                </h1>
                <div className="max-w-3xl mx-auto">
                  <div className="w-full space-y-6">
                    <div className="relative z-10">
                      {/* Focus shadow effect - positioned behind */}
                      {isFocused && (
                        <div 
                          className="pointer-events-none absolute -inset-1 h-full w-full scale-[var(--scale)] transform-gpu blur-xl animate-focus-shadow" 
                          style={{
                            '--scale': '1',
                            willChange: 'transform',
                            backfaceVisibility: 'hidden',
                            zIndex: '-1',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(var(--scale))',
                            width: 'calc(100% + 4px)',
                            height: 'calc(100% + 4px)'
                          } as any}
                        ></div>
                      )}
                      
                      <div className="relative bg-[#18181B] backdrop-blur-sm border rounded-2xl p-6 shadow-2xl transition-all duration-200 border-neutral-700/50">
                        {/* Animated border effect - only shown when not focused and empty */}
                        {!isFocused && inputValue === '' && (
                          <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
                            <div 
                              className="absolute aspect-square bg-gradient-to-l from-teal-100 via-teal-500 to-transparent animate-border-flow" 
                              style={{
                                width: '150px',
                                offsetPath: 'rect(0px auto auto 0px round 150px)',
                                '--color-from': '#ffaa40',
                                '--color-to': '#9c40ff'
                              } as any}
                            ></div>
                          </div>
                        )}
                        <div className="relative">
                          <textarea 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-full bg-transparent text-white text-lg placeholder:text-neutral-100 border-0 outline-0 resize-none min-h-[60px] leading-relaxed focus:outline-none focus:ring-0" 
                            style={{maxHeight: '120px', fontFamily: 'inherit'}} 
                            rows={1} 
                            placeholder=""
                          />
                          <div className="absolute inset-0 pointer-events-none flex items-start pt-1">
                            <AnimatePresence mode="wait">
                              {!isFocused && inputValue === '' && (
                                <motion.span
                                  key={currentPlaceholderIndex}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  transition={{ duration: 0.5, ease: "easeInOut" }}
                                  className="text-lg text-neutral-400"
                                >
                                  {placeholderTexts[currentPlaceholderIndex]}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-3 border-t border-neutral-700/30 flex-row gap-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <label className="cursor-pointer">
                              <div className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 h-9 w-9 rounded-full border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700 hover:text-white">
                                {imagePreview ? (
                                  <img 
                                    src={imagePreview} 
                                    alt="Selected" 
                                    className="w-4 h-4 rounded object-cover"
                                  />
                                ) : (
                                  <Image className="w-4 h-4" />
                                )}
                              </div>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageSelect}
                              />
                            </label>
                            <div>
                              <button 
                                className="cursor-pointer justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 has-[>svg]:px-3 flex rounded-full items-center text-neutral-300 hover:text-neutral-300 gap-2 border border-neutral-700/50 bg-neutral-800/30 backdrop-blur-sm hover:bg-neutral-800/50 transition-all duration-200 group"
                                onClick={handleConnectSupabase}
                                disabled={isConnectingSupabase}
                              >
                                {isConnectingSupabase ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Connecting...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 109 113" className="h-4 w-4">
                                      <path fill="url(#supabase_svg__a)" d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874z"></path>
                                      <path fill="url(#supabase_svg__b)" fillOpacity="0.2" d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874z"></path>
                                      <path fill="#3ECF8E" d="M45.317 2.071c2.86-3.601 8.657-1.628 8.726 2.97l.442 67.251H9.83c-8.19 0-12.759-9.46-7.665-15.875z"></path>
                                      <defs>
                                        <linearGradient id="supabase_svg__a" x1="53.974" x2="94.163" y1="54.974" y2="71.829" gradientUnits="userSpaceOnUse">
                                          <stop stopColor="#249361"></stop>
                                          <stop offset="1" stopColor="#3ECF8E"></stop>
                                        </linearGradient>
                                        <linearGradient id="supabase_svg__b" x1="36.156" x2="54.484" y1="30.578" y2="65.081" gradientUnits="userSpaceOnUse">
                                          <stop></stop>
                                          <stop offset="1" stopOpacity="0"></stop>
                                        </linearGradient>
                                      </defs>
                                    </svg>
                                    <span>Connect Supabase</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button 
                                className="flex items-center gap-2 px-3 py-2 rounded-full border border-neutral-700/50 bg-neutral-800/30 backdrop-blur-sm hover:bg-neutral-800/50 transition-all duration-200 group" 
                                onClick={handleProjectVisibilityToggle}
                                tabIndex={0}
                              >
                                <div className="flex items-center">
                                  {isPrivateProject ? (
                                    <Lock 
                                      className={`lucide lucide-lock text-neutral-400 w-3.5 h-3.5 transition-transform duration-200 ${
                                        isRotating ? 'rotate-counterclockwise' : ''
                                      }`}
                                    />
                                  ) : (
                                    <Unlock 
                                      className={`lucide lucide-unlock text-neutral-400 w-3.5 h-3.5 transition-transform duration-200 ${
                                        isRotating ? 'rotate-clockwise' : ''
                                      }`}
                                    />
                                  )}
                                </div>
                                <span className="text-sm text-neutral-300 group-hover:text-neutral-300 transition-all duration-200">
                                  {isPrivateProject ? 'Private Project' : 'Public'}
                                </span>
                              </button>
                              <div className="hidden md:block">
                                <div className="relative">
                                  <div className="relative w-full mx-auto flex items-center justify-center gap-3">
                                    <button className="group w-9 h-9 rounded-full cursor-pointer flex items-center justify-center transition-colors relative z-10 bg-neutral-800/50 hover:bg-neutral-700" type="button" title="Enable microphone access">
                                      <Mic className="w-4 h-4 text-neutral-300" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 h-9 w-9 hidden md:flex rounded-full border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700 hover:text-white" disabled>
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button 
                              className={`cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 px-4 py-2 has-[>svg]:px-3 rounded-full relative h-10 text-center border shadow-xs ${
                                inputValue.trim() 
                                  ? 'text-white hover:text-white border-neutral-700 bg-neutral-800/50 hover:bg-neutral-700/50' 
                                  : 'text-neutral-400 border-neutral-700 bg-neutral-800/30'
                              }`}
                              disabled={!inputValue.trim()}
                              onClick={handleAgentRedirect}
                            >
                              {inputValue.trim() && (
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
                                ></div>
                              )}
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                      {suggestedProjects.map((project) => (
                        <button
                          key={project}
                          onClick={() => setSelectedProject(project)}
                          className="cursor-pointer justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 h-9 has-[&gt;svg]:px-3 bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-700/40 rounded-xl px-4 py-3 flex items-center gap-3 text-neutral-300 hover:text-white transition-all group"
                        >
                          <span className="text-sm font-medium">{project}</span>
                        </button>
                      ))}
                      <button className="cursor-pointer justify-center whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 h-9 has-[&gt;svg]:px-3 bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-700/40 rounded-xl px-4 py-3 flex items-center gap-3 text-neutral-300 hover:text-white transition-all group" title="Generate new project ideas">
                        <div>
                          <RefreshCw className="w-4 h-4" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Agent Mode Showcase Section */}
        <div className="relative z-20 -mt-24">
          <div className="max-w-3xl mx-auto px-6">
            <AgentTasks />
          </div>
        </div>
      </main>
      
      {isAgentModeOpen && (
        <AgentMode 
          isOpen={isAgentModeOpen} 
          onClose={() => setIsAgentModeOpen(false)} 
        />
      )}

      <ProjectNameModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onConfirm={handleProjectCreation}
        userInput={inputValue}
        isLoading={isCreatingProject}
      />
    </div>
  )
}
