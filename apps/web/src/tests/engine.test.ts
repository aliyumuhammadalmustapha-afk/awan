import { describe, it, expect } from 'vitest';
import { evaluateCheckIn, AdviceLevel, CheckInInput } from '../engine/evaluator';
import vignetteData from '../../../../vignettes/vignettes.v1.json';

const LEVEL_ORDER: Record<AdviceLevel, number> = {
  L0: 0,
  U: 1,
  L1: 2,
  L2: 3,
  L3: 4,
};

describe('Awan Deterministic Rule Engine & 15 Guideline Vignettes', () => {
  it('passes all 15 clinical vignettes with zero under-calls', () => {
    for (const v of vignetteData.vignettes) {
      const result = evaluateCheckIn({
        asOfDate: v.asOf,
        profile: v.input.profile as any,
        answers: v.input.answers,
        results: (v.input.results || []) as any,
      });
      expect(result.level, `Vignette ${v.id} (${v.title}) level mismatch`).toBe(v.expected.level);
      for (const ruleId of v.expected.mustFire) {
        expect(result.firedRules, `Vignette ${v.id} missing rule ${ruleId}`).toContain(ruleId);
      }
      for (const forbiddenRuleId of v.expected.mustNotFire) {
        expect(result.firedRules, `Vignette ${v.id} unexpectedly fired ${forbiddenRuleId}`).not.toContain(
          forbiddenRuleId
        );
      }
    }
  });

  it('Golden Rule 1: Missing key information never gives L0', () => {
    const out = evaluateCheckIn({
      profile: { questionSet: 'female', pathway: 'thinking_ahead', ageYears: 27 },
      answers: { upcoming_fertility_affecting_treatment: 'no' }, // missing cycles_outside_range_12m
    });
    expect(out.level).toBe('U');
    expect(out.level).not.toBe('L0');
  });

  it('Golden Rule 2: Normal lab result or added data never lowers a level', () => {
    const baseInput: CheckInInput = {
      profile: { questionSet: 'female', pathway: 'trying', ageYears: 36 },
      answers: {
        upcoming_fertility_affecting_treatment: 'no',
        trying_duration_months: 7,
        cycles_outside_range_12m: 'three_or_more',
      },
    };
    const baseOut = evaluateCheckIn(baseInput);
    const withNormalLab = evaluateCheckIn({
      ...baseInput,
      results: [
        {
          id: 'lab-1',
          testType: 'AMH',
          value: 2.5,
          unit: 'ng/mL',
          refLow: 1.0,
          refHigh: 4.5,
          date: '2026-11-01',
          source: 'lab-reported',
          confirmed: true,
        },
      ],
    });
    expect(LEVEL_ORDER[withNormalLab.level]).toBeGreaterThanOrEqual(LEVEL_ORDER[baseOut.level]);
  });

  it('Golden Rule 3 & 4 & 5: Habits and partner status never change a level; completed visit never lowers a level', () => {
    const baseInput: CheckInInput = {
      profile: { questionSet: 'male', pathway: 'preparing', ageYears: 30 },
      answers: {
        upcoming_fertility_affecting_treatment: 'no',
        testicular_history: 'no',
      },
    };
    const out1 = evaluateCheckIn(baseInput);
    const out2 = evaluateCheckIn({
      ...baseInput,
      completedVisit: true,
      answers: {
        ...baseInput.answers,
        habits_smoking_alcohol: 'yes',
        partner_status: 'married',
        relationship_status: 'single',
      },
    });
    expect(out1.level).toBe('L0');
    expect(out2.level).toBe('L0');
  });

  it('Golden Rule 6: 250 randomized property test runs preserve determinism and invariants', () => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 250; i++) {
      const qSet = rand() > 0.5 ? 'female' : 'male';
      const pathway = rand() > 0.5 ? 'trying' : 'thinking_ahead';
      const ageYears = Math.floor(20 + rand() * 25);
      const hasTreatmentKey = rand() > 0.2;
      const hasCycleOrMaleKey = rand() > 0.2;
      const hasTryingKey = pathway !== 'trying' || rand() > 0.2;

      const answers: Record<string, any> = {};
      if (hasTreatmentKey) {
        answers.upcoming_fertility_affecting_treatment = rand() > 0.9 ? 'yes' : 'no';
      }
      if (hasCycleOrMaleKey) {
        if (qSet === 'female') {
          answers.cycles_outside_range_12m = rand() > 0.5 ? 'three_or_more' : 'none';
        } else {
          answers.testicular_history = rand() > 0.5 ? 'yes' : 'no';
        }
      }
      if (pathway === 'trying' && hasTryingKey) {
        answers.trying_duration_months = Math.floor(rand() * 18);
      }

      const input: CheckInInput = {
        asOfDate: '2026-11-19',
        profile: { questionSet: qSet, pathway, ageYears },
        answers,
      };

      const res1 = evaluateCheckIn(input);
      const res2 = evaluateCheckIn(input);

      // Determinism
      expect(res1.level).toBe(res2.level);
      expect(res1.firedRules).toEqual(res2.firedRules);

      // Missing key invariant
      if (!hasTreatmentKey || !hasCycleOrMaleKey || !hasTryingKey) {
        expect(res1.level).not.toBe('L0');
      }
    }
  });
});
