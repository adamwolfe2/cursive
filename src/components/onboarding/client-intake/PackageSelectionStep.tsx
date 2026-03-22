'use client'

import { useFormContext, useController } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { PACKAGES, PACKAGE_SLUGS } from '@/types/onboarding'
import type { OnboardingFormData, PackageSlug } from '@/types/onboarding'

export function PackageSelectionStep() {
  const { control, formState: { errors } } = useFormContext<OnboardingFormData>()
  const { field } = useController({
    name: 'packages_selected',
    control,
    rules: {
      validate: (v: PackageSlug[]) => v.length > 0 || 'Please select at least one package',
    },
  })

  const selected: PackageSlug[] = field.value ?? []

  const togglePackage = (slug: PackageSlug) => {
    const next = selected.includes(slug)
      ? selected.filter(s => s !== slug)
      : [...selected, slug]
    field.onChange(next)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Select Your Packages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the services you have purchased. This determines which setup sections you will complete.
        </p>
      </div>

      {errors.packages_selected && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errors.packages_selected.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PACKAGE_SLUGS.map((slug) => {
          const pkg = PACKAGES[slug]
          const isSelected = selected.includes(slug)

          return (
            <button
              key={slug}
              type="button"
              onClick={() => togglePackage(slug)}
              className={cn(
                'relative flex flex-col items-start rounded-xl border-2 p-5 text-left transition-all duration-200',
                isSelected
                  ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                  : 'border-border bg-card hover:border-blue-200 hover:shadow-sm'
              )}
            >
              {/* Checkbox indicator */}
              <div
                className={cn(
                  'absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white'
                )}
              >
                {isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <h3 className="pr-8 text-base font-semibold text-[#0F172A]">{pkg.label}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pkg.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
