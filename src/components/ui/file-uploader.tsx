'use client'

import * as React from 'react'
import { useDropzone, type Accept, type FileRejection } from 'react-dropzone'
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileUploaderProps {
  /**
   * Value of the uploader.
   * @type File[]
   * @default undefined
   * @example value={files}
   */
  value?: File[]

  /**
   * Function to be called when the value changes.
   * @type (files: File[]) => void
   * @default undefined
   * @example onValueChange={(files) => setFiles(files)}
   */
  onValueChange?: (files: File[]) => void

  /**
   * Function to be called when files are uploaded.
   * @type (files: File[]) => Promise<void>
   * @default undefined
   * @example onUpload={(files) => uploadFiles(files)}
   */
  onUpload?: (files: File[]) => Promise<void>

  /**
   * Accepted file types for the uploader.
   * @type { [key: string]: string[]}
   * @default
   * ```ts
   * { "image/*": [] }
   * ```
   * @example accept={["image/png", "image/jpeg"]}
   */
  accept?: Accept

  /**
   * Maximum file size for the uploader.
   * @type number | undefined
   * @default 1024 * 1024 * 2 // 2MB
   * @example maxSize={1024 * 1024 * 2} // 2MB
   */
  maxSize?: number

  /**
   * Maximum number of files for the uploader.
   * @type number | undefined
   * @default 1
   * @example maxFiles={5}
   */
  maxFiles?: number

  /**
   * Whether the uploader should accept multiple files.
   * @type boolean
   * @default false
   * @example multiple
   */
  multiple?: boolean

  /**
   * Whether the uploader is disabled.
   * @type boolean
   * @default false
   * @example disabled
   */
  disabled?: boolean
}

export function FileUploader(props: FileUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    onUpload,
    accept = {
      'text/csv': ['.csv'],
    },
    maxSize = 1024 * 1024 * 50, // 50MB
    maxFiles = 1,
    multiple = false,
    disabled = false,
  } = props

  const [files, setFiles] = React.useState<File[]>([])
  const [rejectedFiles, setRejectedFiles] = React.useState<FileRejection[]>([])
  const [isUploading, setIsUploading] = React.useState(false)

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && acceptedFiles.length > 1) {
        rejectedFiles.push({
          file: acceptedFiles[1]!,
          errors: [
            {
              code: 'too-many-files',
              message: 'Only one file is allowed',
            },
          ],
        })
        acceptedFiles = [acceptedFiles[0]!]
      }

      if ((files?.length ?? 0) + acceptedFiles.length > maxFiles) {
        rejectedFiles.push({
          file: acceptedFiles[0]!,
          errors: [
            {
              code: 'too-many-files',
              message: `Maximum ${maxFiles} file(s) allowed`,
            },
          ],
        })
        return
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )

      const updatedFiles = files ? [...files, ...newFiles] : newFiles

      setFiles(updatedFiles)
      setRejectedFiles(rejectedFiles)
      onValueChange?.(updatedFiles)
    },
    [files, maxFiles, multiple, onValueChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    multiple,
    disabled,
  })

  const removeFile = React.useCallback(
    (index: number) => {
      if (!files) return
      const newFiles = files.filter((_, i) => i !== index)
      setFiles(newFiles)
      onValueChange?.(newFiles)
    },
    [files, onValueChange]
  )

  const handleUpload = async () => {
    setIsUploading(true)
    try {
      await onUpload?.(files)
    } finally {
      setIsUploading(false)
    }
  }

  // Revoke preview urls when component unmounts
  React.useEffect(() => {
    return () => {
      if (!files) return
      files.forEach((file) => {
        if ('preview' in file) {
          URL.revokeObjectURL(file.preview as string)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-zinc-700 px-5 py-2.5 text-center transition hover:bg-zinc-900/50',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isDragActive && 'border-primary bg-primary/10',
          disabled && 'pointer-events-none opacity-60',
          files?.length > 0 && 'border-green-600 bg-green-950/20'
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
            <div className="rounded-full border border-dashed border-primary/80 p-3">
              <Upload className="h-7 w-7 text-primary/80" aria-hidden="true" />
            </div>
            <div className="space-y-px">
              <p className="text-lg font-medium text-white">Drop the file here</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
            <div className="rounded-full border border-dashed border-zinc-600 p-3">
              <FileSpreadsheet className="h-7 w-7 text-zinc-400" aria-hidden="true" />
            </div>
            <div className="space-y-px">
              <p className="text-lg font-medium text-white">
                Drag & drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-zinc-400">
                Max file size: {(maxSize / 1024 / 1024).toFixed(0)}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected files */}
      {files?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Selected file</p>
            {onUpload && (
              <Button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0}
                size="sm"
                className="h-7"
              >
                {isUploading ? 'Processing...' : 'Process file'}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <FileCard
                key={index}
                file={file}
                onRemove={() => removeFile(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected files */}
      {rejectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-400">Rejected files</p>
          <div className="space-y-2">
            {rejectedFiles.map(({ file, errors }, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-red-800 bg-red-950/20 p-3"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-300">{file.name}</p>
                    <p className="text-xs text-red-400">
                      {errors.map((e) => e.message).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface FileCardProps {
  file: File
  onRemove: () => void
  disabled?: boolean
}

function FileCard({ file, onRemove, disabled }: FileCardProps) {
  return (
    <div className="group relative flex items-center justify-between rounded-lg border border-green-800 bg-green-950/20 p-3 transition-colors hover:bg-green-950/30">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-400" />
        <div>
          <p className="text-sm font-medium text-green-300">{file.name}</p>
          <p className="text-xs text-green-400/70">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-zinc-400 hover:text-white"
        onClick={onRemove}
        disabled={disabled}
      >
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Remove file</span>
      </Button>
    </div>
  )
}
