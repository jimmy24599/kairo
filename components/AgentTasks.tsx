'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, Code, Monitor, TrendingUp } from 'lucide-react'

export default function AgentTasks() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [isAllDone, setIsAllDone] = useState(false)

  const tasks = [
    "Reading files",
    "Fix authentication bug", 
    "Install dependencies",
    "Update associated files",
    "Run tests",
    "Deploy to production"
  ]

  // Task progress animation
  useEffect(() => {
    const startTaskLoop = () => {
      let currentIndex = 0
      let completed = []
      let allDone = false
      
      const taskInterval = setInterval(() => {
        currentIndex = currentIndex + 1
        
        if (currentIndex >= tasks.length) {
          // All tasks are done, stop the interval
          clearInterval(taskInterval)
          allDone = true
          // Add the last task (6th task) to completed list
          completed.push(currentIndex - 1)
          
          // Update state
          setCurrentTaskIndex(currentIndex - 1)
          setCompletedTasks(completed)
          setIsAllDone(allDone)
          
          // Reset after 2 seconds to start the loop again
          setTimeout(() => {
            setCurrentTaskIndex(0)
            setCompletedTasks([])
            setIsAllDone(false)
            startTaskLoop() // Restart the loop
          }, 2000)
        } else {
          // Add the previous task to completed list
          if (currentIndex > 0) {
            completed.push(currentIndex - 1)
          }
          
          // Update state
          setCurrentTaskIndex(currentIndex)
          setCompletedTasks(completed)
          setIsAllDone(allDone)
        }
      }, 2000) // Change task every 2 seconds
    }

    startTaskLoop()

    return () => {} // Cleanup handled in the function
  }, [tasks.length])

  // Mark task as completed when moving to next task
  useEffect(() => {
    if (currentTaskIndex > 0) {
      // Add the previous task to completed list
      const previousTaskIndex = currentTaskIndex - 1
      setCompletedTasks(prev => {
        if (!prev.includes(previousTaskIndex)) {
          return [...prev, previousTaskIndex]
        }
        return prev
      })
    }
  }, [currentTaskIndex])

  const getProgressPercentage = () => {
    const completedCount = completedTasks.length
    return (completedCount / tasks.length) * 100
  }

  const getProgressText = () => {
    if (isAllDone) {
      return "6/6"
    }
    const completedCount = completedTasks.length
    return `${completedCount}/${tasks.length}`
  }

  return (
    <div className="rounded-lg text-card-foreground w-full max-w-3xl mx-auto border border-zinc-700/50 shadow-xl overflow-hidden bg-zinc-900 relative z-10">
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="relative">
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
              <img alt="Hero background" className="w-full h-full object-cover" src="/hero.webp" />
            </div>
            <div className="absolute inset-4 bg-zinc-900/30 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-4 shadow-xl min-h-fit">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <div className="ml-2 text-xs text-gray-400 font-mono">agent.tasks</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-3">Active Tasks</h3>
                  {tasks.map((task, index) => {
                    const isCompleted = completedTasks.includes(index)
                    const isActive = currentTaskIndex === index && currentTaskIndex >= 0 && !isAllDone
                    const isUpcoming = index > currentTaskIndex
                    
                    return (
                      <div 
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-md transition-all duration-500 ${
                          isActive 
                            ? 'bg-zinc-700/20 scale-[1.02]' 
                            : isCompleted 
                            ? 'opacity-60' 
                            : 'opacity-60'
                        }`}
                      >
                        <div>
                          {isActive ? (
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          ) : isCompleted ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <div className="w-3 h-3"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p 
                            className={`relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-xs ${
                              isCompleted 
                                ? 'line-through text-white' 
                                : isActive 
                                ? 'text-white font-medium' 
                                : 'text-white'
                            }`}
                            style={{
                              '--spread': `${task.length * 2}px`,
                              backgroundImage: isCompleted 
                                ? 'var(--bg), linear-gradient(var(--base-color), var(--base-color))'
                                : 'none',
                              backgroundPosition: '38.85% center'
                            } as any}
                          >
                            {task}
                          </p>
                        </div>
                        {isActive && (
                          <div className="flex gap-0.5 flex-shrink-0">
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '-0.3s'}}></div>
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '-0.15s'}}></div>
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-200 mb-2">
                    <span>Progress</span>
                    <span>{getProgressText()}</span>
                  </div>
                  <div className="w-full bg-zinc-700/20 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-500 ease-out" 
                      style={{width: `${getProgressPercentage()}%`}}
                    ></div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {isAllDone ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  )}
                  <span className="text-xs text-white font-mono">
                    {isAllDone ? "All tasks done" : "Agent working..."}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <div className="items-center gap-2 w-6 h-6 text-white mb-2 hidden md:block md:absolute top-[20px] right-[20px] animate-spin">
                <svg fill="currentColor" viewBox="50 130 250 250" xmlns="http://www.w3.org/2000/svg">
                  <path d="M285 221Q243 246 210 256 243 266 285 291L261 333Q215 305 193 286 200 317 200 368L152 368Q152 317 159 286 137 305 91 333L67 291Q109 266 142 256 109 246 67 221L91 179Q137 207 159 226 152 195 152 144L200 144Q200 195 193 226 215 207 261 179L285 221Z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-white mb-1">Meet Agent Mode</h1>
              <p className="text-gray-500 text-sm">Here is what's new:</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-gray-800/50">
                  <Code className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white mb-0.5">Smarter Code Edits</h3>
                  <p className="text-sm text-gray-500">Agent mode has a global understanding of your codebase.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-gray-800/50">
                  <Monitor className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white mb-0.5">90% fewer errors</h3>
                  <p className="text-sm text-gray-500">With Agent mode, the code is 90% less likely to break.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-gray-800/50">
                  <TrendingUp className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white mb-0.5">Adaptive Pricing</h3>
                  <p className="text-sm text-gray-500">Pay based on actions, not messages.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 flex-1 h-8 cursor-pointer bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs font-medium">
                Watch Demo
              </button>
              <button className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-xs rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 flex-1 h-8 cursor-pointer bg-white text-gray-900 hover:bg-gray-100 text-xs font-medium">
                <a href="/signup">Try Now</a>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
