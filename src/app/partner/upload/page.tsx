'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Loader2,
} from 'lucide-react'

interface FieldMapping {
  sourceColumn: string
  targetField: string
  sample: string
}

interface PreviewData {
  columns: string[]
  rows: Record<string, string>[]
  totalRows: number
}

interface IndustryCategory {
  id: string
  category_name: string
  category_slug: string
}

const TARGET_FIELDS = [
  { value: 'email', label: 'Email', required: true },
  { value: 'first_name', label: 'First Name', required: true },
  { value: 'last_name', label: 'Last Name', required: true },
  { value: 'company_name', label: 'Company Name', required: true },
  { value: 'job_title', label: 'Job Title', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'city', label: 'City', required: false },
  { value: 'state', label: 'State', required: false },
  { value: 'postal_code', label: 'Zip/Postal Code', required: false },
  { value: 'country', label: 'Country', required: false },
  { value: 'company_size', label: 'Company Size', required: false },
  { value: 'company_domain', label: 'Company Domain', required: false },
  { value: 'linkedin_url', label: 'LinkedIn URL', required: false },
  { value: 'sic_code', label: 'SIC Code', required: false },
  { value: 'ignore', label: '-- Ignore --', required: false },
]

export default function PartnerUploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'mapping' | 'industry' | 'processing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [industries, setIndustries] = useState<IndustryCategory[]>([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    batchId: string
    totalRows: number
    validRows: number
    invalidRows: number
    duplicateRows: number
    rejectedRowsUrl?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Fetch industry categories
  useEffect(() => {
    async function fetchIndustries() {
      try {
        const response = await fetch('/api/industries')
        if (response.ok) {
          const data = await response.json()
          setIndustries(data)
        }
      } catch (err) {
        console.error('Failed to fetch industries:', err)
      }
    }
    fetchIndustries()
  }, [])

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setError(null)
    setFile(selectedFile)
    setUploading(true)

    try {
      // Parse CSV preview
      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const columns = parseCSVLine(lines[0])
      const rows: Record<string, string>[] = []

      // Get first 10 rows for preview
      for (let i = 1; i < Math.min(11, lines.length); i++) {
        const values = parseCSVLine(lines[i])
        const row: Record<string, string> = {}
        columns.forEach((col, idx) => {
          row[col] = values[idx] || ''
        })
        rows.push(row)
      }

      setPreviewData({
        columns,
        rows,
        totalRows: lines.length - 1,
      })

      // Auto-map columns
      const autoMappings = columns.map(col => ({
        sourceColumn: col,
        targetField: autoMapColumn(col),
        sample: rows[0]?.[col] || '',
      }))

      setFieldMappings(autoMappings)
      setStep('mapping')
    } catch (err) {
      setError('Failed to parse CSV file')
    } finally {
      setUploading(false)
    }
  }

  // Parse CSV line handling quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  // Auto-map column names to target fields
  const autoMapColumn = (column: string): string => {
    const normalized = column.toLowerCase().replace(/[^a-z0-9]/g, '')

    const mappings: Record<string, string> = {
      'email': 'email',
      'emailaddress': 'email',
      'firstname': 'first_name',
      'first': 'first_name',
      'fname': 'first_name',
      'lastname': 'last_name',
      'last': 'last_name',
      'lname': 'last_name',
      'company': 'company_name',
      'companyname': 'company_name',
      'organization': 'company_name',
      'title': 'job_title',
      'jobtitle': 'job_title',
      'position': 'job_title',
      'phone': 'phone',
      'phonenumber': 'phone',
      'telephone': 'phone',
      'mobile': 'phone',
      'city': 'city',
      'state': 'state',
      'province': 'state',
      'region': 'state',
      'zip': 'postal_code',
      'zipcode': 'postal_code',
      'postalcode': 'postal_code',
      'country': 'country',
      'size': 'company_size',
      'companysize': 'company_size',
      'employees': 'company_size',
      'domain': 'company_domain',
      'website': 'company_domain',
      'linkedin': 'linkedin_url',
      'linkedinurl': 'linkedin_url',
      'sic': 'sic_code',
      'siccode': 'sic_code',
      'industry': 'sic_code',
    }

    return mappings[normalized] || 'ignore'
  }

  // Update field mapping
  const updateMapping = (index: number, targetField: string) => {
    setFieldMappings(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], targetField }
      return updated
    })
  }

  // Validate mappings
  const validateMappings = (): string[] => {
    const errors: string[] = []
    const requiredFields = TARGET_FIELDS.filter(f => f.required).map(f => f.value)
    const mappedFields = fieldMappings.filter(m => m.targetField !== 'ignore').map(m => m.targetField)

    requiredFields.forEach(field => {
      if (!mappedFields.includes(field)) {
        const fieldLabel = TARGET_FIELDS.find(f => f.value === field)?.label
        errors.push(`Missing required field: ${fieldLabel}`)
      }
    })

    return errors
  }

  // Proceed to industry selection
  const proceedToIndustry = () => {
    const errors = validateMappings()
    if (errors.length > 0) {
      setError(errors.join('. '))
      return
    }
    setError(null)
    setStep('industry')
  }

  // Process the upload
  const processUpload = async () => {
    if (!file) return

    setProcessing(true)
    setStep('processing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fieldMappings', JSON.stringify(fieldMappings.filter(m => m.targetField !== 'ignore')))
      formData.append('industryId', selectedIndustry)

      const response = await fetch('/api/partner/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadResult(result)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStep('industry')
    } finally {
      setProcessing(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setStep('upload')
    setFile(null)
    setPreviewData(null)
    setFieldMappings([])
    setSelectedIndustry('')
    setUploadResult(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Leads</h1>
        <p className="text-zinc-400">
          Upload a CSV file with lead data to add to the marketplace.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {['upload', 'mapping', 'industry', 'processing', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : ['upload', 'mapping', 'industry', 'processing', 'complete'].indexOf(step) > i
                  ? 'bg-green-600 text-white'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {['upload', 'mapping', 'industry', 'processing', 'complete'].indexOf(step) > i ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 4 && (
              <div
                className={`h-0.5 w-12 ${
                  ['upload', 'mapping', 'industry', 'processing', 'complete'].indexOf(step) > i
                    ? 'bg-green-600'
                    : 'bg-zinc-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-700 hover:border-zinc-600'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer flex-col items-center"
            >
              {uploading ? (
                <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
              ) : (
                <FileSpreadsheet className="h-12 w-12 text-zinc-500" />
              )}
              <p className="mt-4 text-lg font-medium text-white">
                {uploading ? 'Processing file...' : 'Drop your CSV file here'}
              </p>
              <p className="mt-1 text-sm text-zinc-400">or click to browse</p>
            </label>
          </div>

          <div className="mt-6 rounded-lg bg-zinc-800 p-4">
            <h3 className="font-medium text-white">Required Fields</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-sm text-zinc-400">
              <li>- Email</li>
              <li>- First Name</li>
              <li>- Last Name</li>
              <li>- Company Name</li>
            </ul>
            <h3 className="mt-4 font-medium text-white">Optional Fields</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2 text-sm text-zinc-400">
              <li>- Job Title</li>
              <li>- Phone</li>
              <li>- City, State, Zip</li>
              <li>- Company Size</li>
            </ul>
            <a
              href="/templates/lead-upload-template.csv"
              className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
            >
              <Download className="h-4 w-4" />
              Download template CSV
            </a>
          </div>
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && previewData && (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">Map Your Columns</h3>
                <p className="text-sm text-zinc-400">
                  {previewData.totalRows.toLocaleString()} rows detected in {file?.name}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {fieldMappings.map((mapping, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-lg bg-zinc-800 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {mapping.sourceColumn}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      Sample: {mapping.sample || '(empty)'}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                  <select
                    value={mapping.targetField}
                    onChange={(e) => updateMapping(index, e.target.value)}
                    className="w-48 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {TARGET_FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label} {field.required ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="font-medium text-white">Preview (First 10 rows)</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {previewData.columns.slice(0, 5).map((col, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left font-medium text-zinc-400"
                      >
                        {col}
                      </th>
                    ))}
                    {previewData.columns.length > 5 && (
                      <th className="px-3 py-2 text-left text-zinc-500">
                        +{previewData.columns.length - 5} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      {previewData.columns.slice(0, 5).map((col, j) => (
                        <td key={j} className="px-3 py-2 text-zinc-300">
                          {row[col] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={proceedToIndustry}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step: Industry Selection */}
      {step === 'industry' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="font-medium text-white">Select Industry Category</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Choose the primary industry for these leads. This helps buyers find relevant leads.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => setSelectedIndustry(industry.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedIndustry === industry.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <p className="font-medium text-white">{industry.category_name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="font-medium text-white">Upload Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">File</span>
                <span className="text-white">{file?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Rows</span>
                <span className="text-white">{previewData?.totalRows.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mapped Fields</span>
                <span className="text-white">
                  {fieldMappings.filter((m) => m.targetField !== 'ignore').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Industry</span>
                <span className="text-white">
                  {industries.find((i) => i.id === selectedIndustry)?.category_name || 'Not selected'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('mapping')}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={processUpload}
              disabled={!selectedIndustry || processing}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Start Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
          <p className="mt-4 text-lg font-medium text-white">Processing your upload...</p>
          <p className="mt-1 text-sm text-zinc-400">
            This may take a few moments depending on file size.
          </p>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && uploadResult && (
        <div className="space-y-6">
          <div className="rounded-lg border border-green-800 bg-green-950/20 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div>
                <h3 className="text-lg font-medium text-white">Upload Complete!</h3>
                <p className="text-sm text-zinc-400">
                  Your leads are being processed and verified.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="font-medium text-white">Results</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-zinc-800 p-4">
                <p className="text-sm text-zinc-400">Total Rows</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {uploadResult.totalRows.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-800 p-4">
                <p className="text-sm text-zinc-400">Valid</p>
                <p className="mt-1 text-2xl font-bold text-green-400">
                  {uploadResult.validRows.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-800 p-4">
                <p className="text-sm text-zinc-400">Duplicates</p>
                <p className="mt-1 text-2xl font-bold text-yellow-400">
                  {uploadResult.duplicateRows.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-800 p-4">
                <p className="text-sm text-zinc-400">Invalid</p>
                <p className="mt-1 text-2xl font-bold text-red-400">
                  {uploadResult.invalidRows.toLocaleString()}
                </p>
              </div>
            </div>

            {uploadResult.rejectedRowsUrl && (
              <div className="mt-4">
                <a
                  href={uploadResult.rejectedRowsUrl}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  <Download className="h-4 w-4" />
                  Download rejected rows
                </a>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-800/50 bg-blue-950/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-blue-400" />
              <div>
                <h4 className="font-medium text-blue-300">Email Verification</h4>
                <p className="mt-1 text-sm text-blue-200/70">
                  Valid leads are queued for email verification. This process takes a few hours.
                  Leads will appear in the marketplace once verification completes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <Upload className="h-4 w-4" />
              Upload Another File
            </button>
            <button
              onClick={() => router.push('/partner/uploads')}
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              View Upload History
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
