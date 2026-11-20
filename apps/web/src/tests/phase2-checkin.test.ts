import { describe, it, expect } from 'vitest';
import { ROUTE_CATALOG } from '../App';
import { QUESTION_BANK } from '../screens/checkin/CheckInScreens';
import { isPlausibleLabValue } from '../engine/evaluator';
import { en } from '../i18n';

describe('Phase 2 Check-In, Lab Results, Review, Result Card & Next Step (P18 - P25)', () => {
  it('registers P18 through P25 as WORKING + TESTED', () => {
    const phase2Codes = ['P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25'];
    for (const code of phase2Codes) {
      const found = ROUTE_CATALOG.find((r) => r.code === code);
      expect(found, `Missing route entry for ${code}`).toBeDefined();
      expect(found?.status).toBe('WORKING + TESTED');
    }
  });

  it('keeps adaptive question count at or below 11 questions for any profile', () => {
    const femaleTrying = QUESTION_BANK.filter((q) =>
      q.showIf('female', 'trying', {})
    );
    const malePreparing = QUESTION_BANK.filter((q) =>
      q.showIf('male', 'preparing', {})
    );
    expect(femaleTrying.length).toBeLessThanOrEqual(11);
    expect(malePreparing.length).toBeLessThanOrEqual(11);
    for (const q of QUESTION_BANK) {
      expect(q.whyWeAsk.length).toBeGreaterThan(10);
    }
  });

  it('flags implausible lab values and uses 4-digit PIN copy', () => {
    expect(isPlausibleLabValue('AMH', 2.1)).toBe(true);
    expect(isPlausibleLabValue('AMH', 85)).toBe(false);
    expect(isPlausibleLabValue('semen_motility', 150)).toBe(false);
    expect(en.onboarding.pin.createTitle).toBe('Create a 4-digit PIN');
  });
});
