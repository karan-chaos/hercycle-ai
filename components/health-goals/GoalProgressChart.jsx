/**
 * GoalProgressChart — Recharts-based visualization of weekly goal completion
 * trends and category distribution.
 */
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { GOAL_CATEGORIES } from '@/lib/health-goals-data.js'

const CATEGORY_COLORS = Object.values(GOAL_CATEGORIES).map((c) => c.color)

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export default function GoalProgressChart({ heatmap, goals, progressLogs }) {
  if (!heatmap || heatmap.length === 0) {
    return (
      <div className="goal-chart goal-chart--empty">
        <p>📊 Start checking in to see your progress charts here.</p>
      </div>
    )
  }

  // Build weekly completion data for the bar chart
  const weeklyData = heatmap.map((day) => ({
    name: day.dayLabel,
    completed: day.completed ? 1 : 0,
    day: day.date,
  }))

  // Build category distribution data for the pie chart
  const categoryCounts = {}
  for (const log of progressLogs || []) {
    const goal = goals?.find((g) => g.id === log.goal_id)
    if (goal) {
      const cat = goal.category
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    }
  }

  const pieData = Object.entries(categoryCounts).map(([key, count]) => ({
    name: GOAL_CATEGORIES[key]?.label || key,
    value: count,
    color: GOAL_CATEGORIES[key]?.color || '#999',
  }))

  const hasPieData = pieData.length > 0

  return (
    <div className="goal-charts">
      {/* Weekly bar chart */}
      <div className="goal-chart">
        <h3 className="goal-chart__title">📅 This Week</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
              ticks={[0, 1]}
              domain={[0, 1]}
              tickFormatter={(v) => (v === 1 ? '✓' : '')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="#81C784"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category pie chart */}
      {hasPieData && (
        <div className="goal-chart">
          <h3 className="goal-chart__title">🏷️ By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
