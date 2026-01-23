'use client'

/**
 * Interactive Demo Section
 * OpenInfo Platform Marketing Site
 *
 * Interactive product demos that visitors can try.
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/design-system'
import {
  FadeIn,
  AnimatedHeading,
  AnimatedCard,
  AnimatedButton,
} from '../ui/animated-components'

// ============================================
// DEMO SECTION
// ============================================

const demoTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'tasks', label: 'Task Management', icon: TaskIcon },
  { id: 'reports', label: 'Reports', icon: ReportIcon },
  { id: 'ai', label: 'AI Insights', icon: AIIcon },
]

export function DemoSection() {
  const [activeTab, setActiveTab] = React.useState('dashboard')

  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <FadeIn>
            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Live Demo
            </span>
          </FadeIn>
          <AnimatedHeading
            tag="h2"
            className="text-4xl lg:text-5xl font-bold text-neutral-900 mt-4 mb-6"
          >
            See it in action
          </AnimatedHeading>
          <FadeIn delay={0.2}>
            <p className="text-lg text-neutral-600">
              Explore key features of the platform with our interactive demo.
            </p>
          </FadeIn>
        </div>

        {/* Tab Navigation */}
        <FadeIn delay={0.3}>
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-neutral-100 rounded-full p-1">
              {demoTabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </FadeIn>

        {/* Demo Content */}
        <FadeIn delay={0.4}>
          <div className="relative">
            {/* Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-3xl blur-2xl" />

            {/* Demo Container */}
            <div className="relative bg-white rounded-2xl border border-neutral-200/60 shadow-xl overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <DemoDashboard key="dashboard" />
                )}
                {activeTab === 'tasks' && (
                  <DemoTasks key="tasks" />
                )}
                {activeTab === 'reports' && (
                  <DemoReports key="reports" />
                )}
                {activeTab === 'ai' && (
                  <DemoAI key="ai" />
                )}
              </AnimatePresence>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ============================================
// DEMO DASHBOARD
// ============================================

