import OpenAI from 'openai'
import { AgentContext, Task } from './types'

export class AIService {
  private openai: OpenAI
  private context: AgentContext
  private useMockResponse: boolean

  constructor(context: AgentContext, apiKey?: string) {
    const key = process.env.OPENAI_API_KEY  || apiKey

    if (!key || key === 'your_openai_api_key_here') {
      console.warn('No OpenAI API key provided. AI features will use fallback parsing.')
      // For testing, we'll use a mock response
      this.useMockResponse = true
    } else {
      this.useMockResponse = false
    }
    this.openai = new OpenAI({
      apiKey: key,
    })
    this.context = context
  }

  async parseUserRequest(userInput: string): Promise<Task[]> {
    const systemPrompt = `You are an AI coding assistant working within an EXISTING project. You should NEVER create new projects or duplicate existing project structure.

Current project context:
- Project Root: ${this.context.projectRoot}
- Framework: ${this.context.framework}
- Language: ${this.context.language}
- Dependencies: ${this.context.dependencies.join(', ')}
- Existing Files: ${this.context.files.map(f => f.path).join(', ')}

IMPORTANT RULES:
1. Work ONLY within the existing project structure
2. Do NOT create new project folders or duplicate existing structure
3. Modify existing files when possible instead of creating new ones
4. Understand the existing codebase before making changes
5. For UI components, add them to existing pages or create new components in appropriate directories

Convert the user's request into a JSON array of tasks. Each task should have:
- type: 'create' | 'modify' | 'delete' | 'command' | 'install'
- description: Clear description of what to do
- priority: 'low' | 'medium' | 'high'
- dependencies: Array of task IDs this depends on
- filePath: Path to file (if applicable) - use EXISTING project structure
- content: File content (if creating/modifying)
- command: Command to run (if applicable)

Examples for existing Next.js project:
- "Add a navigation bar" → [{"type": "modify", "description": "Add navigation bar to existing layout", "filePath": "app/layout.tsx", "content": "...", "priority": "high", "dependencies": []}]
- "Create a new page" → [{"type": "create", "description": "Create new page component", "filePath": "app/new-page/page.tsx", "content": "...", "priority": "high", "dependencies": []}]
- "Install tailwind" → [{"type": "install", "description": "Install Tailwind CSS", "command": "npm install -D tailwindcss", "priority": "high", "dependencies": []}]

Return ONLY valid JSON array, no other text.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')

      const tasks = JSON.parse(content)
      
      // Add IDs and timestamps to tasks
      return tasks.map((task: any) => ({
        ...task,
        id: this.generateId(),
        status: 'pending' as const,
        createdAt: new Date()
      }))

    } catch (error) {
      console.error('AI parsing error:', error)
      // Return a simple task that will be processed by the LLM
      return [{
        id: this.generateId(),
        type: 'modify' as const,
        description: `Process user request: ${userInput}`,
        status: 'pending' as const,
        priority: 'high' as const,
        dependencies: [],
        filePath: 'app/page.tsx',
        content: '',
        createdAt: new Date()
      }]
    }
  }

  async generateCode(task: Task, context: string): Promise<string> {
    const systemPrompt = `You are an expert ${this.context.language} developer working within an EXISTING project. Generate high-quality, production-ready code that integrates seamlessly with the existing codebase.

Project context:
- Framework: ${this.context.framework}
- Language: ${this.context.language}
- Dependencies: ${this.context.dependencies.join(', ')}
- Existing Files: ${this.context.files.map(f => f.path).join(', ')}

Task: ${task.description}
Context: ${context}

IMPORTANT:
1. Generate code that works with the existing project structure
2. Use existing dependencies and patterns from the project
3. Follow the same coding style and conventions as the existing code
4. For modifications, provide the complete updated file content
5. For new components, create them in appropriate directories within the existing structure

Generate clean, well-commented code that follows best practices and integrates with the existing codebase. Return ONLY the code, no explanations.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate code for: ${task.description}` }
        ],
        temperature: 0.2,
        max_tokens: 3000
      })

      return response.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('AI code generation error:', error)
      return '// Error generating code'
    }
  }

  async analyzeCode(filePath: string, content: string): Promise<any> {
    const systemPrompt = `Analyze this ${this.context.language} code and return a JSON object with:
- imports: Array of import statements
- exports: Array of exported items
- dependencies: Array of external dependencies used
- functions: Array of function names
- classes: Array of class names
- variables: Array of variable names
- complexity: Number (1-10) indicating code complexity

Return ONLY valid JSON.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this code:\n\n${content}` }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })

      const content_response = response.choices[0]?.message?.content
      if (!content_response) throw new Error('No response from AI')

      return JSON.parse(content_response)
    } catch (error) {
      console.error('AI code analysis error:', error)
      return {
        imports: [],
        exports: [],
        dependencies: [],
        functions: [],
        classes: [],
        variables: [],
        complexity: 1
      }
    }
  }

  async fixError(error: string, code: string, context: string): Promise<string> {
    const systemPrompt = `You are an expert debugger. Fix the error in this code.

Error: ${error}
Context: ${context}

Return the corrected code. Explain the fix briefly at the top as a comment.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Fix this code:\n\n${code}` }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      return response.choices[0]?.message?.content || code
    } catch (error) {
      console.error('AI error fixing error:', error)
      return code
    }
  }

  private fallbackParsing(userInput: string): Task[] {
    const tasks: Task[] = []
    const input = userInput.toLowerCase()
    
    // Enhanced fallback parsing for common requests
    if (input.includes('landing page') || input.includes('hero section') || input.includes('pricing')) {
      const projectName = 'landing-page-project'
      
      // Create package.json
      tasks.push({
        id: this.generateId(),
        type: 'create',
        description: 'Create project package.json',
        status: 'pending',
        priority: 'high',
        dependencies: [],
        filePath: `${projectName}/package.json`,
        content: `{
  "name": "${projectName}",
  "version": "1.0.0",
  "description": "Landing page with hero section and pricing",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}`,
        createdAt: new Date()
      })
      
      // Create landing page
      tasks.push({
        id: this.generateId(),
        type: 'create',
        description: 'Create landing page component',
        status: 'pending',
        priority: 'high',
        dependencies: [],
        filePath: `${projectName}/app/page.tsx`,
        content: `import React from 'react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Build Amazing Products
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create stunning landing pages and web applications with our powerful platform.
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
          <p className="text-xl text-gray-600">Choose the plan that's right for you</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
            <div className="text-4xl font-bold text-gray-900 mb-6">$9<span className="text-lg text-gray-600">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Up to 5 projects
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Basic templates
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Email support
              </li>
            </ul>
            <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro</h3>
            <div className="text-4xl font-bold text-gray-900 mb-6">$29<span className="text-lg text-gray-600">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited projects
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Premium templates
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Priority support
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Custom domains
              </li>
            </ul>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
            <div className="text-4xl font-bold text-gray-900 mb-6">$99<span className="text-lg text-gray-600">/month</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Everything in Pro
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                White-label solution
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Dedicated support
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Custom integrations
              </li>
            </ul>
            <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}`,
        createdAt: new Date()
      })
      
      // Create Next.js config
      tasks.push({
        id: this.generateId(),
        type: 'create',
        description: 'Create Next.js configuration',
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        filePath: `${projectName}/next.config.js`,
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`,
        createdAt: new Date()
      })
      
      // Create Tailwind config
      tasks.push({
        id: this.generateId(),
        type: 'create',
        description: 'Create Tailwind CSS configuration',
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        filePath: `${projectName}/tailwind.config.js`,
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
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
        createdAt: new Date()
      })
      
      // Create global CSS
      tasks.push({
        id: this.generateId(),
        type: 'create',
        description: 'Create global CSS with Tailwind',
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        filePath: `${projectName}/app/globals.css`,
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
        createdAt: new Date()
      })
      
      // Create layout
      tasks.push({
        id: this.generateId(),
        type: 'create',
        description: 'Create app layout',
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        filePath: `${projectName}/app/layout.tsx`,
        content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Landing Page',
  description: 'A beautiful landing page with hero section and pricing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
        createdAt: new Date()
      })
    }
    
    if (input.includes('install') || input.includes('add package')) {
      const packageMatch = input.match(/(?:install|add)\s+([a-zA-Z0-9@\-_\/]+)/)
      if (packageMatch) {
        tasks.push({
          id: this.generateId(),
          type: 'install',
          description: `Install package: ${packageMatch[1]}`,
          status: 'pending',
          priority: 'high',
          dependencies: [],
          command: packageMatch[1],
          createdAt: new Date()
        })
      }
    }
    
    if (input.includes('run') || input.includes('start') || input.includes('dev')) {
      tasks.push({
        id: this.generateId(),
        type: 'command',
        description: 'Start development server',
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        command: 'npm run dev',
        createdAt: new Date()
      })
    }
    
    return tasks
  }

  async analyzeExistingFile(filePath: string): Promise<string> {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const fullPath = path.join(this.context.projectRoot, filePath)
      const content = await fs.readFile(fullPath, 'utf-8')
      return content
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      return ''
    }
  }

  async generateModificationTask(userInput: string, existingFileContent: string, filePath: string): Promise<Task> {
    if (this.useMockResponse) {
      console.log('Using mock response for modification task')
      return this.getMockModificationTask(userInput, existingFileContent, filePath)
    }

    const systemPrompt = `You are an AI coding assistant that modifies existing files. Analyze the existing code and the user's request to generate the complete updated file content.

Existing file: ${filePath}
User request: ${userInput}

Current file content:
${existingFileContent}

Generate the complete updated file content that incorporates the user's request. Return ONLY the updated code, no explanations.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Modify the file to: ${userInput}` }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })

      const updatedContent = response.choices[0]?.message?.content || existingFileContent

      return {
        id: this.generateId(),
        type: 'modify',
        description: `Modify ${filePath}: ${userInput}`,
        status: 'pending',
        priority: 'high',
        dependencies: [],
        filePath,
        content: updatedContent,
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Error generating modification task:', error)
      // Fallback to mock response on error
      return this.getMockModificationTask(userInput, existingFileContent, filePath)
    }
  }

  private getMockModificationTask(userInput: string, existingFileContent: string, filePath: string): Task {
    const lowerInput = userInput.toLowerCase()
    
    // Mock modification responses
    if (lowerInput.includes('dark') && lowerInput.includes('theme')) {
      // Mock dark theme navigation
      const mockContent = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Landing Page',
  description: 'A beautiful landing page built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-900 shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold text-white">MyApp</span>
              </div>
              <div className="flex items-center space-x-4">
                <a href="#" className="text-gray-300 hover:text-white">Home</a>
                <a href="#" className="text-gray-300 hover:text-white">About</a>
                <a href="#" className="text-gray-300 hover:text-white">Contact</a>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}`
      
      return {
        id: this.generateId(),
        type: 'modify',
        description: `Modify ${filePath}: ${userInput}`,
        status: 'pending',
        priority: 'high',
        dependencies: [],
        filePath,
        content: mockContent,
        createdAt: new Date()
      }
    }
    
    // Default fallback - return existing content
    return {
      id: this.generateId(),
      type: 'modify',
      description: `Modify ${filePath}: ${userInput}`,
      status: 'pending',
      priority: 'high',
      dependencies: [],
      filePath,
      content: existingFileContent,
      createdAt: new Date()
    }
  }

  private getMockResponse(userInput: string): Task[] {
    // For testing without API key, return a simple task that will be processed by the LLM
    return [{
      id: this.generateId(),
      type: 'modify',
      description: `Process user request: ${userInput}`,
      status: 'pending',
      priority: 'high',
      dependencies: [],
      filePath: 'app/page.tsx', // Default file, will be determined by LLM
      content: '', // Will be generated by LLM
      createdAt: new Date()
    }]
  }


  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}
