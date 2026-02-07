'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { TrendingUp, MoreHorizontal } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts'
import { useTheme } from 'next-themes'

type ChartType = 'line' | 'area' | 'bar'
type Period = '7d' | '30d' | '90d' | '12m'

interface ChartDataPoint {
  label: string
  value: number
  fullDate?: string
}

interface LeadGrowthChartProps {
  data?: ChartDataPoint[]
  title?: string
  isLoading?: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: ChartDataPoint
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white border border-blue-100 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground">
          {data.payload.fullDate || data.payload.label}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-sm bg-gradient-cursive bg-clip-text text-transparent">
            {data.value} leads
          </span>
        </div>
      </div>
    )
  }
  return null
}

export function LeadGrowthChart({
  data = [],
  title = 'Lead Growth',
  isLoading = false,
}: LeadGrowthChartProps) {
  const { theme } = useTheme()
  const [chartType, setChartType] = useState<ChartType>('area')
  const [showGrid, setShowGrid] = useState(true)
  const [smoothCurve, setSmoothCurve] = useState(true)

  const axisColor = theme === 'dark' ? '#525866' : '#868c98'
  const gridColor = theme === 'dark' ? '#27272a' : '#e2e4e9'

  const resetToDefault = () => {
    setChartType('area')
    setShowGrid(true)
    setSmoothCurve(true)
  }

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-sm flex-1">
        <div className="flex flex-row items-center justify-between py-5 px-5">
          <div className="flex items-center gap-2">
            <div className="shimmer-cursive h-8 w-8 rounded" />
            <div className="shimmer-cursive h-5 w-32 rounded" />
          </div>
          <div className="shimmer-cursive h-8 w-8 rounded" />
        </div>
        <div className="px-5 pb-5">
          <div className="shimmer-cursive h-[200px] sm:h-[250px] w-full rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-sm flex-1">
      <div className="flex flex-row items-center justify-between py-5 px-5">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8 border-blue-200">
            <TrendingUp className="size-4 text-blue-600" />
          </Button>
          <h3 className="font-medium text-sm sm:text-base bg-gradient-cursive bg-clip-text text-transparent">
            {title}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Chart Type</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setChartType('line')}>
                  Line Chart {chartType === 'line' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType('area')}>
                  Area Chart {chartType === 'area' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType('bar')}>
                  Bar Chart {chartType === 'bar' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={setShowGrid}
            >
              Show Grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={smoothCurve}
              onCheckedChange={setSmoothCurve}
              disabled={chartType === 'bar'}
            >
              Smooth Curve
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetToDefault}>
              Reset to Default
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="px-5 pb-5">
        <div className="h-[200px] sm:h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={data}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                {showGrid && (
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                )}
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisColor }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: axisColor }}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient
                    id="leadBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#007aff" />
                    <stop offset="100%" stopColor="#66b0ff" />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="value"
                  fill="url(#leadBarGradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : chartType === 'area' ? (
              <AreaChart
                data={data}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                {showGrid && (
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                )}
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisColor }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: axisColor }}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient
                    id="leadAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#007aff" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#007aff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type={smoothCurve ? 'monotone' : 'linear'}
                  dataKey="value"
                  stroke="#007aff"
                  strokeWidth={2}
                  fill="url(#leadAreaGradient)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#007aff',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={data}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                {showGrid && (
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                )}
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisColor }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: axisColor }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type={smoothCurve ? 'monotone' : 'linear'}
                  dataKey="value"
                  stroke="#007aff"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#007aff',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
