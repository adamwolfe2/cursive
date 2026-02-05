import Link from 'next/link'

interface SimpleRelatedPost {
  title: string
  description: string
  href: string
}

interface SimpleRelatedPostsProps {
  posts: SimpleRelatedPost[]
}

export function SimpleRelatedPosts({ posts }: SimpleRelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section className="my-12">
      <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link
            key={post.href}
            href={post.href}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all duration-300"
          >
            <h3 className="font-bold mb-2 text-lg">{post.title}</h3>
            <p className="text-sm text-gray-600">{post.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
