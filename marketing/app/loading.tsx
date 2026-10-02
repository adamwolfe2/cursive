/** Route loading state: a calm skeleton on the same pale-blue wash the pages use, announced to assistive tech. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="px-2 py-4 sm:px-4">
      <span className="sr-only">Loading</span>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[#e3eeff] bg-[#f3f8ff]">
        <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-2xl flex-col items-center justify-center gap-4 px-6 py-20" aria-hidden="true">
          <div className="h-4 w-28 animate-pulse rounded-full bg-[#dbe9ff]" />
          <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-[#dbe9ff]" />
          <div className="h-10 w-2/3 max-w-xs animate-pulse rounded-xl bg-[#dbe9ff]" />
          <div className="mt-2 h-4 w-full max-w-sm animate-pulse rounded-full bg-[#e6f0ff]" />
          <div className="h-11 w-44 animate-pulse rounded-xl bg-[#cfe2ff]" />
        </div>
      </div>
    </div>
  )
}
