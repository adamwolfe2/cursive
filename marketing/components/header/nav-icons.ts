import { BookOpen, Coins, Eye, FileText, LayoutDashboard, Plug, Send, Sparkles, type LucideIcon } from "lucide-react"
import type { NavIconName } from "./nav-config"

export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  sparkles: Sparkles,
  coins: Coins,
  send: Send,
  layout: LayoutDashboard,
  eye: Eye,
  book: BookOpen,
  file: FileText,
  plug: Plug,
  info: BookOpen,
}

/** Visible keyboard focus for every interactive element in the site chrome. */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
