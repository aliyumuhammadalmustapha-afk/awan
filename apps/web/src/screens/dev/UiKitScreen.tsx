import React, { useState } from 'react';
import {
  AwanMark,
  Banner,
  BottomNav,
  Button,
  Card,
  Chips,
  EmptyState,
  FeatureIconCircle,
  FileAttach,
  AttachedFileInfo,
  Icon,
  InlineError,
  LevelChip,
  ListRow,
  MonthYearPicker,
  OtpBoxes,
  PhoneField,
  PinPad,
  ProgressBar,
  SegmentedControl,
  SelectCard,
  Sheet,
  SourceTag,
  StatTile,
  StepDots,
  Stepper,
  Switch,
  TabId,
  TextField,
  TimelineItem,
  TopBar,
} from '../../ui';
import { AppShell } from '../../ui/AppShell';
import { en } from '../../i18n';

export const UiKitScreen: React.FC<{ onNavigate?: (route: string) => void }> = ({
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [switchOn, setSwitchOn] = useState(true);
  const [selectedRadio, setSelectedRadio] = useState('female');
  const [textVal, setTextVal] = useState('Layla');
  const [country, setCountry] = useState('+971');
  const [phone, setPhone] = useState('50 123 4567');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('123');
  const [months, setMonths] = useState(6);
  const [birthMonth, setBirthMonth] = useState(5);
  const [birthYear, setBirthYear] = useState(1992);
  const [attached, setAttached] = useState<AttachedFileInfo | null>({
    name: 'hormone_panel_2026.pdf',
    sizeBytes: 342000,
    type: 'application/pdf',
  });
  const [duration, setDuration] = useState('7d');
  const [barriers, setBarriers] = useState<string[]>(['time']);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <AppShell
      onBack={() => onNavigate?.('/')}
      topTitle="UI kit & route directory"
      topRightAction={{ label: 'Routes', onClick: () => onNavigate?.('/routes') }}
      primaryAction={{
        label: 'Primary bottom action (52px)',
        onClick: () => setSheetOpen(true),
      }}
    >
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-12">
          <AwanMark size={48} animated />
          <div className="flex flex-col gap-4">
            <h1 className="type-h1 text-ink">{en.uiKit.title}</h1>
            <p className="type-supporting text-ink-2">{en.uiKit.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 1. LevelChips (Normal & Large) */}
      <Card className="flex flex-col gap-12">
        <h2 className="type-h2 text-ink">Level chips (32px & 40px hero)</h2>
        <div className="flex flex-wrap gap-8">
          <LevelChip level="L0" />
          <LevelChip level="L1" />
          <LevelChip level="L2" />
          <LevelChip level="L3" />
          <LevelChip level="U" />
        </div>
        <div className="flex flex-wrap gap-8">
          <LevelChip level="L0" large />
          <LevelChip level="L1" large />
          <LevelChip level="L2" large />
          <LevelChip level="L3" large />
          <LevelChip level="U" large />
        </div>
      </Card>

      {/* 2. Buttons (Variants & States) */}
      <Card className="flex flex-col gap-12">
        <h2 className="type-h2 text-ink">Buttons & states</h2>
        <Button variant="primary">Primary default</Button>
        <Button variant="primary" pressed>
          Primary pressed
        </Button>
        <Button variant="primary" disabled>
          Primary disabled
        </Button>
        <Button variant="primary" loading>
          Primary loading
        </Button>
        <Button variant="secondary">Secondary default</Button>
        <Button variant="destructive">Destructive plum outline</Button>
        <Button variant="text">Text button action</Button>
      </Card>

      {/* 3. SourceTags & Banners */}
      <Card className="flex flex-col gap-12">
        <h2 className="type-h2 text-ink">Source tags & banners</h2>
        <div className="flex flex-wrap gap-8">
          <SourceTag kind="self-reported" />
          <SourceTag kind="lab-reported" />
          <SourceTag kind="recalled" />
          <SourceTag kind="lab-uploaded-unverified" />
        </div>
        <Banner variant="demo" />
        <Banner variant="offline" />
        <Banner
          variant="update"
          actionLabel={en.banners.refresh}
          onAction={() => {}}
        />
        <InlineError
          message="That value looks unusual. Check it before saving."
          actionLabel="Type the values instead"
          onAction={() => {}}
        />
      </Card>

      {/* 4. Progress, StepDots, SegmentedControl, Chips */}
      <Card className="flex flex-col gap-16">
        <h2 className="type-h2 text-ink">Progress, dots & controls</h2>
        <ProgressBar value={65} label="Check-in progress" />
        <StepDots total={4} current={1} />
        <SegmentedControl
          options={[
            { id: '24h', label: '24 hours' },
            { id: '7d', label: '7 days' },
            { id: '30d', label: '30 days' },
          ]}
          value={duration}
          onChange={setDuration}
        />
        <Chips
          options={[
            { id: 'who', label: 'Not sure who to see' },
            { id: 'cost', label: 'Cost' },
            { id: 'time', label: 'Time' },
            { id: 'privacy', label: 'Privacy' },
          ]}
          selectedIds={barriers}
          onToggle={(id) =>
            setBarriers((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
        />
      </Card>

      {/* 5. SelectCard, Switch, ListRow */}
      <Card className="flex flex-col gap-12">
        <h2 className="type-h2 text-ink">Select cards, switches & rows</h2>
        <SelectCard
          title="Preparing for a family"
          description="Planning ahead and wanting to be ready."
          selected={selectedRadio === 'female'}
          onSelect={() => setSelectedRadio('female')}
        />
        <SelectCard
          compact
          title="Compact option (for 5+ choices)"
          selected={selectedRadio === 'compact'}
          onSelect={() => setSelectedRadio('compact')}
        />
        <Switch
          checked={switchOn}
          onChange={setSwitchOn}
          label={en.onboarding.privacy.discreetTitle}
          description={en.onboarding.privacy.discreetDesc}
        />
        <ListRow
          icon="shield"
          title="Privacy and consent"
          supporting="Stored on this phone · All sharing off by default"
          showChevron
          onClick={() => {}}
        />
      </Card>

      {/* 6. Form Inputs: TextField, PhoneField, OtpBoxes, Stepper, MonthYearPicker */}
      <Card className="flex flex-col gap-16">
        <h2 className="type-h2 text-ink">Inputs & pickers</h2>
        <TextField
          id="demo-name"
          label="Nickname"
          value={textVal}
          onChange={setTextVal}
          maxLength={60}
          helper={en.onboarding.name.helper}
        />
        <PhoneField
          countryCode={country}
          onCountryChange={setCountry}
          phone={phone}
          onPhoneChange={setPhone}
        />
        <OtpBoxes value={otp} onChange={setOtp} />
        <Stepper
          label="How many months have you been trying?"
          value={months}
          onChange={setMonths}
        />
        <MonthYearPicker
          month={birthMonth}
          year={birthYear}
          onChange={(m, y) => {
            setBirthMonth(m);
            setBirthYear(y);
          }}
        />
        <FileAttach file={attached} onSelectFile={setAttached} />
      </Card>

      {/* 7. PinPad */}
      <Card className="flex flex-col gap-16">
        <h2 className="type-h2 text-ink">PIN pad (64px keys, 6 indicators)</h2>
        <PinPad value={pin} onChange={setPin} />
      </Card>

      {/* 8. StatTile, TimelineItem, EmptyState */}
      <div className="grid grid-cols-2 gap-12">
        <StatTile
          value="42 days"
          label="Median days to contact"
          supporting="User-confirmed clinician visit"
        />
        <StatTile
          value="68%"
          label="Referral completion"
          supporting="Synthetic cohort (n=500)"
        />
      </div>

      <TimelineItem
        date="19 Nov 2026"
        level="L1"
        source="self-reported"
        summary="Three or more cycles outside 21 to 35 days (rule F1)."
      />

      <EmptyState
        message="You haven't completed a check-in yet. Start whenever you're ready."
        actionLabel="Check my direction"
        onAction={() => {}}
      />

      {/* 9. Embedded BottomNav preview */}
      <Card className="flex flex-col gap-12">
        <h2 className="type-h2 text-ink">Bottom navigation bar (4 tabs)</h2>
        <BottomNav activeTab={activeTab} onSelect={setActiveTab} />
      </Card>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Confirm action sheet"
      >
        <p className="type-body text-ink">
          Bottom sheets trap keyboard focus and confirm important or destructive choices calmly.
        </p>
        <div className="flex flex-col gap-8">
          <Button variant="destructive" onClick={() => setSheetOpen(false)}>
            Confirm plum action
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(false)}>
            {en.common.cancel}
          </Button>
        </div>
      </Sheet>
    </AppShell>
  );
};
