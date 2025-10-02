'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

interface HeaderProps {
  onAgentModeClick: () => void
}

export default function Header({ onAgentModeClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="max-w-7xl fixed top-4 mx-auto inset-x-0 z-50 w-[95%] lg:w-full">
      <div className="hidden lg:block w-full">
        <div className="w-full flex relative justify-between px-4 py-2 rounded-full transition duration-200 dark:border-none mx-auto bg-transparent text-white">
          <div className="flex flex-row gap-2 items-center">
            <a href="/">
              <div className="flex items-center gap-2">
                <svg fill="currentColor" width="20" height="20" viewBox="50 130 250 250" xmlns="http://www.w3.org/2000/svg">
                  <path d="M285 221Q243 246 210 256 243 266 285 291L261 333Q215 305 193 286 200 317 200 368L152 368Q152 317 159 286 137 305 91 333L67 291Q109 266 142 256 109 246 67 221L91 179Q137 207 159 226 152 195 152 144L200 144Q200 195 193 226 215 207 261 179L285 221Z"></path>
                </svg>
                <span className="text-lg font-bold">Kairo</span>
              </div>
            </a>
            <div className="flex items-center gap-1.5">
              <a className="flex items-center justify-center text-sm leading-[110%] px-4 py-2 rounded-md dark:hover:bg-neutral-800 hover:shadow-[0px_1px_0px_0px_#FFFFFF20_inset] transition duration-200 hover:bg-neutral-100/20" href="/pricing">Pricing</a>
              <a className="flex items-center justify-center text-sm leading-[110%] px-4 py-2 rounded-md dark:hover:bg-neutral-800 hover:shadow-[0px_1px_0px_0px_#FFFFFF20_inset] transition duration-200 hover:bg-neutral-100/20" href="/affiliate">Affiliate Program</a>
            </div>
          </div>
          <div className="flex space-x-2 items-center">
            <a href="/login">
              <button className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2">Sign in</button>
            </a>
            <a href="/signup">
              <button 
                onClick={onAgentModeClick}
                className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 bg-[#2C353F] hover:bg-[#3A4755] text-white shadow-xs h-9 px-4 py-2 rounded-full"
              >
                Get Started
              </button>
            </a>
          </div>
        </div>
      </div>
      <div className="flex h-full w-full items-center lg:hidden">
        <div className="flex justify-between bg-transparent items-center w-full rounded-md px-2.5 py-1.5 transition duration-200 text-white">
          <a href="/">
            <div className="flex items-center gap-2">
              <svg fill="currentColor" width="20" height="20" viewBox="50 130 250 250" xmlns="http://www.w3.org/2000/svg">
                <path d="M285 221Q243 246 210 256 243 266 285 291L261 333Q215 305 193 286 200 317 200 368L152 368Q152 317 159 286 137 305 91 333L67 291Q109 266 142 256 109 246 67 221L91 179Q137 207 159 226 152 195 152 144L200 144Q200 195 193 226 215 207 261 179L285 221Z"></path>
              </svg>
              <span className="text-lg font-bold">Capacity</span>
            </div>
          </a>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden py-4 border-t border-gray-800/50 bg-black/50 backdrop-blur-sm rounded-b-lg"
        >
          <div className="flex flex-col space-y-4">
            <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
              Affiliate Program
            </a>
            <button className="text-sm text-gray-300 hover:text-white transition-colors text-left">
              Sign in
            </button>
            <button
              onClick={onAgentModeClick}
              className="bg-[#2C353F] hover:bg-[#3A4755] text-white px-6 py-2 rounded-full font-medium transition-colors text-left"
            >
              Get Started
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

