'use client'

/**
 * Partner Lead Upload Component
 * CSV upload with validation and preview
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface UploadResult {
  success: boolean
  uploaded: number
  skipped: number
  potential_earnings?: number
  validation_errors?: Array<{ row: number; errors: string[] }>
}

export function LeadUpload() {
  const [csvData, setCsvData] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [autoList, setAutoList] = useState(false)
  const [defaultPrice, setDefaultPrice] = useState<string>('10.00')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const queryClient = useQueryClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setFileName(file.name)
    setUploadResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Clean and validate data
        const cleaned = results.data.map((row: any) => ({
          email: row.email || row.Email || '',
          first_name: row.first_name || row['First Name'] || row.firstName || '',
          last_name: row.last_name || row['Last Name'] || row.lastName || '',
          company_name: row.company_name || row['Company Name'] || row.company || '',
          job_title: row.job_title || row['Job Title'] || row.title || '',
          phone: row.phone || row.Phone || '',
          linkedin_url: row.linkedin_url || row.linkedin || '',
          industry: row.industry || row.Industry || '',
          company_size: row.company_size || row['Company Size'] || '',
          state: row.state || row.State || '',
          city: row.city || row.City || '',
          marketplace_price: parseFloat(row.price || row.Price || defaultPrice) || undefined,
        }))

        setCsvData(cleaned)
        toast.success(`Loaded ${cleaned.length} leads from CSV`)
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`)
      },
    })
  }, [defaultPrice])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/partner/leads/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: csvData,
          auto_list: autoList,
          default_price: parseFloat(defaultPrice),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: (data: UploadResult) => {
      setUploadResult(data)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['partner', 'earnings'] })

      toast.success('Upload complete!', {
        description: `${data.uploaded} leads uploaded${data.skipped > 0 ? `, ${data.skipped} skipped` : ''}`,
      })

      // Clear form
      setCsvData([])
      setFileName('')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Upload failed')
    },
  })

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Leads</CardTitle>
          <CardDescription>
            Upload leads via CSV. Maximum 1000 leads per upload.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse • Max 10MB, 1000 leads
            </p>
          </div>

          {fileName && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {csvData.length} leads loaded
                </p>
              </div>
              <Badge variant="secondary">{csvData.length}</Badge>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-list">Auto-list on marketplace</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically list uploaded leads for sale
                </p>
              </div>
              <Switch
                checked={autoList}
                onChange={(e) => setAutoList(e.target.checked)}
              />
            </div>

            {autoList && (
              <div>
                <Label htmlFor="default-price">Default Price (if not in CSV)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="default-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    className="max-w-[150px]"
                  />
                  <span className="text-sm text-muted-foreground">per lead</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={csvData.length === 0 || uploadMutation.isPending}
            className="w-full"
            size="lg"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {csvData.length} Leads
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Result */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Upload Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.uploaded}
                </div>
                <div className="text-sm text-green-700">Leads Uploaded</div>
              </div>

              {uploadResult.skipped > 0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {uploadResult.skipped}
                  </div>
                  <div className="text-sm text-orange-700">Duplicates Skipped</div>
                </div>
              )}

              {uploadResult.potential_earnings && uploadResult.potential_earnings > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg col-span-2">
                  <div className="text-2xl font-bold text-blue-600">
                    ${uploadResult.potential_earnings.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-700">
                    Potential Earnings (if all leads sell)
                  </div>
                </div>
              )}
            </div>

            {uploadResult.validation_errors && uploadResult.validation_errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">
                      {uploadResult.validation_errors.length} rows had errors
                    </p>
                    <ul className="text-sm text-red-600 mt-2 space-y-1">
                      {uploadResult.validation_errors.slice(0, 5).map((err) => (
                        <li key={err.row}>
                          Row {err.row}: {err.errors.join(', ')}
                        </li>
                      ))}
                      {uploadResult.validation_errors.length > 5 && (
                        <li className="text-red-500">
                          ...and {uploadResult.validation_errors.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CSV Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Format Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p className="font-medium">Required columns (at least one):</p>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              <li>email OR phone</li>
              <li>first_name/last_name OR company_name</li>
            </ul>

            <p className="font-medium mt-4">Optional columns:</p>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              <li>job_title, linkedin_url, industry, company_size</li>
              <li>state, city</li>
              <li>price (for marketplace listing)</li>
            </ul>

            <div className="mt-4 p-3 bg-muted rounded-lg font-mono text-xs">
              email,first_name,last_name,company_name,job_title,price
              <br />
              john@example.com,John,Doe,Acme Inc,CEO,15.00
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
