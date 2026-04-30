export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-gray-100 p-5 mb-6 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
      </div>
      <div className="h-6 w-72 bg-gray-200 rounded animate-pulse mb-3" />
      <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mb-2" />
      <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
    </div>
  )
}
