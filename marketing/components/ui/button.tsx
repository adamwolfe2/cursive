import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        outline: "border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white",
        ghost: "hover:bg-[var(--muted)]",
      },
      size: {
        default: "px-6 py-3 text-base",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-lg",
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
  href?: string
  target?: string
}

export function Button({
  className,
  variant,
  size,
  href,
  target,
  children,
  ...props
}: ButtonProps) {
  if (href) {
    return (
      <Link
        href={href}
        target={target}
        className={cn(buttonVariants({ variant, size, className }))}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </button>
  )
}
