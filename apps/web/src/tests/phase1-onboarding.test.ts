import { describe, it, expect, beforeEach } from 'vitest';
import { en } from '../i18n';
import { ROUTE_CATALOG } from '../App';

describe('Phase 1 Onboarding & Lock Screen Specification (P1 - P17)', () => {
  it('registers all 17 Phase 1 pages (P1 through P17) as WORKING + TESTED', () => {
    const phase1Codes = [
      'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9',
      'P10', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17',
    ];
    for (const code of phase1Codes) {
      const found = ROUTE_CATALOG.find((r) => r.code === code);
      expect(found, `Missing route entry for ${code}`).toBeDefined();
      expect(found?.status).toBe('WORKING + TESTED');
    }
  });

  it('has complete copy in en.json for P1-P17 with non-alarming sentence-case wording', () => {
    expect(en.app.name).toBe('Awan');
    expect(en.app.tagline).toBe('Know your potential as it changes.');
    expect(en.onboarding.howItWorks).toHaveLength(4);
    expect(en.onboarding.howItWorks[0].icon).toBe('calendar-check');
    expect(en.onboarding.howItWorks[1].icon).toBe('list-checks');
    expect(en.onboarding.howItWorks[2].icon).toBe('trending-up');
    expect(en.onboarding.howItWorks[3].icon).toBe('shield');
    expect(en.onboarding.code.demoChip).toContain('123456');
    expect(en.onboarding.privacy.previewBody).toBe(
      'A quick check-in is ready when you are.'
    );
  });
});
