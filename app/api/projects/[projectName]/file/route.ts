import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const { projectName } = params
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 })
    }
    
    const projectsRoot = process.env.PROJECT_ROOT || process.cwd()
    const fullPath = join(projectsRoot, projectName, filePath)
    
    const content = await readFile(fullPath, 'utf-8')
    
    return NextResponse.json({
      success: true,
      content,
      filePath
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
