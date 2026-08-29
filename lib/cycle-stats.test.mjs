import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractCycleLengths,
  extractPeriodLengths,
  computeStats,
  regularityScore,
  predictNextPeriod,
  cycleExtremes,
  cycleTrend,
  cycleLengthChart,
  periodLengthChart,
  flagIrregularities,
} from './cycle-stats.js'

const mockCycles = [
  { start_date: '2026-01-01', end_date: '2026-01-05', cycle_length: 28 },
  { start_date: '2026-01-29', end_date: '2026-02-02', cycle_length: 29 },
  { start_date: '2026-02-27', end_date: '2026-03-02', cycle_length: 28 },
  { start_date: '2026-03-27', end_date: '2026-03-31', cycle_length: 28 },
  { start_date: '2026-04-24', end_date: '2026-04-28', cycle_length: 28 },
  { start_date: '2026-05-22', end_date: '2026-05-26', cycle_length: 28 },
]

describe('extractCycleLengths', () => {
  it('returns lengths from consecutive starts', () => {
    const lengths = extractCycleLengths(mockCycles)
    assert.ok(lengths.length >= 4)
    assert.ok(lengths.every((l) => l.length > 15 && l.length < 90))
  })
  it('returns empty for < 2 cycles', () => assert.deepEqual(extractCycleLengths([]), []))
  it('filters out extreme outliers', () => {
    const cycles = [
      { start_date: '2026-01-01' },
      { start_date: '2026-01-05' }, // 4 days — outlier
      { start_date: '2026-02-02' },
    ]
    const lengths = extractCycleLengths(cycles)
    assert.ok(lengths.every((l) => l.length > 15))
  })
})

describe('extractPeriodLengths', () => {
  it('extracts durations from start/end', () => {
    const periods = extractPeriodLengths(mockCycles)
    assert.ok(periods.length >= 4)
    assert.ok(periods.every((p) => p.duration >= 1 && p.duration <= 15))
  })
  it('returns empty for no cycles', () => assert.deepEqual(extractPeriodLengths([]), []))
})

describe('computeStats', () => {
  it('computes correct stats', () => {
    const s = computeStats([28, 28, 29, 28])
    assert.equal(s.count, 4)
    assert.ok(s.mean >= 28 && s.mean <= 29)
    assert.equal(s.min, 28)
    assert.equal(s.max, 29)
  })
  it('returns zeros for empty', () => {
    const s = computeStats([])
    assert.equal(s.count, 0)
    assert.equal(s.mean, 0)
  })
})

describe('regularityScore', () => {
  it('returns high score for regular cycles', () => {
    const r = regularityScore(extractCycleLengths(mockCycles))
    assert.ok(r.score >= 60)
    assert.ok(r.label)
  })
  it('returns 0 for insufficient data', () => {
    const r = regularityScore([])
    assert.equal(r.score, 0)
    assert.equal(r.label, 'Insufficient Data')
  })
  it('returns low score for very irregular', () => {
    const irregular = [
      { length: 22 }, { length: 45 }, { length: 28 }, { length: 38 }, { length: 25 },
    ]
    const r = regularityScore(irregular)
    assert.ok(r.score <= 50)
  })
})

describe('predictNextPeriod', () => {
  it('predicts a future date', () => {
    const p = predictNextPeriod(mockCycles)
    assert.ok(p)
    assert.ok(p.predictedDate)
    assert.ok(p.confidence)
    assert.ok(p.basedOnCycles >= 4)
  })
  it('returns null for no cycles', () => assert.equal(predictNextPeriod([]), null))
})

describe('cycleExtremes', () => {
  it('finds shortest and longest', () => {
    const e = cycleExtremes(extractCycleLengths(mockCycles))
    assert.ok(e)
    assert.ok(e.shortest.length <= e.longest.length)
    assert.equal(e.range, e.longest.length - e.shortest.length)
  })
  it('returns null for empty', () => assert.equal(cycleExtremes([]), null))
})

describe('cycleTrend', () => {
  it('detects stable trend', () => {
    const t = cycleTrend(extractCycleLengths(mockCycles))
    assert.ok(t.direction)
  })
  it('detects lengthening trend', () => {
    const cycles = [
      { length: 25 }, { length: 26 }, { length: 27 }, { length: 28 },
      { length: 30 }, { length: 33 }, { length: 36 }, { length: 38 },
    ]
    const t = cycleTrend(cycles)
    assert.equal(t.direction, 'lengthening')
  })
  it('detects shortening trend', () => {
    const cycles = [
      { length: 38 }, { length: 36 }, { length: 33 }, { length: 30 },
      { length: 28 }, { length: 27 }, { length: 26 }, { length: 25 },
    ]
    const t = cycleTrend(cycles)
    assert.equal(t.direction, 'shortening')
  })
  it('returns insufficient for < 4', () => {
    const t = cycleTrend([{ length: 28 }, { length: 29 }])
    assert.equal(t.direction, 'insufficient')
  })
})

describe('cycleLengthChart / periodLengthChart', () => {
  it('builds chart data', () => {
    const cl = extractCycleLengths(mockCycles)
    const chart = cycleLengthChart(cl)
    assert.ok(chart.length > 0)
    assert.ok(chart[0].name && chart[0].length)
  })
  it('builds period chart', () => {
    const pl = extractPeriodLengths(mockCycles)
    const chart = periodLengthChart(pl)
    assert.ok(chart.length > 0)
    assert.ok(chart[0].name && chart[0].days)
  })
})

describe('flagIrregularities', () => {
  it('flags long periods', () => {
    const periods = [{ duration: 10 }, { duration: 11 }, { duration: 9 }]
    const flags = flagIrregularities(mockCycles.map((c) => ({ length: c.cycle_length || 28 })), periods)
    assert.ok(flags.some((f) => f.type.includes('Long Periods')))
  })
  it('no flags for normal data', () => {
    const flags = flagIrregularities(
      extractCycleLengths(mockCycles),
      extractPeriodLengths(mockCycles)
    )
    assert.ok(Array.isArray(flags))
  })
})
