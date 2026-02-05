'use client'

import { useState } from 'react'
import { Twitter, Linkedin, Facebook, Mail, Link2, Check } from 'lucide-react'
import { generateShareUrls } from '@/lib/blog-utils'

interface SocialShareProps {
  url: string
  title: string
}

export function SocialShare({ url, title }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const shareUrls = generateShareUrls(url, title)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const shareButtons = [
    {
      name: 'Twitter',
      icon: Twitter,
      href: shareUrls.twitter,
      color: 'hover:bg-[#1DA1F2] hover:text-white',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: shareUrls.linkedin,
      color: 'hover:bg-[#0A66C2] hover:text-white',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: shareUrls.facebook,
      color: 'hover:bg-[#1877F2] hover:text-white',
    },
    {
      name: 'Email',
      icon: Mail,
      href: shareUrls.email,
      color: 'hover:bg-gray-700 hover:text-white',
    },
  ]

  return (
    <div className="flex items-center gap-2 print:hidden">
      <span className="text-sm font-medium text-gray-600 mr-2">Share:</span>
      {shareButtons.map((button) => {
        const Icon = button.icon
        return (
          <a
            key={button.name}
            href={button.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-lg border border-gray-200 text-gray-600 transition-all ${button.color}`}
            aria-label={`Share on ${button.name}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        )
      })}
      <button
        onClick={handleCopyLink}
        className={`p-2 rounded-lg border transition-all ${
          copied
            ? 'bg-green-500 text-white border-green-500'
            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  )
}
