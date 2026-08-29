/**
 * health-goals-data.js
 *
 * Core data definitions, validation helpers, and milestone logic for the
 * Health Goals Tracker feature. Every pure function here is framework-free
 * so it can be unit-tested and shared between client and server code.
 */

/* -------------------------------------------------------------------------- */
/*  Goal categories                                                           */
/* -------------------------------------------------------------------------- */

export const GOAL_CATEGORIES = {
  hydration: { key: 'hydration', label: 'Hydration', icon: '💧', color: '#4FC3F7' },
  exercise: { key: 'exercise', label: 'Exercise', icon: '🏃', color: '#81C784' },
  sleep: { key: 'sleep', label: 'Sleep', icon: '😴', color: '#9575CD' },
  nutrition: { key: 'nutrition', label: 'Nutrition', icon: '🥗', color: '#FFB74D' },
  mental_health: { key: 'mental_health', label: 'Mental Health', icon: '🧠', color: '#F06292' },
  cycle_care: { key: 'cycle_care', label: 'Cycle Care', icon: '🌸', color: '#E57373' },
  custom: { key: 'custom', label: 'Custom', icon: '⭐', color: '#FFD54F' },
}

/* -------------------------------------------------------------------------- */
/*  Frequency presets                                                         */
/* -------------------------------------------------------------------------- */

export const FREQUENCY_PRESETS = {
  daily: { key: 'daily', label: 'Every day', daysPerWeek: 7 },
  weekdays: { key: 'weekdays', label: 'Weekdays only', daysPerWeek: 5 },
  three_per_week: { key: 'three_per_week', label: '3× per week', daysPerWeek: 3 },
  twice_per_week: { key: 'twice_per_week', label: '2× per week', daysPerWeek: 2 },
  once_per_week: { key: 'once_per_week', label: '1× per week', daysPerWeek: 1 },
}

/* -------------------------------------------------------------------------- */
/*  Template goals — pre-built suggestions users can one-tap add              */
/* -------------------------------------------------------------------------- */

