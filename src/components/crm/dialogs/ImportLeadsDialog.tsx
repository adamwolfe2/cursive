'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileUploader } from '@/components/ui/file-uploader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Download } from 'lucide-react'

interface ImportLeadsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ImportLeadsDialog({ open, onOpenChange, onSuccess }: ImportLeadsDialogProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [result, setResult] = React.useState<{
    success: boolean
    imported: number
    failed: number
    errors?: string[]
  } | null>(null)

  const handleUpload = async (uploadFiles: File[]) => {
    if (uploadFiles.length === 0) return

    setIsProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadFiles[0])

      const response = await fetch('/api/crm/leads/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import leads')
      }

      const data = await response.json()
      setResult(data)

      if (data.success) {
        onSuccess?.()
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setFiles([])
    setResult(null)
    onOpenChange(false)
  }

  const downloadTemplate = () => {
    const csvContent = 'first_name,last_name,email,phone,company_name,company_industry,business_type,title,city,state,source\n' +
      'John,Doe,john.doe@example.com,555-0100,Acme Corp,Healthcare,Medical Spa,CEO,New York,NY,website\n' +
      'Jane,Smith,jane.smith@example.com,555-0101,Tech Inc,Technology,Software,CTO,San Francisco,CA,referral'

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import leads into your CRM. Download the template below to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="size-4 mr-2" />
            Download CSV Template
          </Button>

          {/* File Uploader */}
          <FileUploader
            value={files}
            onValueChange={setFiles}
            onUpload={handleUpload}
            accept={{
              'text/csv': ['.csv'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            }}
            maxSize={1024 * 1024 * 10} // 10MB
            maxFiles={1}
            disabled={isProcessing}
          />

          {/* Results */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success ? (
                  <div>
                    <p className="font-medium">Import completed successfully</p>
                    <p className="text-sm mt-1">
                      Imported: {result.imported} lead(s)
                      {result.failed > 0 && ` • Failed: ${result.failed} row(s)`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Import failed</p>
                    {result.errors && result.errors.length > 0 && (
                      <ul className="text-sm mt-1 space-y-1">
                        {result.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>• ... and {result.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Required columns:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>email</strong> (required) - Lead&apos;s email address</li>
              <li>• <strong>first_name</strong> - First name</li>
              <li>• <strong>last_name</strong> - Last name</li>
              <li>• <strong>phone</strong> - Phone number</li>
              <li>• <strong>company_name</strong> - Company name</li>
              <li>• <strong>company_industry</strong> - Industry (e.g., Healthcare, Technology)</li>
              <li>• <strong>business_type</strong> - Business type (e.g., Medical Spa, Retail)</li>
              <li>• <strong>title</strong> - Job title</li>
              <li>• <strong>city</strong> - City</li>
              <li>• <strong>state</strong> - State/Province</li>
              <li>• <strong>source</strong> - Lead source (e.g., website, import, partner)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
