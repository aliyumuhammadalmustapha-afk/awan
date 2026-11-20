import React, { useState, useMemo } from 'react';
import {
  Banner,
  Button,
  Card,
  InlineError,
  LevelChip,
  ListRow,
  StatTile,
  TextField,
} from '../../ui';
import { AppShell } from '../../ui/AppShell';
import { evaluateCheckIn } from '../../engine/evaluator';
import vignetteData from '../../../../../vignettes/vignettes.v1.json';
import { en } from '../../i18n';

export interface DashboardScreenProps {
  onNavigate: (path: string) => void;
  queryState?: string;
}

export interface EquityGroupMetric {
  group: string;
  count: number;
  completionPct: number;
  medianDays: number;
}

export const SYNTHETIC_EQUITY_CUTS: EquityGroupMetric[] = [
  { group: 'Age 20–29 (n=412)', count: 412, completionPct: 71, medianDays: 38 },
  { group: 'Age 30–34 (n=365)', count: 365, completionPct: 74, medianDays: 34 },
  { group: 'Age 35–39 (n=290)', count: 290, completionPct: 69, medianDays: 26 },
  { group: 'Age 40+ (n=128)', count: 128, completionPct: 64, medianDays: 19 },
  { group: 'Female check-in (n=785)', count: 785, completionPct: 72, medianDays: 31 },
  { group: 'Male check-in (n=410)', count: 410, completionPct: 63, medianDays: 41 },
  { group: 'Oncology / urgent L3 (n=7)', count: 7, completionPct: 0, medianDays: 0 },
];

export function formatSuppressedCount(count: number): string {
  return count < 10 ? '<10' : String(count);
}

/* =====================================================================
   P33: Health-System Planner Dashboard (1024px wide, staff login first,
        "Synthetic demo data" Banner, 4 StatTiles, plain-CSS equity bars
        using tokens + text labels, False-reassurance review Card,
        "Groups under 10 are hidden")
   ===================================================================== */
