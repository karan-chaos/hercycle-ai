/**
 * /health-goals — Health Goals Tracker page.
 *
 * Users can create goals from templates or custom, track daily check-ins,
 * view streaks, earn milestones, and see progress charts.
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import GoalCard from '@/components/health-goals/GoalCard.jsx'
import GoalForm from '@/components/health-goals/GoalForm.jsx'
import GoalProgressChart from '@/components/health-goals/GoalProgressChart.jsx'
import GoalStreakDisplay from '@/components/health-goals/GoalStreakDisplay.jsx'
import MilestoneBadge from '@/components/health-goals/MilestoneBadge.jsx'
import { toDateString } from '@/lib/health-goals-data.js'
import fetchWithTimeout from '@/lib/fetch-with-timeout'

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                  */
/* -------------------------------------------------------------------------- */

function SkeletonGoalCard() {
  return (
    <div className="skeleton-goal-card" aria-hidden="true">
      <div className="skeleton-goal-card__line skeleton-goal-card__line--medium" />
      <div className="skeleton-goal-card__line skeleton-goal-card__line--short" />
    </div>
  )
}

function GoalsSkeleton() {
  return (
    <div className="health-goals-list">
      {[0, 1, 2].map((i) => <SkeletonGoalCard key={i} />)}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function HealthGoalsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState(null)

  const today = toDateString()

  /* ---- Fetch data ---- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchWithTimeout(`/api/health-goals?date=${today}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || 'Failed to load goals')
      }
    } catch (err) {
      setError('Could not connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ---- Create goal ---- */
  const handleCreateGoal = async (goalData) => {
    try {
      const res = await fetchWithTimeout('/api/health-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      })
      const json = await res.json()
      if (json.success) {
        setShowForm(false)
        await fetchData()
      } else {
        alert(json.error || 'Failed to create goal')
      }
    } catch {
      alert('Network error. Please try again.')
    }
  }

  /* ---- Toggle daily progress ---- */
  const handleToggleProgress = async (goalId, completed) => {
    try {
      const res = await fetchWithTimeout('/api/health-goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          date: today,
          completed,
          progress: completed ? 1 : 0,
        }),
      })
      const json = await res.json()
      if (json.success) {
        // Optimistic local update
        setData((prev) => {
          if (!prev) return prev
          const updatedLogs = [...prev.progressLogs]
          const idx = updatedLogs.findIndex(
            (l) => l.goal_id === goalId && l.date === today
          )
          const logEntry = {
            id: json.data?.id,
            goal_id: goalId,
            date: today,
            completed,
            progress: completed ? 1 : 0,
          }
          if (idx >= 0) {
            updatedLogs[idx] = logEntry
          } else {
            updatedLogs.push(logEntry)
          }
          return { ...prev, progressLogs: updatedLogs }
        })
      }
    } catch {
      // Silently fail — user can retry
    }
  }

  /* ---- Delete goal ---- */
  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Remove this goal? You can always add it back later.')) return
    try {
      const res = await fetchWithTimeout(`/api/health-goals?id=${goalId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        await fetchData()
      }
    } catch {
      alert('Failed to delete goal')
    }
  }

  /* ---- Derived state ---- */
  const goals = data?.goals || []
  const progressLogs = data?.progressLogs || []
  const stats = data?.stats || {}
  const heatmap = data?.heatmap || []

  const getTodayLog = (goalId) =>
    progressLogs.find((l) => l.goal_id === goalId && l.date === today)

  const completedCount = goals.filter(
    (g) => getTodayLog(g.id)?.completed
  ).length

  return (
    <div className="page">
      <Navbar />
      <main className="health-goals-page">
        {/* Header */}
        <header className="health-goals-page__header">
          <h1 className="health-goals-page__title">🎯 Health Goals</h1>
          <p className="health-goals-page__subtitle">
            {loading
              ? 'Loading your goals...'
              : goals.length === 0
                ? 'Set your first goal and start building healthy habits'
                : `${completedCount}/${goals.length} checked in today`}
          </p>
          <div className="health-goals-page__actions">
            <button
              className="btn-add-goal"
              onClick={() => setShowForm(true)}
            >
              + New Goal
            </button>
          </div>
        </header>

        {/* Error state */}
        {error && (
          <div
            className="goal-form__errors"
            style={{ marginBottom: '1rem' }}
          >
            <p>{error}</p>
            <button
              onClick={fetchData}
              style={{
                background: 'none',
                border: 'none',
                color: '#e57373',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.8rem',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && <GoalsSkeleton />}

        {/* Content */}
        {!loading && (
          <>
            {/* Streak display */}
            {goals.length > 0 && (
              <GoalStreakDisplay
                currentStreak={stats.currentStreak || 0}
                bestStreak={stats.bestStreak || 0}
              />
            )}

            {/* Goals list */}
            {goals.length > 0 ? (
              <section className="health-goals-list">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    todayLog={getTodayLog(goal.id)}
                    onToggleProgress={handleToggleProgress}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </section>
            ) : (
              <div className="health-goals-empty">
                <div className="health-goals-empty__icon">🎯</div>
                <p className="health-goals-empty__text">No goals yet</p>
                <p className="health-goals-empty__hint">
                  Tap "New Goal" to pick a template or create a custom one.
                </p>
              </div>
            )}

            {/* Milestone badges */}
            <MilestoneBadge earnedKeys={stats.milestones || []} />

            {/* Charts */}
            {goals.length > 0 && (
              <GoalProgressChart
                heatmap={heatmap}
                goals={goals}
                progressLogs={progressLogs}
              />
            )}
          </>
        )}

        {/* Goal creation form modal */}
        {showForm && (
          <GoalForm
            onSubmit={handleCreateGoal}
            onClose={() => setShowForm(false)}
          />
        )}
      </main>
    </div>
  )
}
