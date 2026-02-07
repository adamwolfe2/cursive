'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

// Dynamically import TrendChart (uses recharts) only when modal is opened
const TrendChart = dynamic(() => import('./trend-chart').then(mod => ({ default: mod.TrendChart })), {
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="text-sm text-gray-500">Loading chart...</div>
    </div>
  ),
  ssr: false,
})

interface TopicCardProps {
  topic: {
    id: string
    topic: string
    category: string
    current_volume: number
    trend_direction: 'up' | 'down' | 'stable'
    change_percent?: number
  }
  onTrackTopic?: (topicId: string, topicName: string) => void
}

export function TopicCard({ topic, onTrackTopic }: TopicCardProps) {
  const [showChart, setShowChart] = useState(false)
  const [chartData, setChartData] = useState<any>(null)
  const [loadingChart, setLoadingChart] = useState(false)

  const handleShowChart = async () => {
    setShowChart(true)

    if (!chartData) {
      setLoadingChart(true)
      try {
        const response = await fetch(`/api/trends/${topic.id}`)
        const data = await response.json()
        if (data.success) {
          setChartData(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error)
      } finally {
        setLoadingChart(false)
      }
    }
  }

  const getTrendIcon = () => {
    switch (topic.trend_direction) {
      case 'up':
        return (
          <svg
            className="h-5 w-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        )
      case 'down':
        return (
          <svg
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          </svg>
        )
      default:
        return (
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14"
            />
          </svg>
        )
    }
  }

  const getTrendColor = () => {
    switch (topic.trend_direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {topic.topic}
            </h3>
            <p className="mt-1 text-sm text-gray-500 capitalize">
              {topic.category}
            </p>
          </div>
          {getTrendIcon()}
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {topic.current_volume.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Search volume</p>
          </div>
          {topic.change_percent !== undefined && (
            <div className={`text-right ${getTrendColor()}`}>
              <p className="text-lg font-semibold">
                {topic.change_percent > 0 ? '+' : ''}
                {topic.change_percent.toFixed(1)}%
              </p>
              <p className="text-xs">vs last week</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleShowChart}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Chart
          </button>
          {onTrackTopic && (
            <button
              onClick={() => onTrackTopic(topic.id, topic.topic)}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Track This Topic
            </button>
          )}
        </div>
      </div>

      {/* Chart Modal */}
      <Transition.Root show={showChart} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowChart}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <Dialog.Title
                          as="h3"
                          className="text-xl font-semibold text-gray-900"
                        >
                          {topic.topic}
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-gray-500 capitalize">
                          {topic.category}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowChart(false)}
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Close</span>
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-6">
                      {loadingChart ? (
                        <div className="flex h-64 items-center justify-center">
                          <div className="text-sm text-gray-500">
                            Loading chart...
                          </div>
                        </div>
                      ) : chartData ? (
                        <TrendChart
                          data={chartData.trends}
                          topicName={topic.topic}
                        />
                      ) : (
                        <div className="flex h-64 items-center justify-center">
                          <div className="text-sm text-gray-500">
                            No data available
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowChart(false)}
                      className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
