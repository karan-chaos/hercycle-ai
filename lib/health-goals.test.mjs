import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  toDateString,
  getDayOfWeek,
  isWeekday,
  isGoalActiveOnDate,
  calculateStreak,
  calculateBestStreak,
  countActiveCategories,
  checkMilestones,
  validateGoalInput,
  getFrequencyLabel,
  generateId,
  buildWeekHeatmap,
  streakProgress,
  GOAL_CATEGORIES,
  FREQUENCY_PRESETS,
  MILESTONES,
  GOAL_TEMPLATES,
} from './health-goals-data.js'

describe('toDateString', () => {
  it('returns YYYY-MM-DD for a given date', () => {
    assert.equal(toDateString(new Date(2026, 0, 5)), '2026-01-05')
  })

  it('returns today when no argument', () => {
    const result = toDateString()
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('getDayOfWeek', () => {
  it('returns 0 for Sunday', () => {
    assert.equal(getDayOfWeek('2026-01-04'), 0) // Sunday
  })

  it('returns 1 for Monday', () => {
    assert.equal(getDayOfWeek('2026-01-05'), 1) // Monday
  })
})

describe('isWeekday', () => {
  it('returns true for Monday', () => {
    assert.equal(isWeekday('2026-01-05'), true)
  })

  it('returns false for Sunday', () => {
    assert.equal(isWeekday('2026-01-04'), false)
  })

  it('returns false for Saturday', () => {
    assert.equal(isWeekday('2026-01-03'), false)
  })
})

describe('isGoalActiveOnDate', () => {
  it('daily goals are always active', () => {
    const goal = { frequency: 'daily' }
    assert.equal(isGoalActiveOnDate(goal, '2026-01-04'), true) // Sunday
  })

  it('weekdays goal is inactive on Saturday', () => {
    const goal = { frequency: 'weekdays' }
    assert.equal(isGoalActiveOnDate(goal, '2026-01-03'), false)
  })

  it('weekdays goal is active on Friday', () => {
    const goal = { frequency: 'weekdays' }
    assert.equal(isGoalActiveOnDate(goal, '2026-01-02'), true)
  })
})

describe('calculateStreak', () => {
  it('returns 0 for empty records', () => {
    assert.equal(calculateStreak([], '2026-07-01'), 0)
  })

  it('counts consecutive completed days', () => {
    const records = [
      { date: '2026-06-28', completed: true },
      { date: '2026-06-29', completed: true },
      { date: '2026-06-30', completed: true },
      { date: '2026-07-01', completed: true },
    ]
    assert.equal(calculateStreak(records, '2026-07-01'), 4)
  })

  it('stops at a gap', () => {
    const records = [
      { date: '2026-06-28', completed: true },
      { date: '2026-06-29', completed: false },
      { date: '2026-06-30', completed: true },
      { date: '2026-07-01', completed: true },
    ]
    assert.equal(calculateStreak(records, '2026-07-01'), 2)
  })

  it('returns 1 for a single completed day', () => {
    const records = [{ date: '2026-07-01', completed: true }]
    assert.equal(calculateStreak(records, '2026-07-01'), 1)
  })
})

describe('calculateBestStreak', () => {
  it('finds the longest streak', () => {
    const records = [
      { date: '2026-06-20', completed: true },
      { date: '2026-06-21', completed: true },
      { date: '2026-06-22', completed: false },
      { date: '2026-06-23', completed: true },
      { date: '2026-06-24', completed: true },
      { date: '2026-06-25', completed: true },
      { date: '2026-06-26', completed: true },
    ]
    assert.equal(calculateBestStreak(records), 4)
  })

  it('returns 0 for empty records', () => {
    assert.equal(calculateBestStreak([]), 0)
  })
})

describe('countActiveCategories', () => {
  it('counts unique active categories', () => {
    const goals = [
      { category: 'hydration', active: true },
      { category: 'exercise', active: true },
      { category: 'hydration', active: true },
      { category: 'sleep', active: false },
    ]
    assert.equal(countActiveCategories(goals), 2)
  })
})

describe('checkMilestones', () => {
  it('awards first_log milestone', () => {
    const stats = { currentStreak: 0, totalCompletions: 1, activeCategories: 1 }
    const earned = checkMilestones(stats)
    assert.ok(earned.includes('first_log'))
  })

  it('awards streak milestones based on bestStreak', () => {
    const stats = { currentStreak: 0, bestStreak: 7, totalCompletions: 10, activeCategories: 3 }
    const earned = checkMilestones(stats)
    assert.ok(earned.includes('streak_7'))
    assert.ok(earned.includes('streak_3'))
  })

  it('awards all_categories when 7 categories active', () => {
    const stats = { currentStreak: 0, totalCompletions: 0, activeCategories: 7 }
    const earned = checkMilestones(stats)
    assert.ok(earned.includes('all_categories'))
  })
})

describe('validateGoalInput', () => {
  it('returns errors for empty input', () => {
    const errors = validateGoalInput({})
    assert.ok(errors.length > 0)
  })

  it('returns no errors for valid input', () => {
    const errors = validateGoalInput({
      title: 'Drink water',
      category: 'hydration',
      frequency: 'daily',
      targetPerDay: 8,
    })
    assert.equal(errors.length, 0)
  })

  it('rejects title over 100 chars', () => {
    const errors = validateGoalInput({
      title: 'A'.repeat(101),
      category: 'hydration',
      frequency: 'daily',
    })
    assert.ok(errors.some((e) => e.includes('100 characters')))
  })

  it('rejects invalid category', () => {
    const errors = validateGoalInput({
      title: 'Test',
      category: 'nonexistent',
      frequency: 'daily',
    })
    assert.ok(errors.some((e) => e.includes('category')))
  })
})

describe('getFrequencyLabel', () => {
  it('returns label for known key', () => {
    assert.equal(getFrequencyLabel('daily'), 'Every day')
  })

  it('returns key for unknown', () => {
    assert.equal(getFrequencyLabel('unknown'), 'unknown')
  })
})

describe('generateId', () => {
  it('returns a UUID-like string', () => {
    const id = generateId()
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})

describe('buildWeekHeatmap', () => {
  it('returns 7 days ending on endDate', () => {
    const heatmap = buildWeekHeatmap([], '2026-07-07')
    assert.equal(heatmap.length, 7)
    assert.equal(heatmap[0].date, '2026-07-01')
    assert.equal(heatmap[6].date, '2026-07-07')
  })

  it('marks completed days correctly', () => {
    const logs = [{ date: '2026-07-05', completed: true, progress: 3 }]
    const heatmap = buildWeekHeatmap(logs, '2026-07-07')
    const july5 = heatmap.find((d) => d.date === '2026-07-05')
    assert.equal(july5.completed, true)
    assert.equal(july5.progress, 3)
  })
})

describe('streakProgress', () => {
  it('returns correct progress toward next milestone', () => {
    const result = streakProgress(5)
    assert.equal(result.current, 5)
    assert.equal(result.next, 7)
    assert.ok(result.percentage > 0 && result.percentage <= 100)
  })

  it('caps at 100%', () => {
    const result = streakProgress(30)
    assert.equal(result.percentage, 100)
  })
})

describe('data exports', () => {
  it('exports GOAL_CATEGORIES with expected keys', () => {
    assert.ok(GOAL_CATEGORIES.hydration)
    assert.ok(GOAL_CATEGORIES.exercise)
    assert.ok(GOAL_CATEGORIES.sleep)
  })

  it('exports FREQUENCY_PRESETS', () => {
    assert.ok(FREQUENCY_PRESETS.daily)
    assert.equal(FREQUENCY_PRESETS.daily.daysPerWeek, 7)
  })

  it('exports MILESTONES array', () => {
    assert.ok(Array.isArray(MILESTONES))
    assert.ok(MILESTONES.length >= 5)
  })

  it('exports GOAL_TEMPLATES array', () => {
    assert.ok(Array.isArray(GOAL_TEMPLATES))
    assert.ok(GOAL_TEMPLATES.length >= 5)
  })
})
