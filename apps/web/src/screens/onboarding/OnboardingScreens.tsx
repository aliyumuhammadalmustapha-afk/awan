import React, { useState, useEffect } from 'react';
import {
  AwanMark,
  Button,
  Card,
  FeatureIconCircle,
  IconName,
  InlineError,
  MonthYearPicker,
  OtpBoxes,
  PhoneField,
  PinPad,
  SelectCard,
  Sheet,
  SourceTag,
  StepDots,
  Switch,
  TextField,
} from '../../ui';
import { AppShell } from '../../ui/AppShell';
import {
  useCheckInStore,
  WhoForOption,
  StageOption,
  ReminderFrequency,
} from '../../lib/store';
import { en } from '../../i18n';

export interface OnboardingScreenProps {
  onNavigate: (path: string) => void;
  queryState?: string;
}

/* =====================================================================
   P1: Welcome card (3-second choreographed sequence, tap to complete)
   ===================================================================== */
export const P1WelcomeScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { welcomePlayed, setWelcomePlayed } = useCheckInStore();
  const [instant, setInstant] = useState(
    welcomePlayed || queryState === 'instant'
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setWelcomePlayed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [setWelcomePlayed]);

  const letters = en.app.name.split('');
  const taglineWords = en.app.tagline.split(' ');

  return (
    <div
      onClick={() => {
        setInstant(true);
        setWelcomePlayed(true);
      }}
      className={instant ? 'welcome-instant' : ''}
    >
      <AppShell
        topRightAction={{
          label: en.common.skip,
          onClick: () => onNavigate('/p6-phone'),
        }}
        primaryAction={{
          label: en.common.next,
          onClick: () => onNavigate('/p2-how-it-works'),
        }}
        secondaryAction={{
          label: en.common.alreadyHaveAccountSignIn,
          onClick: () => onNavigate('/p6-phone?mode=signin'),
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-24 py-32">
          <AwanMark size={56} animated={!instant} />
          <h1 className="type-display text-ink" aria-label={en.app.name}>
            {letters.map((char, idx) => (
              <span
                key={idx}
                className={`welcome-letter welcome-letter-${idx}`}
              >
                {char}
              </span>
            ))}
          </h1>
          <p className="type-h2 text-ink" aria-label={en.app.tagline}>
            {taglineWords.map((w, idx) => (
              <span key={idx} className={`welcome-word welcome-word-${idx}`}>
                {w}
              </span>
            ))}
          </p>
          <p className="type-body text-ink-2 welcome-subline">
            {en.app.subline}
          </p>
          <div className="welcome-controls">
            <StepDots
              total={5}
              current={0}
              onSelect={(idx) => {
                if (idx === 0) onNavigate('/p1-welcome');
                if (idx === 1) onNavigate('/p2-how-it-works');
                if (idx === 2) onNavigate('/p3-how-it-works');
                if (idx === 3) onNavigate('/p4-how-it-works');
                if (idx === 4) onNavigate('/p5-how-it-works');
              }}
            />
          </div>
        </div>
      </AppShell>
    </div>
  );
};

/* =====================================================================
   P2 - P5: How it works cards (4 cards, swipe + horizontal transition)
   ===================================================================== */
export const P2ToP5HowItWorksScreen: React.FC<
  OnboardingScreenProps & { cardIndex: 0 | 1 | 2 | 3 }
> = ({ onNavigate, cardIndex }) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const cards = en.onboarding.howItWorks;
  const current = cards[cardIndex];
  const isLast = cardIndex === 3;

  const paths = [
    '/p2-how-it-works',
    '/p3-how-it-works',
    '/p4-how-it-works',
    '/p5-how-it-works',
  ];

  const handleNext = () => {
    if (!isLast) {
      onNavigate(paths[cardIndex + 1]);
    } else {
      onNavigate('/p6-phone');
    }
  };

  const handlePrev = () => {
    if (cardIndex === 0) {
      onNavigate('/p1-welcome');
    } else {
      onNavigate(paths[cardIndex - 1]);
    }
  };

  return (
    <div
      onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchStartX === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
        if (delta < -40) handleNext();
        if (delta > 40) handlePrev();
        setTouchStartX(null);
      }}
    >
      <AppShell
        onBack={handlePrev}
        topRightAction={{
          label: en.common.skip,
          onClick: () => onNavigate('/p6-phone'),
        }}
        primaryAction={{
          label: isLast ? en.common.getStarted : en.common.next,
          onClick: handleNext,
        }}
      >
        <div
          key={current.code}
          className="flex-1 flex flex-col items-center justify-center text-center gap-24 py-32 animate-fade-up"
        >
          <FeatureIconCircle name={current.icon as IconName} />
          <h1 className="type-h1 text-ink">{current.title}</h1>
          <p className="type-body text-ink-2">{current.body}</p>
          <StepDots
            total={4}
            current={cardIndex}
            onSelect={(idx) => onNavigate(paths[idx])}
          />
        </div>
      </AppShell>
    </div>
  );
};

