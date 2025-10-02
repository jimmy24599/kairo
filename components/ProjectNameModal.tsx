'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, Loader2 } from 'lucide-react'

interface ProjectNameModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (projectName: string) => void
  userInput: string
  isLoading?: boolean
}

export default function ProjectNameModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userInput, 
  isLoading = false 
}: ProjectNameModalProps) {
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    // Validate project name (alphanumeric, hyphens, underscores only)
    const validName = /^[a-zA-Z0-9-_]+$/.test(projectName)
    if (!validName) {
      setError('Project name can only contain letters, numbers, hyphens, and underscores')
      return
    }

    if (projectName.length < 2) {
      setError('Project name must be at least 2 characters long')
      return
    }

    if (projectName.length > 50) {
      setError('Project name must be less than 50 characters')
      return
    }

    setError('')
    onConfirm(projectName.trim())
  }

  const handleClose = () => {
    if (!isLoading) {
      setProjectName('')
      setError('')
      onClose()
    }
  }

  const generateProjectName = () => {
    // Generate a project name based on user input
    const words = userInput.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 3)
    
    if (words.length > 0) {
      const generated = words.join('-')
      setProjectName(generated)
      setError('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <FolderPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
                  <p className="text-sm text-gray-600">Give your project a name</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* User Input Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Your request:</p>
                <p className="text-gray-900 font-medium">{userInput}</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="projectName"
                      type="text"
                      value={projectName}
                      onChange={(e) => {
                        setProjectName(e.target.value)
                        setError('')
                      }}
                      placeholder="my-awesome-app"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                      disabled={isLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={generateProjectName}
                      disabled={isLoading}
                      className="px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Generate
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Use lowercase letters, numbers, hyphens, and underscores only
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !projectName.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Project</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
