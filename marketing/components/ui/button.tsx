"use client"

import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { trackCTAClick } from "@/lib/analytics"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-[#007AFF] text-white hover:bg-[#0066DD]",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        ghost: "text-gray-700 hover:bg-gray-100",
        link: "text-[#007AFF] hover:underline",
      },
      size: {
        default: "px-6 py-2.5 text-base rounded-lg",
        sm: "px-4 py-2 text-sm rounded-lg",
        lg: "px-8 py-3 text-base rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  href?: string
  target?: string
  rel?: string
  trackingLabel?: string // Optional: custom label for analytics
  trackingLocation?: string // Optional: where the button is located
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  href,
  target,
  rel,
  children,
  trackingLabel,
  trackingLocation,
  onClick,
  ...props
}: ButtonProps) {
  // Handle click with analytics tracking
  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    // Track CTA click if tracking params are provided
    if (trackingLabel && trackingLocation) {
      trackCTAClick(trackingLabel, trackingLocation)
    }

    // Call original onClick if provided
    if (onClick && 'currentTarget' in e) {
      onClick(e as React.MouseEvent<HTMLButtonElement>)
    }
  }

  if (href) {
    const isExternal = target === "_blank"
    return (
      <Link
        href={href}
        target={target}
        rel={isExternal ? "noopener noreferrer" : rel}
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}
