import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogPostLayout } from '@/components/blog/blog-post-layout'
import { getPostBySlug, getRelatedPosts } from '@/lib/blog-content-loader'

interface PageProps {
  params: {
    category: string
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.category, params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const pageUrl = `https://www.meetcursive.com/blog/${params.category}/${params.slug}`

  return {
    title: `${post.title} | Cursive Blog`,
    description: post.description,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.description,
      url: pageUrl,
      siteName: 'Cursive',
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.imageAlt,
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
      creator: '@meetcursive',
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.category, params.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(params.category, params.slug)

  return <BlogPostLayout post={post} relatedPosts={relatedPosts} />
}

