import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AutoresearchProgram, ProgramStatus } from '@/types/autoresearch'
import { FlaskConical, Play, Pause, TrendingUp, BarChart3 } from 'lucide-react'

const STATUS_BADGE: Record<ProgramStatus, { variant: 'success' | 'warning' | 'muted' | 'default'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  draft: { variant: 'muted', label: 'Draft' },
  completed: { variant: 'default', label: 'Completed' },
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AutoresearchProgramsPage() {
  const supabase = createAdminClient()

  const { data: programs, error } = await supabase
    .from('autoresearch_programs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load autoresearch programs: ${error.message}`)
  }

  const allPrograms = (programs ?? []) as AutoresearchProgram[]

  const totalPrograms = allPrograms.length
  const activePrograms = allPrograms.filter((p) => p.status === 'active').length
  const totalExperiments = allPrograms.reduce((sum, p) => sum + p.total_experiments_run, 0)

  const programsWithRate = allPrograms.filter((p) => p.baseline_positive_reply_rate > 0)
  const avgPRR =
    programsWithRate.length > 0
      ? programsWithRate.reduce((sum, p) => sum + p.baseline_positive_reply_rate, 0) / programsWithRate.length
      : 0

  const stats = [
    { label: 'Total Programs', value: totalPrograms, icon: FlaskConical, color: 'text-foreground' },
    { label: 'Active Programs', value: activePrograms, icon: Play, color: 'text-green-600' },
    { label: 'Total Experiments', value: totalExperiments, icon: BarChart3, color: 'text-blue-600' },
    { label: 'Average PRR', value: formatRate(avgPRR), icon: TrendingUp, color: 'text-purple-600' },
  ]

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Autoresearch Programs</h1>
        <Link
          href="/admin/autoresearch/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          New Program
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} padding="sm">
              <div className="flex items-center gap-3">
                <div className={stat.color}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {allPrograms.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <FlaskConical className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground mb-1">No programs yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first autoresearch program to start optimizing email copy.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Experiments</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Wins</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">PRR</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Updated</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allPrograms.map((program) => {
                  const badge = STATUS_BADGE[program.status]
                  return (
                    <tr key={program.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/autoresearch/${program.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {program.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant} dot size="sm">
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{program.total_experiments_run}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{program.total_wins}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatRate(program.baseline_positive_reply_rate)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(program.updated_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/autoresearch/${program.id}`}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors"
                          >
                            View
                          </Link>
                          {program.status === 'active' ? (
                            <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors">
                              <Pause className="h-3 w-3" />
                              Pause
                            </button>
                          ) : program.status !== 'completed' ? (
                            <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 transition-colors">
                              <Play className="h-3 w-3" />
                              Start
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
