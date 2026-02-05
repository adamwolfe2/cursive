import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface RelatedPost {
  title: string
  description: string
  category: string
  slug: string
  image: string
  imageAlt: string
  publishedAt: string
}

interface RelatedPostsProps {
  posts: RelatedPost[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section className="my-12 print:hidden">
      <h2 className="text-3xl font-semibold text-gray-900 mb-6">
        Related Articles
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.category}/${post.slug}`}
            className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[#007AFF] uppercase tracking-wide">
                  {post.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#007AFF] transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {post.description}
              </p>
              <div className="flex items-center text-sm text-[#007AFF] font-medium">
                Read more
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
