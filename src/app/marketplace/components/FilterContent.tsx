'use client'

import { Dispatch, SetStateAction } from 'react'
import type { MarketplaceFilters } from '@/lib/hooks/use-marketplace-leads'

type Filters = MarketplaceFilters
type ArrayFilterKey = 'industries' | 'states' | 'companySizes' | 'seniorityLevels'

export const FILTER_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Professional Services',
  'Construction',
  'Education',
  'Transportation',
]

export const FILTER_STATES = [
  'CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
  'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI',
]

export const FILTER_COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
]

export const FILTER_SENIORITY_LEVELS = [
  { value: 'c_suite', label: 'C-Suite' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'ic', label: 'Individual Contributor' },
]

interface FilterContentProps {
  filters: Filters
  toggleFilter: (category: ArrayFilterKey, value: string) => void
  setFilters: Dispatch<SetStateAction<Filters>>
  clearFilters: () => void
  variant?: 'desktop' | 'mobile'
}

/**
 * Shared filter content for both the desktop sidebar and the mobile sheet drawer.
 * Pass variant="mobile" for larger tap targets and text sizes suitable for touch.
 */
export function FilterContent({
  filters,
  toggleFilter,
  setFilters,
  clearFilters,
  variant = 'desktop',
}: FilterContentProps) {
  const isMobile = variant === 'mobile'

  // Conditional class helpers
  const legendCls = isMobile
    ? 'text-[13px] font-medium text-zinc-900 mb-3'
    : 'text-[12px] font-medium text-zinc-700 mb-2'
  const checkboxCls = `${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500`
  const labelTextCls = isMobile ? 'text-[14px] text-zinc-700' : 'text-[12px] text-zinc-600'
  const labelGapCls = isMobile ? 'gap-3' : 'gap-2'
  const industryMaxHCls = isMobile ? 'max-h-60' : 'max-h-40'
  const fieldsetMbCls = isMobile ? '' : 'mb-4'
  const listSpacingCls = isMobile ? 'space-y-2' : 'space-y-1'

  return (
    <div className={isMobile ? 'space-y-4' : ''}>
      {/* Header row */}
      {isMobile ? (
        <div className="flex items-center justify-between">
          <button
            onClick={clearFilters}
            className="text-[13px] text-zinc-500 hover:text-zinc-700"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-zinc-900">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-[12px] text-zinc-500 hover:text-zinc-700"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Industry */}
      <fieldset className={fieldsetMbCls}>
        <legend className={legendCls}>Industry</legend>
        <div className={`${listSpacingCls} ${industryMaxHCls} overflow-y-auto`} role="group" aria-label="Industry filters">
          {FILTER_INDUSTRIES.map((industry) => (
            <label key={industry} className={`flex items-center ${labelGapCls} cursor-pointer`}>
              <input
                type="checkbox"
                checked={filters.industries.includes(industry)}
                onChange={() => toggleFilter('industries', industry)}
                className={checkboxCls}
                aria-label={`Filter by ${industry} industry`}
              />
              <span className={labelTextCls}>{industry}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* State */}
      <fieldset className={fieldsetMbCls}>
        <legend className={legendCls}>State</legend>
        <div
          className={`grid gap-2 ${isMobile ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}
          role="group"
          aria-label="State filters"
        >
          {FILTER_STATES.slice(0, 10).map((state) => (
            <button
              key={state}
              onClick={() => toggleFilter('states', state)}
              className={`flex items-center justify-center rounded ${
                isMobile
                  ? 'h-11 min-w-[44px] px-3 text-[12px] font-medium'
                  : 'h-11 min-w-[44px] lg:h-auto lg:px-2 lg:py-1 px-3 text-[11px]'
              } ${
                filters.states.includes(state)
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
              aria-label={`Filter by ${state} state`}
              aria-pressed={filters.states.includes(state)}
            >
              {state}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Company Size */}
      <fieldset className={fieldsetMbCls}>
        <legend className={legendCls}>Company Size</legend>
        <div className={listSpacingCls} role="group" aria-label="Company size filters">
          {FILTER_COMPANY_SIZES.map((size) => (
            <label key={size} className={`flex items-center ${labelGapCls} cursor-pointer`}>
              <input
                type="checkbox"
                checked={filters.companySizes.includes(size)}
                onChange={() => toggleFilter('companySizes', size)}
                className={checkboxCls}
                aria-label={`Filter by company size ${size} employees`}
              />
              <span className={labelTextCls}>{size} employees</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Seniority */}
      <fieldset className={fieldsetMbCls}>
        <legend className={legendCls}>Seniority</legend>
        <div className={listSpacingCls} role="group" aria-label="Seniority level filters">
          {FILTER_SENIORITY_LEVELS.map((level) => (
            <label key={level.value} className={`flex items-center ${labelGapCls} cursor-pointer`}>
              <input
                type="checkbox"
                checked={filters.seniorityLevels.includes(level.value)}
                onChange={() => toggleFilter('seniorityLevels', level.value)}
                className={checkboxCls}
                aria-label={`Filter by ${level.label} seniority level`}
              />
              <span className={labelTextCls}>{level.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Contact Quality */}
      <fieldset className={fieldsetMbCls}>
        <legend className={legendCls}>Contact Quality</legend>
        <div className={listSpacingCls} role="group" aria-label="Contact quality filters">
          <label className={`flex items-center ${labelGapCls} cursor-pointer`}>
            <input
              type="checkbox"
              checked={!!filters.hasVerifiedEmail}
              onChange={() => setFilters((prev) => ({ ...prev, hasVerifiedEmail: !prev.hasVerifiedEmail }))}
              className={checkboxCls}
              aria-label="Filter by verified email only"
            />
            <span className={labelTextCls}>Verified email only</span>
          </label>
          <label className={`flex items-center ${labelGapCls} cursor-pointer`}>
            <input
              type="checkbox"
              checked={!!filters.hasPhone}
              onChange={() => setFilters((prev) => ({ ...prev, hasPhone: !prev.hasPhone }))}
              className={checkboxCls}
              aria-label="Filter by has phone number"
            />
            <span className={labelTextCls}>Has phone number</span>
          </label>
        </div>
      </fieldset>

      {/* Intent Score */}
      <fieldset className={fieldsetMbCls}>
        <legend className={legendCls}>Minimum Intent Score</legend>
        <div
          className={isMobile ? 'grid grid-cols-3 gap-2' : 'flex gap-2'}
          role="group"
          aria-label="Intent score filters"
        >
          {[0, 40, 70].map((score) => (
            <button
              key={score}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  intentScoreMin: prev.intentScoreMin === score ? undefined : score,
                }))
              }
              className={`rounded ${
                isMobile ? 'h-11 px-3 text-[13px] font-medium' : 'flex-1 px-2 py-1.5 text-[11px]'
              } ${
                filters.intentScoreMin === score
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
              aria-label={`Filter by intent score ${score === 0 ? 'all levels' : score === 40 ? 'warm and above' : 'hot only'}`}
              aria-pressed={filters.intentScoreMin === score}
            >
              {score === 0 ? 'All' : score === 40 ? 'Warm+' : 'Hot'}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Freshness */}
      <fieldset>
        <legend className={legendCls}>Minimum Freshness</legend>
        <div
          className={isMobile ? 'grid grid-cols-3 gap-2' : 'flex gap-2'}
          role="group"
          aria-label="Freshness filters"
        >
          {[0, 40, 70].map((score) => (
            <button
              key={score}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  freshnessMin: prev.freshnessMin === score ? undefined : score,
                }))
              }
              className={`rounded ${
                isMobile ? 'h-11 px-3 text-[13px] font-medium' : 'flex-1 px-2 py-1.5 text-[11px]'
              } ${
                filters.freshnessMin === score
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
              aria-label={`Filter by freshness ${score === 0 ? 'all levels' : score === 40 ? 'recent and above' : 'fresh only'}`}
              aria-pressed={filters.freshnessMin === score}
            >
              {score === 0 ? 'All' : score === 40 ? 'Recent+' : 'Fresh'}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
