/**
 * Header navigation data. Plain module (no React) so it can be unit-tested and shared by the desktop and mobile menus.
 * Structure follows the pivot spec: Products = Find them / Reach them / Run it, plus the Visitor Pixel add-on.
 */
import { BOOKING_URL, startUrl } from "../../lib/cta"

export type NavIconName = "sparkles" | "coins" | "send" | "layout" | "eye" | "book" | "file" | "plug" | "info"

export interface NavItem {
  href: string
  label: string
  description: string
  icon: NavIconName
  external?: boolean
}

export interface NavGroup {
  /** Small heading above the group, e.g. "Find them". */
  title: string
  items: NavItem[]
}

export interface NavLink {
  label: string
  href?: string
  /** Grouped dropdown (Products). */
  groups?: NavGroup[]
  /** Full-width row under the groups (the Visitor Pixel add-on). */
  footer?: NavItem
}

export const PRODUCT_GROUPS: NavGroup[] = [
  {
    title: "Find them",
    items: [
      {
        href: startUrl("nav-products"),
        label: "25 free leads",
        description: "Paste your website, get 25 buyers with checked work emails",
        icon: "sparkles",
      },
      {
        href: "/pricing",
        label: "Lead credits and plans",
        description: "Credits from $49, Starter at $197 a month",
        icon: "coins",
      },
    ],
  },
  {
    title: "Reach them",
    items: [
      {
        href: "/#rung-reach",
        label: "Done-for-you outreach",
        description: "We run LinkedIn and email to your list, from $1,497 a month",
        icon: "send",
      },
    ],
  },
  {
    title: "Run it",
    items: [
      {
        href: "/#rung-run",
        label: "Operating system",
        description: "One dashboard for leads, replies, visitors and CRM",
        icon: "layout",
      },
    ],
  },
]

/** Shown under the three groups in the Products menu. */
export const PRODUCT_ADDON: NavItem = {
  href: "/pixel",
  label: "Visitor Pixel",
  description: "Add-on, $97 a month. See which companies visit your site",
  icon: "eye",
}

export const RESOURCE_ITEMS: NavItem[] = [
  { href: "/blog", label: "Blog", description: "Guides and playbooks for finding and reaching buyers", icon: "file" },
  { href: "/integrations", label: "Integrations", description: "Connect the tools you already use", icon: "plug" },
  { href: "/about", label: "About Cursive", description: "Who builds Cursive and why", icon: "info" },
]

export const NAV_LINKS: NavLink[] = [
  { label: "Products", groups: PRODUCT_GROUPS, footer: PRODUCT_ADDON },
  { href: "/pricing", label: "Pricing" },
  { label: "Resources", groups: [{ title: "Learn", items: RESOURCE_ITEMS }] },
]

export const BOOK_CALL = { href: BOOKING_URL, label: "Book a call" }
