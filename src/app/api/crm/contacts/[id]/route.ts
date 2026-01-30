/**
 * Contact API
 * GET /api/crm/contacts/[id] - Get a specific contact
 * PUT /api/crm/contacts/[id] - Update a contact
 * DELETE /api/crm/contacts/[id] - Delete a contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { ContactRepository } from '@/lib/repositories/contact.repository'
import { handleApiError, unauthorized, notFound } from '@/lib/utils/api-error-handler'
import { z } from 'zod'

const updateContactSchema = z.object({
  company_id: z.string().uuid().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['Active', 'Prospect', 'Inactive', 'Lost']).optional(),
  owner_user_id: z.string().uuid().optional(),
  seniority_level: z
    .enum(['C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor'])
    .optional(),
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

    // 2. Get contact ID from params
    const { id } = await params

    // 3. Fetch contact with workspace filtering
    const contactRepo = new ContactRepository()
    const contact = await contactRepo.findById(id, user.workspace_id)

    if (!contact) {
      return notFound('Contact not found')
    }

    // 4. Return response
    return NextResponse.json({
      success: true,
      data: contact,
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

    // 2. Get contact ID from params
    const { id } = await params

    // 3. Validate input with Zod
    const body = await request.json()
    const validated = updateContactSchema.parse(body)

    // 4. Update contact
    const contactRepo = new ContactRepository()
    const contact = await contactRepo.update(id, user.workspace_id, {
      ...validated,
      updated_by_user_id: user.id,
    })

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: contact,
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

    // 2. Get contact ID from params
    const { id } = await params

    // 3. Delete contact
    const contactRepo = new ContactRepository()
    await contactRepo.delete(id, user.workspace_id)

    // 4. Return response
    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