function DemoDashboard() {
  const [metrics, setMetrics] = React.useState([
    { label: 'Tasks Today', value: 12, max: 20 },
    { label: 'Completed', value: 8, max: 12 },
    { label: 'In Progress', value: 3, max: 12 },
    { label: 'Team Active', value: 6, max: 8 },
  ])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-neutral-50 rounded-xl p-4"
          >
            <p className="text-sm text-neutral-500 mb-2">{metric.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-neutral-900">
                {metric.value}
              </span>
              <span className="text-sm text-neutral-400">/{metric.max}</span>
            </div>
            <div className="mt-3 h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(metric.value / metric.max) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                className="h-full bg-neutral-900 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Chart */}
      <div className="bg-neutral-50 rounded-xl p-6">
        <h4 className="font-medium text-neutral-900 mb-4">Weekly Activity</h4>
        <div className="flex items-end justify-between h-40 gap-3">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const height = [60, 80, 45, 90, 70, 30, 55][i]
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                  className="w-full bg-neutral-900 rounded-t-lg"
                />
                <span className="text-xs text-neutral-500">{day}</span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// DEMO TASKS
// ============================================

function DemoTasks() {
  const [tasks, setTasks] = React.useState([
    { id: 1, title: 'Review Q4 marketing strategy', status: 'completed', assignee: 'SC' },
    { id: 2, title: 'Prepare investor presentation', status: 'in_progress', assignee: 'MR' },
    { id: 3, title: 'Update product roadmap', status: 'in_progress', assignee: 'EW' },
    { id: 4, title: 'Schedule team sync meeting', status: 'pending', assignee: 'JP' },
    { id: 5, title: 'Review code submissions', status: 'pending', assignee: 'LT' },
  ])

  const toggleStatus = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const statuses = ['pending', 'in_progress', 'completed']
        const currentIndex = statuses.indexOf(t.status)
        const nextIndex = (currentIndex + 1) % statuses.length
        return { ...t, status: statuses[nextIndex] }
      }
      return t
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-medium text-neutral-900">Today's Tasks</h4>
        <span className="text-sm text-neutral-500">
          {tasks.filter(t => t.status === 'completed').length}/{tasks.length} completed
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => toggleStatus(task.id)}
            className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors"
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                task.status === 'completed'
                  ? 'bg-emerald-500 border-emerald-500'
                  : task.status === 'in_progress'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-neutral-300'
              )}
            >
              {task.status === 'completed' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {task.status === 'in_progress' && (
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </div>
            <span
              className={cn(
                'flex-1 text-sm',
                task.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-700'
              )}
            >
              {task.title}
            </span>
            <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-600">{task.assignee}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-neutral-400 text-center mt-4">
        Click on a task to cycle through statuses
      </p>
    </motion.div>
  )
}

// ============================================
// DEMO REPORTS
// ============================================

function DemoReports() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-medium text-neutral-900">End of Day Report</h4>
        <span className="text-sm text-neutral-500">Generated at 6:00 PM</span>
      </div>

      <div className="bg-neutral-50 rounded-xl p-6 space-y-6">
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h5 className="text-sm font-medium text-neutral-500 mb-2">Summary</h5>
          <p className="text-neutral-700 leading-relaxed">
            Today the team completed 8 tasks, with 3 more currently in progress.
            Task completion rate increased by 15% compared to yesterday.
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h5 className="text-sm font-medium text-neutral-500 mb-3">Key Metrics</h5>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Completion Rate', value: '85%', change: '+15%' },
              { label: 'Avg Time/Task', value: '2.3h', change: '-0.5h' },
              { label: 'Team Velocity', value: '24pts', change: '+3' },
            ].map((metric, i) => (
              <div key={metric.label} className="text-center">
                <p className="text-2xl font-bold text-neutral-900">{metric.value}</p>
                <p className="text-xs text-neutral-500">{metric.label}</p>
                <p className="text-xs text-emerald-600 font-medium">{metric.change}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h5 className="text-sm font-medium text-neutral-500 mb-2">Highlights</h5>
          <ul className="space-y-2">
            {[
              'Marketing strategy review completed ahead of schedule',
              'New team member onboarded successfully',
              'Customer feedback integrated into roadmap',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================
// DEMO AI
// ============================================

function DemoAI() {
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: "I've analyzed your team's productivity patterns this week. Here are my insights:" },
  ])
  const [isTyping, setIsTyping] = React.useState(false)

  const insights = [
    "📊 Task completion peaks on Tuesdays and Wednesdays",
    "⏰ Most productive hours are between 10 AM - 12 PM",
    "🎯 Consider redistributing tasks from Friday to earlier in the week",
    "💡 Team velocity has increased 23% this month",
  ]

  const addInsight = () => {
    if (messages.length < insights.length + 1) {
      setIsTyping(true)
      setTimeout(() => {
        setMessages([...messages, { role: 'assistant', content: insights[messages.length - 1] }])
        setIsTyping(false)
      }, 1000)
    }
  }

  React.useEffect(() => {
    const timer = setInterval(addInsight, 2000)
    return () => clearInterval(timer)
  }, [messages])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 className="font-medium text-neutral-900">AI Assistant</h4>
          <p className="text-xs text-neutral-500">Analyzing your team data...</p>
        </div>
      </div>

      <div className="bg-neutral-50 rounded-xl p-4 min-h-[200px] space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-neutral-700 leading-relaxed"
          >
            {msg.content}
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1"
          >
            <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </motion.div>
        )}
      </div>

      <p className="text-xs text-neutral-400 text-center mt-4">
        AI insights are generated based on your team's real activity
      </p>
    </motion.div>
  )
}

// ============================================
// ICONS
// ============================================

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )
}

function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

export default DemoSection
