export interface ProjectFile {
  path: string
  content: string
  type: 'file' | 'directory'
  dependencies?: string[]
  imports?: string[]
  exports?: string[]
}

export interface Task {
  id: string
  type: 'create' | 'modify' | 'delete' | 'command' | 'install'
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high'
  dependencies: string[]
  filePath?: string
  content?: string
  command?: string
  error?: string
  createdAt: Date
  completedAt?: Date
}

export interface AgentContext {
  projectRoot: string
  files: ProjectFile[]
  packageJson?: any
  dependencies: string[]
  devDependencies: string[]
  scripts: Record<string, string>
  framework: 'next' | 'react' | 'vue' | 'angular' | 'unknown'
  language: 'typescript' | 'javascript' | 'python' | 'unknown'
}

export interface AgentResponse {
  success: boolean
  message: string
  tasks: Task[]
  filesCreated: string[]
  filesModified: string[]
  errors: string[]
}

export interface CodeAnalysis {
  imports: string[]
  exports: string[]
  dependencies: string[]
  functions: string[]
  classes: string[]
  variables: string[]
  complexity: number
}
