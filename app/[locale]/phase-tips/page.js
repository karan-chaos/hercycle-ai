'use client'

import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import {
  getPhaseTips,
  getPhaseSummary,
  phaseTimeline,
  TIP_CATEGORIES,
  getTipCategoryInfo,
} from '@/lib/phase-tips.js'
import { calculateCyclePhase, getLatestCycle } from '@/lib/calculateCyclePhase.js'
import fetchWithTimeout from '@/lib/fetch-with-timeout'

function Skeleton() {
  return (
    <div className="pt-skeleton">
      {[0, 1, 2].map((i) => (
        <div key={i} className="pt-skeleton__card"><div className="pt-skeleton__line" /><div className="pt-skeleton__line pt-skeleton__line--short" /></div>
      ))}
    </div>
  )
}

export default function PhaseTipsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchWithTimeout('/api/phase-tips')
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error)
    } catch {
      setError('Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Derive phase from cycle data
  const latestCycle = getLatestCycle(data?.cycles || [])
  const periodStart = latestCycle?.start_date || latestCycle?.period_start || null
  const cycleLength = latestCycle?.cycle_length || 28
  const periodLength = latestCycle?.end_date && periodStart
    ? Math.max(1, Math.round((new Date(latestCycle.end_date) - new Date(periodStart)) / 86400000) + 1)
    : 5

  const phaseInfo = calculateCyclePhase({ periodStart, cycleLength, periodLength })
  const phaseKey = phaseInfo.phaseKey || 'luteal'
  const tips = getPhaseTips(phaseKey, phaseInfo.cycleDay || 1)
  const summary = getPhaseSummary(phaseKey)
  const timeline = phaseTimeline(phaseInfo)

  const filteredTips = activeCategory === 'all' ? tips : tips.filter((t) => t.category === activeCategory)

  return (
    <div className="page">
      <Navbar />
      <main className="pt-page">
        <header className="pt-page__header">
          <h1 className="pt-page__title">🌿 Phase Tips</h1>
          <p className="pt-page__subtitle">
            {loading ? 'Loading...' : phaseInfo.hasData ? `Day ${phaseInfo.cycleDay} of your cycle` : 'Log your cycle to see personalised tips'}
          </p>
        </header>

        {error && (
          <div className="pt-page__error">
            <span>{error}</span>
            <button onClick={fetchData}>Retry</button>
          </div>
        )}

        {loading && <Skeleton />}

        {!loading && (
          <>
            {/* Phase summary card */}
            <div className="pt-phase-card" style={{ borderLeftColor: summary.accent }}>
              <span className="pt-phase-card__eyebrow">{summary.eyebrow}</span>
              <h2 className="pt-phase-card__title">{summary.title}</h2>
              <p className="pt-phase-card__overview">{summary.overview}</p>
            </div>

            {/* Visual timeline */}
            {timeline.length > 0 && (
              <div className="pt-timeline">
                {timeline.map((seg) => (
                  <div key={seg.key} className={`pt-timeline__seg ${seg.active ? 'active' : ''}`}>
                    <div className="pt-timeline__bar">
                      <div className="pt-timeline__fill" style={{ width: `${seg.active ? seg.progress : seg.active ? 100 : 0}%` }} />
                    </div>
                    <span className="pt-timeline__label">{seg.label}</span>
                    {seg.active && <span className="pt-timeline__day">Day {phaseInfo.cycleDay}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Category filter */}
            <div className="pt-filters">
              <button className={`pt-filter ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
              {Object.values(TIP_CATEGORIES).map((cat) => (
                <button
                  key={cat.key}
                  className={`pt-filter ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Tips list */}
            <section className="pt-tips">
              {filteredTips.length === 0 ? (
                <p className="pt-tips__empty">No tips for this category. Try "All".</p>
              ) : (
                filteredTips.map((tip, i) => {
                  const cat = getTipCategoryInfo(tip.category)
                  return (
                    <div key={i} className="pt-tip" style={{ borderLeftColor: cat.color }}>
                      <span className="pt-tip__icon">{cat.icon}</span>
                      <p className="pt-tip__text">{tip.text}</p>
                    </div>
                  )
                })
              )}
            </section>

            {/* Phase-specific symptoms */}
            <div className="pt-symptoms-card">
              <h3 className="pt-symptoms-card__title">🔍 Common in this phase</h3>
              <div className="pt-symptoms-card__list">
                {getPhaseSymptoms(phaseKey).map((s, i) => (
                  <span key={i} className="pt-symptoms-card__chip">{s}</span>
                ))}
              </div>
            </div>

            {/* Phase self-care */}
            <div className="pt-care-card">
              <h3 className="pt-care-card__title">🌿 Self-Care This Phase</h3>
              <ul className="pt-care-card__list">
                {getPhaseCare(phaseKey).map((c, i) => (
                  <li key={i} className="pt-care-card__item">{c}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

import { CYCLE_PHASES } from '@/lib/cyclePhaseContent.js'

function getPhaseSymptoms(phaseKey) {
  return CYCLE_PHASES[phaseKey]?.symptoms || []
}

function getPhaseCare(phaseKey) {
  return CYCLE_PHASES[phaseKey]?.selfCare || []
}
