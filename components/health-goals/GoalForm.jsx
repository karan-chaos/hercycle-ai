/**
 * GoalForm — A modal form for creating a new health goal.
 * Supports both template selection and custom goal creation.
 */
'use client'

import { useState } from 'react'
import {
  GOAL_CATEGORIES,
  FREQUENCY_PRESETS,
  GOAL_TEMPLATES,
} from '@/lib/health-goals-data.js'

export default function GoalForm({ onSubmit, onClose }) {
  const [mode, setMode] = useState('template') // 'template' | 'custom'
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [form, setForm] = useState({
    title: '',
    category: 'custom',
    frequency: 'daily',
    targetPerDay: 1,
    unit: 'times',
    icon: '⭐',
    description: '',
  })
  const [errors, setErrors] = useState([])

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setForm({
      title: template.title,
      category: template.category,
      frequency: template.frequency,
      targetPerDay: template.targetPerDay || 1,
      unit: template.unit || 'times',
      icon: template.icon || '⭐',
      description: template.description || '',
    })
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSelectedTemplate(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = []

    if (!form.title.trim()) {
      newErrors.push('Please enter a goal title.')
    }
    if (!GOAL_CATEGORIES[form.category]) {
      newErrors.push('Please select a valid category.')
    }
    if (!FREQUENCY_PRESETS[form.frequency]) {
      newErrors.push('Please select a valid frequency.')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      targetPerDay: Number(form.targetPerDay) || 1,
    })
  }

  return (
    <div className="goal-form-overlay" onClick={onClose}>
      <div className="goal-form" onClick={(e) => e.stopPropagation()}>
        <div className="goal-form__header">
          <h2 className="goal-form__title">Add New Goal</h2>
          <button className="goal-form__close" onClick={onClose}>✕</button>
        </div>

        {/* Mode tabs */}
        <div className="goal-form__tabs">
          <button
            className={`goal-form__tab ${mode === 'template' ? 'goal-form__tab--active' : ''}`}
            onClick={() => setMode('template')}
          >
            📋 Templates
          </button>
          <button
            className={`goal-form__tab ${mode === 'custom' ? 'goal-form__tab--active' : ''}`}
            onClick={() => setMode('custom')}
          >
            ✏️ Custom
          </button>
        </div>

        {mode === 'template' ? (
          <div className="goal-form__templates">
            {GOAL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={`goal-form__template ${selectedTemplate?.id === t.id ? 'goal-form__template--selected' : ''}`}
                onClick={() => handleTemplateSelect(t)}
              >
                <span className="goal-form__template-icon">{t.icon}</span>
                <div className="goal-form__template-info">
                  <span className="goal-form__template-title">{t.title}</span>
                  <span className="goal-form__template-cat">
                    {GOAL_CATEGORIES[t.category]?.label}
                  </span>
                </div>
              </button>
            ))}
            {selectedTemplate && (
              <button className="goal-form__submit" onClick={handleSubmit}>
                Add "{selectedTemplate.title}"
              </button>
            )}
          </div>
        ) : (
          <form className="goal-form__fields" onSubmit={handleSubmit}>
            {errors.length > 0 && (
              <div className="goal-form__errors">
                {errors.map((err, i) => <p key={i}>{err}</p>)}
              </div>
            )}

            <label className="goal-form__label">
              Goal Title
              <input
                className="goal-form__input"
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Drink 8 glasses of water"
                maxLength={100}
              />
            </label>

            <label className="goal-form__label">
              Category
              <select
                className="goal-form__select"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {Object.entries(GOAL_CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="goal-form__label">
              Frequency
              <select
                className="goal-form__select"
                value={form.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
              >
                {Object.entries(FREQUENCY_PRESETS).map(([key, freq]) => (
                  <option key={key} value={key}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="goal-form__row">
              <label className="goal-form__label goal-form__label--half">
                Daily Target
                <input
                  className="goal-form__input"
                  type="number"
                  min="1"
                  max="999"
                  value={form.targetPerDay}
                  onChange={(e) => handleChange('targetPerDay', e.target.value)}
                />
              </label>
              <label className="goal-form__label goal-form__label--half">
                Unit
                <input
                  className="goal-form__input"
                  type="text"
                  value={form.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  placeholder="e.g., glasses"
                />
              </label>
            </div>

            <label className="goal-form__label">
              Icon (emoji)
              <input
                className="goal-form__input"
                type="text"
                value={form.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                maxLength={4}
              />
            </label>

            <label className="goal-form__label">
              Description (optional)
              <textarea
                className="goal-form__textarea"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Why is this goal important to you?"
                rows={3}
              />
            </label>

            <button type="submit" className="goal-form__submit">
              Create Goal
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
