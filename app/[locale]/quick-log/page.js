'use client'

import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import QuickLogCard from '@/components/quick-log/QuickLogCard.jsx'
import { logStreak, coverage, topSymptom, avgWellness, dayLabel, wellnessScore, QUICK_SYMPTOMS, MOOD_OPTIONS } from '@/lib/quick-log.js'
import fetchWithTimeout from '@/lib/fetch-with-timeout'

const symptomLookup = Object.fromEntries(QUICK_SYMPTOMS.map((s) => [s.key, s]))
const moodLookup = Object.fromEntries(MOOD_OPTIONS.map((m) => [m.key, m]))

function StatTile({ emoji, value, label }) {
  return (
    <div className="ql-stat">
      <span className="ql-stat__emoji">{emoji}</span>
      <span className="ql-stat__value">{value}</span>
      <span className="ql-stat__label">{label}</span>
    </div>
  )
}

export default function QuickLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchWithTimeout('/api/quick-log')
      const json = await res.json()
      if (json.success) setLogs(json.data)
      else setError(json.error)
    } catch {
      setError('Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (form) => {
    try {
      const res = await fetchWithTimeout('/api/quick-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) await fetchData()
      else alert(json.error || 'Failed to save')
    } catch {
      alert('Network error')
    }
  }

  const handleDelete = async (date) => {
    if (!confirm(`Delete log for ${date}?`)) return
    try {
      const res = await fetchWithTimeout(`/api/quick-log?date=${date}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) await fetchData()
    } catch {
      alert('Failed to delete')
    }
  }

  const todayLog = logs.find((l) => l.date === today)
  const streak = logStreak(logs)
  const recent30 = coverage(logs, 30)
  const top = topSymptom(logs.slice(0, 30))
  const avg = avgWellness(logs.slice(0, 30))
  const recentEntries = logs.slice(0, 14)

  return (
    <div className="page">
      <Navbar />
      <main className="ql-page">
        <header className="ql-page__header">
          <h1 className="ql-page__title">⚡ Quick Log</h1>
          <p className="ql-page__subtitle">
            {loading ? 'Loading...' : `Log your day in 30 seconds · ${logs.length} total entries`}
          </p>
        </header>

        {error && (
          <div className="ql-page__error">
            <span>{error}</span>
            <button onClick={fetchData}>Retry</button>
          </div>
        )}

        {!loading && (
          <>
            {/* Stats row */}
            <div className="ql-stats">
              <StatTile emoji="🔥" value={streak} label="day streak" />
              <StatTile emoji="📊" value={`${recent30}/30`} label="this month" />
              <StatTile emoji="💪" value={avg} label="avg wellness" />
              {top && <StatTile emoji={symptomLookup[top]?.emoji || '•'} value={symptomLookup[top]?.label || top} label="top symptom" />}
            </div>

            {/* Quick log card */}
            <QuickLogCard onSave={handleSave} existingEntry={todayLog} />

            {/* Recent entries */}
            <section className="ql-recent">
              <h2 className="ql-recent__title">Recent Entries</h2>
              {recentEntries.length === 0 ? (
                <p className="ql-recent__empty">No entries yet. Start logging above!</p>
              ) : (
                <div className="ql-recent__list">
                  {recentEntries.map((entry) => {
                    const score = wellnessScore(entry)
                    const moodInfo = moodLookup[entry.mood]
                    return (
                      <div key={entry.date} className="ql-recent__entry">
                        <div className="ql-recent__entry-left">
                          <span className="ql-recent__day">{dayLabel(entry.date)}</span>
                          <span className="ql-recent__mood">
                            {moodInfo ? `${moodInfo.emoji} ${moodInfo.label}` : '—'}
                          </span>
                          {entry.symptoms?.length > 0 && (
                            <span className="ql-recent__symp-count">
                              {entry.symptoms.length} symptom{entry.symptoms.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="ql-recent__entry-right">
                          <span className={`ql-recent__score ${score >= 60 ? 'good' : score >= 40 ? 'mid' : 'low'}`}>
                            {score}
                          </span>
                          <button
                            className="ql-recent__delete"
                            onClick={() => handleDelete(entry.date)}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