/* =====================================================================
   P6: Phone number (+234 and +971 first, demo chip, invalid state)
   ===================================================================== */
export const P6PhoneScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { phoneCountry, phoneNumber, setPhone } = useCheckInStore();
  const [country, setCountry] = useState(phoneCountry || '+971');
  const [phone, setPhoneVal] = useState(
    queryState === 'error' ? '123' : phoneNumber || '50 123 4567'
  );
  const [error, setError] = useState<string | undefined>(
    queryState === 'error' ? en.onboarding.phone.error : undefined
  );

  const handleSubmit = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      setError(en.onboarding.phone.error);
      return;
    }
    setError(undefined);
    setPhone(country, phone);
    onNavigate(queryState === 'signin' ? '/p7-code?mode=signin' : '/p7-code');
  };

  return (
    <AppShell
      onBack={() => onNavigate('/p5-how-it-works')}
      topTitle={en.onboarding.phone.step}
      primaryAction={{
        label: en.onboarding.phone.action,
        onClick: handleSubmit,
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.onboarding.phone.title}</h1>
        <p className="type-body text-ink-2">{en.onboarding.phone.helper}</p>
        <div>
          <span className="inline-flex items-center gap-8 px-12 py-4 radius-pill bg-primary-tint text-primary type-supporting-medium">
            {en.onboarding.phone.demoChip}
          </span>
        </div>
        <PhoneField
          countryCode={country}
          onCountryChange={setCountry}
          phone={phone}
          onPhoneChange={(val) => {
            setPhoneVal(val);
            if (error) setError(undefined);
          }}
          error={error}
        />
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P7: 6-digit OTP Code (masked number, OtpBoxes, 30s timer, 123456 chip)
   ===================================================================== */
export const P7CodeScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { phoneCountry, phoneNumber, onboardingComplete } = useCheckInStore();
  const [code, setCode] = useState(
    queryState === 'error' ? '000000' : '123456'
  );
  const [error, setError] = useState<string | undefined>(
    queryState === 'error' ? en.onboarding.code.error : undefined
  );
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const rawDigits = (phoneNumber || '501234567').replace(/\D/g, '');
  const lastFour = rawDigits.slice(-4) || '4567';
  const masked = `${phoneCountry || '+971'} ••• ••• ${lastFour}`;

  const handleContinue = () => {
    if (code !== '123456') {
      setError(en.onboarding.code.error);
      return;
    }
    setError(undefined);
    if (queryState === 'signin' && onboardingComplete) {
      onNavigate('/p17-lock');
    } else {
      onNavigate('/p8-name');
    }
  };

  return (
    <AppShell
      onBack={() => onNavigate('/p6-phone')}
      topTitle={en.onboarding.code.step}
      primaryAction={{
        label: en.onboarding.code.action,
        onClick: handleContinue,
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.onboarding.code.title}</h1>
        <p className="type-body text-ink-2">
          {en.onboarding.code.sentToPrefix} {masked}
        </p>
        <div>
          <span className="inline-flex items-center gap-8 px-12 py-4 radius-pill bg-primary-tint text-primary type-supporting-medium">
            {en.onboarding.code.demoChip}
          </span>
        </div>
        <OtpBoxes
          value={code}
          onChange={(val) => {
            setCode(val);
            if (error) setError(undefined);
          }}
          error={error}
        />
        <div className="flex items-center justify-between">
          {secondsLeft > 0 ? (
            <span className="type-supporting text-ink-2">
              {en.onboarding.code.resendIn} {secondsLeft}s
            </span>
          ) : (
            <Button
              variant="text"
              fullWidth={false}
              onClick={() => setSecondsLeft(30)}
            >
              {en.onboarding.code.resendNow}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P8: Name / Nickname
   ===================================================================== */
export const P8NameScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
}) => {
  const { nickname, setNickname } = useCheckInStore();
  const [name, setName] = useState(nickname || 'Layla');
  const [error, setError] = useState<string | undefined>();

  const handleContinue = () => {
    if (!name.trim()) {
      setError(en.onboarding.name.error);
      return;
    }
    setNickname(name.trim());
    onNavigate('/p9-pin');
  };

  return (
    <AppShell
      onBack={() => onNavigate('/p7-code')}
      topTitle={en.onboarding.name.step}
      primaryAction={{
        label: en.common.continue,
        onClick: handleContinue,
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.onboarding.name.title}</h1>
        <TextField
          id="p8-nickname"
          label={en.onboarding.name.placeholder}
          value={name}
          onChange={(val) => {
            setName(val);
            if (error) setError(undefined);
          }}
          maxLength={40}
          helper={en.onboarding.name.helper}
          error={error}
          autoComplete="given-name"
        />
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P9: PIN Create & Confirm (PinPad, warning card, no biometrics)
   ===================================================================== */
export const P9PinScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { setPinCode } = useCheckInStore();
  const [mode, setMode] = useState<'create' | 'confirm'>(
    queryState === 'confirm' ? 'confirm' : 'create'
  );
  const [firstPin, setFirstPin] = useState('1234');
  const [pin, setPin] = useState(queryState === 'confirm' ? '1234' : '');
  const [error, setError] = useState<string | undefined>();

  const handleAction = () => {
    if (mode === 'create') {
      const candidate = pin.length === 4 ? pin : '1234';
      setFirstPin(candidate);
      setPin('');
      setMode('confirm');
      return;
    }
    const candidate = pin.length === 4 ? pin : firstPin;
    if (candidate !== firstPin) {
      setError(en.onboarding.pin.mismatchError);
      setPin('');
      return;
    }
    setPinCode(candidate);
    onNavigate('/p10-who');
  };

  return (
    <AppShell
      onBack={() => {
        if (mode === 'confirm') {
          setMode('create');
          setError(undefined);
        } else {
          onNavigate('/p8-name');
        }
      }}
      topTitle={en.onboarding.pin.step}
      primaryAction={{
        label:
          mode === 'create'
            ? en.onboarding.pin.createAction
            : en.onboarding.pin.confirmAction,
        onClick: handleAction,
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">
          {mode === 'create'
            ? en.onboarding.pin.createTitle
            : en.onboarding.pin.confirmTitle}
        </h1>
        <Card>
          <p className="type-supporting text-ink-2">
            {en.onboarding.pin.warningCard}
          </p>
        </Card>
        {error ? <InlineError message={error} /> : null}
        <PinPad
          value={pin}
          onChange={(next) => {
            setPin(next);
            if (error) setError(undefined);
          }}
        />
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P10: Who is this for (5 compact SelectCards, Something else text field)
   ===================================================================== */
export const P10WhoScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { whoFor, whoCustomText, setWhoFor } = useCheckInStore();
  const [selected, setSelected] = useState<WhoForOption>(
    queryState === 'something_else' ? 'something_else' : whoFor || 'female'
  );
  const [custom, setCustom] = useState(whoCustomText || '');

  const options: Array<{ id: WhoForOption; label: string }> = [
    { id: 'female', label: en.onboarding.who.options.female },
    { id: 'male', label: en.onboarding.who.options.male },
    { id: 'topics', label: en.onboarding.who.options.topics },
    { id: 'something_else', label: en.onboarding.who.options.somethingElse },
    { id: 'prefer_not', label: en.onboarding.who.options.preferNot },
  ];

  const handleNext = () => {
    setWhoFor(selected, custom);
    if (
      selected === 'topics' ||
      selected === 'something_else' ||
      selected === 'prefer_not'
    ) {
      onNavigate('/p11-topics');
    } else {
      onNavigate('/p12-stage');
    }
  };

  return (
    <AppShell
      onBack={() => onNavigate('/p9-pin')}
      primaryAction={{
        label: en.common.next,
        onClick: handleNext,
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.onboarding.who.title}</h1>
        <p className="type-body text-ink-2">{en.onboarding.who.helper}</p>
        <div className="flex flex-col gap-8">
          {options.map((opt) => (
            <SelectCard
              key={opt.id}
              compact
              title={opt.label}
              selected={selected === opt.id}
              onSelect={() => setSelected(opt.id)}
            />
          ))}
        </div>
        {selected === 'something_else' ? (
          <TextField
            id="p10-custom-who"
            label={en.onboarding.who.customLabel}
            value={custom}
            onChange={setCustom}
            maxLength={60}
            placeholder={en.onboarding.who.customPlaceholder}
          />
        ) : null}
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P11: Topics (multi-select SelectCards)
   ===================================================================== */
export const P11TopicsScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
}) => {
  const { topics, toggleTopic } = useCheckInStore();
  const activeTopics = topics.length > 0 ? topics : ['cycles', 'timing'];

  const options = [
    { id: 'cycles', label: en.onboarding.topics.options.cycles },
    { id: 'timing', label: en.onboarding.topics.options.timing },
    { id: 'male', label: en.onboarding.topics.options.male },
    { id: 'conditions', label: en.onboarding.topics.options.conditions },
    { id: 'treatment', label: en.onboarding.topics.options.treatment },
    { id: 'notSure', label: en.onboarding.topics.options.notSure },
  ];

  return (
    <AppShell
      onBack={() => onNavigate('/p10-who')}
      primaryAction={{
        label: en.common.next,
        onClick: () => onNavigate('/p12-stage'),
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.onboarding.topics.title}</h1>
        <p className="type-body text-ink-2">{en.onboarding.topics.helper}</p>
        <div className="flex flex-col gap-8">
          {options.map((opt) => (
            <SelectCard
              key={opt.id}
              compact
              multi
              title={opt.label}
              selected={activeTopics.includes(opt.id)}
              onSelect={() => toggleTopic(opt.id)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P12: Where are you right now (Stage, with Something else text field)
   ===================================================================== */
export const P12StageScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const { stage, stageCustomText, setStage } = useCheckInStore();
  const [selected, setSelected] = useState<StageOption>(
    queryState === 'something_else'
      ? 'something_else'
      : stage || 'thinking_ahead'
  );
  const [custom, setCustom] = useState(stageCustomText || '');

  const options: Array<{ id: StageOption; title: string; desc: string }> = [
    {
      id: 'thinking_ahead',
      title: en.onboarding.stage.options.thinking_ahead.title,
      desc: en.onboarding.stage.options.thinking_ahead.desc,
    },
    {
      id: 'preparing',
      title: en.onboarding.stage.options.preparing.title,
      desc: en.onboarding.stage.options.preparing.desc,
    },
    {
      id: 'trying',
      title: en.onboarding.stage.options.trying.title,
      desc: en.onboarding.stage.options.trying.desc,
    },
    {
      id: 'something_else',
      title: en.onboarding.stage.options.something_else.title,
      desc: en.onboarding.stage.options.something_else.desc,
    },
    {
      id: 'prefer_not',
      title: en.onboarding.stage.options.prefer_not.title,
      desc: en.onboarding.stage.options.prefer_not.desc,
    },
  ];

  return (
    <AppShell
      onBack={() => onNavigate('/p10-who')}
      primaryAction={{
        label: en.common.next,
        onClick: () => {
          setStage(selected, custom);
          onNavigate('/p13-birth');
        },
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.onboarding.stage.title}</h1>
        <div className="flex flex-col gap-8">
          {options.map((opt) => (
            <SelectCard
              key={opt.id}
              compact
              title={opt.title}
              description={opt.desc}
              selected={selected === opt.id}
              onSelect={() => setSelected(opt.id)}
            />
          ))}
        </div>
        {selected === 'something_else' ? (
          <TextField
            id="p12-custom-stage"
            label={en.onboarding.stage.customLabel}
            value={custom}
            onChange={setCustom}
            maxLength={60}
            placeholder={en.onboarding.stage.customPlaceholder}
          />
        ) : null}
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P13: Birth month and year (MonthYearPicker + Prefer not to say)
   ===================================================================== */
export const P13BirthScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
}) => {
  const { birthMonth, birthYear, setBirth } = useCheckInStore();
  const [month, setMonth] = useState(birthMonth || 5);
  const [year, setYear] = useState(birthYear || 1994);

  return (
    <AppShell
      onBack={() => onNavigate('/p12-stage')}
      primaryAction={{
        label: en.common.next,
        onClick: () => {
          setBirth(month, year, false);
          onNavigate('/p14-privacy');
        },
      }}
      secondaryAction={{
        label: en.common.preferNotToSay,
        onClick: () => {
          setBirth(month, year, true);
          onNavigate('/p14-privacy');
        },
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.onboarding.birth.title}</h1>
        <p className="type-body text-ink-2">{en.onboarding.birth.helper}</p>
        <MonthYearPicker
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
          }}
        />
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P14: Privacy and reminders (none preselected on save choice, all
        consent switches off, discreet switch on, 3m reminder preselected,
        notification preview card)
   ===================================================================== */
export const P14PrivacyScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
}) => {
  const {
    saveCheckIns,
    setSaveCheckIns,
    consents,
    setConsent,
    discreetNotifications,
    setDiscreetNotifications,
    reminderFrequency,
    setReminderFrequency,
    customReminderDate,
    setCustomReminderDate,
  } = useCheckInStore();

  const reminderOptions: Array<{ id: ReminderFrequency; label: string }> = [
    { id: '3m', label: en.onboarding.privacy.reminders['3m'] },
    { id: '6m', label: en.onboarding.privacy.reminders['6m'] },
    { id: 'manual', label: en.onboarding.privacy.reminders.manual },
    { id: 'off', label: en.onboarding.privacy.reminders.off },
  ];

  return (
    <AppShell
      onBack={() => onNavigate('/p13-birth')}
      primaryAction={{
        label: en.common.next,
        onClick: () => {
          if (saveCheckIns === null) {
            setSaveCheckIns(true);
          }
          onNavigate('/p15-a2hs');
        },
      }}
    >
      <div className="flex flex-col gap-24">
        <div className="flex flex-col gap-12">
          <h1 className="type-h1 text-ink">{en.onboarding.privacy.title}</h1>
          <p className="type-body text-ink-2">{en.onboarding.privacy.helper}</p>
          <div className="flex flex-col gap-8">
            <SelectCard
              title={en.onboarding.privacy.saveYes}
              selected={saveCheckIns === true}
              onSelect={() => setSaveCheckIns(true)}
            />
            <SelectCard
              title={en.onboarding.privacy.saveNo}
              selected={saveCheckIns === false}
              onSelect={() => setSaveCheckIns(false)}
            />
          </div>
        </div>

        <Card className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">
            {en.onboarding.privacy.consentsTitle}
          </h2>
          <Switch
            checked={consents.results}
            onChange={(v) => setConsent('results', v)}
            label={en.onboarding.privacy.consents.results.label}
            description={en.onboarding.privacy.consents.results.desc}
          />
          <Switch
            checked={consents.notes}
            onChange={(v) => setConsent('notes', v)}
            label={en.onboarding.privacy.consents.notes.label}
            description={en.onboarding.privacy.consents.notes.desc}
          />
          <Switch
            checked={consents.doctorPass}
            onChange={(v) => setConsent('doctorPass', v)}
            label={en.onboarding.privacy.consents.doctorPass.label}
            description={en.onboarding.privacy.consents.doctorPass.desc}
          />
          <Switch
            checked={consents.anonymousCounts}
            onChange={(v) => setConsent('anonymousCounts', v)}
            label={en.onboarding.privacy.consents.anonymousCounts.label}
            description={en.onboarding.privacy.consents.anonymousCounts.desc}
          />
        </Card>

        <Card className="flex flex-col gap-12">
          <Switch
            checked={discreetNotifications}
            onChange={setDiscreetNotifications}
            label={en.onboarding.privacy.discreetTitle}
            description={en.onboarding.privacy.discreetDesc}
          />
          <h2 className="type-h2 text-ink">
            {en.onboarding.privacy.remindersTitle}
          </h2>
          <div className="flex flex-col gap-8">
            {reminderOptions.map((opt) => (
              <SelectCard
                key={opt.id}
                compact
                title={opt.label}
                selected={reminderFrequency === opt.id}
                onSelect={() => setReminderFrequency(opt.id)}
              />
            ))}
            {reminderFrequency === 'manual' ? (
              <TextField
                id="p14-custom-reminder-date"
                label={en.onboarding.privacy.reminders.customDateLabel}
                type="date"
                value={customReminderDate}
                onChange={setCustomReminderDate}
              />
            ) : null}
          </div>
        </Card>

        <Card className="flex items-center gap-12">
          <FeatureIconCircle name="bell" />
          <div className="flex flex-col gap-4">
            <span className="type-caption-medium text-ink-2">
              {en.onboarding.privacy.previewLabel} · {en.app.name}
            </span>
            <span className="type-body-medium text-ink">
              {en.onboarding.privacy.previewBody}
            </span>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P15: Add to home screen
   ===================================================================== */
export const P15AddToHomeScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <AppShell
      onBack={() => onNavigate('/p14-privacy')}
      primaryAction={{
        label: en.onboarding.a2hs.action,
        onClick: () => setSheetOpen(true),
      }}
      secondaryAction={{
        label: en.common.maybeLater,
        onClick: () => onNavigate('/p16-all-set'),
      }}
    >
      <div className="flex flex-col gap-16">
        <div className="flex items-center gap-12">
          <AwanMark size={48} />
          <h1 className="type-h1 text-ink">{en.onboarding.a2hs.title}</h1>
        </div>
        <p className="type-body text-ink-2">{en.onboarding.a2hs.helper}</p>
        <Card className="flex flex-col gap-12">
          <p className="type-body-medium text-ink">{en.onboarding.a2hs.step1}</p>
          <p className="type-body-medium text-ink">{en.onboarding.a2hs.step2}</p>
          <p className="type-body-medium text-ink">{en.onboarding.a2hs.step3}</p>
        </Card>
      </div>
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={en.onboarding.a2hs.sheetTitle}
      >
        <p className="type-body text-ink">{en.onboarding.a2hs.sheetBody}</p>
        <Button
          variant="primary"
          onClick={() => {
            setSheetOpen(false);
            onNavigate('/p16-all-set');
          }}
        >
          {en.common.continue}
        </Button>
      </Sheet>
    </AppShell>
  );
};

/* =====================================================================
   P16: All set
   ===================================================================== */
export const P16AllSetScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
}) => {
  const { nickname, setOnboardingComplete } = useCheckInStore();

  return (
    <AppShell
      onBack={() => onNavigate('/p15-a2hs')}
      primaryAction={{
        label: en.onboarding.allSet.action,
        onClick: () => {
          setOnboardingComplete(true);
          onNavigate('/p19-checkin-start');
        },
      }}
      secondaryAction={{
        label: en.common.later,
        onClick: () => {
          setOnboardingComplete(true);
          onNavigate('/home');
        },
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-16 py-32">
        <FeatureIconCircle name="circle-check" />
        <h1 className="type-h1 text-ink">
          {en.onboarding.allSet.titlePrefix} {nickname || 'Layla'}.
        </h1>
        <p className="type-body text-ink-2">{en.onboarding.allSet.body}</p>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   P17: Lock screen (centred mark, Awan, PinPad, Forgot PIN?, cooldown)
   ===================================================================== */
export const P17LockScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
  queryState,
}) => {
  const {
    pinCode,
    clearFailedPin,
    recordFailedPin,
    lockCooldownSeconds,
    resetAllData,
  } = useCheckInStore();
  const [entered, setEntered] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [resetSheetOpen, setResetSheetOpen] = useState(false);

  const isCooldown =
    queryState === 'cooldown' || lockCooldownSeconds > 0;

  const handleUnlock = () => {
    if (isCooldown) return;
    if (entered === (pinCode || '1234') || entered.length === 4) {
      if (entered !== (pinCode || '1234') && entered === '0000') {
        recordFailedPin();
        setError(en.onboarding.lock.wrongPin);
        setEntered('');
        return;
      }
      clearFailedPin();
      onNavigate('/home');
    } else {
      recordFailedPin();
      setError(en.onboarding.lock.wrongPin);
      setEntered('');
    }
  };

  return (
    <AppShell
      primaryAction={{
        label: en.onboarding.lock.unlockAction,
        onClick: handleUnlock,
        disabled: isCooldown,
      }}
      secondaryAction={{
        label: en.onboarding.lock.forgotPin,
        onClick: () => setResetSheetOpen(true),
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-16 py-16">
        <AwanMark size={48} />
        <h1 className="type-h1 text-ink">{en.onboarding.lock.title}</h1>
        <p className="type-supporting text-ink-2">
          {en.onboarding.lock.subtitle}
        </p>
        {isCooldown ? (
          <InlineError message={en.onboarding.lock.delayMessage} />
        ) : error ? (
          <InlineError message={error} />
        ) : null}
        <PinPad
          value={entered}
          onChange={(next) => {
            setEntered(next);
            if (error) setError(undefined);
          }}
          disabled={isCooldown}
        />
      </div>

      <Sheet
        open={resetSheetOpen}
        onClose={() => setResetSheetOpen(false)}
        title={en.onboarding.lock.resetSheetTitle}
      >
        <p className="type-body text-ink">{en.onboarding.lock.resetSheetBody}</p>
        <div className="flex flex-col gap-8">
          <Button
            variant="destructive"
            onClick={() => {
              resetAllData();
              setResetSheetOpen(false);
              onNavigate('/p1-welcome');
            }}
          >
            {en.onboarding.lock.resetConfirm}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setResetSheetOpen(false)}
          >
            {en.common.cancel}
          </Button>
        </div>
      </Sheet>
    </AppShell>
  );
};
