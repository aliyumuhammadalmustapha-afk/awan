import React, { useState } from 'react';
import {
  AttachedFileInfo,
  Button,
  Card,
  EmptyState,
  FeatureIconCircle,
  FileAttach,
  Icon,
  InlineError,
  LevelChip,
  ListRow,
  ProgressBar,
  SelectCard,
  Sheet,
  SourceTag,
  SourceTagKind,
  Stepper,
  Switch,
  TabId,
  TextField,
} from '../../ui';
import { AppShell } from '../../ui/AppShell';
import { useCheckInStore } from '../../lib/store';
import {
  AdviceLevel,
  EvaluationOutput,
  evaluateCheckIn,
  isPlausibleLabValue,
  LabResultInput,
} from '../../engine/evaluator';
import { en } from '../../i18n';

export interface CheckInScreenProps {
  onNavigate: (path: string) => void;
  queryState?: string;
}

export interface QuestionDef {
  id: string;
  title: string;
  whyWeAsk: string;
  isKey?: boolean;
  isRecalled?: boolean;
  kind: 'single' | 'multi' | 'stepper';
  options?: Array<{ id: string; label: string; desc?: string }>;
  showIf: (whoFor: string, stage: string, answers: Record<string, any>) => boolean;
}

export const QUESTION_BANK: QuestionDef[] = [
  {
    id: 'upcoming_fertility_affecting_treatment',
    title: 'Do you have a planned or recent medical treatment that may affect fertility?',
    whyWeAsk:
      'Certain treatments such as chemotherapy, radiation or surgery can affect fertility rapidly, so speaking with a care team before treatment begins keeps options open (rule X1).',
    isKey: true,
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes, planned or recent' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: () => true,
  },
  {
    id: 'currently_trying',
    title: 'Are you currently trying for a family?',
    whyWeAsk:
      'Because you selected "Something else" for your stage, knowing whether you are currently trying helps apply the right timing guideline.',
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes' },
    ],
    showIf: (_who, stage) => stage === 'something_else',
  },
  {
    id: 'trying_duration_months',
    title: 'How many months have you been trying?',
    whyWeAsk:
      'Public guidelines usually suggest an assessment after 12 months of trying under age 35, or after 6 months at age 35 and over (rules T1, T2, T5, M4).',
    isKey: true,
    kind: 'stepper',
    showIf: (_who, stage, answers) =>
      stage === 'trying' || (stage === 'something_else' && answers['currently_trying'] === 'yes'),
  },
  {
    id: 'cycles_outside_range_12m',
    title: 'In the past 12 months, how often were your cycles shorter than 21 days or longer than 35 days?',
    whyWeAsk:
      'Having 3 or more cycles outside the typical 21 to 35 day range can be an early sign of ovulation shifts worth mentioning at a routine visit (rule F1).',
    isKey: true,
    kind: 'single',
    options: [
      { id: 'none', label: 'None, or 1 to 2 cycles' },
      { id: 'three_or_more', label: '3 or more cycles outside 21 to 35 days' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: (who) => who !== 'male',
  },
  {
    id: 'periods_stopped_3m',
    title: 'Have your periods stopped for 3 months or more (not due to pregnancy or contraception)?',
    whyWeAsk:
      'Periods pausing for 3 months or more is a signal to speak with a clinician soon rather than waiting (rule F2).',
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes, 3 months or more' },
    ],
    showIf: (who) => who !== 'male',
  },
  {
    id: 'disruptive_pain',
    title: 'Do you have period or pelvic pain that disrupts your daily life, work or sleep?',
    whyWeAsk:
      'Pain that interferes with daily life is often overlooked for years and deserves a calm conversation with a clinician (rule F3).',
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes, it disrupts my day' },
    ],
    showIf: (who) => who !== 'male',
  },
  {
    id: 'diagnosed_conditions',
    title: 'Has a clinician ever told you that you have any of these conditions?',
    whyWeAsk:
      'Known conditions such as PCOS, endometriosis or thyroid disorders can shorten the recommended wait before speaking with a clinician when preparing or trying (rule F4).',
    kind: 'multi',
    options: [
      { id: 'pcos', label: 'PCOS (polycystic ovary syndrome)' },
      { id: 'endometriosis', label: 'Endometriosis' },
      { id: 'thyroid', label: 'Thyroid condition' },
      { id: 'none', label: 'None of these' },
    ],
    showIf: (who) => who !== 'male',
  },
  {
    id: 'pelvic_history',
    title: 'Have you ever had pelvic surgery or a diagnosed pelvic infection?',
    whyWeAsk:
      'Past pelvic surgery or infection is useful history to review early with a clinician (rule F5).',
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes' },
    ],
    showIf: (who) => who !== 'male',
  },
  {
    id: 'cycle_compare_last_year',
    title: 'Compared with a year ago, how do your cycles feel?',
    whyWeAsk:
      'Even without a calendar log, noticing that your cycles feel less regular than a year ago helps show direction over time (rule F6).',
    isRecalled: true,
    kind: 'single',
    options: [
      { id: 'same', label: 'About the same' },
      { id: 'less_regular', label: 'Less regular than a year ago' },
      { id: 'more_regular', label: 'More regular' },
    ],
    showIf: (who) => who !== 'male',
  },
  {
    id: 'testicular_history',
    title: 'Have you ever had an undescended testicle, testicular injury, infection, varicocele or surgery?',
    whyWeAsk:
      'Past testicular conditions are a key part of male reproductive history and help guide earlier evaluation when preparing or trying (rule M1).',
    isKey: true,
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes' },
    ],
    showIf: (who) => who === 'male' || who === 'topics' || who === 'something_else',
  },
  {
    id: 'sexual_function_difficulty',
    title: 'Do you experience ongoing difficulty with erections or ejaculation?',
    whyWeAsk:
      'Ongoing sexual function difficulty is a practical, common reason for a private routine visit with a clinician (rule M2).',
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes' },
    ],
    showIf: (who) => who === 'male' || who === 'topics' || who === 'something_else',
  },
  {
    id: 'testosterone_use',
    title: 'Are you taking external testosterone, anabolic steroids or similar hormone products?',
    whyWeAsk:
      'External testosterone can suppress sperm production. Never stop prescribed medication without speaking to your prescriber (rule M5).',
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes' },
    ],
    showIf: (who) => who === 'male' || who === 'topics' || who === 'something_else',
  },
  {
    id: 'family_history_fertility',
    title: 'Does a close relative have a history of early menopause (before 40) or severe fertility difficulty?',
    whyWeAsk:
      'First-degree family history provides helpful background context when preparing or trying (rule X3).',
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: () => true,
  },
  {
    id: 'habits_smoking_alcohol',
    title: 'Do you currently smoke, vape or drink alcohol heavily?',
    whyWeAsk:
      'Habits never change your urgency level, but they allow Awan to highlight practical changes that support reproductive health (rule X2).',
    kind: 'single',
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes' },
    ],
    showIf: () => true,
  },
];

