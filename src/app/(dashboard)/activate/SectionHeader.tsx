'use client'

export function SectionHeader({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {sub && <p className="text-sm text-gray-500 ml-8">{sub}</p>}
    </div>
  )
}
