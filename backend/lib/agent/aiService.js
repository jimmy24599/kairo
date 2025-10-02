const OpenAI = require('openai')
const { Task } = require('./types')
const { FileSystemManager } = require('./fileSystem')

class AIService {
  constructor(context) {
    const key = process.env.OPENROUTER_API_KEY

    if (!key || key === 'your_openrouter_api_key_here') {
      console.warn('No OpenRouter API key provided. AI features will use fallback parsing.')
      this.useMockResponse = true
    } else {
      this.useMockResponse = false
    }
    
    this.openai = new OpenAI({
      apiKey: key,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    })
    this.context = context
    this.fileSystem = new FileSystemManager(context.projectRoot)
  }

  async parseUserRequest(userInput) {
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
        model: process.env.OPENROUTER_EXECUTE_MODEL || 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')

      const tasks = JSON.parse(content)
      
      // Add IDs and timestamps to tasks
      return tasks.map((task) => new Task({
        ...task,
        id: this.generateId(),
        status: 'pending',
        createdAt: new Date()
      }))

    } catch (error) {
      console.error('AI parsing error:', error)
      // Return a simple task that will be processed by the LLM
      return [new Task({
        type: 'modify',
        description: `Process user request: ${userInput}`,
        status: 'pending',
        priority: 'high',
        dependencies: [],
        filePath: 'app/page.tsx',
        content: '',
        createdAt: new Date()
      })]
    }
  }

  async generateCode(task, context) {
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
        model: process.env.OPENROUTER_EXECUTE_MODEL || 'openai/gpt-4o',
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

  async analyzeExistingFile(filePath) {
    try {
      return await this.fileSystem.readFile(filePath)
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      return ''
    }
  }

  async generateModificationTask(userInput, existingFileContent, filePath) {
    if (this.useMockResponse) {
      console.log('Using mock response for modification task')
      return this.getMockModificationTask(userInput, existingFileContent, filePath)
    }

    const systemPrompt = `You are an expert developer. Analyze the user's request and the existing file content to generate a complete updated file.

User Request: ${userInput}
File Path: ${filePath}
Existing Content:
${existingFileContent}

Generate the complete updated file content that incorporates the user's request. Return ONLY the complete file content, no explanations.`

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENROUTER_EXECUTE_MODEL || 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })

      const content = response.choices[0]?.message?.content || ''
      
      return new Task({
        type: 'modify',
        description: `Modify ${filePath}: ${userInput}`,
        status: 'pending',
        priority: 'high',
        dependencies: [],
        filePath,
        content,
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Error generating modification task:', error)
      // Fallback to mock response on error
      return this.getMockModificationTask(userInput, existingFileContent, filePath)
    }
  }

  getMockModificationTask(userInput, existingFileContent, filePath) {
    const lowerInput = userInput.toLowerCase()
    
    if (lowerInput.includes('navigation') || lowerInput.includes('nav') || lowerInput.includes('header')) {
      return new Task({
        type: 'modify',
        description: `Add navigation bar to ${filePath}`,
        status: 'pending',
        priority: 'high',
        dependencies: [],
        filePath,
        content: this.generateNavigationBar(),
        createdAt: new Date()
      })
    }
    
    if (lowerInput.includes('faq') || (lowerInput.includes('frequently') && lowerInput.includes('asked'))) {
      return new Task({
        type: 'modify',
        description: `Add FAQ section to ${filePath}`,
        status: 'pending',
        priority: 'high',
        dependencies: [],
        filePath,
        content: this.generateFAQSection(),
        createdAt: new Date()
      })
    }
    
    // Default fallback
    return new Task({
      type: 'modify',
      description: `Modify ${filePath}: ${userInput}`,
      status: 'pending',
      priority: 'high',
      dependencies: [],
      filePath,
      content: existingFileContent + '\n\n// TODO: Implement user request: ' + userInput,
      createdAt: new Date()
    })
  }

  generateNavigationBar() {
    return `import type { Metadata } from 'next'
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
  }

  generateFAQSection() {
    return `import React from 'react'

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

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">Find answers to common questions about our platform</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What is included in the Basic plan?</h3>
              <p className="text-gray-600">The Basic plan includes up to 5 projects, basic templates, and email support. Perfect for individuals and small teams getting started.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Can I upgrade or downgrade my plan anytime?</h3>
              <p className="text-gray-600">Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the next billing cycle.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Do you offer custom domains?</h3>
              <p className="text-gray-600">Custom domains are available with our Pro and Enterprise plans. You can connect your own domain to your projects.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What kind of support do you provide?</h3>
              <p className="text-gray-600">We provide email support for Basic plans, priority support for Pro plans, and dedicated support for Enterprise customers.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Is there a free trial available?</h3>
              <p className="text-gray-600">Yes, we offer a 14-day free trial for all plans. No credit card required to get started.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}`
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9)
  }
}

module.exports = { AIService }