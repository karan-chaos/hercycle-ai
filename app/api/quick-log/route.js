import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin.js'
import { auth } from '@clerk/nextjs/server'
import { validateQuickLog } from '@/lib/quick-log.js'
import { logger } from '@/lib/logger.js'

export async function GET(request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('symptom_journal')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(60)

    if (error) {
      logger.error('[quick-log] GET error', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err) {
    logger.error('[quick-log] GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const errors = validateQuickLog(body)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const record = {
      user_id: userId,
      date: body.date,
      mood: body.mood || null,
      flow: body.flow || null,
      symptoms: body.symptoms || [],
      notes: body.notes || '',
      energy: body.energy || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('symptom_journal')
      .upsert(record, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) {
      logger.error('[quick-log] POST error', error)
      return NextResponse.json({ error: 'Failed to save log' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    logger.error('[quick-log] POST error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('symptom_journal')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)

    if (error) {
      logger.error('[quick-log] DELETE error', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[quick-log] DELETE error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
