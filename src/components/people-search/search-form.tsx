'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { peopleSearchSchema, type PeopleSearchFormData } from '@/lib/validation/schemas'
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormCheckbox,
} from '@/components/ui/form'

interface SearchFormProps {
  onSearch: (data: PeopleSearchFormData) => void
  loading: boolean
}

const SENIORITY_LEVELS = [
  'Entry Level',
  'Manager',
  'Director',
  'VP',
  'C-Level',
  'Executive',
]

const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Product',
  'Operations',
  'Finance',
  'HR',
  'Customer Success',
]

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [saveSearch, setSaveSearch] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<PeopleSearchFormData>({
    resolver: zodResolver(peopleSearchSchema),
    mode: 'onBlur',
  })

  const onSubmit = (data: PeopleSearchFormData) => {
    onSearch(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-[15px] font-medium text-zinc-900 mb-4">
          Search Filters
        </h3>

        {/* Company Domain */}
        <div className="space-y-4">
          <FormField error={errors.domain}>
            <FormLabel
              htmlFor="domain"
              required
              hint="Enter the company's website domain to find employees"
            >
              Company Domain
            </FormLabel>
            <FormInput
              id="domain"
              type="text"
              placeholder="e.g., acme.com"
              disabled={loading}
              error={errors.domain}
              {...register('domain')}
            />
          </FormField>

          {/* Company Name (Alternative) */}
          <FormField error={errors.company}>
            <FormLabel
              htmlFor="company"
              optional
              hint="If you don't know the domain, enter the company name"
            >
              Or Company Name
            </FormLabel>
            <FormInput
              id="company"
              type="text"
              placeholder="e.g., Acme Corporation"
              disabled={loading}
              error={errors.company}
              {...register('company')}
            />
          </FormField>

          {/* Job Title */}
          <FormField error={errors.job_title}>
            <FormLabel htmlFor="job_title" optional>
              Job Title
            </FormLabel>
            <FormInput
              id="job_title"
              type="text"
              placeholder="e.g., VP of Engineering"
              disabled={loading}
              error={errors.job_title}
              {...register('job_title')}
            />
          </FormField>

          {/* Seniority Level */}
          <FormField error={errors.seniority}>
            <FormLabel htmlFor="seniority" optional>
              Seniority Level
            </FormLabel>
            <FormSelect
              id="seniority"
              disabled={loading}
              error={errors.seniority}
              {...register('seniority')}
            >
              <option value="">All Levels</option>
              {SENIORITY_LEVELS.map((level) => (
                <option key={level} value={level.toLowerCase()}>
                  {level}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {/* Department */}
          <FormField error={errors.department}>
            <FormLabel htmlFor="department" optional>
              Department
            </FormLabel>
            <FormSelect
              id="department"
              disabled={loading}
              error={errors.department}
              {...register('department')}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept.toLowerCase()}>
                  {dept}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {/* Location */}
          <FormField error={errors.location}>
            <FormLabel htmlFor="location" optional>
              Location
            </FormLabel>
            <FormInput
              id="location"
              type="text"
              placeholder="e.g., San Francisco, CA"
              disabled={loading}
              error={errors.location}
              {...register('location')}
            />
          </FormField>
        </div>
      </div>

      {/* Save Search */}
      <div className="border-t border-zinc-200 pt-4">
        <FormCheckbox
          id="save_search"
          label="Save this search"
          checked={saveSearch}
          onChange={(e) => setSaveSearch(e.target.checked)}
          disabled={loading}
        />

        {saveSearch && (
          <FormField error={errors.search_name} className="mt-3">
            <FormInput
              type="text"
              placeholder="Search name..."
              disabled={loading}
              error={errors.search_name}
              {...register('search_name')}
            />
          </FormField>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          type="submit"
          disabled={loading || !isValid}
          className="flex-1 min-h-[44px] h-11 sm:h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search People'}
        </button>
        <button
          type="button"
          onClick={() => {
            reset()
            setSaveSearch(false)
          }}
          disabled={loading}
          className="min-h-[44px] h-11 sm:h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-zinc-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-[13px] font-medium text-zinc-900">
              How it works
            </h4>
            <div className="mt-2 text-[13px] text-zinc-600">
              <ul className="list-disc space-y-1 pl-5">
                <li>Enter a company domain to find employees</li>
                <li>Apply filters to narrow down results</li>
                <li>Email addresses are hidden until revealed</li>
                <li>Each email reveal costs 1 credit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
