'use client'

import { useState } from 'react'
import { FLOW_LEVELS, MOOD_OPTIONS, QUICK_SYMPTOMS, wellnessScore } from '@/lib/quick-log.js'

export default function QuickLogCard({ onSave, existingEntry }) {
  const today = new Date().toISOString().split('T')[0]
  const [flow, setFlow] = useState(existingEntry?.flow || '')
  const [mood, setMood] = useState(existingEntry?.mood || '')
  const [symptoms, setSymptoms] = useState(existingEntry?.symptoms || [])
  const [notes, setNotes] = useState(existingEntry?.notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleSymptom = (key) => {
    setSymptoms((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave({ date: today, flow, mood, symptoms, notes })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const score = wellnessScore({ mood, symptoms, flow })

  return (
    <div className="quick-card">
      <div className="quick-card__header">
        <h3 className="quick-card__title">⚡ Quick Log</h3>
        <div className="quick-card__score">
          <span className="quick-card__score-num">{score}</span>
          <span className="quick-card__score-label">wellness</span>
        </div>
      </div>

      {/* Flow */}
      <div className="quick-card__section">
        <span className="quick-card__label">Flow</span>
        <div className="quick-card__row">
          {FLOW_LEVELS.map((f) => (
            <button
              key={f.key}
              className={`quick-card__pill ${flow === f.key ? 'active' : ''}`}
              onClick={() => setFlow(flow === f.key ? '' : f.key)}
              style={flow === f.key ? { borderColor: f.color, background: f.color + '33' } : {}}
            >
              {f.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="quick-card__section">
        <span className="quick-card__label">Mood</span>
        <div className="quick-card__row">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.key}
              className={`quick-card__pill ${mood === m.key ? 'active' : ''}`}
              onClick={() => setMood(mood === m.key ? '' : m.key)}
              style={mood === m.key ? { borderColor: m.color, background: m.color + '22' } : {}}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms */}
      <div className="quick-card__section">
        <span className="quick-card__label">Symptoms</span>
        <div className="quick-card__row quick-card__row--wrap">
          {QUICK_SYMPTOMS.map((s) => (
            <button
              key={s.key}
              className={`quick-card__pill quick-card__pill--tag ${symptoms.includes(s.key) ? 'active' : ''}`}
              onClick={() => toggleSymptom(s.key)}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="quick-card__section">
        <input
          className="quick-card__notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Quick note (optional)"
          maxLength={200}
        />
      </div>

      <button
        className={`quick-card__save ${saved ? 'quick-card__save--done' : ''}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Log Today'}
      </button>
    </div>
  )
}
