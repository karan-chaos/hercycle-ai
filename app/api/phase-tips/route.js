import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin.js'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger.js'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdmin()

    // Fetch latest cycles
    const { data: cycles, error: cErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .limit(6)

    if (cErr) {
      logger.error('[phase-tips] cycles error', cErr)
      return NextResponse.json({ error: 'Failed to fetch cycles' }, { status: 500 })
    }

    // Fetch recent journal entries (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: journals, error: jErr } = await supabase
      .from('symptom_journal')
      .select('date, symptoms, mood')
      .eq('user_id', userId)
      .gte('date', cutoff)
      .order('date', { ascending: false })

    if (jErr) {
      logger.error('[phase-tips] journal error', jErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        cycles: cycles || [],
        journals: journals || [],
      },
    })
  } catch (err) {
    logger.error('[phase-tips] GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
