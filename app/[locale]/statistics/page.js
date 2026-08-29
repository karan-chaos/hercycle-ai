'use client'

import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  extractCycleLengths, extractPeriodLengths, computeStats,
  regularityScore, predictNextPeriod, cycleExtremes, cycleTrend,
  cycleLengthChart, periodLengthChart, flagIrregularities,
} from '@/lib/cycle-stats.js'
import fetchWithTimeout from '@/lib/fetch-with-timeout'

function StatTile({ emoji, value, label }) {
  return (
    <div className="cs-stat">
      <span className="cs-stat__emoji">{emoji}</span>
      <span className="cs-stat__value">{value}</span>
      <span className="cs-stat__label">{label}</span>
    </div>
  )
}

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="cs-tooltip">
      <p className="cs-tooltip__label">{label}</p>
      {payload.map((e, i) => <p key={i} style={{ color: e.color }}>{e.name}: {e.value}</p>)}
    </div>
  )
}

function Skeleton() {
  return <div className="cs-skeleton"><div className="cs-skeleton__line" /><div className="cs-skeleton__line cs-skeleton__line--short" /></div>
}

export default function StatisticsPage() {
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchWithTimeout('/api/cycle-stats')
      const json = await res.json()
      if (json.success) setCycles(json.data)
      else setError(json.error)
    } catch {
      setError('Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const cycleLengths = extractCycleLengths(cycles)
  const periodLengths = extractPeriodLengths(cycles)
  const cycleStats = computeStats(cycleLengths.map((c) => c.length))
  const periodStats = computeStats(periodLengths.map((p) => p.duration))
  const regularity = regularityScore(cycleLengths)
  const prediction = predictNextPeriod(cycles)
  const extremes = cycleExtremes(cycleLengths)
  const trend = cycleTrend(cycleLengths)
  const flags = flagIrregularities(cycleLengths, periodLengths)
  const clChart = cycleLengthChart(cycleLengths)
  const plChart = periodLengthChart(periodLengths)

  const trendEmoji = { lengthening: '📈', shortening: '📉', stable: '➡️', insufficient: '❓' }

  return (
    <div className="page">
      <Navbar />
      <main className="cs-page">
        <header className="cs-page__header">
          <h1 className="cs-page__title">📊 Cycle Statistics</h1>
          <p className="cs-page__subtitle">
            {loading ? 'Loading...' : `${cycles.length} cycles recorded · Analysis based on ${cycleStats.count} intervals`}
          </p>
        </header>

        {error && <div className="cs-page__error"><span>{error}</span><button onClick={fetchData}>Retry</button></div>}
        {loading && <Skeleton />}

        {!loading && cycles.length < 2 && (
          <div className="cs-empty">
            <span className="cs-empty__icon">📊</span>
            <p>Need at least 2 cycles for statistics.</p>
            <p className="cs-empty__hint">Log your period start and end dates on the Track page to build your history.</p>
          </div>
        )}

        {!loading && cycles.length >= 2 && (
          <>
            {/* Key stats */}
            <div className="cs-stats">
              <StatTile emoji="📏" value={cycleStats.mean} label="avg cycle (days)" />
              <StatTile emoji="🩸" value={periodStats.mean} label="avg period (days)" />
              <StatTile emoji="🎯" value={regularity.score} label={regularity.label} />
              <StatTile emoji={trendEmoji[trend.direction]} value={trend.direction} label="trend" />
            </div>

            {/* Regularity detail */}
            <div className="cs-card">
              <h3 className="cs-card__title">🎯 Regularity Score</h3>
              <div className="cs-gauge">
                <div className="cs-gauge__fill" style={{ width: `${regularity.score}%` }} />
              </div>
              <p className="cs-card__detail">{regularity.detail}</p>
            </div>

            {/* Prediction */}
            {prediction && (
              <div className="cs-card cs-card--accent">
                <h3 className="cs-card__title">🔮 Next Period Prediction</h3>
                <div className="cs-prediction">
                  <span className="cs-prediction__date">{prediction.predictedDate}</span>
                  <span className="cs-prediction__confidence">{prediction.confidence} confidence · Based on {prediction.basedOnCycles} cycles</span>
                </div>
              </div>
            )}

            {/* Extremes */}
            {extremes && (
              <div className="cs-card">
                <h3 className="cs-card__title">📏 Cycle Range</h3>
                <div className="cs-extremes">
                  <span className="cs-extremes__item">Shortest: <strong>{extremes.shortest.length} days</strong> ({extremes.shortest.from})</span>
                  <span className="cs-extremes__item">Longest: <strong>{extremes.longest.length} days</strong> ({extremes.longest.from})</span>
                  <span className="cs-extremes__item">Range: <strong>{extremes.range} days</strong></span>
                </div>
              </div>
            )}

            {/* Cycle length chart */}
            {clChart.length > 0 && (
              <div className="cs-card">
                <h3 className="cs-card__title">📏 Cycle Length Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={clChart} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,.5)', fontSize: 10 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(255,255,255,.5)', fontSize: 10 }} />
                    <Tooltip content={<TooltipBox />} />
                    <ReferenceLine y={cycleStats.mean} stroke="#c084fc" strokeDasharray="4 4" label={{ value: 'avg', fill: '#c084fc', fontSize: 10 }} />
                    <Line type="monotone" dataKey="length" name="Cycle Length" stroke="#f472b6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Period length chart */}
            {plChart.length > 0 && (
              <div className="cs-card">
                <h3 className="cs-card__title">🩸 Period Duration Over Time</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={plChart} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,.5)', fontSize: 10 }} />
                    <YAxis domain={[0, 'auto']} tick={{ fill: 'rgba(255,255,255,.5)', fontSize: 10 }} />
                    <Tooltip content={<TooltipBox />} />
                    <Bar dataKey="days" name="Period Days" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Flags */}
            {flags.length > 0 && (
              <div className="cs-card cs-card--flags">
                <h3 className="cs-card__title">⚠️ Notes</h3>
                {flags.map((f, i) => (
                  <div key={i} className={`cs-flag cs-flag--${f.severity}`}>
                    <span className="cs-flag__type">{f.type}</span>
                    <p className="cs-flag__text">{f.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Detailed stats */}
            <div className="cs-card">
              <h3 className="cs-card__title">📋 Detailed Stats</h3>
              <div className="cs-detail-grid">
                <div className="cs-detail"><span>Cycle Mean</span><strong>{cycleStats.mean} days</strong></div>
                <div className="cs-detail"><span>Cycle Median</span><strong>{cycleStats.median} days</strong></div>
                <div className="cs-detail"><span>Cycle Std Dev</span><strong>{cycleStats.stdDev} days</strong></div>
                <div className="cs-detail"><span>Cycle Range</span><strong>{cycleStats.min}–{cycleStats.max} days</strong></div>
                <div className="cs-detail"><span>Period Mean</span><strong>{periodStats.mean} days</strong></div>
                <div className="cs-detail"><span>Period Median</span><strong>{periodStats.median} days</strong></div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
