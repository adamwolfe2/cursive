/**
 * Company API
 * GET /api/crm/companies/[id] - Get a specific company
 * PUT /api/crm/companies/[id] - Update a company
 * DELETE /api/crm/companies/[id] - Delete a company
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { CompanyRepository } from '@/lib/repositories/company.repository'
import { handleApiError, unauthorized, notFound } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
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
  status: z.enum(['Active', 'Prospect', 'Inactive', 'Lost']).optional(),
  owner_user_id: z.string().uuid().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get company ID from params
    const { id } = await params

    // 3. Fetch company with workspace filtering
    const companyRepo = new CompanyRepository()
    const company = await companyRepo.findById(id, user.workspace_id)

    if (!company) {
      return notFound('Company not found')
    }

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: company,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get company ID from params
    const { id } = await params

    // 3. Validate input with Zod
    const body = await request.json()
    const validated = updateCompanySchema.parse(body)

    // 4. Update company
    const companyRepo = new CompanyRepository()
    const company = await companyRepo.update(id, user.workspace_id, {
      ...validated,
      updated_by_user_id: user.id,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: company,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Get company ID from params
    const { id } = await params

    // 3. Delete company
    const companyRepo = new CompanyRepository()
    await companyRepo.delete(id, user.workspace_id)

    // 4. Return response
    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
