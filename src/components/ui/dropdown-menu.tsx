'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface DropdownMenuContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(
  undefined
)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu provider')
  }
  return context
}

interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

export function DropdownMenuTrigger({
  children,
  className,
}: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen, triggerRef } = useDropdownMenu()

  return (
    <button
      ref={triggerRef}
      type="button"
      className={className}
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {children}
    </button>
  )
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
}: DropdownMenuContentProps) {
  const { isOpen, setIsOpen, triggerRef } = useDropdownMenu()
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, setIsOpen, triggerRef])

  if (!isOpen) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-dropdown mt-2 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-enterprise-md animate-slide-in-from-top',
        align === 'start' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'end' && 'right-0',
        className
      )}
      role="menu"
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled,
  destructive,
}: DropdownMenuItemProps) {
  const { setIsOpen } = useDropdownMenu()

  const handleClick = () => {
    if (!disabled) {
      onClick?.()
      setIsOpen(false)
    }
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors',
        destructive
          ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
          : 'focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-border', className)} role="separator" />
}

interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}>
      {children}
    </div>
  )
}
