import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  EmptyState,
  FeatureIconCircle,
  Icon,
  LevelChip,
  ListRow,
  SegmentedControl,
  SelectCard,
  Sheet,
  SourceTag,
  TabId,
  TimelineItem,
} from '../../ui';
import { AppShell } from '../../ui/AppShell';
import { DoctorPassEntry, useCheckInStore } from '../../lib/store';
import {
  decryptPassSnapshot,
  encryptPassSnapshot,
} from '../../lib/cryptoPass';
import { AdviceLevel, DataGap, LabResultInput } from '../../engine/evaluator';
import { en } from '../../i18n';

export interface ShareScreenProps {
  onNavigate: (path: string) => void;
  queryState?: string;
}

export interface ClinicianSnapshotPayload {
  patientLabel: string;
  createdAt: string;
  expiresAt: string;
  level: AdviceLevel;
  headline: string;
  reason: string;
  firedRules: string[];
  timeline: Array<{
    date: string;
    level: AdviceLevel;
    summary: string;
    source: 'self-reported' | 'lab-reported' | 'recalled';
  }>;
  results: LabResultInput[];
  attachmentsIncluded: boolean;
  ownWordsNote?: string;
  gaps: DataGap[];
}

const ENCRYPTED_PASS_STORAGE_KEY = 'awan-encrypted-passes';

