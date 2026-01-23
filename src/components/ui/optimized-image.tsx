'use client'

/**
 * Optimized Image Component
 * OpenInfo Platform
 *
 * Wraps Next.js Image with loading states, error handling, and defaults.
 */

import * as React from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/design-system'
import { Skeleton } from './skeleton'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallback?: React.ReactNode
  showSkeleton?: boolean
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
}

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback,
  showSkeleton = true,
  aspectRatio,
  rounded = 'none',
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
  }

  if (error) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          aspectRatio && aspectRatioClasses[aspectRatio],
          roundedClasses[rounded],
          className
        )}
      >
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatio && aspectRatioClasses[aspectRatio],
        roundedClasses[rounded]
      )}
    >
      {isLoading && showSkeleton && (
        <Skeleton className="absolute inset-0" />
      )}
      <Image
        src={src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          roundedClasses[rounded],
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        {...props}
      />
    </div>
  )
}

/**
 * Avatar Image - optimized for user avatars
 */
interface AvatarImageProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallbackInitials?: string
  className?: string
}

const avatarSizes = {
  sm: { size: 32, text: 'text-xs' },
  md: { size: 40, text: 'text-sm' },
  lg: { size: 48, text: 'text-base' },
  xl: { size: 64, text: 'text-lg' },
}

export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallbackInitials,
  className,
}: AvatarImageProps) {
  const { size: pixelSize, text } = avatarSizes[size]

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium',
          text,
          className
        )}
        style={{ width: pixelSize, height: pixelSize }}
      >
        {fallbackInitials?.slice(0, 2).toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={pixelSize}
      height={pixelSize}
      rounded="full"
      className={className}
      fallback={
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium',
            text
          )}
          style={{ width: pixelSize, height: pixelSize }}
        >
          {fallbackInitials?.slice(0, 2).toUpperCase() || '?'}
        </div>
      }
    />
  )
}

/**
 * Logo Image - optimized for company logos
 */
interface LogoImageProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
}

export function LogoImage({
  src,
  alt,
  width = 40,
  height = 40,
  className,
}: LogoImageProps) {
  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <svg
          className="h-1/2 w-1/2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      rounded="md"
      className={className}
    />
  )
}

export { OptimizedImage as default }
