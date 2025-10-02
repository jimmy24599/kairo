'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Image, 
  Zap, 
  Lock, 
  Mic, 
  RefreshCw,
  ArrowRight
} from 'lucide-react'

interface HeroProps {
  onGetStarted: () => void
}

export default function Hero({ onGetStarted }: HeroProps) {
  const [inputValue, setInputValue] = useState('')
  const [selectedProject, setSelectedProject] = useState('')

  const suggestedProjects = [
    'Clone Spotify',
    'Mood Tracker', 
    'EliteFootwear',
    'AI Study Buddy'
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/images/hero.webp)' }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-serif font-bold text-white mb-16 leading-tight"
        >
          Turn any idea into a working web app
        </motion.h1>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-3xl mx-auto"
        >
          {/* Input Field */}
          <div className="mb-6">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Make a task management system..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Image className="w-5 h-5 text-gray-400" />
              </button>
              
              <button className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm text-white">Connect Supabase</span>
              </button>
              
              <button className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Lock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">Private Project</span>
              </button>
              
              <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Mic className="w-5 h-5 text-gray-400" />
              </button>
              
              <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
              </button>
              
              <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Suggested Projects */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400">Try:</span>
            {suggestedProjects.map((project) => (
              <button
                key={project}
                onClick={() => setSelectedProject(project)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedProject === project
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {project}
              </button>
            ))}
            <button className="p-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