export function extractPassTokenFromLocation(
  pathname: string,
  search: string
): string | null {
  const params = new URLSearchParams(search || '');
  const queryToken = params.get('token');
  if (queryToken) return queryToken;
  const match = (pathname || '').match(/^\/p\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function saveEncryptedBundleLocally(
  token: string,
  ciphertextB64: string,
  ivB64: string,
  expiresAt: string,
  expiresAtMs?: number
) {
  try {
    const raw = localStorage.getItem(ENCRYPTED_PASS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[token] = { ciphertextB64, ivB64, expiresAt, expiresAtMs, revoked: false };
    localStorage.setItem(ENCRYPTED_PASS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota issues in demo
  }
}

function getEncryptedBundleLocally(token: string): {
  ciphertextB64: string;
  ivB64: string;
  expiresAt: string;
  expiresAtMs?: number;
  revoked: boolean;
} | null {
  try {
    const raw = localStorage.getItem(ENCRYPTED_PASS_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[token] || null;
  } catch {
    return null;
  }
}

function handleTabNav(tab: TabId, onNavigate: (path: string) => void) {
  if (tab === 'home') onNavigate('/home');
  if (tab === 'results') onNavigate('/results');
  if (tab === 'share') onNavigate('/share');
  if (tab === 'account') onNavigate('/account');
}

function StatusBadge({ status }: { status: 'Active' | 'Expired' | 'Revoked' }) {
  const icon =
    status === 'Active'
      ? 'circle-check'
      : status === 'Expired'
      ? 'clock'
      : 'x';
  const cls =
    status === 'Active'
      ? 'bg-l0 text-l0'
      : status === 'Expired'
      ? 'bg-u text-u'
      : 'bg-l3 text-l3';
  return (
    <span
      className={`inline-flex items-center gap-4 px-8 py-4 radius-pill type-caption-medium ${cls}`}
    >
      <Icon name={icon} size={16} />
      <span>{status}</span>
    </span>
  );
}

/* Crisp SVG QR matrix placeholder (token-coloured, no external image) */
const PassQrVisual: React.FC<{ token: string }> = ({ token }) => {
  const cells = [
    1,1,1,0,1,0,1,1,1,
    1,0,1,1,0,1,1,0,1,
    1,1,1,0,1,0,1,1,1,
    0,1,0,1,0,1,0,1,0,
    1,0,1,1,1,0,1,0,1,
    0,1,0,0,1,1,0,1,0,
    1,1,1,0,1,0,1,0,1,
    1,0,1,1,0,1,0,1,0,
    1,1,1,0,1,1,1,0,1,
  ];
  return (
    <svg
      width="108"
      height="108"
      viewBox="0 0 9 9"
      role="img"
      aria-label={`QR code for pass ${token}`}
      className="bg-surface p-8 border-1 radius-control"
    >
      {cells.map((on, idx) =>
        on ? (
          <rect
            key={idx}
            x={idx % 9}
            y={Math.floor(idx / 9)}
            width="0.9"
            height="0.9"
            fill="var(--color-ink)"
          />
        ) : null
      )}
    </svg>
  );
};

/* =====================================================================
   P28: Share tab (list of passes with status chips, Create a new pass,
        EmptyState)
   ===================================================================== */
export const P28ShareTabScreen: React.FC<ShareScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { passes, revokePass } = useCheckInStore();
  const isEmpty = queryState === 'empty' || passes.length === 0;
  const [selectedPass, setSelectedPass] = useState<DoctorPassEntry | null>(
    null
  );

  return (
    <AppShell
      showBottomNav
      activeTab="share"
      onSelectTab={(t) => handleTabNav(t, onNavigate)}
      primaryAction={{
        label: en.share.createNewPass,
        onClick: () => onNavigate('/p29-create-pass'),
      }}
    >
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-4">
          <h1 className="type-h1 text-ink">{en.share.title}</h1>
          <p className="type-body text-ink-2">{en.share.subtitle}</p>
        </div>

        {isEmpty ? (
          <EmptyState
            icon="share-2"
            message={en.share.emptyMessage}
            actionLabel={en.share.createNewPass}
            onAction={() => onNavigate('/p29-create-pass')}
          />
        ) : (
          <div className="flex flex-col gap-12">
            {passes.map((p) => (
              <ListRow
                key={p.id}
                icon="qr-code"
                title={`Pass ${p.token}`}
                supporting={`${en.share.expiresPrefix} ${p.expiresAt} · ${p.durationLabel}`}
                endSlot={<StatusBadge status={p.status} />}
                showChevron
                onClick={() => setSelectedPass(p)}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet
        open={selectedPass !== null}
        onClose={() => setSelectedPass(null)}
        title={selectedPass ? `Pass ${selectedPass.token}` : 'Doctor Pass'}
      >
        {selectedPass ? (
          <div className="flex flex-col gap-12">
            <div className="flex items-center justify-between">
              <StatusBadge status={selectedPass.status} />
              <span className="type-supporting text-ink-2">
                {selectedPass.durationLabel}
              </span>
            </div>
            <p className="type-supporting text-ink-2">
              {en.share.expiresPrefix} {selectedPass.expiresAt}
            </p>
            <Button
              variant="primary"
              onClick={() => {
                const tok = selectedPass.token;
                const key = selectedPass.keyFragment;
                const st = selectedPass.status;
                setSelectedPass(null);
                if (st === 'Revoked') {
                  onNavigate('/clinician-view?state=revoked');
                } else if (st === 'Expired') {
                  onNavigate('/clinician-view?state=expired');
                } else {
                  onNavigate(`/clinician-view?token=${tok}#${key}`);
                }
              }}
            >
              {en.share.create.openClinicianView}
            </Button>
            {selectedPass.status === 'Active' ? (
              <Button
                variant="destructive"
                onClick={() => {
                  revokePass(selectedPass.id);
                  setSelectedPass(null);
                }}
              >
                {en.share.create.revokePass}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </AppShell>
  );
};

/* =====================================================================
   P29: Doctor Pass Create Flow (SelectCard scopes, SegmentedControl
        duration, Preview Sheet, Encrypted Link + QR + Access Log +
        Plum Revoke Sheet)
   ===================================================================== */
export const P29CreatePassScreen: React.FC<ShareScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const store = useCheckInStore();
  const [scopeAnswers, setScopeAnswers] = useState(true);
  const [scopeResults, setScopeResults] = useState(true);
  const [scopeAttachments, setScopeAttachments] = useState(false);
  const [scopeNote, setScopeNote] = useState(store.includeNoteInPass);
  const [duration, setDuration] = useState<'24h' | '7d' | '30d'>('7d');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [accessLogOpen, setAccessLogOpen] = useState(false);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [createdPass, setCreatedPass] = useState<DoctorPassEntry | null>(() => {
    if (queryState === 'ready') {
      return store.passes[0] || null;
    }
    return null;
  });

  const durationLabelMap: Record<'24h' | '7d' | '30d', '24 hours' | '7 days' | '30 days'> = {
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
  };

  const buildSnapshot = (): ClinicianSnapshotPayload => {
    const evalOut = store.latestEvaluation || {
      level: 'L1' as AdviceLevel,
      headline: en.levels.L1.headline,
      reason:
        'Having three or more cycles outside the typical 21 to 35 day range is worth mentioning at a routine visit.',
      firedRules: ['F1', 'F6'],
      whatCanChange: [],
      whatCantChange: [],
      gaps: [
        {
          id: 'gap_pain',
          kind: 'would-sharpen',
          reason:
            'Sharing whether period or pelvic pain disrupts your day would sharpen this picture.',
          howToFill: 'Answer the pain question',
        },
      ],
      confidence: 'Some gaps' as const,
      primaryAction: { id: 'plan-routine-visit', label: en.levels.L1.primaryAction },
      secondaryActions: [],
      recheckInDays: 90,
      followUpDueDays: 21,
      cautiousAgeUsed: false,
    };

    const days = duration === '24h' ? 1 : duration === '7d' ? 7 : 30;
    const expDate = new Date(Date.now() + days * 86400000).toLocaleDateString(
      'en-GB',
      { day: 'numeric', month: 'short', year: 'numeric' }
    );

    return {
      patientLabel: `${store.nickname || 'Layla'} (Self-shared)`,
      createdAt: '19 Nov 2026',
      expiresAt: expDate,
      level: evalOut.level,
      headline: evalOut.headline,
      reason: evalOut.reason,
      firedRules: evalOut.firedRules,
      timeline: scopeAnswers
        ? [
            {
              date: '19 Nov 2026',
              level: evalOut.level,
              summary: evalOut.reason,
              source: 'self-reported',
            },
            {
              date: '19 May 2026',
              level: 'L0',
              summary: 'Baseline check-in (Recalled cycle comparison).',
              source: 'recalled',
            },
          ]
        : [],
      results: scopeResults ? store.results : [],
      attachmentsIncluded: scopeAttachments,
      ownWordsNote: scopeNote ? store.ownWordsNote : undefined,
      gaps: evalOut.gaps,
    };
  };

  const handleGeneratePass = async () => {
    const days = duration === '24h' ? 1 : duration === '7d' ? 7 : 30;
    const expiresAtMs = Date.now() + days * 86400000;
    const snapshot = buildSnapshot();
    const bundle = await encryptPassSnapshot(snapshot);
    const token = `awan-${Math.random().toString(36).slice(2, 8)}`;
    saveEncryptedBundleLocally(
      token,
      bundle.ciphertextB64,
      bundle.ivB64,
      snapshot.expiresAt,
      expiresAtMs
    );
    if (typeof fetch === 'function') {
      fetch('/api/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ciphertextB64: bundle.ciphertextB64,
          ivB64: bundle.ivB64,
          expiresAt: snapshot.expiresAt,
          expiresAtMs,
        }),
      }).catch(() => {
        // Offline / local dev fallback uses localStorage
      });
    }

    const newEntry: DoctorPassEntry = {
      id: `pass-${Date.now()}`,
      token,
      keyFragment: bundle.keyFragment,
      createdAt: '19 Nov 2026, now',
      expiresAt: snapshot.expiresAt,
      durationLabel: durationLabelMap[duration],
      status: 'Active',
      scopes: {
        answers: scopeAnswers,
        results: scopeResults,
        attachments: scopeAttachments,
        ownWordsNote: scopeNote,
      },
      accessLog: [
        { timestamp: '19 Nov 2026, now', event: 'Encrypted & created on device' },
      ],
    };
    store.addPass(newEntry);
    setCreatedPass(newEntry);
  };

  if (createdPass) {
    const shareUrl = `${window.location.origin}/p/${createdPass.token}#${createdPass.keyFragment}`;
    return (
      <AppShell
        onBack={() => onNavigate('/share')}
        topTitle={en.share.create.readyTitle}
        primaryAction={{
          label: en.share.create.openClinicianView,
          onClick: () =>
            onNavigate(
              `/clinician-view?token=${createdPass.token}#${createdPass.keyFragment}`
            ),
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.share.create.readyTitle}</h1>

          <Card hero className="flex flex-col items-center gap-16 text-center">
            <PassQrVisual token={createdPass.token} />
            <div className="flex flex-col gap-4 w-full">
              <span className="type-supporting-medium text-ink">
                {en.share.expiresPrefix} {createdPass.expiresAt} (
                {createdPass.durationLabel})
              </span>
              <p className="type-caption text-ink-2">
                {en.share.create.linkHelper}
              </p>
            </div>
            <Card className="w-full">
              <p className="type-caption text-ink truncate">{shareUrl}</p>
            </Card>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl);
                setCopied(true);
              }}
            >
              <Icon name="copy" size={20} />
              <span className="px-8">
                {copied ? en.share.create.copied : en.share.create.copyLink}
              </span>
            </Button>
          </Card>

          <div className="flex flex-col gap-8">
            <Button
              variant="secondary"
              onClick={() => setAccessLogOpen(true)}
            >
              {en.share.create.viewAccessLog}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRevokeConfirmOpen(true)}
            >
              {en.share.create.revokePass}
            </Button>
          </div>
        </div>

        <Sheet
          open={accessLogOpen}
          onClose={() => setAccessLogOpen(false)}
          title={en.share.create.viewAccessLog}
        >
          <div className="flex flex-col gap-8">
            {createdPass.accessLog.map((item, idx) => (
              <ListRow
                key={idx}
                icon="clock"
                title={item.event}
                supporting={item.timestamp}
              />
            ))}
          </div>
        </Sheet>

        <Sheet
          open={revokeConfirmOpen}
          onClose={() => setRevokeConfirmOpen(false)}
          title={en.share.create.revokeSheetTitle}
        >
          <p className="type-body text-ink">
            {en.share.create.revokeSheetBody}
          </p>
          <div className="flex flex-col gap-8">
            <Button
              variant="destructive"
              onClick={() => {
                store.revokePass(createdPass.id);
                setRevokeConfirmOpen(false);
                onNavigate('/share');
              }}
            >
              {en.share.create.revokePass}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRevokeConfirmOpen(false)}
            >
              {en.common.cancel}
            </Button>
          </div>
        </Sheet>
      </AppShell>
    );
  }

  const previewSnap = buildSnapshot();

  return (
    <AppShell
      onBack={() => onNavigate('/share')}
      topTitle={en.share.create.title}
      primaryAction={{
        label: en.share.create.generateAction,
        onClick: handleGeneratePass,
      }}
      secondaryAction={{
        label: en.share.create.previewAction,
        onClick: () => setPreviewOpen(true),
      }}
    >
      <div className="flex flex-col gap-24">
        <h1 className="type-h1 text-ink">{en.share.create.title}</h1>

        <div className="flex flex-col gap-8">
          <h2 className="type-h2 text-ink">{en.share.create.scopeTitle}</h2>
          <SelectCard
            compact
            multi
            title={en.share.create.scopeAnswers}
            selected={scopeAnswers}
            onSelect={() => setScopeAnswers(!scopeAnswers)}
          />
          <SelectCard
            compact
            multi
            title={en.share.create.scopeResults}
            selected={scopeResults}
            onSelect={() => setScopeResults(!scopeResults)}
          />
          <SelectCard
            compact
            multi
            title={en.share.create.scopeAttachments}
            selected={scopeAttachments}
            onSelect={() => setScopeAttachments(!scopeAttachments)}
          />
          <SelectCard
            compact
            multi
            title={en.share.create.scopeNote}
            selected={scopeNote}
            onSelect={() => setScopeNote(!scopeNote)}
          />
        </div>

        <div className="flex flex-col gap-8">
          <h2 className="type-h2 text-ink">{en.share.create.durationTitle}</h2>
          <SegmentedControl
            options={[
              { id: '24h', label: '24 hours' },
              { id: '7d', label: '7 days' },
              { id: '30d', label: '30 days' },
            ]}
            value={duration}
            onChange={(val) => setDuration(val as '24h' | '7d' | '30d')}
          />
        </div>
      </div>

      <Sheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={en.share.create.previewSheetTitle}
      >
        <div className="flex flex-col gap-12">
          <div className="flex items-center justify-between">
            <LevelChip level={previewSnap.level} />
            <span className="type-caption text-ink-2">
              {en.app.notADiagnosis}
            </span>
          </div>
          <p className="type-body-medium text-ink">{previewSnap.headline}</p>
          <p className="type-supporting text-ink-2">
            Includes: {scopeAnswers ? 'Answers, ' : ''}
            {scopeResults ? `${previewSnap.results.length} lab result(s), ` : ''}
            {scopeNote ? 'Own-words note' : 'No personal note'}
          </p>
          <Button variant="primary" onClick={() => setPreviewOpen(false)}>
            {en.common.close}
          </Button>
        </div>
      </Sheet>
    </AppShell>
  );
};

/* =====================================================================
   P32: Clinician View (desktop 1024px wide, view-only, header strip,
        summary block with LevelChip + Rule IDs + Not a diagnosis,
        timeline, source-labelled results, unverified attachments,
        optional note, data gaps, "Decisions stay with the clinician.",
        and expired/revoked unavailable state)
   ===================================================================== */
const DEMO_CLINICIAN_SNAPSHOT: ClinicianSnapshotPayload = {
  patientLabel: 'Layla (Age 28 · Female check-in)',
  createdAt: '19 Nov 2026',
  expiresAt: '26 Nov 2026',
  level: 'L1',
  headline: 'A few details are worth discussing at a routine visit.',
  reason:
    'Having three or more cycles outside the typical 21 to 35 day range (rule F1) and noticing cycles feel less regular than a year ago (rule F6).',
  firedRules: ['F1', 'F6'],
  timeline: [
    {
      date: '19 Nov 2026',
      level: 'L1',
      summary: '3+ cycles outside 21–35 days; less regular than a year ago.',
      source: 'self-reported',
    },
    {
      date: '19 May 2026',
      level: 'L0',
      summary: 'Baseline check-in recalled as regular.',
      source: 'recalled',
    },
  ],
  results: [
    {
      id: 'res-clin-1',
      testType: 'AMH',
      value: 1.9,
      unit: 'ng/mL',
      refLow: 1.0,
      refHigh: 4.5,
      date: '2026-10-15',
      source: 'lab-reported',
      confirmed: true,
    },
    {
      id: 'res-clin-2',
      testType: 'TSH',
      value: 2.1,
      unit: 'mIU/L',
      refLow: 0.4,
      refHigh: 4.0,
      date: '2026-10-15',
      source: 'lab-uploaded-unverified',
      confirmed: true,
    },
  ],
  attachmentsIncluded: true,
  ownWordsNote:
    'Cycles have been 38 to 42 days over the past four months. Hoping to prepare in the next year.',
  gaps: [
    {
      id: 'gap_pain',
      kind: 'would-sharpen',
      reason: 'Period/pelvic pain impact question was skipped by patient.',
      howToFill: 'Explore pain history during consultation',
    },
    {
      id: 'gap_partner',
      kind: 'good-context',
      reason: 'Male partner reproductive history is not included in this individual pass.',
      howToFill: 'Consider partner history if applicable',
    },
  ],
};

export const P32ClinicianViewScreen: React.FC<ShareScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const passes = useCheckInStore((s) => s.passes);
  const [snapshot, setSnapshot] = useState<ClinicianSnapshotPayload>(
    DEMO_CLINICIAN_SNAPSHOT
  );
  const [unavailableReason, setUnavailableReason] = useState<
    'revoked' | 'expired' | null
  >(() => {
    if (queryState === 'revoked') return 'revoked';
    if (queryState === 'expired') return 'expired';
    return null;
  });

  const isSharedLink =
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/p/');

  useEffect(() => {
    if (queryState === 'revoked') {
      setUnavailableReason('revoked');
      return;
    }
    if (queryState === 'expired') {
      setUnavailableReason('expired');
      return;
    }

    const token = extractPassTokenFromLocation(
      window.location.pathname,
      window.location.search
    );
    const key = window.location.hash.replace(/^#/, '');

    if (!token) {
      setUnavailableReason(null);
      setSnapshot(DEMO_CLINICIAN_SNAPSHOT);
      return;
    }

    const storePass = passes.find((p) => p.token === token);
    const localBundle = getEncryptedBundleLocally(token);

    if (storePass?.status === 'Revoked' || localBundle?.revoked) {
      setUnavailableReason('revoked');
      return;
    }
    if (
      storePass?.status === 'Expired' ||
      (localBundle?.expiresAtMs && localBundle.expiresAtMs < Date.now())
    ) {
      setUnavailableReason('expired');
      return;
    }

    let cancelled = false;

    const loadAndDecrypt = async () => {
      let bundle = localBundle;
      if (typeof fetch === 'function') {
        try {
          const res = await fetch(`/api/passes?token=${encodeURIComponent(token)}`);
          if (res.ok) {
            const remote = (await res.json()) as {
              ciphertextB64: string;
              ivB64: string;
              expiresAt: string;
              expiresAtMs?: number;
              revoked: boolean;
            };
            if (remote.revoked) {
              if (!cancelled) setUnavailableReason('revoked');
              return;
            }
            if (remote.expiresAtMs && remote.expiresAtMs < Date.now()) {
              if (!cancelled) setUnavailableReason('expired');
              return;
            }
            if (remote.ciphertextB64 && remote.ivB64) {
              bundle = remote;
            }
          }
        } catch {
          // Offline / local dev fallback uses localStorage
        }
      }

      if (cancelled) return;

      if (bundle && key) {
        try {
          const decoded = await decryptPassSnapshot<ClinicianSnapshotPayload>(
            bundle.ciphertextB64,
            bundle.ivB64,
            key
          );
          if (!cancelled) {
            setUnavailableReason(null);
            setSnapshot(decoded);
          }
        } catch {
          if (!cancelled) setUnavailableReason('revoked');
        }
      } else if (
        storePass &&
        storePass.status === 'Active' &&
        key === storePass.keyFragment
      ) {
        if (!cancelled) {
          setUnavailableReason(null);
          setSnapshot(DEMO_CLINICIAN_SNAPSHOT);
        }
      } else {
        if (!cancelled) setUnavailableReason('revoked');
      }
    };

    loadAndDecrypt();
    return () => {
      cancelled = true;
    };
  }, [queryState, passes]);

  if (unavailableReason) {
    return (
      <AppShell
        mode="viewer"
        onBack={isSharedLink ? undefined : () => onNavigate('/share')}
        topTitle="Clinician summary · Unavailable"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-16 py-32">
          <FeatureIconCircle name="eye-off" />
          <h1 className="type-h1 text-ink">
            {en.clinicianView.unavailableTitle}
          </h1>
          <p className="type-body text-ink-2">
            {unavailableReason === 'revoked'
              ? en.clinicianView.unavailableBodyRevoked
              : en.clinicianView.unavailableBodyExpired}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      mode="viewer"
      onBack={isSharedLink ? undefined : () => onNavigate('/share')}
      topTitle="Clinician view (View-only)"
    >
      {/* Header strip */}
      <Card className="flex items-center justify-between flex-wrap gap-8 bg-banner">
        <span className="type-supporting-medium text-ink">
          {en.clinicianView.headerStripPrefix} {snapshot.expiresAt}
        </span>
        <span className="type-caption-medium text-ink-2">
          {snapshot.patientLabel}
        </span>
      </Card>

      {/* Summary block */}
      <Card hero className="flex flex-col gap-12">
        <div className="flex items-center justify-between flex-wrap gap-8">
          <LevelChip level={snapshot.level} large />
          <span className="type-caption-medium text-ink-2">
            Rules: {snapshot.firedRules.join(', ')} · {en.app.notADiagnosis}
          </span>
        </div>
        <h1 className="type-h1 text-ink">{en.clinicianView.summaryTitle}</h1>
        <p className="type-body text-ink">{snapshot.reason}</p>
      </Card>

      <div className="grid grid-cols-2 gap-16">
        {/* Timeline */}
        <Card className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">
            {en.clinicianView.timelineTitle}
          </h2>
          {snapshot.timeline.map((item, idx) => (
            <TimelineItem
              key={idx}
              date={item.date}
              level={item.level}
              summary={item.summary}
              source={item.source}
            />
          ))}
        </Card>

        {/* Data gaps */}
        <Card className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">{en.clinicianView.gapsTitle}</h2>
          {snapshot.gaps.map((g) => (
            <div key={g.id} className="p-12 border-1 radius-control flex flex-col gap-4">
              <span className="type-body-medium text-ink">{g.reason}</span>
              <span className="type-supporting text-ink-2">{g.howToFill}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Results table with SourceTags */}
      <Card className="flex flex-col gap-12">
        <h2 className="type-h2 text-ink">{en.clinicianView.resultsTitle}</h2>
        <div className="flex flex-col gap-8">
          {snapshot.results.map((r) => (
            <ListRow
              key={r.id}
              icon="file-text"
              title={`${r.testType}: ${r.value} ${r.unit}`}
              supporting={`Lab ref: ${r.refLow}–${r.refHigh} ${r.unit} · Date: ${r.date}`}
              endSlot={<SourceTag kind={r.source} />}
            />
          ))}
        </div>
        {snapshot.attachmentsIncluded ? (
          <p className="type-supporting text-ink-2">
            {en.clinicianView.attachmentsNote}
          </p>
        ) : null}
      </Card>

      {/* Own-words note */}
      {snapshot.ownWordsNote ? (
        <Card className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="type-h2 text-ink">{en.clinicianView.noteTitle}</h2>
            <SourceTag kind="self-reported" />
          </div>
          <p className="type-body text-ink">{snapshot.ownWordsNote}</p>
        </Card>
      ) : null}

      {/* Clinical boundary footer */}
      <div className="py-12 border-t-1 flex items-center justify-between flex-wrap gap-8">
        <span className="type-supporting-medium text-ink">
          {en.app.decisionsStayWithClinician}
        </span>
        <span className="type-caption text-ink-2">
          {en.app.notADiagnosis} · {en.app.disclaimer}
        </span>
      </div>
    </AppShell>
  );
};
