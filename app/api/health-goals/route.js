/**
 * /api/health-goals — CRUD API for the Health Goals Tracker.
 *
 * GET    /api/health-goals          – list all goals + today's progress
 * POST   /api/health-goals          – create a new goal
 * PATCH  /api/health-goals          – update a goal or log daily progress
 * DELETE /api/health-goals?id=...   – soft-delete a goal
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin, runSupabaseQuery } from '@/lib/supabase-admin.js'
import { auth } from '@clerk/nextjs/server'
import {
  toDateString,
  validateGoalInput,
  generateId,
  calculateStreak,
  calculateBestStreak,
  countActiveCategories,
  checkMilestones,
  buildWeekHeatmap,
} from '@/lib/health-goals-data.js'
import { logger } from '@/lib/logger.js'

/* -------------------------------------------------------------------------- */
/*  GET — list goals + progress                                               */
/* -------------------------------------------------------------------------- */

export async function GET(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const url = new URL(request.url)
    const dateParam = url.searchParams.get('date') || toDateString()

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('health_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (goalsError) {
      logger.error('[health-goals] GET goals error', goalsError)
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    // Fetch today's progress logs
    const goalIds = (goals || []).map((g) => g.id)
    let progressLogs = []
    if (goalIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from('health_goal_logs')
        .select('*')
        .eq('user_id', userId)
        .in('goal_id', goalIds)
        .gte('date', dateParam)
        .lte('date', dateParam)

      if (logsError) {
        logger.error('[health-goals] GET logs error', logsError)
      } else {
        progressLogs = logs || []
      }
    }

    // Fetch recent 30 days of logs for streak calculation
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentLogs = goalIds.length > 0
      ? (await supabase
          .from('health_goal_logs')
          .select('date, completed')
          .eq('user_id', userId)
          .in('goal_id', goalIds)
          .gte('date', toDateString(thirtyDaysAgo))
        ).data || []
      : []

    // Aggregate daily completion: a day counts as completed if ANY goal was completed
    const dayMap = new Map()
    for (const log of recentLogs) {
      if (!dayMap.has(log.date)) {
        dayMap.set(log.date, { date: log.date, completed: false })
      }
      if (log.completed) {
        dayMap.get(log.date).completed = true
      }
    }
    const dailyRecords = Array.from(dayMap.values())
    const currentStreak = calculateStreak(dailyRecords)
    const bestStreak = calculateBestStreak(dailyRecords)

    const totalCompletions = recentLogs.filter((l) => l.completed).length
    const activeCategories = countActiveCategories(goals || [])
    const milestones = checkMilestones({ currentStreak, bestStreak, totalCompletions, activeCategories })
    const heatmap = buildWeekHeatmap(dailyRecords, dateParam)

    return NextResponse.json({
      success: true,
      data: {
        goals: goals || [],
        progressLogs,
        stats: {
          currentStreak,
          bestStreak,
          totalCompletions,
          activeCategories,
          milestones,
        },
        heatmap,
      },
    })
  } catch (err) {
    logger.error('[health-goals] GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* -------------------------------------------------------------------------- */
/*  POST — create goal                                                        */
/* -------------------------------------------------------------------------- */

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const errors = validateGoalInput(body)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const goalId = generateId()

    const goalRecord = {
      id: goalId,
      user_id: userId,
      title: body.title.trim(),
      category: body.category,
      frequency: body.frequency,
      target_per_day: body.targetPerDay || 1,
      unit: body.unit || 'times',
      icon: body.icon || '⭐',
      description: body.description || '',
      active: true,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('health_goals')
      .insert(goalRecord)
      .select()
      .single()

    if (error) {
      logger.error('[health-goals] POST insert error', error)
      return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    logger.error('[health-goals] POST error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* -------------------------------------------------------------------------- */
/*  PATCH — update goal or log daily progress                                 */
/* -------------------------------------------------------------------------- */

export async function PATCH(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseAdmin()

    // If goalId + date + completed => log progress
    if (body.goalId && body.date && body.completed !== undefined) {
      const logRecord = {
        user_id: userId,
        goal_id: body.goalId,
        date: body.date,
        completed: body.completed,
        progress: body.progress || 0,
        note: body.note || '',
      }

      const { data, error } = await supabase
        .from('health_goal_logs')
        .upsert(logRecord, { onConflict: 'user_id,goal_id,date' })
        .select()
        .single()

      if (error) {
        logger.error('[health-goals] PATCH log error', error)
        return NextResponse.json({ error: 'Failed to log progress' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }

    // Otherwise update the goal itself
    if (!body.goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 })
    }

    const updates = {}
    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.category !== undefined) updates.category = body.category
    if (body.frequency !== undefined) updates.frequency = body.frequency
    if (body.targetPerDay !== undefined) updates.target_per_day = body.targetPerDay
    if (body.unit !== undefined) updates.unit = body.unit
    if (body.icon !== undefined) updates.icon = body.icon
    if (body.description !== undefined) updates.description = body.description
    if (body.active !== undefined) updates.active = body.active

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('health_goals')
      .update(updates)
      .eq('id', body.goalId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logger.error('[health-goals] PATCH update error', error)
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    logger.error('[health-goals] PATCH error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* -------------------------------------------------------------------------- */
/*  DELETE — soft-delete a goal                                               */
/* -------------------------------------------------------------------------- */

export async function DELETE(request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const goalId = url.searchParams.get('id')

    if (!goalId) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('health_goals')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', goalId)
      .eq('user_id', userId)

    if (error) {
      logger.error('[health-goals] DELETE error', error)
      return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[health-goals] DELETE error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
