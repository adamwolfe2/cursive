'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import type { ContextFormat } from '@/types/onboarding-templates'
import { CONTEXT_FORMATS } from '@/types/onboarding-templates'

interface ContextInputProps {
  onParse: (rawContext: string, format: ContextFormat) => void
  isParsing: boolean
}

const ACCEPTED_FILE_TYPES = '.txt,.md,.pdf,.docx'

export default function ContextInput({ onParse, isParsing }: ContextInputProps) {
  const [rawContext, setRawContext] = useState('')
  const [contextFormat, setContextFormat] = useState<ContextFormat>('mixed')
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; text: string }[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const extractTextFromFile = useCallback(async (file: File): Promise<string> => {
    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.md')) {
      return file.text()
    }
    // For PDF/DOCX, read as text (basic extraction)
    // In production you'd use a proper parser; for now, read as text
    try {
      return await file.text()
    } catch {
      return `[Could not extract text from ${file.name}]`
    }
  }, [])

  const handleFilesDrop = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const newFiles: { name: string; text: string }[] = []

      for (const file of fileArray) {
        const text = await extractTextFromFile(file)
        newFiles.push({ name: file.name, text })
      }

      setAttachedFiles((prev) => [...prev, ...newFiles])
    },
    [extractTextFromFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        handleFilesDrop(e.dataTransfer.files)
      }
    },
    [handleFilesDrop]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesDrop(e.target.files)
      }
    },
    [handleFilesDrop]
  )

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleParse = useCallback(() => {
    const fileText = attachedFiles.map((f) => `\n\n--- Attached file: ${f.name} ---\n${f.text}`).join('')
    const fullContext = rawContext + fileText
    onParse(fullContext, contextFormat)
  }, [rawContext, attachedFiles, contextFormat, onParse])

  const canParse = rawContext.trim().length >= 10 || attachedFiles.length > 0

  return (
    <div className="space-y-4">
      {/* Format selector buttons */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CONTEXT_FORMATS) as [ContextFormat, { label: string }][]).map(
          ([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setContextFormat(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                contextFormat === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Main textarea */}
      <textarea
        value={rawContext}
        onChange={(e) => setRawContext(e.target.value)}
        placeholder="Paste anything here — call notes, transcript, meeting summary, email thread, client brief, voice memo text, or any combination. Include as much context as you have. The more you give, the less you'll need to fill in manually.

Works great with Granola AI meeting notes — just paste the full export."
        rows={12}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[200px]"
        disabled={isParsing}
      />

      {/* File drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drop files here or{' '}
          <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
            browse
            <input
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              multiple
              onChange={handleFileInput}
              className="sr-only"
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-gray-400">.txt, .md, .pdf, .docx</p>
      </div>

      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          {attachedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
            >
              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
              <span className="text-xs text-gray-400">
                {file.text.length > 1000
                  ? `${(file.text.length / 1000).toFixed(1)}k chars`
                  : `${file.text.length} chars`}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Parse button */}
      <button
        type="button"
        onClick={handleParse}
        disabled={!canParse || isParsing}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isParsing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing your context...
          </>
        ) : (
          'Parse with AI'
        )}
      </button>
    </div>
  )
}
