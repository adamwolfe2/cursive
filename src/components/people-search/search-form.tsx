'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const searchFormSchema = z.object({
  domain: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  seniority: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  save_search: z.boolean().optional(),
  search_name: z.string().optional(),
})

type SearchFormData = z.infer<typeof searchFormSchema>

interface SearchFormProps {
  onSearch: (data: SearchFormData) => void
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
    formState: { errors },
    reset,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
  })

  const onSubmit = (data: SearchFormData) => {
    onSearch({
      ...data,
      save_search: saveSearch,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-[15px] font-medium text-zinc-900 mb-4">
          Search Filters
        </h3>

        {/* Company Domain */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="domain"
              className="block text-[13px] font-medium text-zinc-700 mb-2"
            >
              Company Domain <span className="text-red-600">*</span>
            </label>
            <input
              id="domain"
              type="text"
              {...register('domain')}
              placeholder="e.g., acme.com"
              className="w-full h-9 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            />
            {errors.domain && (
              <p className="mt-1 text-[13px] text-red-600">{errors.domain.message}</p>
            )}
            <p className="mt-1 text-[12px] text-zinc-500">
              Enter the company&apos;s website domain to find employees
            </p>
          </div>

          {/* Company Name (Alternative) */}
          <div>
            <label
              htmlFor="company"
              className="block text-[13px] font-medium text-zinc-700 mb-2"
            >
              Or Company Name
            </label>
            <input
              id="company"
              type="text"
              {...register('company')}
              placeholder="e.g., Acme Corporation"
              className="w-full h-9 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            />
            <p className="mt-1 text-[12px] text-zinc-500">
              If you don&apos;t know the domain, enter the company name
            </p>
          </div>

          {/* Job Title */}
          <div>
            <label
              htmlFor="job_title"
              className="block text-[13px] font-medium text-zinc-700 mb-2"
            >
              Job Title
            </label>
            <input
              id="job_title"
              type="text"
              {...register('job_title')}
              placeholder="e.g., VP of Engineering"
              className="w-full h-9 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            />
          </div>

          {/* Seniority Level */}
          <div>
            <label
              htmlFor="seniority"
              className="block text-[13px] font-medium text-zinc-700 mb-2"
            >
              Seniority Level
            </label>
            <select
              id="seniority"
              {...register('seniority')}
              className="w-full h-9 px-3 text-[13px] text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            >
              <option value="">All Levels</option>
              {SENIORITY_LEVELS.map((level) => (
                <option key={level} value={level.toLowerCase()}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label
              htmlFor="department"
              className="block text-[13px] font-medium text-zinc-700 mb-2"
            >
              Department
            </label>
            <select
              id="department"
              {...register('department')}
              className="w-full h-9 px-3 text-[13px] text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept.toLowerCase()}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-[13px] font-medium text-zinc-700 mb-2"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              {...register('location')}
              placeholder="e.g., San Francisco, CA"
              className="w-full h-9 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            />
          </div>
        </div>
      </div>

      {/* Save Search */}
      <div className="border-t border-zinc-200 pt-4">
        <div className="flex items-center">
          <input
            id="save_search"
            type="checkbox"
            checked={saveSearch}
            onChange={(e) => setSaveSearch(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
          />
          <label htmlFor="save_search" className="ml-2 text-[13px] text-zinc-700">
            Save this search
          </label>
        </div>

        {saveSearch && (
          <div className="mt-3">
            <input
              type="text"
              {...register('search_name')}
              placeholder="Search name..."
              className="w-full h-9 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search People'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          disabled={loading}
          className="h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
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
