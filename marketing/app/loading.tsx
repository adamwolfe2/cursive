import { Container } from "@/components/ui/container"

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <Container className="py-20">
        {/* Hero Skeleton */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="h-7 w-40 bg-zinc-100 rounded-full animate-pulse" />
          </div>

          {/* Heading */}
          <div className="space-y-3 mb-6">
            <div className="h-10 w-full max-w-xl mx-auto bg-zinc-100 rounded-lg animate-pulse" />
            <div className="h-10 w-3/4 mx-auto bg-zinc-100 rounded-lg animate-pulse" />
          </div>

          {/* Subtext */}
          <div className="space-y-2 mb-8">
            <div className="h-5 w-full max-w-lg mx-auto bg-zinc-50 rounded animate-pulse" />
            <div className="h-5 w-2/3 mx-auto bg-zinc-50 rounded animate-pulse" />
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4">
            <div className="h-11 w-36 bg-zinc-100 rounded-lg animate-pulse" />
            <div className="h-11 w-36 bg-zinc-50 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Feature Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 p-6"
            >
              {/* Icon */}
              <div className="h-10 w-10 bg-zinc-100 rounded-lg animate-pulse mb-4" />

              {/* Title */}
              <div className="h-5 w-2/3 bg-zinc-100 rounded animate-pulse mb-3" />

              {/* Description lines */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-zinc-50 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-zinc-50 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-zinc-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 w-20 mx-auto bg-zinc-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 mx-auto bg-zinc-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
