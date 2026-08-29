import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getPhaseTips,
  getPhaseSummary,
  phaseTimeline,
  symptomPhaseCorrelation,
  validatePhaseTipsInput,
  getTipCategoryInfo,
  TIP_CATEGORIES,
  PHASE_TIPS,
} from './phase-tips.js'

describe('TIP_CATEGORIES / PHASE_TIPS', () => {
  it('has 4 tip categories', () => assert.equal(Object.keys(TIP_CATEGORIES).length, 4))
  it('has tips for all 4 phases', () => {
    assert.ok(PHASE_TIPS.menstrual.length > 0)
    assert.ok(PHASE_TIPS.follicular.length > 0)
    assert.ok(PHASE_TIPS.ovulation.length > 0)
    assert.ok(PHASE_TIPS.luteal.length > 0)
  })
})

describe('getPhaseTips', () => {
  it('returns tips for menstrual phase', () => {
    const tips = getPhaseTips('menstrual', 3)
    assert.ok(tips.length >= 4)
    assert.ok(tips.every((t) => t.text && t.category))
  })
  it('returns different tips on different days', () => {
    const tips1 = getPhaseTips('luteal', 1)
    const tips2 = getPhaseTips('luteal', 5)
    const texts1 = tips1.map((t) => t.text).join(',')
    const texts2 = tips2.map((t) => t.text).join(',')
    // At least some should differ
    assert.ok(texts1 !== texts2)
  })
  it('falls back to luteal for unknown phase', () => {
    const tips = getPhaseTips('unknown', 1)
    assert.ok(tips.length > 0)
  })
})

describe('getPhaseSummary', () => {
  it('returns phase info for known phase', () => {
    const s = getPhaseSummary('menstrual')
    assert.ok(s.title.includes('Menstrual'))
    assert.ok(s.overview)
  })
  it('returns fallback for unknown', () => {
    const s = getPhaseSummary('zzz')
    assert.ok(s.title)
  })
})

describe('phaseTimeline', () => {
  it('returns empty for no data', () => {
    assert.deepEqual(phaseTimeline(null), [])
  })
  it('returns 4 segments', () => {
    const tl = phaseTimeline({ hasData: true, periodLength: 5, cycleLength: 28, cycleDay: 10 })
    assert.equal(tl.length, 4)
  })
  it('marks correct segment as active', () => {
    const tl = phaseTimeline({ hasData: true, periodLength: 5, cycleLength: 28, cycleDay: 3 })
    assert.ok(tl[0].active) // menstrual
    assert.ok(!tl[1].active) // follicular
  })
  it('computes progress correctly', () => {
    const tl = phaseTimeline({ hasData: true, periodLength: 5, cycleLength: 28, cycleDay: 3 })
    assert.ok(tl[0].progress > 0 && tl[0].progress <= 100)
  })
})

describe('symptomPhaseCorrelation', () => {
  it('counts symptoms per phase', () => {
    const entries = [
      { date: '2026-08-01', symptoms: ['cramps'] },
      { date: '2026-08-10', symptoms: [] },
    ]
    const phases = [
      { date: '2026-08-01', phaseKey: 'menstrual' },
      { date: '2026-08-10', phaseKey: 'follicular' },
    ]
    const corr = symptomPhaseCorrelation(entries, phases)
    assert.equal(corr.menstrual.withSymptoms, 1)
    assert.equal(corr.follicular.withSymptoms, 0)
  })
  it('returns empty for no data', () => {
    assert.deepEqual(symptomPhaseCorrelation([], []), {})
  })
})

describe('validatePhaseTipsInput', () => {
  it('requires phaseKey', () => assert.ok(validatePhaseTipsInput({}).some((e) => e.includes('phaseKey'))))
  it('accepts valid input', () => assert.equal(validatePhaseTipsInput({ phaseKey: 'menstrual' }).length, 0))
  it('rejects invalid cycleDay', () => assert.ok(validatePhaseTipsInput({ phaseKey: 'a', cycleDay: 70 }).some((e) => e.includes('cycleDay'))))
})

describe('getTipCategoryInfo', () => {
  it('returns info for known key', () => assert.equal(getTipCategoryInfo('nutrition').icon, '🥗'))
  it('falls back for unknown', () => assert.equal(getTipCategoryInfo('zzz').key, 'selfCare'))
})
