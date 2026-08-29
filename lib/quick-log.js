/**
 * quick-log.js — Data definitions, validation, and analysis for the
 * Quick Log feature: a fast 30-second daily cycle check-in.
 */

export const FLOW_LEVELS = [
  { key: 'none', label: 'None', emoji: '⭕', color: 'rgba(255,255,255,0.1)' },
  { key: 'spotting', label: 'Spotting', emoji: '🩸', color: '#fecaca' },
  { key: 'light', label: 'Light', emoji: '💧', color: '#f87171' },
  { key: 'medium', label: 'Medium', emoji: '🔴', color: '#ef4444' },
  { key: 'heavy', label: 'Heavy', emoji: '🩸', color: '#b91c1c' },
]

export const MOOD_OPTIONS = [
  { key: 'great', emoji: '😄', label: 'Great', color: '#4ade80' },
  { key: 'good', emoji: '🙂', label: 'Good', color: '#86efac' },
  { key: 'okay', emoji: '😐', label: 'Okay', color: '#fbbf24' },
  { key: 'low', emoji: '😔', label: 'Low', color: '#f87171' },
  { key: 'anxious', emoji: '😰', label: 'Anxious', color: '#c084fc' },
  { key: 'tired', emoji: '😴', label: 'Tired', color: '#94a3b8' },
]

export const QUICK_SYMPTOMS = [
  { key: 'cramps', emoji: '🤕' },
  { key: 'headache', emoji: '🤯' },
  { key: 'bloating', emoji: '🫧' },
  { key: 'backache', emoji: '💆' },
  { key: 'fatigue', emoji: '😴' },
  { key: 'nausea', emoji: '🤢' },
  { key: 'cravings', emoji: '🍫' },
  { key: 'breast_tenderness', emoji: '💗' },
]

function toDateString(date = new Date()) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function validateQuickLog(input) {
  const errors = []
  if (!input.date) errors.push('Date is required.')
  if (input.flow && !FLOW_LEVELS.find((f) => f.key === input.flow))
    errors.push('Invalid flow level.')
  if (input.mood && !MOOD_OPTIONS.find((m) => m.key === input.mood))
    errors.push('Invalid mood.')
  if (input.symptoms && !Array.isArray(input.symptoms))
    errors.push('Symptoms must be an array.')
  if (input.symptoms?.length > 8) errors.push('Maximum 8 symptoms per entry.')
  if (input.notes && input.notes.length > 200)
    errors.push('Notes must be 200 characters or fewer.')
  return errors
}

/**
 * Calculate a wellness score (0-100) from a quick-log entry.
 * Higher is better. Considers mood, energy, and symptom count.
 */
export function wellnessScore(entry) {
  let score = 50 // base
  const moodScores = { great: 20, good: 15, okay: 5, low: -5, anxious: -5, tired: -10 }
  score += moodScores[entry.mood] || 0
  const symptomPenalty = Math.min((entry.symptoms?.length || 0) * 3, 20)
  score -= symptomPenalty
  if (entry.flow === 'heavy') score -= 5
  if (entry.flow === 'spotting' || entry.flow === 'light') score -= 2
  return Math.max(0, Math.min(100, score))
}

/**
 * Build a streak of consecutive logged days ending at `endDate`.
 */
export function logStreak(logs, endDate) {
  const today = endDate || toDateString()
  const dateSet = new Set(logs.map((l) => l.date))
  let streak = 0
  const d = new Date(`${today}T00:00:00`)
  while (dateSet.has(toDateString(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/**
 * Count how many days in the last N days have a log entry.
 */
export function coverage(logs, days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = toDateString(cutoff)
  const recent = logs.filter((l) => l.date >= cutoffStr)
  return recent.length
}

/**
 * Get the most common symptom key from a set of logs.
 */
export function topSymptom(logs) {
  const counts = {}
  for (const log of logs) {
    for (const s of log.symptoms || []) {
      counts[s] = (counts[s] || 0) + 1
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || null
}

/**
 * Average wellness score from recent logs.
 */
export function avgWellness(logs) {
  if (logs.length === 0) return 0
  const total = logs.reduce((sum, l) => sum + wellnessScore(l), 0)
  return Math.round(total / logs.length)
}

/**
 * Day label: "Today", "Yesterday", or formatted date.
 */
export function dayLabel(dateStr) {
  const today = toDateString()
  const yesterday = toDateString(new Date(Date.now() - 86400000))
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
