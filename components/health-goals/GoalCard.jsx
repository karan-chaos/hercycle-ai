/**
 * GoalCard — Displays a single health goal with its current progress,
 * a check-in toggle, and streak indicator.
 */
'use client'

import { useState } from 'react'
import { GOAL_CATEGORIES, FREQUENCY_PRESETS } from '@/lib/health-goals-data.js'

export default function GoalCard({ goal, todayLog, onToggleProgress, onDelete }) {
  const [isToggling, setIsToggling] = useState(false)

  const category = GOAL_CATEGORIES[goal.category] || GOAL_CATEGORIES.custom
  const frequency = FREQUENCY_PRESETS[goal.frequency]
  const isCompletedToday = todayLog?.completed || false
  const progress = todayLog?.progress || 0

  const handleToggle = async () => {
    if (isToggling) return
    setIsToggling(true)
    try {
      await onToggleProgress(goal.id, !isCompletedToday)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div
      className="health-goal-card"
      style={{
        borderLeft: `4px solid ${category.color}`,
        opacity: isCompletedToday ? 0.75 : 1,
      }}
    >
      <div className="health-goal-card__header">
        <div className="health-goal-card__icon" style={{ backgroundColor: `${category.color}22` }}>
          <span>{goal.icon || category.icon}</span>
        </div>
        <div className="health-goal-card__info">
          <h3 className="health-goal-card__title">
            {goal.title}
            {isCompletedToday && <span className="health-goal-card__check"> ✓</span>}
          </h3>
          <p className="health-goal-card__meta">
            {category.label} · {frequency?.label || goal.frequency}
          </p>
        </div>
      </div>

      {goal.description && (
        <p className="health-goal-card__description">{goal.description}</p>
      )}

      <div className="health-goal-card__footer">
        <button
          className={`health-goal-card__toggle ${isCompletedToday ? 'health-goal-card__toggle--done' : ''}`}
          onClick={handleToggle}
          disabled={isToggling}
          aria-label={isCompletedToday ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompletedToday ? '✓ Done' : '○ Check in'}
        </button>

        <button
          className="health-goal-card__delete"
          onClick={() => onDelete(goal.id)}
          aria-label="Remove goal"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