export const P33DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const [authenticated, setAuthenticated] = useState(
    queryState !== 'login' && queryState !== 'login-error'
  );
  const [email, setEmail] = useState('planner@doh-demo.ae');
  const [password, setPassword] = useState('awan-demo-2026');
  const [loginError, setLoginError] = useState<string | undefined>(
    queryState === 'login-error' ? en.dashboard.staffLoginError : undefined
  );

  // Live execution of the 15 clinical vignettes for False-Reassurance Review
  const calibrationSummary = useMemo(() => {
    let total = 0;
    let exactAgreement = 0;
    let underCalls = 0;
    let overCalls = 0;
    let criticalFailures = 0;
    const rank: Record<string, number> = { L0: 0, U: 1, L1: 2, L2: 3, L3: 4 };

    for (const v of vignetteData.vignettes) {
      total++;
      const out = evaluateCheckIn({
        asOfDate: v.asOf,
        profile: v.input.profile as any,
        answers: v.input.answers,
        results: (v.input.results || []) as any,
      });
      if (out.level === v.expected.level) {
        exactAgreement++;
      } else if (rank[out.level] < rank[v.expected.level]) {
        underCalls++;
        if (v.severityIfWrong === 'critical') criticalFailures++;
      } else {
        overCalls++;
      }
    }

    return {
      total,
      exactAgreement,
      underCalls,
      overCalls,
      criticalFailures,
    };
  }, []);

  if (!authenticated) {
    return (
      <AppShell
        mode="viewer"
        showDemoBanner={false}
        onBack={() => onNavigate('/routes')}
        topTitle="Staff access"
      >
        <Banner customText={en.banners.syntheticDashboard} />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="shell-phone w-full">
            <Card hero className="flex flex-col gap-16">
              <h1 className="type-h1 text-ink">
                {en.dashboard.staffLoginTitle}
              </h1>
              <p className="type-supporting text-ink-2">
                {en.dashboard.staffLoginHelper}
              </p>
              {loginError ? <InlineError message={loginError} /> : null}
              <TextField
                id="staff-email"
                label={en.dashboard.staffEmailLabel}
                type="email"
                value={email}
                onChange={setEmail}
              />
              <TextField
                id="staff-password"
                label={en.dashboard.staffPasswordLabel}
                type="password"
                value={password}
                onChange={setPassword}
              />
              <Button
                variant="primary"
                onClick={() => {
                  if (!email.includes('@') || password.length < 4) {
                    setLoginError(en.dashboard.staffLoginError);
                    return;
                  }
                  setLoginError(undefined);
                  setAuthenticated(true);
                }}
              >
                {en.dashboard.staffSignInAction}
              </Button>
            </Card>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      mode="viewer"
      showDemoBanner={false}
      onBack={() => onNavigate('/routes')}
      topTitle={en.dashboard.title}
      topRightAction={{
        label: 'Staff sign-out',
        onClick: () => setAuthenticated(false),
      }}
    >
      <Banner customText={en.banners.syntheticDashboard} />

      <div className="flex flex-col gap-4">
        <h1 className="type-h1 text-ink">{en.dashboard.title}</h1>
        <p className="type-body text-ink-2">{en.dashboard.subtitle}</p>
      </div>

      {/* 4 StatTiles */}
      <div className="grid grid-cols-4 gap-12">
        <StatTile
          value="31 days"
          label="Median days to confirmed contact"
          supporting="Headline early-action metric"
        />
        <StatTile
          value="68%"
          label="Referral completion"
          supporting="User-confirmed follow-up"
        />
        <StatTile
          value="74%"
          label="On-time re-check rate"
          supporting="Within suggested window"
        />
        <StatTile
          value="<10"
          label="Small-group threshold"
          supporting="Groups under 10 are hidden"
        />
      </div>

      {/* Equity bars drawn with plain CSS using tokens & text labels */}
      <Card className="flex flex-col gap-16">
        <div className="flex items-center justify-between flex-wrap gap-8">
          <h2 className="type-h2 text-ink">{en.dashboard.equityTitle}</h2>
          <span className="type-caption-medium text-ink-2">
            {en.dashboard.smallGroupNote}
          </span>
        </div>

        <div className="flex flex-col gap-12">
          {SYNTHETIC_EQUITY_CUTS.map((row) => {
            const suppressed = row.count < 10;
            return (
              <div key={row.group} className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-8">
                  <span className="type-body-medium text-ink">{row.group}</span>
                  <span className="type-supporting text-ink-2">
                    {suppressed
                      ? 'Suppressed (<10) · Hidden to protect privacy'
                      : `${row.completionPct}% follow-up · ${row.medianDays}d median`}
                  </span>
                </div>
                <div className="w-full h-chip bg-banner radius-pill overflow-hidden">
                  <div
                    className="h-full bg-primary transition-calm"
                    style={{
                      width: suppressed ? '0%' : `${row.completionPct}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* False-reassurance review Card */}
      <Card className="flex flex-col gap-12">
        <div className="flex items-center justify-between flex-wrap gap-8">
          <h2 className="type-h2 text-ink">{en.dashboard.calibrationTitle}</h2>
          <LevelChip level="L0" />
        </div>
        <p className="type-supporting text-ink-2">
          {en.dashboard.calibrationNote}
        </p>

        <div className="grid grid-cols-4 gap-12">
          <ListRow
            title={`${calibrationSummary.exactAgreement}/${calibrationSummary.total}`}
            supporting="Exact vignette agreement"
          />
          <ListRow
            title={String(calibrationSummary.underCalls)}
            supporting="Under-calls (false reassurance)"
          />
          <ListRow
            title={String(calibrationSummary.overCalls)}
            supporting="Over-calls (cautious)"
          />
          <ListRow
            title={String(calibrationSummary.criticalFailures)}
            supporting="Critical failures"
          />
        </div>
      </Card>

      <p className="type-caption text-ink-2">
        Groups under 10 are hidden. Synthetic cohort (n=1,202) · Daily active users are never reported.
      </p>
    </AppShell>
  );
};
