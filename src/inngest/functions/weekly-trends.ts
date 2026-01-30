// Weekly Trends Update
// Updates topic trends data every week

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'

export const weeklyTrends = inngest.createFunction(
  {
    id: 'weekly-trends',
    name: 'Weekly Trends Update',
    timeout: 300000, // 5 minutes
  },
  { cron: '0 3 * * 0' }, // Every Sunday at 3 AM
  async ({ step, logger }) => {
    // Get week start date
    const weekStart = await step.run('calculate-week-start', async () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek
      const monday = new Date(now.setDate(diff))
      monday.setHours(0, 0, 0, 0)
      return monday.toISOString().split('T')[0]
    })

    logger.info(`Updating trends for week starting: ${weekStart}`)

    // Fetch all topics
    const topics = await step.run('fetch-topics', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('global_topics')
        .select('id, topic, current_volume')

      if (error) {
        throw new Error(`Failed to fetch topics: ${error.message}`)
      }

      return data
    })

    logger.info(`Processing ${topics.length} topics`)

    // Update trends for each topic
    const trendResults = await Promise.all(
      topics.map(async (topic: any) => {
        return await step.run(`update-trend-${topic.id}`, async () => {
          const supabase = await createClient()

          // Get previous week's volume
          const { data: previousTrend } = await supabase
            .from('trends')
            .select('volume')
            .eq('topic_id', topic.id)
            .order('week_start', { ascending: false })
            .limit(1)
            .single()

          const previousVolume = previousTrend?.volume || topic.current_volume
          const currentVolume = topic.current_volume

          // Calculate change
          const changePercent =
            previousVolume > 0
              ? ((currentVolume - previousVolume) / previousVolume) * 100
              : 0

          const trendDirection =
            changePercent > 10 ? 'up' : changePercent < -10 ? 'down' : 'stable'

          // Insert new trend record
          const { error: insertError } = await supabase.from('trends').insert({
            topic_id: topic.id,
            week_start: weekStart,
            volume: currentVolume,
            change_percent: Math.round(changePercent * 10) / 10,
          })

          if (insertError) {
            logger.error(`Failed to insert trend for ${topic.topic}:`, insertError)
            return null
          }

          // Update topic with trend direction
          await supabase
            .from('global_topics')
            .update({ trend_direction: trendDirection })
            .eq('id', topic.id)

          return {
            topic: topic.topic,
            volume: currentVolume,
            change_percent: Math.round(changePercent * 10) / 10,
            trend_direction: trendDirection,
          }
        })
      })
    )

    const successfulUpdates = trendResults.filter((r) => r !== null).length

    logger.info(
      `Weekly trends update complete. ${successfulUpdates}/${topics.length} topics updated`
    )

    return {
      success: true,
      week_start: weekStart,
      topics_processed: topics.length,
      successful_updates: successfulUpdates,
    }
  }
)
