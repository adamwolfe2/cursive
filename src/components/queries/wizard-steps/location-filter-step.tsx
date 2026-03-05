'use client'

import { useState } from 'react'
import type { QueryFilters } from '@/types'

interface LocationFilterStepProps {
  filters: QueryFilters
  onUpdate: (filters: QueryFilters) => void
  onNext: () => void
  onBack: () => void
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Australia', 'Japan', 'India', 'Brazil', 'Mexico', 'China',
  'Netherlands', 'Sweden', 'Spain', 'Italy', 'Switzerland'
]

export function LocationFilterStep({
  filters,
  onUpdate,
  onNext,
  onBack,
}: LocationFilterStepProps) {
  const [country, setCountry] = useState(filters.location?.country || '')
  const [state, setState] = useState(filters.location?.state || '')
  const [city, setCity] = useState(filters.location?.city || '')

  const handleNext = () => {
    const location =
      country || state || city
        ? {
            country: country || undefined,
            state: state || undefined,
            city: city || undefined,
          }
        : null

    onUpdate({
      ...filters,
      location,
    })
    onNext()
  }

  const handleSkip = () => {
    onUpdate({
      ...filters,
      location: null,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[17px] font-medium text-zinc-900">
          Filter by Location (Optional)
        </h2>
        <p className="mt-1 text-[13px] text-zinc-600">
          Narrow down companies by their geographic location
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="country"
            className="block text-[13px] font-medium text-zinc-700 mb-2"
          >
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full h-10 px-3 text-[13px] text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="state"
            className="block text-[13px] font-medium text-zinc-700 mb-2"
          >
            State/Province
          </label>
          {country === 'United States' ? (
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full h-10 px-3 text-[13px] text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            >
              <option value="">Select a state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., California, Ontario"
              className="w-full h-10 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
            />
          )}
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-[13px] font-medium text-zinc-700 mb-2"
          >
            City
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., San Francisco"
            className="w-full h-10 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200 transition-all duration-150"
          />
        </div>
      </div>

      {/* Current Selection */}
      {(country || state || city) && (
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4">
          <p className="text-[12px] font-medium text-zinc-700 mb-2">
            Current Selection
          </p>
          <p className="text-[13px] text-zinc-900">
            {[city, state, country].filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-zinc-200">
        <button
          type="button"
          onClick={onBack}
          className="h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150"
        >
          Back
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleSkip}
            className="h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="h-9 px-6 text-[13px] font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-all duration-150"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
