import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

// Store running processes (best-effort in-memory cache; persistence handled via status file)
const runningProcesses = new Map<string, any>()

async function isPortResponding(port: number): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 800)
    const res = await fetch(`http://localhost:${port}/`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectName } = await request.json()
    console.log('Starting dev server for project:', projectName)

    if (!projectName) {
      console.log('No project name provided')
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Check if process is already running in-memory
    if (runningProcesses.has(projectName)) {
      const existingProcess = runningProcesses.get(projectName)
      return NextResponse.json({ 
        message: 'Dev server already running',
        port: existingProcess.port,
        pid: existingProcess.pid 
      })
    }

    // Get project path - PROJECT_ROOT already points to AI-Projects directory
    console.log('Environment PROJECT_ROOT:', process.env.PROJECT_ROOT)
    console.log('Current working directory:', process.cwd())
    
    const projectRoot = process.env.PROJECT_ROOT || path.join(process.cwd(), 'AI-Projects')
    const projectPath = path.join(projectRoot, projectName)
    console.log('Final project root:', projectRoot)
    console.log('Final project path:', projectPath)
    console.log('Project exists:', fs.existsSync(projectPath))

    // Check if project exists
    if (!fs.existsSync(projectPath)) {
      console.log('Project not found at:', projectPath)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      console.log('No package.json found at:', packageJsonPath)
      return NextResponse.json({ error: 'No package.json found in project' }, { status: 400 })
    }

    // Check for persisted status file and an already-running server
    const statusFilePath = path.join(projectPath, '.kairo-dev-server.json')
    if (fs.existsSync(statusFilePath)) {
      try {
        const raw = fs.readFileSync(statusFilePath, 'utf8')
        const info = JSON.parse(raw)
        if (info && typeof info.port === 'number') {
          const running = await isPortResponding(info.port)
          if (running) {
            return NextResponse.json({
              message: 'Dev server already running',
              port: info.port,
              pid: info.pid || null,
              projectName
            })
          } else {
            // stale file
            try { fs.unlinkSync(statusFilePath) } catch {}
          }
        }
      } catch (e) {
        console.warn('Could not read status file, proceeding to start new server:', e)
      }
    }

    // Find available port starting from 3000
    const port = await findAvailablePort(3000)
    console.log('Using port:', port)

    // Start the dev server
    console.log('Spawning npm run dev in:', projectPath)
    const childProcess = spawn('npm', ['run', 'dev'], {
      cwd: projectPath,
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: port.toString()
      }
    })

    // Store process info
    const processInfo = {
      process: childProcess,
      port: port,
      pid: childProcess.pid,
      projectName: projectName
    }
    runningProcesses.set(projectName, processInfo)

    // Persist status to file for cross-route visibility
    try {
      fs.writeFileSync(statusFilePath, JSON.stringify({
        projectName,
        port,
        pid: childProcess.pid,
        startedAt: Date.now()
      }, null, 2))
    } catch (e) {
      console.warn('Failed to write status file:', e)
    }

    // Handle process events
    childProcess.on('error', (error) => {
      console.error(`Dev server error for ${projectName}:`, error)
      runningProcesses.delete(projectName)
    })

    childProcess.on('exit', (code) => {
      console.log(`Dev server exited for ${projectName} with code ${code}`)
      runningProcesses.delete(projectName)
      try { fs.unlinkSync(statusFilePath) } catch {}
    })

    // Log process output for debugging
    childProcess.stdout?.on('data', (data) => {
      console.log(`Dev server stdout for ${projectName}:`, data.toString())
    })

    childProcess.stderr?.on('data', (data) => {
      console.error(`Dev server stderr for ${projectName}:`, data.toString())
    })

    // Wait a moment for the server to start, then verify it's responding
    await new Promise(resolve => setTimeout(resolve, 1500))
    const responding = await isPortResponding(port)

    if (responding) {
      return NextResponse.json({
        message: 'Dev server started successfully',
        port: port,
        pid: childProcess.pid,
        projectName: projectName
      })
    } else {
      console.warn('Dev server not yet responding, returning port optimistically')
      return NextResponse.json({
        message: 'Dev server starting',
        port: port,
        pid: childProcess.pid,
        projectName: projectName
      })
    }

  } catch (error) {
    console.error('Error starting dev server:', error)
    return NextResponse.json({ 
      error: 'Failed to start dev server',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('net')
  
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port
      server.close(() => resolve(port))
    })
    
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve).catch(reject)
    })
  })
}
