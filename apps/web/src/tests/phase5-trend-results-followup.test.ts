import { describe, it, expect } from 'vitest';
import { ROUTE_CATALOG } from '../App';
import { en } from '../i18n';

describe('Phase 5 Trend (P26), Results Tab (P27), and Follow-Up Cards (P30)', () => {
  it('registers P26, P27, and P30 as WORKING + TESTED', () => {
    for (const code of ['P26', 'P27', 'P30']) {
      const found = ROUTE_CATALOG.find((r) => r.code === code);
      expect(found?.status).toBe('WORKING + TESTED');
    }
  });

  it('includes calm non-score wording for Trend, Results, and all 5 Follow-Up options in en.json', () => {
    expect(en.trend.steady).toBe('Direction: steady');
    expect(en.trend.shifting).toBe('Direction: shifting');
    expect(en.trend.startingPoint).toBe('Starting point');
    expect(en.followUp.question).toBe('Did you speak to someone?');
    expect(en.followUp.optYes).toBe('Yes');
    expect(en.followUp.optBooked).toBe('Booked, not yet');
    expect(en.followUp.optNotYet).toBe('Not yet');
    expect(en.followUp.optDecidedNo).toBe('I decided not to');
    expect(en.followUp.optPreferNot).toBe('Prefer not to say');
  });
});
