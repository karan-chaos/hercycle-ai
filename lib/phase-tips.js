/**
 * phase-tips.js — Personalized cycle-phase-aware recommendations.
 *
 * Combines cycle phase detection with symptom/journal data to deliver
 * actionable daily tips for nutrition, exercise, mood, and self-care.
 */

import { CYCLE_PHASES } from './cyclePhaseContent.js'

/* ── Tip database ────────────────────────────────────────────────────── */

export const TIP_CATEGORIES = {
  nutrition: { key: 'nutrition', label: 'Nutrition', icon: '🥗', color: '#4ade80' },
  exercise: { key: 'exercise', label: 'Exercise', icon: '🏃', color: '#60a5fa' },
  mood: { key: 'mood', label: 'Mood & Mind', icon: '🧠', color: '#c084fc' },
  selfCare: { key: 'selfCare', label: 'Self-Care', icon: '💆', color: '#f472b6' },
}

export const PHASE_TIPS = {
  menstrual: [
    { category: 'nutrition', text: 'Eat iron-rich foods like spinach, lentils, and jaggery to replenish blood loss.' },
    { category: 'nutrition', text: 'Drink warm water with ginger to ease cramps and improve circulation.' },
    { category: 'nutrition', text: 'Include anti-inflammatory foods: turmeric milk, salmon, berries.' },
    { category: 'exercise', text: 'Gentle walking (15–20 min) can reduce cramp intensity by improving blood flow.' },
    { category: 'exercise', text: 'Try restorative yoga: Child\'s Pose, Supine Twist, Legs-Up-The-Wall.' },
    { category: 'mood', text: 'Allow yourself extra rest — your body is doing significant work right now.' },
    { category: 'mood', text: 'Journaling about how you feel can help process emotions during this phase.' },
    { category: 'selfCare', text: 'Use a heating pad on your lower abdomen for 15–20 minutes to ease cramps.' },
    { category: 'selfCare', text: 'Prioritise 7–9 hours of sleep; your body heals and restores during rest.' },
  ],
  follicular: [
    { category: 'nutrition', text: 'Focus on lean protein and fermented foods to support rising estrogen.' },
    { category: 'nutrition', text: 'Eat sprouts, eggs, and paneer — your body is rebuilding tissue.' },
    { category: 'nutrition', text: 'Add prebiotic-rich foods (banana, oats, garlic) for gut health.' },
    { category: 'exercise', text: 'Energy is rising — try strength training, running, or a dance class.' },
    { category: 'exercise', text: 'This is a great time to try a new workout or increase intensity.' },
    { category: 'mood', text: 'Take advantage of improved focus for creative projects or planning.' },
    { category: 'mood', text: 'Set intentions for the cycle — your motivation is naturally higher now.' },
    { category: 'selfCare', text: 'Schedule social activities; your confidence and communication are peaking.' },
    { category: 'selfCare', text: 'Start a new habit this week — forming routines is easiest in this phase.' },
  ],
  ovulation: [
    { category: 'nutrition', text: 'Eat antioxidant-rich foods: pomegranate, walnuts, dark chocolate.' },
    { category: 'nutrition', text: 'Stay well hydrated — aim for 2.5–3 litres of water today.' },
    { category: 'nutrition', text: 'Include zinc-rich foods (pumpkin seeds, chickpeas) to support hormone balance.' },
    { category: 'exercise', text: 'Peak performance window — go for HIIT, sport, or a personal best attempt.' },
    { category: 'exercise', text: 'Try a group fitness class; your social energy is at its highest.' },
    { category: 'mood', text: 'You may feel more confident and outgoing — leverage this for important conversations.' },
    { category: 'mood', text: 'Notice any mood shifts and remind yourself they are hormonally driven.' },
    { category: 'selfCare', text: 'Schedule important meetings or presentations during this high-energy phase.' },
    { category: 'selfCare', text: 'Be mindful of bloating or ovulation pain — it\'s normal and temporary.' },
  ],
  luteal: [
    { category: 'nutrition', text: 'Increase magnesium-rich foods: dark chocolate, bananas, almonds.' },
    { category: 'nutrition', text: 'Reduce caffeine and salt to minimise bloating and anxiety.' },
    { category: 'nutrition', text: 'Eat complex carbs (sweet potato, brown rice) to stabilise blood sugar and mood.' },
    { category: 'exercise', text: 'Switch to moderate exercise: brisk walking, swimming, or pilates.' },
    { category: 'exercise', text: 'Listen to your body — it\'s okay to reduce intensity as your period approaches.' },
    { category: 'mood', text: 'PMS symptoms are normal. Practice deep breathing when you feel irritable.' },
    { category: 'mood', text: 'Avoid overcommitting — your energy reserves are depleting.' },
    { category: 'selfCare', text: 'Take warm baths with Epsom salt to ease muscle tension.' },
    { category: 'selfCare', text: 'Plan light, comforting activities for the days ahead.' },
  ],
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function toDateString(date = new Date()) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Pick 2–3 tips per category for the current phase, rotating by day
 * so users see fresh tips each day.
 */
export function getPhaseTips(phaseKey, cycleDay = 1) {
  const allTips = PHASE_TIPS[phaseKey] || PHASE_TIPS.luteal
  const categories = Object.keys(TIP_CATEGORIES)
  const selected = []

  for (const cat of categories) {
    const catTips = allTips.filter((t) => t.category === cat)
    if (catTips.length === 0) continue
    const idx = cycleDay % catTips.length
    selected.push(catTips[idx])
    // Add a second tip from different index if available
    if (catTips.length > 1) {
      const idx2 = (idx + Math.floor(catTips.length / 2)) % catTips.length
      selected.push(catTips[idx2])
    }
  }

  return selected
}

/**
 * Get a summary description of the current phase.
 */
export function getPhaseSummary(phaseKey) {
  const phase = CYCLE_PHASES[phaseKey]
  if (!phase) return { title: 'Unknown Phase', overview: 'Track your cycle to see phase-specific guidance.' }
  return { title: phase.title, eyebrow: phase.eyebrow, overview: phase.overview, accent: phase.accent }
}

/**
 * Build a visual phase timeline showing where the user currently is.
 * Returns array of 4 segments with { key, label, start, end, active }.
 */
export function phaseTimeline(phaseInfo) {
  if (!phaseInfo?.hasData) return []
  const { periodLength = 5, cycleLength = 28, cycleDay = 1 } = phaseInfo
  const ovDay = Math.max(periodLength + 2, cycleLength - 14)

  const segments = [
    { key: 'menstrual', label: 'Period', start: 1, end: periodLength },
    { key: 'follicular', label: 'Follicular', start: periodLength + 1, end: ovDay - 2 },
    { key: 'ovulation', label: 'Ovulation', start: ovDay - 1, end: ovDay + 1 },
    { key: 'luteal', label: 'Luteal', start: ovDay + 2, end: cycleLength },
  ]

  return segments.map((s) => ({
    ...s,
    active: cycleDay >= s.start && cycleDay <= s.end,
    progress: cycleDay < s.start ? 0 : cycleDay > s.end ? 100 : Math.round(((cycleDay - s.start + 1) / (s.end - s.start + 1)) * 100),
  }))
}

/**
 * Count how many tips from journal entries match a given phase.
 */
export function symptomPhaseCorrelation(journalEntries, phases) {
  const phaseSymptomCount = {}
  for (const entry of journalEntries) {
    const phase = phases?.find((p) => p.date === entry.date)?.phaseKey
    if (!phase) continue
    if (!phaseSymptomCount[phase]) phaseSymptomCount[phase] = { total: 0, withSymptoms: 0 }
    phaseSymptomCount[phase].total++
    if (entry.symptoms?.length > 0) phaseSymptomCount[phase].withSymptoms++
  }
  return phaseSymptomCount
}

/**
 * Validate phase tips input.
 */
export function validatePhaseTipsInput(input) {
  const errors = []
  if (!input.phaseKey) errors.push('phaseKey is required.')
  if (input.cycleDay !== undefined && (input.cycleDay < 1 || input.cycleDay > 60))
    errors.push('cycleDay must be between 1 and 60.')
  return errors
}

export function getTipCategoryInfo(key) {
  return TIP_CATEGORIES[key] || TIP_CATEGORIES.selfCare
}
