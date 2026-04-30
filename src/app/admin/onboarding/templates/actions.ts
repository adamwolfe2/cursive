'use server'

import { revalidatePath } from 'next/cache'
import { OnboardingTemplateRepository } from '@/lib/repositories/onboarding-template.repository'
import type { OnboardingTemplateInsert, TemplateCategory } from '@/types/onboarding-templates'

export async function createTemplate(
  input: OnboardingTemplateInsert
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const repo = new OnboardingTemplateRepository()
    const template = await repo.create(input)
    revalidatePath('/admin/onboarding/templates')
    return { success: true, id: template.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updateTemplate(
  id: string,
  updates: Partial<OnboardingTemplateInsert>
): Promise<{ success: boolean; error?: string }> {
  try {
    const repo = new OnboardingTemplateRepository()
    await repo.update(id, updates)
    revalidatePath('/admin/onboarding/templates')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const repo = new OnboardingTemplateRepository()
    await repo.delete(id)
    revalidatePath('/admin/onboarding/templates')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function createTemplateFromClient(
  clientId: string,
  name: string,
  description: string,
  category: TemplateCategory
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const repo = new OnboardingTemplateRepository()
    const template = await repo.createFromClient(clientId, name, description, category)
    revalidatePath('/admin/onboarding/templates')
    return { success: true, id: template.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
