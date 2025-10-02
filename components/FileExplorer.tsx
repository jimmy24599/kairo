'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Download,
  Folder,
  File
} from 'lucide-react'

interface GeneratedFile {
  name: string
  content: string
  language: string
  path: string
}

interface FileExplorerProps {
  projectStructure: any
  files: GeneratedFile[]
}

export default function FileExplorer({ projectStructure, files }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath)
    } else {
      newExpanded.add(folderPath)
    }
    setExpandedFolders(newExpanded)
  }

  const downloadAllFiles = () => {
    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  const renderFileTree = () => {
    if (!projectStructure) {
      return (
        <div className="flex items-center justify-center h-full text-secondary-600">
          <div className="text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
            <p>No project structure available</p>
          </div>
        </div>
      )
    }

    const fileTree = {
      name: projectStructure.name,
      type: 'folder',
      children: files.map(file => ({
        name: file.name,
        type: 'file',
        path: file.path,
        language: file.language
      }))
    }

    return renderNode(fileTree, 'root')
  }

  const renderNode = (node: any, path: string) => {
    const isExpanded = expandedFolders.has(path)
    const isFolder = node.type === 'folder'

    return (
      <div key={path} className="ml-4">
        <div className="flex items-center py-1 hover:bg-secondary-50 rounded px-2">
          {isFolder ? (
            <button
              onClick={() => toggleFolder(path)}
              className="flex items-center space-x-1 text-secondary-700 hover:text-secondary-900"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4" />
              <span className="font-medium">{node.name}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-secondary-600">
              <File className="w-4 h-4" />
              <span>{node.name}</span>
              <span className="text-xs text-secondary-400">({node.language})</span>
            </div>
          )}
        </div>
        
        {isFolder && isExpanded && node.children && (
          <div className="ml-4">
            {node.children.map((child: any, index: number) => 
              renderNode(child, `${path}/${index}`)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-secondary-200 bg-white">
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-5 h-5 text-secondary-600" />
          <h3 className="font-semibold text-secondary-900">Project Files</h3>
        </div>
        <button
          onClick={downloadAllFiles}
          className="btn-primary text-sm px-3 py-1"
        >
          <Download className="w-4 h-4 mr-1" />
          Download All
        </button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderFileTree()}
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-secondary-200 bg-secondary-50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-secondary-600">Files:</span>
            <span className="ml-2 font-medium text-secondary-900">{files.length}</span>
          </div>
          <div>
            <span className="text-secondary-600">Total Size:</span>
            <span className="ml-2 font-medium text-secondary-900">
              {files.reduce((acc, file) => acc + file.content.length, 0).toLocaleString()} chars
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