function handleTabNav(tab: TabId, onNavigate: (path: string) => void) {
  if (tab === 'home') onNavigate('/home');
  if (tab === 'results') onNavigate('/results');
  if (tab === 'share') onNavigate('/share');
  if (tab === 'account') onNavigate('/account');
}

function formatFutureDate(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * 86400000);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* =====================================================================
   P18: Home (empty state and returning state, bottom nav visible)
   ===================================================================== */
export const P18HomeScreen: React.FC<CheckInScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { nickname, checkInHistory, latestEvaluation } = useCheckInStore();
  const isReturning =
    queryState === 'returning' ||
    (queryState !== 'empty' && (checkInHistory.length > 0 || latestEvaluation !== null));

  const initialName = (nickname || 'Layla').trim();
  const avatarInitials = initialName.slice(0, 2);

  // Fallback synthetic evaluation if ?state=returning is visited directly
  const activeEval: EvaluationOutput =
    latestEvaluation ||
    checkInHistory[0]?.output ||
    evaluateCheckIn({
      profile: { questionSet: 'female', pathway: 'preparing', ageYears: 28 },
      answers: {
        upcoming_fertility_affecting_treatment: 'no',
        cycles_outside_range_12m: 'three_or_more',
      },
    });

  const lastDate = checkInHistory[0]?.date || '19 Nov 2026';
  const recheckDate = formatFutureDate(activeEval.recheckInDays);

  return (
    <AppShell
      showBottomNav
      activeTab="home"
      onSelectTab={(t) => handleTabNav(t, onNavigate)}
      primaryAction={{
        label: en.home.checkMyDirection,
        onClick: () => onNavigate('/p19-checkin-start'),
      }}
      secondaryAction={
        isReturning
          ? {
              label: `${en.home.anythingChangedPrefix} ${lastDate}?`,
              onClick: () => onNavigate('/p20-questions'),
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <span className="type-body-medium text-primary">{en.app.name}</span>
        <button
          type="button"
          aria-label={en.nav.account}
          onClick={() => onNavigate('/account')}
          className="icon-circle-48 type-body-medium border-none cursor-pointer"
        >
          {avatarInitials}
        </button>
      </div>

      <h1 className="type-h1 text-ink">
        {en.home.greetingPrefix} {initialName}
      </h1>

      {!isReturning ? (
        <EmptyState
          icon="calendar-check"
          message={en.home.emptyMessage}
          actionLabel={en.home.checkMyDirection}
          onAction={() => onNavigate('/p19-checkin-start')}
        />
      ) : (
        <div className="flex flex-col gap-16">
          <Card hero className="flex flex-col gap-12">
            <div className="flex items-center justify-between gap-8 flex-wrap">
              <span className="type-supporting-medium text-ink-2">
                {en.home.latestCheckInTitle} · {lastDate}
              </span>
              <LevelChip level={activeEval.level} />
            </div>
            <p className="type-body-medium text-ink">{activeEval.headline}</p>
            <p className="type-supporting text-ink-2">{activeEval.reason}</p>
            <div className="pt-16 border-t-1 flex flex-col gap-4">
              <span className="type-supporting text-ink">
                {en.home.whatChangedPrefix}{' '}
                {checkInHistory.length > 1
                  ? en.home.whatChangedSteady
                  : en.home.whatChangedInitial}
              </span>
            </div>
          </Card>

          <ListRow
            icon="calendar-check"
            title={en.home.nextCheckInTitle}
            supporting={`${en.resultCard.recheckPrefix} ${recheckDate}`}
            showChevron
            onClick={() => onNavigate('/p26-trend')}
          />

          <Card className="flex flex-col gap-12">
            <div className="flex items-center gap-12">
              <FeatureIconCircle name="message-circle" />
              <div className="flex flex-col gap-4 flex-1">
                <span className="type-body-medium text-ink">
                  {en.home.followUpTitle}
                </span>
                <span className="type-supporting text-ink-2">
                  {en.home.followUpBody}
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => onNavigate('/p30-follow-up')}
            >
              {en.home.followUpAction}
            </Button>
          </Card>
        </div>
      )}
    </AppShell>
  );
};

