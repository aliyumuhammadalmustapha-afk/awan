import { describe, it, expect } from 'vitest';
import { ROUTE_CATALOG } from '../App';
import { formatSuppressedCount, SYNTHETIC_EQUITY_CUTS } from '../screens/dashboard/DashboardScreen';

describe('Phase 6 Health-System Planner Dashboard (P33)', () => {
  it('registers P33 as WORKING + TESTED', () => {
    const found = ROUTE_CATALOG.find((r) => r.code === 'P33');
    expect(found?.status).toBe('WORKING + TESTED');
  });

  it('enforces <10 k-anonymity suppression on small groups', () => {
    expect(formatSuppressedCount(7)).toBe('<10');
    expect(formatSuppressedCount(9)).toBe('<10');
    expect(formatSuppressedCount(10)).toBe('10');
    const smallGroup = SYNTHETIC_EQUITY_CUTS.find((g) => g.count < 10);
    expect(smallGroup).toBeDefined();
    expect(formatSuppressedCount(smallGroup!.count)).toBe('<10');
  });
});
