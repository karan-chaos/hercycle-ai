/**
 * cycle-stats.js — Pure calculations for cycle statistics, regularity
 * scoring, variation analysis, and predictions. No framework deps.
 */

function toDateString(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000)
}

/**
 * Extract cycle lengths from consecutive start_date pairs.
 * Returns sorted array of { length, from, to }.
 */
export function extractCycleLengths(cycles) {
  if (!cycles || cycles.length < 2) return []
  const sorted = [...cycles]
    .filter((c) => c.start_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const lengths = []
  for (let i = 1; i < sorted.length; i++) {
    const len = daysBetween(sorted[i - 1].start_date, sorted[i].start_date)
    if (len > 15 && len < 90) {
      lengths.push({ length: len, from: sorted[i - 1].start_date, to: sorted[i].start_date })
    }
  }
  return lengths
}

/**
 * Extract period durations from start_date and end_date.
 * Returns sorted array of { duration, start, end }.
 */
export function extractPeriodLengths(cycles) {
  if (!cycles) return []
  return cycles
    .filter((c) => c.start_date && c.end_date)
    .map((c) => {
      const dur = daysBetween(c.start_date, c.end_date) + 1
      return { duration: Math.max(1, Math.min(15, dur)), start: c.start_date, end: c.end_date }
    })
    .filter((p) => p.duration >= 1 && p.duration <= 15)
    .sort((a, b) => a.start.localeCompare(b.start))
}

/**
 * Compute mean, median, min, max, std deviation of an array of numbers.
 */
export function computeStats(numbers) {
  if (!numbers || numbers.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, count: 0 }
  }
  const sorted = [...numbers].sort((a, b) => a - b)
  const count = sorted.length
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = Math.round((sum / count) * 10) / 10
  const median = count % 2 === 0
    ? Math.round(((sorted[count / 2 - 1] + sorted[count / 2]) / 2) * 10) / 10
    : sorted[Math.floor(count / 2)]
  const variance = sorted.reduce((s, n) => s + (n - mean) ** 2, 0) / count
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10

  return { mean, median, min: sorted[0], max: sorted[count - 1], stdDev, count }
}

/**
 * Regularity score: 100 = perfectly regular, 0 = highly irregular.
 * Based on coefficient of variation (CV = stdDev/mean).
 */
export function regularityScore(cycleLengths) {
  const nums = cycleLengths.map((c) => c.length)
  const stats = computeStats(nums)
  if (stats.count < 2) return { score: 0, label: 'Insufficient Data', detail: 'Need at least 2 cycles to calculate regularity.' }

  const cv = stats.stdDev / stats.mean
  let score, label
  if (cv <= 0.05) { score = 95; label = 'Very Regular' }
  else if (cv <= 0.10) { score = 80; label = 'Regular' }
  else if (cv <= 0.15) { score = 60; label = 'Mildly Irregular' }
  else if (cv <= 0.25) { score = 40; label = 'Irregular' }
  else { score = 20; label = 'Highly Irregular' }

  return {
    score,
    label,
    detail: `CV = ${(cv * 100).toFixed(1)}% · σ = ${stats.stdDev} days · μ = ${stats.mean} days`,
  }
}

/**
 * Predict next period start based on average cycle length.
 * Returns { predictedDate, confidence, basedOnCycles }.
 */
export function predictNextPeriod(cycles) {
  const lengths = extractCycleLengths(cycles)
  if (lengths.length === 0) return null

  const sorted = [...cycles].sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''))
  const lastStart = sorted[0]?.start_date
  if (!lastStart) return null

  const stats = computeStats(lengths.map((l) => l.length))
  const predicted = new Date(`${lastStart}T00:00:00`)
  predicted.setDate(predicted.getDate() + Math.round(stats.mean))

  // Confidence based on consistency (fewer cycles = lower confidence)
  let confidence
  if (lengths.length >= 6) confidence = stats.stdDev <= 3 ? 'High' : 'Medium'
  else if (lengths.length >= 3) confidence = 'Medium'
  else confidence = 'Low'

  return {
    predictedDate: toDateString(predicted),
    confidence,
    basedOnCycles: lengths.length,
    avgLength: stats.mean,
  }
}

/**
 * Identify longest and shortest cycles.
 */
export function cycleExtremes(cycleLengths) {
  if (cycleLengths.length === 0) return null
  const sorted = [...cycleLengths].sort((a, b) => a.length - b.length)
  return {
    shortest: sorted[0],
    longest: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1].length - sorted[0].length,
  }
}

/**
 * Trend: is the cycle getting longer, shorter, or stable?
 * Compares first half vs second half average.
 */
export function cycleTrend(cycleLengths) {
  if (cycleLengths.length < 4) return { direction: 'insufficient', detail: 'Need at least 4 cycles for trend analysis.' }
  const nums = cycleLengths.map((c) => c.length)
  const mid = Math.floor(nums.length / 2)
  const firstHalf = nums.slice(0, mid)
  const secondHalf = nums.slice(mid)
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  const diff = Math.round((avgSecond - avgFirst) * 10) / 10

  if (diff > 2) return { direction: 'lengthening', detail: `Cycles are getting ~${Math.abs(diff)} days longer on average.`, diff }
  if (diff < -2) return { direction: 'shortening', detail: `Cycles are getting ~${Math.abs(diff)} days shorter on average.`, diff }
  return { direction: 'stable', detail: 'Cycle length is staying consistent.', diff }
}

/**
 * Build chart data for cycle lengths over time.
 */
export function cycleLengthChart(cycleLengths) {
  return cycleLengths.map((c, i) => ({
    name: `Cycle ${i + 1}`,
    length: c.length,
    from: c.from,
  }))
}

/**
 * Build chart data for period durations over time.
 */
export function periodLengthChart(periodLengths) {
  return periodLengths.map((p, i) => ({
    name: `Period ${i + 1}`,
    days: p.duration,
    start: p.start,
  }))
}

/**
 * Flag potential irregularities worth mentioning.
 */
export function flagIrregularities(cycleLengths, periodLengths) {
  const flags = []
  const cycleStats = computeStats(cycleLengths.map((c) => c.length))

  if (cycleStats.count >= 3 && cycleStats.stdDev > 7) {
    flags.push({ type: 'cycle Variation', severity: 'warning', text: `Cycle length varies by ±${cycleStats.stdDev} days, which is higher than typical.` })
  }
  if (cycleStats.mean < 21) {
    flags.push({ type: 'Short Cycles', severity: 'info', text: 'Average cycle length is under 21 days. This is known as polymenorrhea.' })
  }
  if (cycleStats.mean > 35) {
    flags.push({ type: 'Long Cycles', severity: 'info', text: 'Average cycle length is over 35 days. This may warrant a check with your doctor.' })
  }

  const periodStats = computeStats(periodLengths.map((p) => p.duration))
  if (periodStats.mean > 8) {
    flags.push({ type: 'Long Periods', severity: 'warning', text: 'Average period duration is over 8 days. Consider discussing with a healthcare provider.' })
  }

  return flags
}
