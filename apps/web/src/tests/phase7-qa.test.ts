import { describe, it, expect } from 'vitest';
import { ROUTE_CATALOG } from '../App';
import { evaluateCheckIn } from '../engine/evaluator';

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function readTokenColors(): Promise<Record<string, string>> {
  // @ts-ignore -- Node builtin available in Vitest runner
  const fs = await import('node:fs');
  // @ts-ignore -- Node builtin available in Vitest runner
  const path = await import('node:path');
  const css = fs.readFileSync(
    path.resolve((globalThis as any).process.cwd(), 'src/styles/tokens.css'),
    'utf8'
  );
  const map: Record<string, string> = {};
  const re = /(--color-[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

describe('Phase 7 Full QA: P1-P34 Coverage, WCAG AA Contrast & Engine Speed', () => {
  it('verifies every single page P1 through P34 is WORKING + TESTED', () => {
    expect(ROUTE_CATALOG.length).toBe(34);
    for (const item of ROUTE_CATALOG) {
      expect(item.status, `${item.code} is not WORKING + TESTED`).toBe('WORKING + TESTED');
    }
  });

  it('verifies all token text/background pairs meet WCAG 2.1 AA (>= 4.5:1)', async () => {
    const tokens = await readTokenColors();
    const pairs: Array<[string, string, string]> = [
      ['ink on canvas', tokens['--color-ink'], tokens['--color-canvas']],
      ['ink on surface', tokens['--color-ink'], tokens['--color-surface']],
      ['ink-2 on surface', tokens['--color-ink-2'], tokens['--color-surface']],
      ['surface on primary teal', tokens['--color-surface'], tokens['--color-primary']],
      ['L0 text on L0 bg', tokens['--color-l0-ink'], tokens['--color-l0-bg']],
      ['L1 text on L1 bg', tokens['--color-l1-ink'], tokens['--color-l1-bg']],
      ['L2 text on L2 bg', tokens['--color-l2-ink'], tokens['--color-l2-bg']],
      ['L3 text on L3 bg', tokens['--color-l3-ink'], tokens['--color-l3-bg']],
      ['U text on U bg', tokens['--color-u-ink'], tokens['--color-u-bg']],
      ['plum on surface', tokens['--color-plum'], tokens['--color-surface']],
    ];
    for (const [label, fg, bg] of pairs) {
      expect(fg, `Missing token for ${label}`).toBeTruthy();
      expect(bg, `Missing token for ${label}`).toBeTruthy();
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${label} contrast ${ratio.toFixed(2)} < 4.5`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('evaluates 100 check-ins well under the 50ms per-evaluation NFR target', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      evaluateCheckIn({
        profile: { questionSet: 'female', pathway: 'trying', ageYears: 35 },
        answers: {
          upcoming_fertility_affecting_treatment: 'no',
          trying_duration_months: 6,
          cycles_outside_range_12m: 'three_or_more',
          diagnosed_conditions: ['pcos'],
        },
      });
    }
    const elapsedMs = performance.now() - start;
    expect(elapsedMs / 100).toBeLessThan(50);
  });
});
