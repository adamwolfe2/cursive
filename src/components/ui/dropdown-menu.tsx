'use client'

import * as React from 'react'
import { cn } from '@/lib/design-system'

interface DropdownMenuContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
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
        'relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-3 sm:py-2 text-sm outline-none transition-colors touch-manipulation',
        destructive
          ? 'text-destructive focus:bg-destructive/10 focus:text-destructive active:bg-destructive/10'
          : 'focus:bg-accent focus:text-accent-foreground active:bg-accent',
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

interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

// Sub-menu components for nested dropdown menus
export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <div className="relative">{children}</div>
}

export function DropdownMenuSubTrigger({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none transition-colors focus:bg-accent',
        className
      )}
    >
      {children}
      <svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

export function DropdownMenuSubContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute left-full top-0 z-dropdown min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-enterprise-md',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuCheckboxItem({
  children,
  checked = false,
  onCheckedChange,
  className,
  disabled = false,
}: DropdownMenuCheckboxItemProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-3 sm:py-2 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground active:bg-accent',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
    >
      <span className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
        {checked && (
          <svg
            className="h-3 w-3 fill-current"
            viewBox="0 0 12 12"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        )}
      </span>
      {children}
    </button>
  )
}
