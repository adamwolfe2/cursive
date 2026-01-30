/**
 * Contacts API
 * GET /api/crm/contacts - List contacts with filters
 * POST /api/crm/contacts - Create a new contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ContactRepository } from '@/lib/repositories/contact.repository'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import type { ContactStatus, SeniorityLevel } from '@/types/crm.types'

const contactFiltersSchema = z.object({
  status: z.string().optional(),
  company_id: z.string().uuid().optional(),
  seniority_level: z.string().optional(),
  owner_user_id: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional(),
  page_size: z.string().optional(),
})

const createContactSchema = z.object({
  company_id: z.string().uuid().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['Active', 'Prospect', 'Inactive', 'Lost']).default('Prospect'),
  owner_user_id: z.string().uuid().optional(),
  seniority_level: z
    .enum(['C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor'])
    .optional(),
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
      company_id: searchParams.get('company_id') || undefined,
      seniority_level: searchParams.get('seniority_level') || undefined,
      owner_user_id: searchParams.get('owner_user_id') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_direction: searchParams.get('sort_direction') || undefined,
      page: searchParams.get('page') || '1',
      page_size: searchParams.get('page_size') || '100',
    }

    const validated = contactFiltersSchema.parse(params)

    // Parse pagination
    const page = parseInt(validated.page || '1', 10)
    const pageSize = parseInt(validated.page_size || '100', 10)

    // Parse filters
    const filters = {
      status: validated.status ? [validated.status as ContactStatus] : undefined,
      company_id: validated.company_id ? [validated.company_id] : undefined,
      seniority_level: validated.seniority_level
        ? [validated.seniority_level as SeniorityLevel]
        : undefined,
      owner_user_id: validated.owner_user_id ? [validated.owner_user_id] : undefined,
      search: validated.search,
    }

    // Parse sorting
    const sort =
      validated.sort_by && validated.sort_direction
        ? [{ field: validated.sort_by, direction: validated.sort_direction as 'asc' | 'desc' }]
        : undefined

    // 3. Fetch contacts with workspace filtering
    const contactRepo = new ContactRepository()
    const result = await contactRepo.findByWorkspace(user.workspace_id, filters, sort, page, pageSize)

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
    const validated = createContactSchema.parse(body)

    // 3. Create contact
    const contactRepo = new ContactRepository()
    const contact = await contactRepo.create({
      ...validated,
      workspace_id: user.workspace_id,
      created_by_user_id: user.id,
      updated_by_user_id: user.id,
    })

    // 4. Return response
    return NextResponse.json(
      {
        success: true,
        data: contact,
      },
      { status: 201 }
    )
  } catch (error: any) {
    return handleApiError(error)
  }
}
