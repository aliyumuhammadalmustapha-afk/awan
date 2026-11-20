import React, { useState } from 'react';
import {
  Button,
  Card,
  Chips,
  EmptyState,
  FeatureIconCircle,
  Icon,
  LevelChip,
  ListRow,
  Sheet,
  SourceTag,
  TabId,
  TextField,
  TimelineItem,
} from '../../ui';
import { AppShell } from '../../ui/AppShell';
import { useCheckInStore } from '../../lib/store';
import { AdviceLevel } from '../../engine/evaluator';
import { en } from '../../i18n';

export interface Phase5ScreenProps {
  onNavigate: (path: string) => void;
  queryState?: string;
}

function handleTabNav(tab: TabId, onNavigate: (path: string) => void) {
  if (tab === 'home') onNavigate('/home');
  if (tab === 'results') onNavigate('/results');
  if (tab === 'share') onNavigate('/share');
  if (tab === 'account') onNavigate('/account');
}

/* =====================================================================
   P26: Trend (Direction: steady / shifting / Starting point,
        vertical TimelineItems, Recalled tags, no-save EmptyState)
   ===================================================================== */
export const P26TrendScreen: React.FC<Phase5ScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { saveCheckIns, checkInHistory } = useCheckInStore();
  const isNoSave = queryState === 'no-save' || saveCheckIns === false;

  const timelineEntries: Array<{
    date: string;
    level: AdviceLevel;
    summary: string;
    source: 'self-reported' | 'recalled';
  }> =
    queryState === 'single'
      ? [
          {
            date: '19 Nov 2026',
            level: 'L1',
            summary: 'Three or more cycles outside 21 to 35 days (rule F1).',
            source: 'self-reported',
          },
        ]
      : checkInHistory.length >= 2
      ? checkInHistory.map((c) => ({
          date: c.date,
          level: c.output.level,
          summary: c.output.reason,
          source: 'self-reported' as const,
        }))
      : [
          {
            date: '19 Nov 2026',
            level: 'L1',
            summary: 'Cycles 38–42 days; noticing less regularity than a year ago (rules F1, F6).',
            source: 'self-reported',
          },
          {
            date: '19 May 2026',
            level: 'L0',
            summary: 'Cycles recalled as mostly regular (recalled history).',
            source: 'recalled',
          },
        ];

  const isSingle = timelineEntries.length === 1;
  const isShifting =
    !isSingle && timelineEntries[0].level !== timelineEntries[1].level;

  const summaryTitle = isSingle
    ? en.trend.startingPoint
    : isShifting
    ? en.trend.shifting
    : en.trend.steady;

  const summarySupport = isSingle
    ? en.trend.startingSupport
    : isShifting
    ? en.trend.shiftingSupport
    : en.trend.steadySupport;

  return (
    <AppShell
      onBack={() => onNavigate('/home')}
      showBottomNav
      activeTab="home"
      onSelectTab={(t) => handleTabNav(t, onNavigate)}
      primaryAction={{
        label: en.trend.recheckAction,
        onClick: () => onNavigate('/p19-checkin-start'),
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.trend.title}</h1>

        {isNoSave ? (
          <EmptyState
            icon="eye-off"
            message={en.trend.noSaveEmpty}
            actionLabel={en.trend.enableSaving}
            onAction={() => onNavigate('/account?sub=privacy')}
          />
        ) : (
          <>
            <Card hero className="flex flex-col gap-12">
              <div className="flex items-center justify-between flex-wrap gap-8">
                <div className="flex items-center gap-8">
                  <FeatureIconCircle name="trending-up" />
                  <h2 className="type-h2 text-ink">{summaryTitle}</h2>
                </div>
                <LevelChip level={timelineEntries[0].level} />
              </div>
              <p className="type-body text-ink-2">{summarySupport}</p>
            </Card>

            <div className="flex flex-col gap-12">
              {timelineEntries.map((item, idx) => (
                <TimelineItem
                  key={idx}
                  date={item.date}
                  level={item.level}
                  summary={item.summary}
                  source={item.source}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P27: Results tab (saved results with SourceTag & attachment icon,
        "Still missing" Card, Add a result, EmptyState)
   ===================================================================== */
export const P27ResultsTabScreen: React.FC<Phase5ScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { results } = useCheckInStore();
  const isEmpty = queryState === 'empty' || results.length === 0;

  return (
    <AppShell
      showBottomNav
      activeTab="results"
      onSelectTab={(t) => handleTabNav(t, onNavigate)}
      primaryAction={{
        label: en.resultsTab.addResult,
        onClick: () => onNavigate('/p21-add-results?mode=type'),
      }}
    >
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-4">
          <h1 className="type-h1 text-ink">{en.resultsTab.title}</h1>
          <p className="type-body text-ink-2">{en.resultsTab.subtitle}</p>
        </div>

        {isEmpty ? (
          <EmptyState
            icon="file-text"
            message={en.resultsTab.emptyMessage}
            actionLabel={en.resultsTab.addResult}
            onAction={() => onNavigate('/p21-add-results?mode=type')}
          />
        ) : (
          <div className="flex flex-col gap-12">
            {results.map((r) => (
              <ListRow
                key={r.id}
                icon={
                  r.source === 'lab-uploaded-unverified'
                    ? 'paperclip'
                    : 'file-text'
                }
                title={`${r.testType}: ${r.value} ${r.unit}`}
                supporting={`Lab ref: ${r.refLow}–${r.refHigh} ${r.unit} · ${r.date}`}
                endSlot={<SourceTag kind={r.source} />}
              />
            ))}
          </div>
        )}

        <Card className="flex flex-col gap-8">
          <h2 className="type-h2 text-ink">{en.resultsTab.stillMissingTitle}</h2>
          <p className="type-body text-ink-2">
            {en.resultsTab.stillMissingBody}
          </p>
        </Card>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P30: Follow-up cards (Did you speak to someone? 5 stacked secondary
        buttons, Booked date-picker Sheet + day-before/day-after preview,
        "What's getting in the way?" Chips sheet, "Yes" What next?
        choices)
   ===================================================================== */
const BARRIER_OPTIONS = [
  { id: 'who', label: 'Not sure who to see' },
  { id: 'cost', label: 'Cost' },
  { id: 'time', label: 'Time' },
  { id: 'worried', label: 'Worried' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'other', label: 'Other' },
];

export const P30FollowUpScreen: React.FC<Phase5ScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const [bookedSheetOpen, setBookedSheetOpen] = useState(
    queryState === 'booked'
  );
  const [barriersSheetOpen, setBarriersSheetOpen] = useState(
    queryState === 'barriers'
  );
  const [yesView, setYesView] = useState(queryState === 'yes');
  const [bookedDate, setBookedDate] = useState('2026-12-05');
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>(['time']);
  const [savedBannerMsg, setSavedBannerMsg] = useState<string | null>(
    queryState === 'booked-saved' ? en.followUp.bookedSavedMsg : null
  );

  const toggleBarrier = (id: string) => {
    setSelectedBarriers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <AppShell
      onBack={() => onNavigate('/home?state=returning')}
      showBottomNav
      activeTab="home"
      onSelectTab={(t) => handleTabNav(t, onNavigate)}
      primaryAction={{
        label: en.systemStates.backToHome,
        onClick: () => onNavigate('/home?state=returning'),
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.followUp.title}</h1>

        {savedBannerMsg ? (
          <Card className="flex items-start gap-12 bg-primary-tint border-2-primary">
            <Icon name="calendar-check" size={20} className="text-primary shrink-0" />
            <p className="type-body text-ink">{savedBannerMsg}</p>
          </Card>
        ) : null}

        {yesView ? (
          <Card hero className="flex flex-col gap-12">
            <FeatureIconCircle name="circle-check" />
            <h2 className="type-h2 text-ink">{en.followUp.yesNextTitle}</h2>
            <Button
              variant="secondary"
              onClick={() => onNavigate('/p21-add-results?mode=type')}
            >
              {en.followUp.yesNext1}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('/p26-trend')}
            >
              {en.followUp.yesNext2}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('/home?state=returning')}
            >
              {en.followUp.yesNext3}
            </Button>
          </Card>
        ) : (
          <Card hero className="flex flex-col gap-12">
            <h2 className="type-h2 text-ink">{en.followUp.question}</h2>
            <p className="type-supporting text-ink-2">{en.followUp.helper}</p>
            <div className="flex flex-col gap-8">
              <Button variant="secondary" onClick={() => setYesView(true)}>
                {en.followUp.optYes}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setBookedSheetOpen(true)}
              >
                {en.followUp.optBooked}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setBarriersSheetOpen(true)}
              >
                {en.followUp.optNotYet}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setBarriersSheetOpen(true)}
              >
                {en.followUp.optDecidedNo}
              </Button>
              <Button
                variant="secondary"
                onClick={() => onNavigate('/home?state=returning')}
              >
                {en.followUp.optPreferNot}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Booked date-picker Sheet */}
      <Sheet
        open={bookedSheetOpen}
        onClose={() => setBookedSheetOpen(false)}
        title={en.followUp.bookedSheetTitle}
      >
        <TextField
          id="p30-booked-date"
          label={en.followUp.bookedDateLabel}
          type="date"
          value={bookedDate}
          onChange={setBookedDate}
        />
        <p className="type-supporting text-ink-2">
          {en.followUp.bookedSavedMsg}
        </p>
        <Button
          variant="primary"
          onClick={() => {
            setBookedSheetOpen(false);
            setSavedBannerMsg(
              `Visit booked for ${bookedDate}. ${en.followUp.bookedSavedMsg}`
            );
          }}
        >
          {en.followUp.saveAction}
        </Button>
      </Sheet>

      {/* What's getting in the way? Chips Sheet */}
      <Sheet
        open={barriersSheetOpen}
        onClose={() => setBarriersSheetOpen(false)}
        title={en.followUp.barriersSheetTitle}
      >
        <p className="type-supporting text-ink-2">
          {en.followUp.barriersHelper}
        </p>
        <Chips
          options={BARRIER_OPTIONS}
          selectedIds={selectedBarriers}
          onToggle={toggleBarrier}
        />
        <Button
          variant="primary"
          onClick={() => {
            setBarriersSheetOpen(false);
            setSavedBannerMsg(
              'Noted. We will keep your next check-in gentle and on your schedule.'
            );
          }}
        >
          {en.followUp.saveAction}
        </Button>
      </Sheet>
    </AppShell>
  );
};
