/**
 * Companies API
 * GET /api/crm/companies - List companies with filters
 * POST /api/crm/companies - Create a new company
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { CompanyRepository } from '@/lib/repositories/company.repository'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import type { CompanyStatus } from '@/types/crm.types'

const companyFiltersSchema = z.object({
  status: z.string().optional(),
  industry: z.string().optional(),
  owner_user_id: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional(),
  page_size: z.string().optional(),
})

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  employees_range: z.string().optional(),
  revenue_range: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['Active', 'Prospect', 'Inactive', 'Lost']).default('Prospect'),
  owner_user_id: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const searchParams = request.nextUrl.searchParams
    const params = {
      status: searchParams.get('status') || undefined,
      industry: searchParams.get('industry') || undefined,
      owner_user_id: searchParams.get('owner_user_id') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_direction: searchParams.get('sort_direction') || undefined,
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '100',
    }

    const validated = companyFiltersSchema.parse(params)

    // Parse pagination
    const page = parseInt(validated.page || '1', 10)
    const pageSize = parseInt(validated.page_size || '100', 10)

    // Parse filters
    const filters = {
      status: validated.status ? [validated.status as CompanyStatus] : undefined,
      industry: validated.industry ? [validated.industry] : undefined,
      owner_user_id: validated.owner_user_id ? [validated.owner_user_id] : undefined,
      search: validated.search,
    }

    // Parse sorting
    const sort =
      validated.sort_by && validated.sort_direction
        ? [{ field: validated.sort_by, direction: validated.sort_direction as 'asc' | 'desc' }]
        : undefined

    // 3. Fetch companies with workspace filtering
    const companyRepo = new CompanyRepository()
    const result = await companyRepo.findByWorkspace(user.workspace_id, filters, sort, page, pageSize)

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input with Zod
    const body = await request.json()
    const validated = createCompanySchema.parse(body)

    // 3. Create company
    const companyRepo = new CompanyRepository()
    const company = await companyRepo.create({
      ...validated,
      workspace_id: user.workspace_id,
      created_by_user_id: user.id,
      updated_by_user_id: user.id,
    })

    // 4. Return response
    return NextResponse.json(
      {
        success: true,
        data: company,
      },
      { status: 201 }
    )
  } catch (error: any) {
    return handleApiError(error)
  }
}
