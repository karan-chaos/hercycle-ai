/**
 * GoalStreakDisplay — Visualizes the user's current streak, best streak,
 * and progress toward the next streak milestone.
 */
'use client'

import { streakProgress, MILESTONES } from '@/lib/health-goals-data.js'

export default function GoalStreakDisplay({ currentStreak, bestStreak }) {
  const progress = streakProgress(currentStreak || 0)
  const nextMilestone = MILESTONES.find(
    (m) => m.key.startsWith('streak_') && m.threshold === progress.next
  )

  return (
    <div className="streak-display">
      <div className="streak-display__main">
        <div className="streak-display__fire">
          <span className="streak-display__flame">{currentStreak > 0 ? '🔥' : '❄️'}</span>
          <span className="streak-display__count">{currentStreak || 0}</span>
          <span className="streak-display__label">day streak</span>
        </div>

        <div className="streak-display__stats">
          <div className="streak-display__stat">
            <span className="streak-display__stat-value">{bestStreak || 0}</span>
            <span className="streak-display__stat-label">Best</span>
          </div>
        </div>
      </div>

      <div className="streak-display__progress">
        <div className="streak-display__progress-bar">
          <div
            className="streak-display__progress-fill"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="streak-display__progress-text">
          {nextMilestone
            ? `${progress.current}/${progress.next} to "${nextMilestone.label}" ${nextMilestone.icon}`
            : 'You\'ve hit every streak milestone! 🏆'}
        </p>
      </div>
    </div>
  )
}