/* =====================================================================
   P19: Check-in start
   ===================================================================== */
export const P19CheckInStartScreen: React.FC<CheckInScreenProps> = ({
  onNavigate,
}) => (
  <AppShell
    onBack={() => onNavigate('/home')}
    primaryAction={{
      label: en.checkin.start.action,
      onClick: () => onNavigate('/p20-questions'),
    }}
  >
    <div className="flex-1 flex flex-col justify-center gap-16 py-24">
      <FeatureIconCircle name="list-checks" />
      <h1 className="type-h1 text-ink">{en.checkin.start.title}</h1>
      <p className="type-h2 text-ink">{en.checkin.start.body}</p>
      <p className="type-body text-ink-2">{en.checkin.start.helper}</p>
    </div>
  </AppShell>
);

/* =====================================================================
   P20: Question screen (TopBar back + Save and finish later, ProgressBar,
        expandable Why we ask, Skip, Next)
   ===================================================================== */
export const P20QuestionsScreen: React.FC<CheckInScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { whoFor, stage, answers, setAnswer } = useCheckInStore();
  const activeQuestions = QUESTION_BANK.filter((q) =>
    q.showIf(whoFor || 'female', stage || 'preparing', answers)
  );

  const initialIdx = queryState === 'stepper'
    ? Math.max(0, activeQuestions.findIndex((q) => q.kind === 'stepper'))
    : 0;
  const [idx, setIdx] = useState(initialIdx >= 0 ? initialIdx : 0);
  const [whyOpen, setWhyOpen] = useState(true);

  const currentQ = activeQuestions[idx] || activeQuestions[0];
  const progressPct = Math.round(((idx + 1) / activeQuestions.length) * 100);
  const currentVal = answers[currentQ.id];

  const advance = () => {
    if (idx < activeQuestions.length - 1) {
      setIdx(idx + 1);
    } else {
      onNavigate('/p21-add-results');
    }
  };

  const handleBack = () => {
    if (idx > 0) {
      setIdx(idx - 1);
    } else {
      onNavigate('/p19-checkin-start');
    }
  };

  return (
    <AppShell
      onBack={handleBack}
      topRightAction={{
        label: en.common.saveAndFinishLater,
        onClick: () => onNavigate('/home'),
      }}
      primaryAction={{
        label: en.common.next,
        onClick: advance,
      }}
      secondaryAction={{
        label: en.common.skip,
        onClick: () => {
          setAnswer(currentQ.id, 'skipped');
          advance();
        },
      }}
    >
      <div className="flex flex-col gap-16">
        <div className="flex items-center justify-between">
          <span className="type-caption-medium text-ink-2">
            Question {idx + 1} of {activeQuestions.length}
          </span>
          {currentQ.isRecalled ? <SourceTag kind="recalled" /> : null}
        </div>
        <ProgressBar value={progressPct} label="Check-in question progress" />

        <h1 className="type-h1 text-ink">{currentQ.title}</h1>

        {currentQ.kind === 'stepper' ? (
          <Stepper
            label="Months actively trying"
            value={typeof currentVal === 'number' ? currentVal : 6}
            onChange={(val) => setAnswer(currentQ.id, val)}
          />
        ) : currentQ.kind === 'multi' ? (
          <div className="flex flex-col gap-8">
            {(currentQ.options || []).map((opt) => {
              const arr: string[] = Array.isArray(currentVal) ? currentVal : [];
              const selected = arr.includes(opt.id);
              return (
                <SelectCard
                  key={opt.id}
                  multi
                  title={opt.label}
                  selected={selected}
                  onSelect={() => {
                    if (opt.id === 'none') {
                      setAnswer(currentQ.id, ['none']);
                    } else {
                      const clean = arr.filter((x) => x !== 'none');
                      const next = selected
                        ? clean.filter((x) => x !== opt.id)
                        : [...clean, opt.id];
                      setAnswer(currentQ.id, next);
                    }
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {(currentQ.options || []).map((opt) => (
              <SelectCard
                key={opt.id}
                title={opt.label}
                description={opt.desc}
                selected={currentVal === opt.id}
                onSelect={() => setAnswer(currentQ.id, opt.id)}
              />
            ))}
          </div>
        )}

        <Card className="flex flex-col gap-8">
          <button
            type="button"
            onClick={() => setWhyOpen(!whyOpen)}
            aria-expanded={whyOpen}
            className="w-full flex items-center justify-between bg-surface border-none cursor-pointer text-start"
          >
            <span className="type-supporting-medium text-primary">
              {en.common.whyWeAsk}
            </span>
            <Icon name="info" size={16} className="text-primary" />
          </button>
          {whyOpen ? (
            <p className="type-supporting text-ink-2">{currentQ.whyWeAsk}</p>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P21: Add results (optional: chooser, type form, attach flow with
        plausibility warning and unverified source tag)
   ===================================================================== */
const LAB_TESTS = [
  { id: 'AMH', label: 'AMH (ng/mL)', unit: 'ng/mL', defaultLow: '1.0', defaultHigh: '4.5' },
  { id: 'FSH', label: 'FSH (IU/L)', unit: 'IU/L', defaultLow: '3.5', defaultHigh: '12.5' },
  {
    id: 'semen_concentration',
    label: 'Semen concentration (million/mL)',
    unit: 'million/mL',
    defaultLow: '16',
    defaultHigh: '200',
  },
  {
    id: 'semen_motility',
    label: 'Semen motility (%)',
    unit: '%',
    defaultLow: '42',
    defaultHigh: '100',
  },
];

export const P21AddResultsScreen: React.FC<CheckInScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { addResult } = useCheckInStore();
  const [mode, setMode] = useState<'choose' | 'type' | 'attach'>(
    queryState === 'type'
      ? 'type'
      : queryState === 'attach' || queryState === 'unusual'
      ? 'attach'
      : 'choose'
  );
  const [testId, setTestId] = useState('AMH');
  const [valStr, setValStr] = useState(queryState === 'unusual' ? '85' : '1.8');
  const [refLowStr, setRefLowStr] = useState('1.0');
  const [refHighStr, setRefHighStr] = useState('4.5');
  const [dateStr, setDateStr] = useState('2026-10-15');
  const [confirmedUnusual, setConfirmedUnusual] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFileInfo | null>(
    queryState === 'attach' || queryState === 'unusual'
      ? {
          name: 'hormone_panel_report.pdf',
          sizeBytes: 412000,
          type: 'application/pdf',
        }
      : null
  );

  const selectedTest = LAB_TESTS.find((t) => t.id === testId) || LAB_TESTS[0];
  const numericVal = Number(valStr);
  const plausible = isPlausibleLabValue(testId, numericVal);

  const handleSaveResult = () => {
    const entry: LabResultInput = {
      id: `res-${Date.now()}`,
      testType: testId,
      value: Number.isNaN(numericVal) ? 0 : numericVal,
      unit: selectedTest.unit,
      refLow: Number(refLowStr) || 0,
      refHigh: Number(refHighStr) || 100,
      date: dateStr,
      source: mode === 'attach' ? 'lab-uploaded-unverified' : 'lab-reported',
      confirmed: plausible || confirmedUnusual,
    };
    addResult(entry);
    onNavigate('/p22-own-words');
  };

  if (mode === 'choose') {
    return (
      <AppShell
        onBack={() => onNavigate('/p20-questions')}
        primaryAction={{
          label: en.common.skipForNow,
          onClick: () => onNavigate('/p22-own-words'),
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.checkin.addResults.title}</h1>
          <p className="type-body text-ink-2">
            {en.checkin.addResults.subtitle}
          </p>
          <div className="flex flex-col gap-12">
            <ListRow
              icon="file-text"
              title={en.checkin.addResults.typeRowTitle}
              supporting={en.checkin.addResults.typeRowDesc}
              showChevron
              onClick={() => setMode('type')}
            />
            <ListRow
              icon="paperclip"
              title={en.checkin.addResults.attachRowTitle}
              supporting={en.checkin.addResults.attachRowDesc}
              showChevron
              onClick={() => setMode('attach')}
            />
            <ListRow
              icon="chevron-right"
              title={en.checkin.addResults.skipRowTitle}
              supporting={en.checkin.addResults.skipRowDesc}
              showChevron
              onClick={() => onNavigate('/p22-own-words')}
            />
          </div>
          <p className="type-supporting text-ink-2">
            {en.checkin.addResults.ageNotice}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      onBack={() => setMode('choose')}
      primaryAction={{
        label: en.checkin.addResults.saveAction,
        onClick: handleSaveResult,
      }}
      secondaryAction={{
        label: en.common.skipForNow,
        onClick: () => onNavigate('/p22-own-words'),
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.checkin.addResults.title}</h1>

        {mode === 'attach' ? (
          <div className="flex flex-col gap-12">
            <div>
              <SourceTag kind="lab-uploaded-unverified" />
            </div>
            <p className="type-supporting text-ink-2">
              {en.checkin.addResults.attachHelper}
            </p>
            <FileAttach
              file={attachedFile}
              onSelectFile={setAttachedFile}
              onFallbackTypeValues={() => setMode('type')}
            />
          </div>
        ) : (
          <div>
            <SourceTag kind="lab-reported" />
          </div>
        )}

        <div className="flex flex-col gap-8">
          <label
            htmlFor="lab-test-select"
            className="type-supporting-medium text-ink"
          >
            Test name and unit
          </label>
          <select
            id="lab-test-select"
            value={testId}
            onChange={(e) => {
              const next = LAB_TESTS.find((t) => t.id === e.target.value);
              setTestId(e.target.value);
              if (next) {
                setRefLowStr(next.defaultLow);
                setRefHighStr(next.defaultHigh);
              }
            }}
            className="min-h-tap px-12 bg-surface border-1 radius-control type-body text-ink"
          >
            {LAB_TESTS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <TextField
            id="lab-val"
            label={`Value (${selectedTest.unit})`}
            value={valStr}
            onChange={setValStr}
          />
          <TextField
            id="lab-date"
            label="Test date"
            type="date"
            value={dateStr}
            onChange={setDateStr}
          />
        </div>

        <div className="grid grid-cols-2 gap-12">
          <TextField
            id="lab-ref-low"
            label="Lab range low"
            value={refLowStr}
            onChange={setRefLowStr}
          />
          <TextField
            id="lab-ref-high"
            label="Lab range high"
            value={refHighStr}
            onChange={setRefHighStr}
          />
        </div>

        {!plausible ? (
          <div className="flex flex-col gap-8">
            <InlineError message={en.checkin.addResults.plausibilityWarning} />
            <SelectCard
              compact
              multi
              title={en.checkin.addResults.confirmPlausible}
              selected={confirmedUnusual}
              onSelect={() => setConfirmedUnusual(!confirmedUnusual)}
            />
          </div>
        ) : null}

        <p className="type-supporting text-ink-2">
          {en.checkin.addResults.ageNotice}
        </p>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P22: Own words (optional, 500 counter, Include in Doctor Pass switch,
        fixed urgent care card)
   ===================================================================== */
export const P22OwnWordsScreen: React.FC<CheckInScreenProps> = ({
  onNavigate,
}) => {
  const {
    ownWordsNote,
    setOwnWordsNote,
    includeNoteInPass,
    setIncludeNoteInPass,
  } = useCheckInStore();

  return (
    <AppShell
      onBack={() => onNavigate('/p21-add-results')}
      primaryAction={{
        label: en.common.continue,
        onClick: () => onNavigate('/p23-review'),
      }}
      secondaryAction={{
        label: en.common.skip,
        onClick: () => onNavigate('/p23-review'),
      }}
    >
      <div className="flex flex-col gap-16">
        <div className="flex items-center justify-between">
          <h1 className="type-h1 text-ink">{en.checkin.ownWords.title}</h1>
          <span className="type-supporting text-ink-2">
            {en.checkin.ownWords.subtitle}
          </span>
        </div>

        <TextField
          id="p22-own-words-textarea"
          label={en.checkin.ownWords.label}
          value={ownWordsNote}
          onChange={setOwnWordsNote}
          maxLength={500}
          multiline
          placeholder={en.checkin.ownWords.placeholder}
          helper={en.checkin.ownWords.helper}
        />

        <Card>
          <Switch
            checked={includeNoteInPass}
            onChange={setIncludeNoteInPass}
            label={en.checkin.ownWords.includeSwitchLabel}
            description={en.checkin.ownWords.includeSwitchDesc}
          />
        </Card>

        <Card className="flex items-start gap-12">
          <Icon name="info" size={20} className="text-primary shrink-0" />
          <p className="type-supporting-medium text-ink">
            {en.checkin.ownWords.urgentCard}
          </p>
        </Card>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P23: Review (grouped ListRows with SourceTag and Edit, See my result)
   ===================================================================== */
export const P23ReviewScreen: React.FC<CheckInScreenProps> = ({
  onNavigate,
}) => {
  const {
    whoFor,
    stage,
    answers,
    results,
    ownWordsNote,
    finalizeCheckIn,
  } = useCheckInStore();

  const activeQuestions = QUESTION_BANK.filter((q) =>
    q.showIf(whoFor || 'female', stage || 'preparing', answers)
  );

  const formatAnswer = (val: any): string => {
    if (val === undefined || val === null || val === 'skipped' || val === '') {
      return 'Skipped';
    }
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'number') return `${val} months`;
    return String(val).replace(/_/g, ' ');
  };

  return (
    <AppShell
      onBack={() => onNavigate('/p22-own-words')}
      primaryAction={{
        label: en.checkin.review.action,
        onClick: () => {
          finalizeCheckIn();
          onNavigate('/p24-result');
        },
      }}
    >
      <div className="flex flex-col gap-24">
        <div className="flex flex-col gap-4">
          <h1 className="type-h1 text-ink">{en.checkin.review.title}</h1>
          <p className="type-body text-ink-2">{en.checkin.review.subtitle}</p>
        </div>

        <div className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">
            {en.checkin.review.answersSection}
          </h2>
          {activeQuestions.slice(0, 6).map((q) => {
            const tagKind: SourceTagKind = q.isRecalled
              ? 'recalled'
              : 'self-reported';
            return (
              <ListRow
                key={q.id}
                title={q.title}
                supporting={`Answer: ${formatAnswer(answers[q.id])}`}
                endSlot={
                  <div className="flex items-center gap-8">
                    <SourceTag kind={tagKind} />
                    <Button
                      variant="text"
                      fullWidth={false}
                      onClick={() => onNavigate('/p20-questions')}
                    >
                      {en.common.edit}
                    </Button>
                  </div>
                }
              />
            );
          })}
        </div>

        <div className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">
            {en.checkin.review.resultsSection}
          </h2>
          {results.length === 0 ? (
            <ListRow
              title={en.checkin.review.noResults}
              endSlot={
                <Button
                  variant="text"
                  fullWidth={false}
                  onClick={() => onNavigate('/p21-add-results')}
                >
                  {en.common.edit}
                </Button>
              }
            />
          ) : (
            results.map((r) => (
              <ListRow
                key={r.id}
                title={`${r.testType}: ${r.value} ${r.unit}`}
                supporting={`Lab range: ${r.refLow}–${r.refHigh} ${r.unit} · ${r.date}`}
                endSlot={
                  <div className="flex items-center gap-8">
                    <SourceTag kind={r.source} />
                    <Button
                      variant="text"
                      fullWidth={false}
                      onClick={() => onNavigate('/p21-add-results')}
                    >
                      {en.common.edit}
                    </Button>
                  </div>
                }
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">{en.checkin.review.noteSection}</h2>
          <ListRow
            title={ownWordsNote ? ownWordsNote : en.checkin.review.noNote}
            endSlot={
              <div className="flex items-center gap-8">
                <SourceTag kind="self-reported" />
                <Button
                  variant="text"
                  fullWidth={false}
                  onClick={() => onNavigate('/p22-own-words')}
                >
                  {en.common.edit}
                </Button>
              </div>
            }
          />
        </div>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P24: Result Card (hero) — large LevelChip, H1 headline, one-line
        reason, 3 cards (What can change, What can't change, What we
        don't know yet [max 3 gaps + how to fill it]), How sure we are,
        rule trace caption, re-check line, level-matched primary action,
        Add a result, Share with a doctor, Need support?
   ===================================================================== */
function getDemoEvaluationForLevel(level: AdviceLevel): EvaluationOutput {
  switch (level) {
    case 'L0':
      return evaluateCheckIn({
        profile: { questionSet: 'female', pathway: 'thinking_ahead', ageYears: 27 },
        answers: {
          upcoming_fertility_affecting_treatment: 'no',
          cycles_outside_range_12m: 'none',
          disruptive_pain: 'no',
          family_history_fertility: 'no',
          habits_smoking_alcohol: 'yes',
        },
      });
    case 'L2':
      return evaluateCheckIn({
        profile: { questionSet: 'female', pathway: 'trying', ageYears: 36 },
        answers: {
          upcoming_fertility_affecting_treatment: 'no',
          trying_duration_months: 7,
          cycles_outside_range_12m: 'three_or_more',
        },
      });
    case 'L3':
      return evaluateCheckIn({
        profile: { questionSet: 'male', pathway: 'thinking_ahead', ageYears: 29 },
        answers: {
          upcoming_fertility_affecting_treatment: 'yes',
          testicular_history: 'no',
        },
      });
    case 'U':
      return evaluateCheckIn({
        profile: { questionSet: 'female', pathway: 'thinking_ahead', ageYears: 27 },
        answers: {
          upcoming_fertility_affecting_treatment: 'no',
        },
      });
    case 'L1':
    default:
      return evaluateCheckIn({
        profile: { questionSet: 'female', pathway: 'preparing', ageYears: 29 },
        answers: {
          upcoming_fertility_affecting_treatment: 'no',
          cycles_outside_range_12m: 'three_or_more',
          diagnosed_conditions: ['pcos'],
        },
      });
  }
}

export const P24ResultCardScreen: React.FC<CheckInScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { latestEvaluation } = useCheckInStore();
  const [supportOpen, setSupportOpen] = useState(false);

  const forcedLevel = ['L0', 'L1', 'L2', 'L3', 'U'].includes(queryState || '')
    ? (queryState as AdviceLevel)
    : undefined;

  const result: EvaluationOutput = forcedLevel
    ? getDemoEvaluationForLevel(forcedLevel)
    : latestEvaluation || getDemoEvaluationForLevel('L1');

  const recheckDate = formatFutureDate(result.recheckInDays);
  const rulesCaption =
    result.firedRules.length > 0
      ? `${en.resultCard.basedOnRulesPrefix} ${result.firedRules.join(' and ')} · ${en.app.notADiagnosis}`
      : `${en.resultCard.basedOnBaseline} · ${en.app.notADiagnosis}`;

  return (
    <AppShell
      onBack={() => onNavigate('/p23-review')}
      primaryAction={{
        label: result.primaryAction.label,
        onClick: () => {
          if (result.level === 'U') {
            onNavigate('/p20-questions');
          } else {
            onNavigate('/p25-next-step');
          }
        },
      }}
    >
      <div className="flex flex-col gap-16">
        {/* Hero Header */}
        <Card hero className="flex flex-col gap-12 animate-fade-up">
          <div>
            <LevelChip level={result.level} large />
          </div>
          <h1 className="type-h1 text-ink">{result.headline}</h1>
          <p className="type-body text-ink-2">{result.reason}</p>
        </Card>

        {/* Card 1: What can change */}
        <Card className="flex flex-col gap-8 animate-fade-up animate-stagger-1">
          <h2 className="type-h2 text-ink">{en.resultCard.whatCanChange}</h2>
          {result.whatCanChange.map((item, i) => (
            <p key={i} className="type-body text-ink-2">
              {item}
            </p>
          ))}
        </Card>

        {/* Card 2: What can't change */}
        <Card className="flex flex-col gap-8 animate-fade-up animate-stagger-2">
          <h2 className="type-h2 text-ink">{en.resultCard.whatCantChange}</h2>
          {result.whatCantChange.map((item, i) => (
            <p key={i} className="type-body text-ink-2">
              {item}
            </p>
          ))}
        </Card>

        {/* Card 3: What we don't know yet (missing data gaps, max 3) */}
        <Card className="flex flex-col gap-12 animate-fade-up animate-stagger-3">
          <h2 className="type-h2 text-ink">{en.resultCard.whatWeDontKnow}</h2>
          {result.gaps.length === 0 ? (
            <p className="type-body text-ink-2">{en.resultCard.noGaps}</p>
          ) : (
            result.gaps.map((g) => (
              <div
                key={g.id}
                className="flex flex-col gap-4 pb-16 border-b-1"
              >
                <p className="type-body text-ink">{g.reason}</p>
                <div>
                  <Button
                    variant="text"
                    fullWidth={false}
                    onClick={() =>
                      onNavigate(
                        g.id.includes('result')
                          ? '/p21-add-results'
                          : '/p20-questions'
                      )
                    }
                  >
                    {g.howToFill}
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Confidence, rule trace caption, re-check date & secondary links */}
        <Card className="flex flex-col gap-8 animate-fade-up animate-stagger-4">
          <div className="flex items-center justify-between">
            <span className="type-supporting-medium text-ink-2">
              {en.resultCard.howSureWeAre}
            </span>
            <span className="type-body-medium text-ink">
              {result.confidence}
            </span>
          </div>
          <p className="type-supporting text-ink">
            {en.resultCard.recheckPrefix} {recheckDate}.
          </p>
          <p className="type-caption text-ink-2">{rulesCaption}</p>
        </Card>

        <div className="flex items-center justify-between flex-wrap gap-8">
          <Button
            variant="text"
            fullWidth={false}
            onClick={() => onNavigate('/p21-add-results')}
          >
            {en.resultCard.addAResult}
          </Button>
          <Button
            variant="text"
            fullWidth={false}
            onClick={() => onNavigate('/p29-create-pass')}
          >
            {en.resultCard.shareWithDoctor}
          </Button>
          <Button
            variant="text"
            fullWidth={false}
            onClick={() => setSupportOpen(true)}
          >
            {en.resultCard.needSupport}
          </Button>
        </div>
      </div>

      <Sheet
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        title={en.resultCard.supportSheetTitle}
      >
        <p className="type-body text-ink">{en.resultCard.supportSheetBody}</p>
        <Button variant="primary" onClick={() => setSupportOpen(false)}>
          {en.common.close}
        </Button>
      </Sheet>
    </AppShell>
  );
};

/* =====================================================================
   P25: Next Step (checklist Card, Questions to ask Card with 3 items,
        Remind me to follow up Switch)
   ===================================================================== */
export const P25NextStepScreen: React.FC<CheckInScreenProps> = ({
  onNavigate,
}) => {
  const { followUpReminderEnabled, setFollowUpReminderEnabled } =
    useCheckInStore();
  const [checkedItems, setCheckedItems] = useState<string[]>(['c1']);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <AppShell
      onBack={() => onNavigate('/p24-result')}
      primaryAction={{
        label: en.checkin.nextStep.action,
        onClick: () => onNavigate('/home?state=returning'),
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.checkin.nextStep.title}</h1>

        <Card className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">
            {en.checkin.nextStep.checklistTitle}
          </h2>
          <SelectCard
            compact
            multi
            title={en.checkin.nextStep.check1}
            selected={checkedItems.includes('c1')}
            onSelect={() => toggleItem('c1')}
          />
          <SelectCard
            compact
            multi
            title={en.checkin.nextStep.check2}
            selected={checkedItems.includes('c2')}
            onSelect={() => toggleItem('c2')}
          />
          <SelectCard
            compact
            multi
            title={en.checkin.nextStep.check3}
            selected={checkedItems.includes('c3')}
            onSelect={() => toggleItem('c3')}
          />
        </Card>

        <Card className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">
            {en.checkin.nextStep.questionsTitle}
          </h2>
          <p className="type-body text-ink">1. {en.checkin.nextStep.q1}</p>
          <p className="type-body text-ink">2. {en.checkin.nextStep.q2}</p>
          <p className="type-body text-ink">3. {en.checkin.nextStep.q3}</p>
        </Card>

        <Card>
          <Switch
            checked={followUpReminderEnabled}
            onChange={setFollowUpReminderEnabled}
            label={en.checkin.nextStep.remindSwitchLabel}
            description={en.checkin.nextStep.remindSwitchDesc}
          />
        </Card>
      </div>
    </AppShell>
  );
};
