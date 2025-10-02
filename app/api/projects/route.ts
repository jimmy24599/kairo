import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { name, description, template = 'nextjs' } = await request.json()

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Project name and description are required' },
        { status: 400 }
      )
    }

    // Validate project name
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Project name can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      )
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Project name must be between 2 and 50 characters' },
        { status: 400 }
      )
    }

    // Define project paths
    const projectRoot = process.env.PROJECT_ROOT || process.cwd()
    
    // Check if we're already in the AI-Projects directory
    const isAlreadyInAIProjects = projectRoot.endsWith('AI-Projects')
    const aiProjectsDir = isAlreadyInAIProjects ? projectRoot : path.join(projectRoot, 'AI-Projects')
    const projectPath = path.join(aiProjectsDir, name)

    // Check if project already exists
    try {
      await fs.access(projectPath)
      return NextResponse.json(
        { error: 'Project with this name already exists' },
        { status: 409 }
      )
    } catch {
      // Project doesn't exist, continue
    }

    // Ensure AI-Projects directory exists
    await fs.mkdir(aiProjectsDir, { recursive: true })

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true })

    // Create package.json
    const packageJson = {
      name: name,
      version: "0.1.0",
      private: true,
      description: description,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint"
      },
      dependencies: {
        "next": "^14.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "autoprefixer": "^10.4.0",
        "eslint": "^8.0.0",
        "eslint-config-next": "^14.0.0",
        "postcss": "^8.4.0",
        "tailwindcss": "^3.3.0",
        "typescript": "^5.0.0"
      }
    }

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )

    // Create Next.js config
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`

    await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig)

    // Create TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "es6"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [
          {
            name: "next"
          }
        ],
        paths: {
          "@/*": ["./*"]
        }
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    }

    await fs.writeFile(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    )

    // Create Tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
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
}`

    await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig)

    // Create PostCSS config
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`

    await fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfig)

    // Create app directory structure
    const appDir = path.join(projectPath, 'app')
    await fs.mkdir(appDir, { recursive: true })

    // Create global CSS
    const globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;`

    await fs.writeFile(path.join(appDir, 'globals.css'), globalCss)

    // Create layout.tsx
    const layout = `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${name}',
  description: '${description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`

    await fs.writeFile(path.join(appDir, 'layout.tsx'), layout)

    // Create page.tsx
    const page = `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ${name}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          ${description}
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <p className="text-gray-700">
            Your project has been created successfully! Start building your application.
          </p>
        </div>
      </div>
    </main>
  )
}`

    await fs.writeFile(path.join(appDir, 'page.tsx'), page)

    // Create components directory
    const componentsDir = path.join(projectPath, 'components')
    await fs.mkdir(componentsDir, { recursive: true })

    // Create public directory
    const publicDir = path.join(projectPath, 'public')
    await fs.mkdir(publicDir, { recursive: true })

    // Create .gitignore
    const gitignore = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`

    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore)

    // Create README.md
    const readme = `# ${name}

${description}

## Getting Started

First, install the dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.`

    await fs.writeFile(path.join(projectPath, 'README.md'), readme)

    // Install dependencies
    try {
      await execAsync('npm install', { cwd: projectPath })
    } catch (error) {
      console.warn('Failed to install dependencies:', error)
      // Continue even if npm install fails
    }

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project: {
        name,
        path: projectPath,
        description
      }
    })

  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const projectRoot = process.env.PROJECT_ROOT || process.cwd()
    
    // Check if we're already in the AI-Projects directory
    const isAlreadyInAIProjects = projectRoot.endsWith('AI-Projects')
    const aiProjectsDir = isAlreadyInAIProjects ? projectRoot : path.join(projectRoot, 'AI-Projects')

    // Check if AI-Projects directory exists
    try {
      await fs.access(aiProjectsDir)
    } catch {
      return NextResponse.json({ projects: [] })
    }

    // Read all projects
    const entries = await fs.readdir(aiProjectsDir, { withFileTypes: true })
    const projects = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectPath = path.join(aiProjectsDir, entry.name)
        const packageJsonPath = path.join(projectPath, 'package.json')
        
        try {
          const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
          const packageJson = JSON.parse(packageJsonContent)
          
          projects.push({
            name: entry.name,
            description: packageJson.description || '',
            version: packageJson.version || '0.1.0',
            path: projectPath
          })
        } catch {
          // If package.json doesn't exist or is invalid, still include the project
          projects.push({
            name: entry.name,
            description: '',
            version: '0.1.0',
            path: projectPath
          })
        }
      }
    }

    return NextResponse.json({ projects })

  } catch (error) {
    console.error('Error listing projects:', error)
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    )
  }
}