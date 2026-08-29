/**
 * MilestoneBadge — Renders earned and locked milestones as a badge shelf.
 * Earned badges are highlighted; locked ones are dimmed with a lock icon.
 */
'use client'

import { MILESTONES } from '@/lib/health-goals-data.js'

export default function MilestoneBadge({ earnedKeys = [] }) {
  const earnedSet = new Set(earnedKeys)

  return (
    <div className="milestone-badges">
      <h3 className="milestone-badges__title">🏆 Milestones</h3>
      <div className="milestone-badges__shelf">
        {MILESTONES.map((milestone) => {
          const earned = earnedSet.has(milestone.key)
          return (
            <div
              key={milestone.key}
              className={`milestone-badge ${earned ? 'milestone-badge--earned' : 'milestone-badge--locked'}`}
              title={milestone.description}
            >
              <span className="milestone-badge__icon">
                {earned ? milestone.icon : '🔒'}
              </span>
              <span className="milestone-badge__label">{milestone.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