export const GOAL_TEMPLATES = [
  {
    id: 'drink-water',
    title: 'Drink 8 glasses of water',
    category: 'hydration',
    frequency: 'daily',
    targetPerDay: 8,
    unit: 'glasses',
    icon: '💧',
    description: 'Stay hydrated throughout the day for better energy and skin health.',
  },
  {
    id: 'morning-stretch',
    title: 'Morning stretch routine',
    category: 'exercise',
    frequency: 'daily',
    targetPerDay: 1,
    unit: 'session',
    icon: '🧘',
    description: '5–10 minutes of gentle stretching after waking up.',
  },
  {
    id: 'sleep-8h',
    title: 'Sleep 8 hours',
    category: 'sleep',
    frequency: 'daily',
    targetPerDay: 8,
    unit: 'hours',
    icon: '😴',
    description: 'Aim for a full 8 hours of rest every night.',
  },
  {
    id: 'iron-rich-meal',
    title: 'Eat an iron-rich meal',
    category: 'nutrition',
    frequency: 'daily',
    targetPerDay: 1,
    unit: 'meal',
    icon: '🥬',
    description: 'Include leafy greens, lentils, or fortified cereals.',
  },
  {
    id: 'meditation',
    title: '5-minute meditation',
    category: 'mental_health',
    frequency: 'daily',
    targetPerDay: 1,
    unit: 'session',
    icon: '🧠',
    description: 'Short guided meditation to reduce stress and improve focus.',
  },
  {
    id: 'yoga',
    title: 'Yoga session',
    category: 'exercise',
    frequency: 'three_per_week',
    targetPerDay: 1,
    unit: 'session',
    icon: '🧘',
    description: '30-minute yoga flow for flexibility and calm.',
  },
  {
    id: 'journal',
    title: 'Write in journal',
    category: 'mental_health',
    frequency: 'daily',
    targetPerDay: 1,
    unit: 'entry',
    icon: '📝',
    description: 'Reflect on your day and track your emotions.',
  },
  {
    id: 'cycle-symptoms',
    title: 'Log cycle symptoms',
    category: 'cycle_care',
    frequency: 'daily',
    targetPerDay: 1,
    unit: 'log',
    icon: '🌸',
    description: 'Record any symptoms, flow, or mood changes daily.',
  },
  {
    id: 'walk-30min',
    title: 'Walk 30 minutes',
    category: 'exercise',
    frequency: 'daily',
    targetPerDay: 30,
    unit: 'minutes',
    icon: '🚶',
    description: 'A brisk walk outdoors for cardiovascular health.',
  },
  {
    id: 'reduce-sugar',
    title: 'Limit added sugar',
    category: 'nutrition',
    frequency: 'daily',
    targetPerDay: 1,
    unit: 'day',
    icon: '🚫',
    description: 'Avoid sugary drinks and snacks for better hormonal balance.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Milestone definitions                                                     */
/* -------------------------------------------------------------------------- */

export const MILESTONES = [
  { key: 'first_log', label: 'First Step', icon: '🌱', description: 'Logged progress for the first time', threshold: 1 },
  { key: 'streak_3', label: 'On a Roll', icon: '🔥', description: '3-day streak achieved', threshold: 3 },
  { key: 'streak_7', label: 'Week Warrior', icon: '⚡', description: '7-day streak achieved', threshold: 7 },
  { key: 'streak_14', label: 'Fortnight Force', icon: '💪', description: '14-day streak achieved', threshold: 14 },
  { key: 'streak_30', label: 'Monthly Master', icon: '👑', description: '30-day streak achieved', threshold: 30 },
  { key: 'goals_5', label: 'Goal Getter', icon: '🎯', description: 'Completed 5 goals total', threshold: 5 },
  { key: 'goals_25', label: 'Ambitious Star', icon: '⭐', description: 'Completed 25 goals total', threshold: 25 },
  { key: 'goals_100', label: 'Century Club', icon: '💯', description: 'Completed 100 goals total', threshold: 100 },
  { key: 'perfect_week', label: 'Perfect Week', icon: '🌟', description: 'All goals completed for 7 consecutive days', threshold: 7 },
  { key: 'all_categories', label: 'Well-Rounded', icon: '🌈', description: 'Active goals in every category', threshold: 7 },
]

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Returns a YYYY-MM-DD string for the given date (or today).
 */
export function toDateString(date = new Date()) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns the day-of-week as a 0-indexed integer (0 = Sunday).
 */
export function getDayOfWeek(dateStr) {
  return new Date(`${dateStr}T00:00:00`).getDay()
}

/**
 * Returns true if the date falls on a weekday (Mon–Fri).
 */
export function isWeekday(dateStr) {
  const dow = getDayOfWeek(dateStr)
  return dow >= 1 && dow <= 5
}

/**
 * Determines whether a goal should be active on a given date based on its
 * frequency setting.
 */
export function isGoalActiveOnDate(goal, dateStr) {
  switch (goal.frequency) {
    case 'daily':
      return true
    case 'weekdays':
      return isWeekday(dateStr)
    case 'three_per_week':
    case 'twice_per_week':
    case 'once_per_week':
      // For non-daily goals we treat every day as a potential check-in day
      // but the user decides whether to log.
      return true
    default:
      return true
  }
}

/**
 * Calculates the current streak (consecutive active days with ≥1 completed
 * goal) counting backwards from `endDate` (inclusive).
 *
 * @param {Array<{date: string, completed: boolean}>} dailyRecords
 *   Sorted ascending by date. Each entry should represent one active day.
 * @param {string} endDate   YYYY-MM-DD (defaults to today)
 * @returns {number} The streak length.
 */
export function calculateStreak(dailyRecords, endDate) {
  const today = endDate || toDateString()
  const recordMap = new Map(dailyRecords.map((r) => [r.date, r]))

  let streak = 0
  const d = new Date(`${today}T00:00:00`)

  while (true) {
    const ds = toDateString(d)
    const record = recordMap.get(ds)
    if (record && record.completed) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Returns the best streak from an array of daily records.
 */
export function calculateBestStreak(dailyRecords) {
  const sorted = [...dailyRecords].sort((a, b) => a.date.localeCompare(b.date))
  let best = 0
  let current = 0

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].completed) {
      current++
      if (current > best) best = current
    } else {
      current = 0
    }
  }

  return best
}

/**
 * Counts how many unique categories have at least one active goal.
 */
export function countActiveCategories(goals) {
  const cats = new Set(goals.filter((g) => g.active !== false).map((g) => g.category))
  return cats.size
}

/**
 * Checks which milestones a user has earned given their stats.
 *
 * @param {Object} stats
 * @param {number} stats.currentStreak
 * @param {number} stats.totalCompletions
 * @param {number} stats.activeCategories
 * @returns {string[]} Array of milestone keys that have been earned.
 */
export function checkMilestones(stats) {
  const earned = []

  for (const m of MILESTONES) {
    switch (m.key) {
      case 'first_log':
        if (stats.totalCompletions >= m.threshold) earned.push(m.key)
        break
      case 'streak_3':
      case 'streak_7':
      case 'streak_14':
      case 'streak_30':
        if (stats.currentStreak >= m.threshold || (stats.bestStreak || 0) >= m.threshold) {
          earned.push(m.key)
        }
        break
      case 'goals_5':
      case 'goals_25':
      case 'goals_100':
        if (stats.totalCompletions >= m.threshold) earned.push(m.key)
        break
      case 'perfect_week':
        if ((stats.bestStreak || 0) >= m.threshold) earned.push(m.key)
        break
      case 'all_categories':
        if (stats.activeCategories >= m.threshold) earned.push(m.key)
        break
      default:
        break
    }
  }

  return earned
}

/**
 * Validates goal creation payload. Returns an array of error strings
 * (empty means valid).
 */
export function validateGoalInput(input) {
  const errors = []

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Goal title is required.')
  } else if (input.title.length > 100) {
    errors.push('Goal title must be 100 characters or fewer.')
  }

  if (!input.category || !GOAL_CATEGORIES[input.category]) {
    errors.push('Valid category is required.')
  }

  if (!input.frequency || !FREQUENCY_PRESETS[input.frequency]) {
    errors.push('Valid frequency is required.')
  }

  if (input.targetPerDay !== undefined) {
    const t = Number(input.targetPerDay)
    if (!Number.isFinite(t) || t < 1 || t > 999) {
      errors.push('Target per day must be between 1 and 999.')
    }
  }

  return errors
}

