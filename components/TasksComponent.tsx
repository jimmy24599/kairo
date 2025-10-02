'use client'

import { useState, useEffect } from 'react'
import { Check, RefreshCw, XCircle, Clock, ChevronUp, ChevronDown } from 'lucide-react'

interface Task {
  tool: string
  explanation: string
  status: 'pending' | 'running' | 'done' | 'failed'
}

interface TasksComponentProps {
  // Legacy props for backward compatibility
  todos?: any[]
  subtasks?: Map<string, any>
  currentThought?: string
  onFetchSubtasks?: (todoId: string) => Promise<void>
  // New props for real-time task updates
  tasks?: Task[]
  isActive?: boolean
  onTaskUpdate?: (tasks: Task[]) => void
}

export default function TasksComponent({ 
  todos, 
  subtasks, 
  currentThought, 
  onFetchSubtasks,
  tasks: propTasks,
  isActive = false,
  onTaskUpdate
}: TasksComponentProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [loadingSubtasks, setLoadingSubtasks] = useState<Set<string>>(new Set())
  const [realTimeTasks, setRealTimeTasks] = useState<Task[]>(propTasks || [])
  const [isProcessing, setIsProcessing] = useState(false)

  // Update real-time tasks when props change
  useEffect(() => {
    console.log('TasksComponent received propTasks:', propTasks)
    if (propTasks) {
      setRealTimeTasks(propTasks)
      setIsProcessing(propTasks.some(task => task.status === 'running'))
    }
  }, [propTasks])

  // Use real-time tasks if available, otherwise fall back to legacy todos
  const displayTasks = realTimeTasks.length > 0 ? realTimeTasks : (todos || [])
  const isRealTimeMode = realTimeTasks.length > 0
  
  console.log('TasksComponent displayTasks:', displayTasks)
  console.log('TasksComponent isRealTimeMode:', isRealTimeMode)
  console.log('TasksComponent realTimeTasks:', realTimeTasks)

  const toggleTaskExpansion = async (todoId: string) => {
    const newExpanded = new Set(expandedTasks)
    const isCurrentlyExpanded = newExpanded.has(todoId)
    
    if (isCurrentlyExpanded) {
      newExpanded.delete(todoId)
      setExpandedTasks(newExpanded)
    } else {
      // If we're expanding and don't have subtasks yet, fetch them
      const todo = todos?.find(t => t._id === todoId)
      if (todo?.subtask && !subtasks?.has(todo.subtask) && onFetchSubtasks) {
        setLoadingSubtasks(prev => new Set(prev).add(todoId))
        try {
          await onFetchSubtasks(todo.subtask)
        } catch (error) {
          console.error('Failed to fetch subtasks:', error)
        } finally {
          setLoadingSubtasks(prev => {
            const newSet = new Set(prev)
            newSet.delete(todoId)
            return newSet
          })
        }
      }
      newExpanded.add(todoId)
      setExpandedTasks(newExpanded)
    }
  }

  // Calculate progress
  const completedTasks = displayTasks.filter(task => 
    isRealTimeMode ? task.status === 'done' : task.status === 'done'
  ).length
  const totalTasks = displayTasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Check if all tasks are done
  const allTasksDone = totalTasks > 0 && completedTasks === totalTasks

  return (
    <div className="bg-black border border-gray-700 rounded-lg p-4 my-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white">Agent tasks</h4>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {displayTasks.map((task, index) => {
              const taskId = isRealTimeMode ? `${task.tool}-${index}` : task._id
              const status = isRealTimeMode ? task.status : task.status
              return (
                <div
                  key={taskId}
                  className={`w-1 h-4 rounded-full transition-all duration-300 ${
                    status === 'done'
                      ? 'bg-green-500 shadow-lg shadow-green-500/60' 
                      : status === 'running'
                        ? 'bg-gray-300' 
                        : 'bg-gray-600'
                  }`}
                />
              )
            })}
          </div>
          <span className="text-xs text-gray-300 font-mono">{progressPercent}%</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {displayTasks.map((task, index) => {
          const taskId = isRealTimeMode ? `${task.tool}-${index}` : task._id
          const taskName = isRealTimeMode ? task.explanation : task.taskName
          const status = isRealTimeMode ? task.status : task.status
          const tool = isRealTimeMode ? task.tool : null
          
          const isCompleted = status === 'done'
          const isRunning = status === 'running'
          const isPending = status === 'pending'
          const isFailed = status === 'failed'
          const isExpanded = expandedTasks.has(taskId)
          const hasSubtasks = !isRealTimeMode && task.subtask && subtasks?.has(task.subtask)
          
          return (
            <div key={taskId} className="pl-2 pr-1 py-3">
              <div className="flex items-start gap-2 text-xs">
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/60 ring-2 ring-green-500/30">
                      <Check className="w-2.5 h-2.5 text-white drop-shadow-sm" />
                    </div>
                  ) : isRunning ? (
                    <RefreshCw className="w-4 h-4 text-gray-300 animate-spin" />
                  ) : isFailed ? (
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <XCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : (
                    <Clock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <span className={`flex-1 text-xs ${
                  isCompleted 
                    ? 'line-through text-gray-400' 
                    : isRunning 
                      ? 'text-white font-medium' 
                      : isFailed
                        ? 'text-red-400 font-medium'
                        : 'text-white'
                }`}>
                  {taskName}
                </span>
                {isRealTimeMode && tool && (
                  <span className="text-[10px] text-white bg-neutral-800 px-2 py-1 rounded font-mono">
                    {tool}
                  </span>
                )}
                {hasSubtasks && (
                  <button
                    onClick={() => toggleTaskExpansion(taskId)}
                    className="flex-shrink-0 p-1 hover:bg-neutral-800 rounded mt-0.5"
                    disabled={loadingSubtasks.has(taskId)}
                  >
                    {loadingSubtasks.has(taskId) ? (
                      <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Subtasks */}
              {isExpanded && hasSubtasks && (
                <div className="mt-3 ml-6 space-y-2 border-l-2 border-gray-600 pl-3">
                  {(() => {
                    const subtask = subtasks?.get(task.subtask!)
                    if (!subtask) return null
                    
                    return Array.from(subtask.tasksName.entries()).map((entry) => {
                      const [key, subtaskItem] = entry as [string, any]
                      const isSubtaskCompleted = subtaskItem.status === 'done'
                      const isSubtaskRunning = subtaskItem.status === 'running'
                      const isSubtaskFailed = subtaskItem.status === 'failed'
                      const isSubtaskSkipped = subtaskItem.status === 'skipped'
                      
                      return (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <div className="flex-shrink-0 mt-0.5">
                            {isSubtaskCompleted ? (
                              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/60 ring-1 ring-green-500/30">
                                <Check className="w-1.5 h-1.5 text-white drop-shadow-sm" />
                              </div>
                            ) : isSubtaskRunning ? (
                              <RefreshCw className="w-3 h-3 text-gray-300 animate-spin" />
                            ) : isSubtaskFailed ? (
                              <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                <XCircle className="w-1.5 h-1.5 text-white" />
                              </div>
                            ) : isSubtaskSkipped ? (
                              <div className="w-3 h-3 bg-gray-500 rounded-full flex items-center justify-center">
                                <XCircle className="w-1.5 h-1.5 text-white" />
                              </div>
                            ) : (
                              <Clock className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                          <span className={`flex-1 font-mono ${
                            isSubtaskCompleted 
                              ? 'line-through text-gray-400' 
                              : isSubtaskRunning 
                                ? 'text-white font-medium' 
                                : isSubtaskFailed
                                  ? 'text-red-400 font-medium'
                                  : isSubtaskSkipped
                                    ? 'text-gray-400 font-medium'
                                    : 'text-white'
                          }`}>
                            {subtaskItem.name}
                          </span>
                          {subtaskItem.tool && (
                            <span className="text-[10px] text-white bg-neutral-800 px-2 py-1 rounded font-mono">
                              {subtaskItem.tool}
                            </span>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Status display */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center gap-2 text-xs">
          {allTasksDone ? (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/60 ring-1 ring-green-500/30">
                <Check className="w-1.5 h-1.5 text-white drop-shadow-sm" />
              </div>
              <span className="text-green-400 font-medium">All tasks done</span>
            </>
          ) : isRealTimeMode && isProcessing ? (
            <>
              <RefreshCw className="w-3 h-3 text-gray-300 animate-spin" />
              <span className="text-gray-300">Agent working</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3 text-gray-300 animate-spin" />
              <span className="text-gray-300">
                {completedTasks}/{totalTasks} tasks done
              </span>
            </>
          )}
        </div>
        {currentThought && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">{currentThought}</p>
          </div>
        )}
      </div>
    </div>
  )
}
