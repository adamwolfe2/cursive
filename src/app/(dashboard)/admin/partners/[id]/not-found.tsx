import Link from 'next/link'
import { FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PartnerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <FileX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Partner Not Found</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        This partner account doesn&apos;t exist or you don&apos;t have permission to view it.
      </p>
      <Button asChild>
        <Link href="/admin/partners">Back to Partners</Link>
      </Button>
    </div>
  )
}