/**
 * Returns a human-readable label for a frequency key.
 */
export function getFrequencyLabel(frequencyKey) {
  return FREQUENCY_PRESETS[frequencyKey]?.label || frequencyKey
}

/**
 * Generates a simple UUID v4 (client-safe, no crypto dependency).
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Builds a 7-day heatmap from daily logs. Returns an array of 7 objects
 * { date, completed, progress } for the week ending on `endDate`.
 */
export function buildWeekHeatmap(dailyLogs, endDate) {
  const today = new Date(`${endDate || toDateString()}T00:00:00`)
  const week = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = toDateString(d)
    const log = dailyLogs.find((l) => l.date === ds)
    week.push({
      date: ds,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: log?.completed || false,
      progress: log?.progress || 0,
    })
  }

  return week
}

/**
 * Calculates the percentage progress toward the current streak goal (next
 * milestone). Returns { current, next, percentage }.
 */
export function streakProgress(currentStreak) {
  const streakMilestones = [3, 7, 14, 30]
  const next = streakMilestones.find((m) => m > currentStreak) || 30
  const prev = streakMilestones.filter((m) => m <= currentStreak).pop() || 0
  const range = next - prev
  const progress = currentStreak - prev
  return {
    current: currentStreak,
    next,
    percentage: Math.min(100, Math.round((progress / range) * 100)),
  }
}
