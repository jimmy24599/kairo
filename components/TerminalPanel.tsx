'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Terminal as TerminalIcon,
  Play,
  Square,
  RotateCcw,
  Download,
  Copy
} from 'lucide-react'

export default function TerminalPanel() {
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentCommand, setCurrentCommand] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)

  const commands = [
    'npm install',
    'npm run dev',
    'npm run build',
    'npm run start',
    'git init',
    'git add .',
    'git commit -m "Initial commit"'
  ]

  const runCommand = (command: string) => {
    setIsRunning(true)
    setOutput(prev => [...prev, `$ ${command}`])
    
    // Simulate command execution
    setTimeout(() => {
      let result = ''
      
      switch (command) {
        case 'npm install':
          result = `added 1234 packages, and audited 1234 packages in 2s
          
1234 packages are looking for funding
  run \`npm fund\` for details

found 0 vulnerabilities`
          break
        case 'npm run dev':
          result = `> my-app@0.1.0 dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully in 1.2s (12 modules)
- event compiled client and server successfully in 45ms (12 modules)`
          break
        case 'npm run build':
          result = `> my-app@0.1.0 build
> next build

info  - Checking validity of types
info  - Creating an optimized production build
info  - Compiled successfully
info  - Collecting page data
info  - Generating static pages (3/3)
info  - Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                  4.2 kB        89.2 kB
└ ○ /_not-found                        182 B        85.2 kB
+ First Load JS shared by all           85.0 kB
  ├ chunks/14-1234567890.js            25.6 kB
  ├ chunks/framework-1234567890.js      42.1 kB
  ├ chunks/main-app-1234567890.js      17.3 kB
  └ chunks/webpack-1234567890.js       1.4 kB

○  (Static)  automatically rendered as static HTML (uses no initial props)
✓  (SSG)     prerendered as static HTML + JSON (uses getStaticProps)`
          break
        case 'git init':
          result = `Initialized empty Git repository in /Users/user/my-app/.git/`
          break
        case 'git add .':
          result = ``
          break
        case 'git commit -m "Initial commit"':
          result = `[main (root-commit) 1234567] Initial commit
 15 files changed, 1234 insertions(+)
 create mode 100644 package.json
 create mode 100644 app/page.tsx
 create mode 100644 tailwind.config.js
 create mode 100644 tsconfig.json
 create mode 100644 next.config.js`
          break
        default:
          result = `Command not found: ${command}`
      }
      
      setOutput(prev => [...prev, result])
      setIsRunning(false)
    }, 1000)
  }

  const clearOutput = () => {
    setOutput([])
  }

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output.join('\n'))
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadOutput = () => {
    const blob = new Blob([output.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'terminal-output.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-secondary-200 bg-white">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-5 h-5 text-secondary-600" />
          <h3 className="font-semibold text-secondary-900">Terminal</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearOutput}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-secondary-600 hover:text-secondary-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </button>
          <button
            onClick={copyOutput}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-secondary-600 hover:text-secondary-900 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
          <button
            onClick={downloadOutput}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-secondary-600 hover:text-secondary-900 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-4 border-b border-secondary-200 bg-secondary-50">
        <h4 className="text-sm font-medium text-secondary-700 mb-2">Quick Commands:</h4>
        <div className="flex flex-wrap gap-2">
          {commands.map((command) => (
            <button
              key={command}
              onClick={() => runCommand(command)}
              disabled={isRunning}
              className="px-3 py-1 text-xs bg-white border border-secondary-200 rounded hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {command}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-hidden">
        <div ref={outputRef} className="h-full overflow-y-auto">
          {output.length === 0 ? (
            <div className="text-secondary-400">
              <p>Terminal ready. Use the quick commands above or type your own commands.</p>
              <p className="mt-2">Example: npm install</p>
            </div>
          ) : (
            output.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {line}
              </div>
            ))
          )}
          {isRunning && (
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Running...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-secondary-200 bg-black">
        <div className="flex items-center space-x-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && currentCommand.trim()) {
                runCommand(currentCommand.trim())
                setCurrentCommand('')
              }
            }}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-green-400 outline-none placeholder-green-600"
            disabled={isRunning}
          />
        </div>
      </div>
    </div>
  )
}

