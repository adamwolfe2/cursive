import Image from 'next/image'
import Link from 'next/link'
import { Twitter, Linkedin, Globe } from 'lucide-react'

interface AuthorBoxProps {
  author: {
    name: string
    role: string
    avatar: string
    bio: string
    social?: {
      twitter?: string
      linkedin?: string
      website?: string
    }
  }
}

export function AuthorBox({ author }: AuthorBoxProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 print:bg-white print:border print:border-gray-300">
      <div className="flex items-start gap-4">
        <Image
          src={author.avatar}
          alt={`${author.name} profile picture`}
          width={80}
          height={80}
          className="rounded-full"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{author.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{author.role}</p>
          <p className="text-sm text-gray-700 mb-3">{author.bio}</p>

          {author.social && (
            <div className="flex gap-3 print:hidden">
              {author.social.twitter && (
                <Link
                  href={author.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#007AFF] transition-colors"
                  aria-label={`${author.name} on Twitter`}
                >
                  <Twitter className="h-5 w-5" />
                </Link>
              )}
              {author.social.linkedin && (
                <Link
                  href={author.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#007AFF] transition-colors"
                  aria-label={`${author.name} on LinkedIn`}
                >
                  <Linkedin className="h-5 w-5" />
                </Link>
              )}
              {author.social.website && (
                <Link
                  href={author.social.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#007AFF] transition-colors"
                  aria-label={`${author.name}'s website`}
                >
                  <Globe className="h-5 w-5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
