'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ClientFile, ClientFileType } from '@/types/onboarding'
import {
  FileText,
  Image,
  File,
  Presentation,
  Table,
  Download,
  FolderOpen,
} from 'lucide-react'

const FILE_TYPE_LABELS: Record<ClientFileType, string> = {
  brand_guidelines: 'Brand Guidelines',
  deck: 'Deck',
  testimonials: 'Testimonials',
  sample_offers: 'Sample Offers',
  examples: 'Examples',
  existing_list: 'Existing List',
  suppression_list: 'Suppression List',
}

const FILE_TYPE_ORDER: ClientFileType[] = [
  'brand_guidelines',
  'deck',
  'testimonials',
  'sample_offers',
  'examples',
  'existing_list',
  'suppression_list',
]

function getMimeIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-4 w-4" />
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
  if (mimeType.includes('presentation') || mimeType.includes('pptx'))
    return <Presentation className="h-4 w-4 text-orange-500" />
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('xlsx'))
    return <Table className="h-4 w-4 text-green-500" />
  if (mimeType.includes('document') || mimeType.includes('docx'))
    return <FileText className="h-4 w-4 text-blue-500" />
  return <File className="h-4 w-4" />
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getDownloadUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return `${supabaseUrl}/storage/v1/object/public/onboarding-files/${storagePath}`
}

interface ClientFilesViewProps {
  files: ClientFile[]
}

export default function ClientFilesView({ files }: ClientFilesViewProps) {
  if (files.length === 0) {
    return (
      <Card padding="default">
        <CardContent className="flex items-center gap-3 py-6">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No files have been uploaded for this client.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group by type
  const grouped = FILE_TYPE_ORDER.reduce<Record<string, ClientFile[]>>((acc, type) => {
    const typeFiles = files.filter((f) => f.file_type === type)
    if (typeFiles.length > 0) {
      acc[type] = typeFiles
    }
    return acc
  }, {})

  // Also gather any files with unrecognized types
  const knownTypes = new Set(FILE_TYPE_ORDER)
  const unknownFiles = files.filter((f) => !knownTypes.has(f.file_type as ClientFileType))
  if (unknownFiles.length > 0) {
    grouped['other'] = unknownFiles
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="muted" size="lg">{files.length} file{files.length !== 1 ? 's' : ''}</Badge>
      </div>

      {Object.entries(grouped).map(([type, typeFiles]) => (
        <Card key={type} padding="default">
          <CardHeader>
            <CardTitle className="text-base">
              {FILE_TYPE_LABELS[type as ClientFileType] ?? 'Other'}
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-2">
            <div className="divide-y divide-border/50">
              {typeFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-muted-foreground shrink-0">
                      {getMimeIcon(file.mime_type)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(file.file_size)}
                        {file.mime_type ? ` - ${file.mime_type}` : ''}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getDownloadUrl(file.storage_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors shrink-0"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
