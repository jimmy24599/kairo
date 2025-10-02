import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// Store running processes (same as in start route)
const runningProcesses = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const { projectName } = await request.json()

    if (!projectName) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const processInfo = runningProcesses.get(projectName)
    if (!processInfo) {
      return NextResponse.json({ error: 'No running dev server found for this project' }, { status: 404 })
    }

    // Kill the process
    processInfo.process.kill('SIGTERM')
    runningProcesses.delete(projectName)

    // Remove persisted status file
    const projectRoot = process.env.PROJECT_ROOT || path.join(process.cwd(), 'AI-Projects')
    const projectPath = path.join(projectRoot, projectName)
    const statusFilePath = path.join(projectPath, '.kairo-dev-server.json')
    try { fs.unlinkSync(statusFilePath) } catch {}

    return NextResponse.json({
      message: 'Dev server stopped successfully',
      projectName: projectName
    })

  } catch (error) {
    console.error('Error stopping dev server:', error)
    return NextResponse.json({ error: 'Failed to stop dev server' }, { status: 500 })
  }
}
