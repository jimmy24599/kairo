import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectName = searchParams.get('projectName')
    if (!projectName) {
      return NextResponse.json({ error: 'projectName is required' }, { status: 400 })
    }

    const projectRoot = process.env.PROJECT_ROOT || path.join(process.cwd(), 'AI-Projects')
    const projectPath = path.join(projectRoot, projectName)
    const statusFilePath = path.join(projectPath, '.kairo-dev-server.json')

    if (fs.existsSync(statusFilePath)) {
      try {
        const raw = fs.readFileSync(statusFilePath, 'utf8')
        const info = JSON.parse(raw)
        if (info && typeof info.port === 'number') {
          const running = await isPortResponding(info.port)
          if (running) {
            return NextResponse.json({ running: true, port: info.port, pid: info.pid || null })
          }
        }
      } catch {}
    }

    return NextResponse.json({ running: false })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}


