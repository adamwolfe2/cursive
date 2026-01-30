// Industry Categories API
// Returns list of industry categories for partner upload wizard

import { NextResponse } from 'next/server'
import { INDUSTRY_CATEGORIES } from '@/lib/constants/industries'

interface IndustryCategory {
  id: string
  category_name: string
  category_slug: string
}

/**
 * GET /api/industries
 * Returns list of all industry categories
 */
export async function GET() {
  try {
    // Convert INDUSTRY_CATEGORIES array to API format
    const categories: IndustryCategory[] = INDUSTRY_CATEGORIES.map((category, index) => ({
      id: (index + 1).toString(),
      category_name: category,
      category_slug: category.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
    }))

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch industries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch industries' },
      { status: 500 }
    )
  }
}
