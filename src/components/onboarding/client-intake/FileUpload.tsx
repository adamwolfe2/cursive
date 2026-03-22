'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { PendingFile, ClientFileType } from '@/types/onboarding'

interface FileUploadProps {
  label: string
  helperText?: string
  accept: string
  value: PendingFile | null
  onChange: (file: PendingFile | null) => void
  fileType: ClientFileType
  className?: string
}

const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({ label, helperText, accept, value, onChange, fileType, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const acceptedTypes = accept.split(',').map(t => t.trim())

  const validateFile = (file: File): boolean => {
    setError(null)

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File too large. Maximum size is 25 MB.`)
      return false
    }

    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
    const mimeMatch = acceptedTypes.some(t => {
      if (t.startsWith('.')) return ext === t.toLowerCase()
      if (t.endsWith('/*')) return file.type.startsWith(t.replace('/*', '/'))
      return file.type === t
    })

    if (!mimeMatch) {
      setError(`Invalid file type. Accepted: ${accept}`)
      return false
    }

    return true
  }

  const handleFile = (file: File) => {
    if (!validateFile(file)) return
    onChange({ file, type: fileType, preview: file.name })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = () => {
    setError(null)
    onChange(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}

      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{value.file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(value.file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-3 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Remove file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-all duration-200',
            isDragging
              ? 'border-blue-400 bg-blue-50/50'
              : 'border-border hover:border-blue-300 hover:bg-muted/30',
            error && 'border-destructive/50'
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-foreground hidden sm:block">
            Drop your file here, or <span className="text-blue-600">browse</span>
          </p>
          <p className="mt-3 text-sm font-medium text-foreground sm:hidden">
            <span className="text-blue-600">Tap to select file</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {accept} &middot; Max 25 MB
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-label={label}
      />
    </div>
  )
}
