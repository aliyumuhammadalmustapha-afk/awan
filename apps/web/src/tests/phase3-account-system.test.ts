import { describe, it, expect } from 'vitest';
import { ROUTE_CATALOG } from '../App';
import { en } from '../i18n';

describe('Phase 3 Account & 8 Subpages (P31) and System States (P34)', () => {
  it('registers P31 and P34 as WORKING + TESTED', () => {
    const p31 = ROUTE_CATALOG.find((r) => r.code === 'P31');
    const p34 = ROUTE_CATALOG.find((r) => r.code === 'P34');
    expect(p31?.status).toBe('WORKING + TESTED');
    expect(p34?.status).toBe('WORKING + TESTED');
  });

  it('includes all 8 Account subpages and all 4 P34 System States in en.json', () => {
    const rowKeys = Object.keys(en.account.rows);
    expect(rowKeys).toEqual([
      'profile',
      'privacy',
      'notifications',
      'security',
      'sharing',
      'data',
      'about',
      'signin',
    ]);
    expect(en.account.privacy.turnOffSheetTitle).toBe(
      "Keep or delete what's saved?"
    );
    expect(en.banners.passOffline).toBe(
      "You're offline. Passes need a connection."
    );
    expect(en.systemStates.corruptedTitle).toBe(
      "We couldn't read your saved data. Start fresh?"
    );
    expect(en.systemStates.errorTitle).toBe('Something went wrong.');
  });
});
