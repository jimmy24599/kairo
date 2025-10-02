'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface GeneratedFile {
  name: string
  content: string
  language: string
  path: string
}

interface CodeEditorProps {
  files: GeneratedFile[]
}

export default function CodeEditor({ files }: CodeEditorProps) {
  const [activeFile, setActiveFile] = useState<GeneratedFile | null>(files[0] || null)
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  const copyToClipboard = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFile(fileName)
      setTimeout(() => setCopiedFile(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllFiles = () => {
    files.forEach(file => {
      setTimeout(() => downloadFile(file), 100)
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* File Tabs */}
      <div className="flex border-b border-secondary-200 bg-secondary-50">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => setActiveFile(file)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeFile?.name === file.name
                ? 'border-primary-500 text-primary-600 bg-white'
                : 'border-transparent text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center p-4 border-b border-secondary-200 bg-white">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-secondary-600">
            {activeFile?.name} ({activeFile?.language})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {activeFile && (
            <>
              <button
                onClick={() => copyToClipboard(activeFile.content, activeFile.name)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-secondary-600 hover:text-secondary-900 transition-colors"
              >
                {copiedFile === activeFile.name ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>Copy</span>
              </button>
              <button
                onClick={() => downloadFile(activeFile)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-secondary-600 hover:text-secondary-900 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </>
          )}
          <button
            onClick={downloadAllFiles}
            className="btn-primary text-sm px-3 py-1"
          >
            Download All
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <div className="h-full">
            <SyntaxHighlighter
              language={activeFile.language}
              style={tomorrow}
              customStyle={{
                margin: 0,
                height: '100%',
                fontSize: '14px',
                lineHeight: '1.5',
                padding: '1rem'
              }}
              showLineNumbers
              wrapLines
            >
              {activeFile.content}
            </SyntaxHighlighter>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-secondary-600">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
              <p>Select a file to view its code</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

