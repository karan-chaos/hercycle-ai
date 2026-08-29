import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin.js'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger.js'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true })

    if (error) {
      logger.error('[cycle-stats] GET error', error)
      return NextResponse.json({ error: 'Failed to fetch cycles' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err) {
    logger.error('[cycle-stats] GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
