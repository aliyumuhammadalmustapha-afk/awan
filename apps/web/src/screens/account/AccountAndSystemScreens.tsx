import React, { useState } from 'react';
import {
  AwanMark,
  Banner,
  Button,
  Card,
  FeatureIconCircle,
  Icon,
  InlineError,
  ListRow,
  MonthYearPicker,
  PinPad,
  SelectCard,
  Sheet,
  Switch,
  TabId,
  TextField,
} from '../../ui';
import { AppShell } from '../../ui/AppShell';
import {
  ConsentSwitches,
  DemoPersonaId,
  ReminderFrequency,
  StageOption,
  useCheckInStore,
  WhoForOption,
} from '../../lib/store';
import { en } from '../../i18n';

export interface AccountScreenProps {
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
   P31: Account root & 8 subpages:
   - Root (/account)
   - Profile (?sub=profile)
   - Privacy and consent (?sub=privacy & ?sub=privacy-sheet)
   - Notifications (?sub=notifications)
   - Security and discretion (?sub=security)
   - Sharing (?sub=sharing)
   - Your data (?sub=data & ?sub=data-sheet)
   - About and safety (?sub=about)
   - Sign-in (?sub=signin)
   ===================================================================== */
export const P31AccountScreen: React.FC<AccountScreenProps> = ({
  onNavigate,
  queryState = '',
}) => {
  const store = useCheckInStore();
  const [sub, setSub] = useState<string>(queryState || 'root');

  // Sync when queryState changes externally
  React.useEffect(() => {
    setSub(queryState || 'root');
  }, [queryState]);

  const goSub = (nextSub: string) => {
    if (nextSub === 'root') {
      onNavigate('/account');
    } else {
      onNavigate(`/account?sub=${nextSub}`);
    }
  };

  // Subpage 1: Profile
  const [editName, setEditName] = useState(store.nickname || 'Layla');
  const [editMonth, setEditMonth] = useState(store.birthMonth || 5);
  const [editYear, setEditYear] = useState(store.birthYear || 1998);
  const [editWho, setEditWho] = useState<WhoForOption>(
    store.whoFor || 'female'
  );
  const [editStage, setEditStage] = useState<StageOption>(
    store.stage || 'preparing'
  );
  const [editStageCustom, setEditStageCustom] = useState(
    store.stageCustomText || ''
  );

  // Subpage 2: Privacy turn-off sheet
  const [turnOffSheetKey, setTurnOffSheetKey] = useState<string | null>(
    queryState === 'privacy-sheet' ? 'results' : null
  );

  // Subpage 4: Security PIN change sheet
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [newPin, setNewPin] = useState('');

  // Subpage 5: Sharing revoke sheet
  const [revokeSheetOpen, setRevokeSheetOpen] = useState(false);

  // Subpage 6: Your data delete sheet
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(
    queryState === 'data-sheet'
  );

  // Subpage 7: Demo person sheet
  const [demoSheetOpen, setDemoSheetOpen] = useState(false);

  // Subpage 8: Sign out sheet
  const [signOutSheetOpen, setSignOutSheetOpen] = useState(false);

  const initialName = (store.nickname || 'Layla').trim();
  const avatarInitials = initialName.slice(0, 2);

  if (sub === 'profile') {
    const whoOptions: Array<{ id: WhoForOption; label: string }> = [
      { id: 'female', label: en.onboarding.who.options.female },
      { id: 'male', label: en.onboarding.who.options.male },
      { id: 'topics', label: en.onboarding.who.options.topics },
      { id: 'something_else', label: en.onboarding.who.options.somethingElse },
      { id: 'prefer_not', label: en.onboarding.who.options.preferNot },
    ];
    const stageOptions: Array<{ id: StageOption; label: string }> = [
      { id: 'thinking_ahead', label: en.onboarding.stage.options.thinking_ahead.title },
      { id: 'preparing', label: en.onboarding.stage.options.preparing.title },
      { id: 'trying', label: en.onboarding.stage.options.trying.title },
      { id: 'something_else', label: en.onboarding.stage.options.something_else.title },
      { id: 'prefer_not', label: en.onboarding.stage.options.prefer_not.title },
    ];

    return (
      <AppShell
        onBack={() => goSub('root')}
        topTitle={en.account.profile.title}
        primaryAction={{
          label: en.account.profile.saveAction,
          onClick: () => {
            store.setNickname(editName);
            store.setBirth(editMonth, editYear, false);
            store.setWhoFor(editWho);
            store.setStage(editStage, editStageCustom);
            goSub('root');
          },
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.account.profile.title}</h1>
          <TextField
            id="profile-nickname"
            label={en.onboarding.name.placeholder}
            value={editName}
            onChange={setEditName}
            helper={en.common.storedOnThisPhone}
          />
          <MonthYearPicker
            month={editMonth}
            year={editYear}
            onChange={(m, y) => {
              setEditMonth(m);
              setEditYear(y);
            }}
          />
          <Card className="flex flex-col gap-8">
            <h2 className="type-h2 text-ink">{en.onboarding.who.title}</h2>
            {whoOptions.map((o) => (
              <SelectCard
                key={o.id}
                compact
                title={o.label}
                selected={editWho === o.id}
                onSelect={() => setEditWho(o.id)}
              />
            ))}
          </Card>
          <Card className="flex flex-col gap-8">
            <h2 className="type-h2 text-ink">{en.onboarding.stage.title}</h2>
            {stageOptions.map((o) => (
              <SelectCard
                key={o.id}
                compact
                title={o.label}
                selected={editStage === o.id}
                onSelect={() => setEditStage(o.id)}
              />
            ))}
            {editStage === 'something_else' ? (
              <TextField
                id="profile-stage-custom"
                label={en.onboarding.stage.customLabel}
                value={editStageCustom}
                onChange={setEditStageCustom}
                maxLength={60}
              />
            ) : null}
          </Card>
          <Card className="flex flex-col gap-8">
            <h2 className="type-h2 text-ink">{en.account.profile.languageTitle}</h2>
            <SelectCard
              compact
              title={en.account.profile.english}
              selected
              onSelect={() => {}}
            />
            <ListRow
              title={en.account.profile.arabic}
              supporting={en.common.comingSoon}
            />
          </Card>
        </div>
      </AppShell>
    );
  }

  if (sub === 'privacy' || sub === 'privacy-sheet') {
    const handleToggleConsent = (key: keyof ConsentSwitches, next: boolean) => {
      if (!next) {
        setTurnOffSheetKey(key);
      } else {
        store.setConsent(key, true);
      }
    };

    const items: Array<{
      key: keyof ConsentSwitches;
      label: string;
      desc: string;
    }> = [
      {
        key: 'results',
        label: en.onboarding.privacy.consents.results.label,
        desc: en.onboarding.privacy.consents.results.desc,
      },
      {
        key: 'notes',
        label: en.onboarding.privacy.consents.notes.label,
        desc: en.onboarding.privacy.consents.notes.desc,
      },
      {
        key: 'recalled',
        label: en.onboarding.privacy.consents.recalled.label,
        desc: en.onboarding.privacy.consents.recalled.desc,
      },
      {
        key: 'doctorPass',
        label: en.onboarding.privacy.consents.doctorPass.label,
        desc: en.onboarding.privacy.consents.doctorPass.desc,
      },
      {
        key: 'anonymousCounts',
        label: en.onboarding.privacy.consents.anonymousCounts.label,
        desc: en.onboarding.privacy.consents.anonymousCounts.desc,
      },
    ];

    return (
      <AppShell
        onBack={() => goSub('root')}
        topTitle={en.account.privacy.title}
        primaryAction={{
          label: en.common.back,
          onClick: () => goSub('root'),
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.account.privacy.title}</h1>
          <Card className="flex flex-col gap-8">
            <Switch
              checked={store.saveCheckIns !== false}
              onChange={(next) => {
                if (!next) setTurnOffSheetKey('saveCheckIns');
                else store.setSaveCheckIns(true);
              }}
              label={en.onboarding.privacy.title}
              description={`${en.onboarding.privacy.helper} · ${en.account.privacy.lastChangedPrefix} 19 Nov 2026`}
            />
          </Card>

          <Card className="flex flex-col gap-12">
            {items.map((item) => (
              <div key={item.key} className="pb-12 border-b-1">
                <Switch
                  checked={Boolean(store.consents[item.key])}
                  onChange={(next) => handleToggleConsent(item.key, next)}
                  label={item.label}
                  description={`${item.desc} · ${en.account.privacy.lastChangedPrefix} ${
                    store.consentDates[item.key] || '19 Nov 2026'
                  }`}
                />
              </div>
            ))}
          </Card>
        </div>

        <Sheet
          open={turnOffSheetKey !== null}
          onClose={() => setTurnOffSheetKey(null)}
          title={en.account.privacy.turnOffSheetTitle}
        >
          <p className="type-body text-ink">
            {en.account.privacy.turnOffSheetBody}
          </p>
          <div className="flex flex-col gap-8">
            <Button
              variant="secondary"
              onClick={() => {
                if (turnOffSheetKey === 'saveCheckIns') {
                  store.setSaveCheckIns(false);
                } else if (turnOffSheetKey) {
                  store.setConsent(turnOffSheetKey as keyof ConsentSwitches, false);
                }
                setTurnOffSheetKey(null);
              }}
            >
              {en.account.privacy.keepSaved}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (turnOffSheetKey === 'saveCheckIns') {
                  store.setSaveCheckIns(false);
                } else if (turnOffSheetKey) {
                  store.setConsent(turnOffSheetKey as keyof ConsentSwitches, false);
                }
                setTurnOffSheetKey(null);
              }}
            >
              {en.account.privacy.deleteSaved}
            </Button>
          </div>
        </Sheet>
      </AppShell>
    );
  }

  if (sub === 'notifications') {
    const freqOptions: Array<{ id: ReminderFrequency; label: string }> = [
      { id: '3m', label: en.onboarding.privacy.reminders['3m'] },
      { id: '6m', label: en.onboarding.privacy.reminders['6m'] },
      { id: 'manual', label: en.onboarding.privacy.reminders.manual },
      { id: 'off', label: en.onboarding.privacy.reminders.off },
    ];

    return (
      <AppShell
        onBack={() => goSub('root')}
        topTitle={en.account.notifications.title}
        primaryAction={{
          label: en.account.notifications.pauseAll,
          onClick: () => store.setReminderFrequency('off'),
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.account.notifications.title}</h1>
          <Card className="flex flex-col gap-8">
            <h2 className="type-h2 text-ink">
              {en.onboarding.privacy.remindersTitle}
            </h2>
            {freqOptions.map((o) => (
              <SelectCard
                key={o.id}
                compact
                title={o.label}
                selected={store.reminderFrequency === o.id}
                onSelect={() => store.setReminderFrequency(o.id)}
              />
            ))}
            {store.reminderFrequency === 'manual' ? (
              <TextField
                id="notif-custom-date"
                label={en.onboarding.privacy.reminders.customDateLabel}
                type="date"
                value={store.customReminderDate}
                onChange={store.setCustomReminderDate}
              />
            ) : null}
          </Card>

          <Card className="flex flex-col gap-12">
            <TextField
              id="notif-time"
              label={en.account.notifications.timeLabel}
              type="time"
              value={store.preferredTime}
              onChange={store.setPreferredTime}
            />
            <ListRow
              icon="clock"
              title={en.account.notifications.quietHoursLabel}
              supporting={en.account.notifications.quietHoursValue}
            />
            <Switch
              checked={store.followUpReminderEnabled}
              onChange={store.setFollowUpReminderEnabled}
              label={en.account.notifications.followUpSwitch}
              description={en.account.notifications.followUpDesc}
            />
            <Switch
              checked={store.discreetNotifications}
              onChange={store.setDiscreetNotifications}
              label={en.onboarding.privacy.discreetTitle}
              description={en.onboarding.privacy.discreetDesc}
            />
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
  }

  if (sub === 'security') {
    const timerOptions: Array<{
      id: 'immediate' | '1m' | '5m';
      label: string;
    }> = [
      { id: 'immediate', label: en.account.security.autoLockImmediate },
      { id: '1m', label: en.account.security.autoLock1m },
      { id: '5m', label: en.account.security.autoLock5m },
    ];

    return (
      <AppShell
        onBack={() => goSub('root')}
        topTitle={en.account.security.title}
        primaryAction={{
          label: en.account.lockNow,
          onClick: () => {
            store.setLocked(true);
            onNavigate('/p17-lock');
          },
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.account.security.title}</h1>
          <ListRow
            icon="lock"
            title={en.account.security.changePin}
            supporting="4-digit PIN · Stored as salted key on this phone"
            showChevron
            onClick={() => setPinSheetOpen(true)}
          />
          <Card className="flex flex-col gap-8">
            <h2 className="type-h2 text-ink">
              {en.account.security.autoLockTitle}
            </h2>
            {timerOptions.map((o) => (
              <SelectCard
                key={o.id}
                compact
                title={o.label}
                selected={store.autoLockTimer === o.id}
                onSelect={() => store.setAutoLockTimer(o.id)}
              />
            ))}
          </Card>
          <Card>
            <Switch
              checked={store.lockOnBackground}
              onChange={store.setLockOnBackground}
              label={en.account.security.lockOnBg}
              description={en.account.security.lockOnBgDesc}
            />
          </Card>
        </div>

        <Sheet
          open={pinSheetOpen}
          onClose={() => setPinSheetOpen(false)}
          title={en.account.security.changePin}
        >
          <PinPad value={newPin} onChange={setNewPin} />
          <Button
            variant="primary"
            onClick={() => {
              if (newPin.length === 4) {
                store.setPinCode(newPin);
              }
              setNewPin('');
              setPinSheetOpen(false);
            }}
          >
            {en.onboarding.pin.confirmAction}
          </Button>
        </Sheet>
      </AppShell>
    );
  }

  if (sub === 'sharing') {
    return (
      <AppShell
        onBack={() => goSub('root')}
        topTitle={en.account.sharing.title}
        primaryAction={{
          label: en.common.back,
          onClick: () => goSub('root'),
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.account.sharing.title}</h1>
          <Card className="flex flex-col gap-12">
            <h2 className="type-h2 text-ink">
              {en.account.sharing.activePassesTitle}
            </h2>
            {store.passes.map((p) => (
              <ListRow
                key={p.id}
                icon="share-2"
                title={`Pass ${p.token} · ${p.status}`}
                supporting={`Expires ${p.expiresAt} (${p.durationLabel})`}
                endSlot={
                  p.status === 'Active' ? (
                    <Button
                      variant="destructive"
                      fullWidth={false}
                      onClick={() => store.revokePass(p.id)}
                    >
                      Revoke
                    </Button>
                  ) : null
                }
              />
            ))}
          </Card>

          <Card className="flex flex-col gap-12">
            <h2 className="type-h2 text-ink">
              {en.account.sharing.accessLogTitle}
            </h2>
            {store.passes.flatMap((p) =>
              p.accessLog.map((log, i) => (
                <ListRow
                  key={`${p.id}-${i}`}
                  icon="clock"
                  title={`${p.token} · ${log.event}`}
                  supporting={log.timestamp}
                />
              ))
            )}
          </Card>

          <Button
            variant="destructive"
            onClick={() => setRevokeSheetOpen(true)}
          >
            {en.account.sharing.revokeAll}
          </Button>
        </div>

        <Sheet
          open={revokeSheetOpen}
          onClose={() => setRevokeSheetOpen(false)}
          title={en.account.sharing.revokeSheetTitle}
        >
          <p className="type-body text-ink">
            {en.account.sharing.revokeSheetBody}
          </p>
          <div className="flex flex-col gap-8">
            <Button
              variant="destructive"
              onClick={() => {
                store.revokeAllPasses();
                setRevokeSheetOpen(false);
              }}
            >
              {en.account.sharing.revokeAll}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRevokeSheetOpen(false)}
            >
              {en.common.cancel}
            </Button>
          </div>
        </Sheet>
      </AppShell>
    );
  }

  if (sub === 'data' || sub === 'data-sheet') {
    const handleDownloadJson = () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        nickname: store.nickname,
        whoFor: store.whoFor,
        stage: store.stage,
        birthYear: store.birthYear,
        birthMonth: store.birthMonth,
        answers: store.answers,
        results: store.results,
        ownWordsNote: store.ownWordsNote,
        checkInHistory: store.checkInHistory,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'awan-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <AppShell
        onBack={() => goSub('root')}
        topTitle={en.account.data.title}
        primaryAction={{
          label: en.account.data.downloadAction,
          onClick: handleDownloadJson,
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.account.data.title}</h1>
          <Card className="flex flex-col gap-12">
            <Button variant="secondary" onClick={handleDownloadJson}>
              <Icon name="download" size={20} className=" text-ink" />
              <span className="px-8">{en.account.data.downloadAction}</span>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteSheetOpen(true)}
            >
              {en.account.data.deleteAllAction}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteSheetOpen(true)}
            >
              {en.account.data.deleteAccountAction}
            </Button>
          </Card>

          <ListRow
            icon="shield"
            title={en.account.data.backupRow}
            supporting={en.common.comingLater}
          />
        </div>

        <Sheet
          open={deleteSheetOpen}
          onClose={() => setDeleteSheetOpen(false)}
          title={en.account.data.deleteSheetTitle}
        >
          <p className="type-body text-ink">{en.account.data.deleteSheetBody}</p>
          <div className="flex flex-col gap-8">
            <Button
              variant="destructive"
              onClick={() => {
                store.resetAllData();
                setDeleteSheetOpen(false);
                onNavigate('/p1-welcome');
              }}
            >
              {en.account.data.deleteAllAction}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDeleteSheetOpen(false)}
            >
              {en.common.cancel}
            </Button>
          </div>
        </Sheet>
      </AppShell>
    );
  }

  if (sub === 'about') {
    const personas: Array<{ id: DemoPersonaId; label: string; desc: string }> = [
      {
        id: 'layla',
        label: 'Layla, 28 (Demo)',
        desc: 'Irregular cycles, not trying yet · Level L1 (rules F1, F6)',
      },
      {
        id: 'ahmed',
        label: 'Ahmed, 32 (Demo)',
        desc: 'Newly married, preparing · Level L0 + modifiable habit X2',
      },
      {
        id: 'priya',
        label: 'Priya, 35 (Demo)',
        desc: 'PCOS, trying for 5 months · Level L1 (rules F4, T5)',
      },
      {
        id: 'tariq',
        label: 'Tariq, 29 (Demo)',
        desc: 'Upcoming medical treatment · Level L3 (rule X1)',
      },
    ];

    return (
      <AppShell
        onBack={() => goSub('root')}
        topTitle={en.account.about.title}
        primaryAction={{
          label: en.account.about.loadDemoPerson,
          onClick: () => setDemoSheetOpen(true),
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.account.about.title}</h1>

          <Card className="flex flex-col gap-8">
            <h2 className="type-h2 text-ink">
              {en.account.about.intendedUseTitle}
            </h2>
            <p className="type-body text-ink-2">
              {en.account.about.intendedUseBody}
            </p>
          </Card>

          <Card className="flex flex-col gap-8">
            <h2 className="type-h2 text-ink">
              {en.account.about.howRulesWorkTitle}
            </h2>
            <p className="type-body text-ink-2">
              {en.account.about.howRulesWorkBody}
            </p>
          </Card>

          <Card className="flex flex-col gap-8">
            <h2 className="type-h2 text-ink">{en.account.about.limitsTitle}</h2>
            <p className="type-body text-ink-2">{en.account.about.limitsBody}</p>
          </Card>

          <ListRow
            icon="info"
            title={en.account.about.reopenIntro}
            supporting={en.account.about.version}
            showChevron
            onClick={() => onNavigate('/p1-welcome')}
          />

          <Card className="flex flex-col gap-12">
            <h2 className="type-h2 text-ink">
              {en.account.about.demoControlsTitle}
            </h2>
            <Button
              variant="secondary"
              onClick={() => setDemoSheetOpen(true)}
            >
              {en.account.about.loadDemoPerson}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                store.resetAllData();
                onNavigate('/p1-welcome');
              }}
            >
              {en.account.about.resetDemo}
            </Button>
          </Card>
        </div>

        <Sheet
          open={demoSheetOpen}
          onClose={() => setDemoSheetOpen(false)}
          title={en.account.about.loadDemoPerson}
        >
          <div className="flex flex-col gap-8">
            {personas.map((p) => (
              <SelectCard
                key={p.id}
                title={p.label}
                description={p.desc}
                selected={
                  store.nickname.toLowerCase() === p.id
                }
                onSelect={() => {
                  store.loadDemoPersona(p.id);
                  setDemoSheetOpen(false);
                  onNavigate('/home?state=returning');
                }}
              />
            ))}
          </div>
        </Sheet>
      </AppShell>
    );
  }

  if (sub === 'signin') {
    const rawDigits = (store.phoneNumber || '8012345678').replace(/\D/g, '');
    const lastFour = rawDigits.slice(-4) || '5678';
    const masked = `${store.phoneCountry || '+234'} ••• ••• ${lastFour}`;

    return (
      <AppShell
        onBack={() => goSub('root')}
        topTitle={en.account.signin.title}
        primaryAction={{
          label: en.account.signOut,
          onClick: () => setSignOutSheetOpen(true),
        }}
      >
        <div className="flex flex-col gap-16">
          <h1 className="type-h1 text-ink">{en.account.signin.title}</h1>
          <ListRow
            icon="user"
            title={masked}
            supporting={en.account.signin.signedInAs}
          />
          <ListRow
            icon="shield"
            title={en.account.signin.uaePass}
            supporting={en.common.comingLater}
          />
        </div>

        <Sheet
          open={signOutSheetOpen}
          onClose={() => setSignOutSheetOpen(false)}
          title={en.account.signin.signOutSheetTitle}
        >
          <p className="type-body text-ink">
            {en.account.signin.signOutSheetBody}
          </p>
          <div className="flex flex-col gap-8">
            <Button
              variant="secondary"
              onClick={() => {
                setSignOutSheetOpen(false);
                onNavigate('/p1-welcome');
              }}
            >
              {en.account.signin.keepDataSignOut}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                store.resetAllData();
                setSignOutSheetOpen(false);
                onNavigate('/p1-welcome');
              }}
            >
              {en.account.signin.eraseDataSignOut}
            </Button>
          </div>
        </Sheet>
      </AppShell>
    );
  }

  // Root P31 Account hub
  return (
    <AppShell
      showBottomNav
      activeTab="account"
      onSelectTab={(t) => handleTabNav(t, onNavigate)}
      primaryAction={{
        label: en.account.lockNow,
        onClick: () => {
          store.setLocked(true);
          onNavigate('/p17-lock');
        },
      }}
      secondaryAction={{
        label: en.account.signOut,
        onClick: () => setSignOutSheetOpen(true),
      }}
    >
      <div className="flex items-center gap-16">
        <div className="icon-circle-48 type-h2">{avatarInitials}</div>
        <div className="flex flex-col gap-4">
          <h1 className="type-h1 text-ink">{initialName}</h1>
          <span className="type-supporting text-ink-2">
            {en.common.storedOnThisPhone}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        <ListRow
          icon="user"
          title={en.account.rows.profile.title}
          supporting={en.account.rows.profile.desc}
          showChevron
          onClick={() => goSub('profile')}
        />
        <ListRow
          icon="shield"
          title={en.account.rows.privacy.title}
          supporting={en.account.rows.privacy.desc}
          showChevron
          onClick={() => goSub('privacy')}
        />
        <ListRow
          icon="bell"
          title={en.account.rows.notifications.title}
          supporting={en.account.rows.notifications.desc}
          showChevron
          onClick={() => goSub('notifications')}
        />
        <ListRow
          icon="lock"
          title={en.account.rows.security.title}
          supporting={en.account.rows.security.desc}
          showChevron
          onClick={() => goSub('security')}
        />
        <ListRow
          icon="share-2"
          title={en.account.rows.sharing.title}
          supporting={en.account.rows.sharing.desc}
          showChevron
          onClick={() => goSub('sharing')}
        />
        <ListRow
          icon="download"
          title={en.account.rows.data.title}
          supporting={en.account.rows.data.desc}
          showChevron
          onClick={() => goSub('data')}
        />
        <ListRow
          icon="info"
          title={en.account.rows.about.title}
          supporting={en.account.rows.about.desc}
          showChevron
          onClick={() => goSub('about')}
        />
        <ListRow
          icon="log-out"
          title={en.account.rows.signin.title}
          supporting={en.account.rows.signin.desc}
          showChevron
          onClick={() => goSub('signin')}
        />
      </div>

      <Sheet
        open={signOutSheetOpen}
        onClose={() => setSignOutSheetOpen(false)}
        title={en.account.signin.signOutSheetTitle}
      >
        <p className="type-body text-ink">
          {en.account.signin.signOutSheetBody}
        </p>
        <div className="flex flex-col gap-8">
          <Button
            variant="secondary"
            onClick={() => {
              setSignOutSheetOpen(false);
              onNavigate('/p6-phone');
            }}
          >
            {en.account.signin.keepDataSignOut}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              store.resetAllData();
              setSignOutSheetOpen(false);
              onNavigate('/p6-phone');
            }}
          >
            {en.account.signin.eraseDataSignOut}
          </Button>
        </div>
      </Sheet>
    </AppShell>
  );
};

/* =====================================================================
   P34: System states:
   - offline Banner (the app still works) & Doctor Pass offline message
   - update-available Banner with "Refresh"
   - corrupted storage screen ("We couldn't read your saved data. Start fresh?" + "Load demo person")
   - error boundary screen ("Something went wrong. Back to Home.")
   ===================================================================== */
export const P34SystemStatesScreen: React.FC<AccountScreenProps> = ({
  onNavigate,
  queryState = 'offline',
}) => {
  const store = useCheckInStore();
  const [activeState, setActiveState] = useState<string>(
    queryState || 'offline'
  );

  React.useEffect(() => {
    setActiveState(queryState || 'offline');
  }, [queryState]);

  if (activeState === 'corrupted') {
    return (
      <AppShell
        onBack={() => onNavigate('/account')}
        primaryAction={{
          label: en.account.about.loadDemoPerson,
          onClick: () => {
            store.loadDemoPersona('layla');
            onNavigate('/home?state=returning');
          },
        }}
        secondaryAction={{
          label: en.account.about.resetDemo,
          onClick: () => {
            store.resetAllData();
            onNavigate('/p1-welcome');
          },
        }}
      >
        <div className="flex-1 flex flex-col justify-center gap-16 py-24">
          <FeatureIconCircle name="circle-help" />
          <h1 className="type-h1 text-ink">
            {en.systemStates.corruptedTitle}
          </h1>
          <p className="type-body text-ink-2">
            {en.systemStates.corruptedBody}
          </p>
        </div>
      </AppShell>
    );
  }

  if (activeState === 'error') {
    return (
      <AppShell
        onBack={() => onNavigate('/home')}
        primaryAction={{
          label: en.systemStates.backToHome,
          onClick: () => onNavigate('/home'),
        }}
      >
        <div className="flex-1 flex flex-col justify-center gap-16 py-24">
          <FeatureIconCircle name="info" />
          <h1 className="type-h1 text-ink">{en.systemStates.errorTitle}</h1>
          <p className="type-body text-ink-2">{en.systemStates.errorBody}</p>
        </div>
      </AppShell>
    );
  }

  const bannerVariant =
    activeState === 'update'
      ? 'update'
      : activeState === 'offline' || activeState === 'pass-offline'
      ? 'offline'
      : 'demo';

  return (
    <AppShell
      bannerVariant={bannerVariant}
      onBack={() => onNavigate('/account')}
      primaryAction={{
        label: en.systemStates.backToHome,
        onClick: () => onNavigate('/home'),
      }}
    >
      <div className="flex flex-col gap-16">
        <h1 className="type-h1 text-ink">{en.systemStates.title}</h1>

        <Card className="flex flex-col gap-12">
          <h2 className="type-h2 text-ink">Active state preview</h2>
          <Banner variant="offline" />
          <Banner
            variant="update"
            actionLabel={en.banners.refresh}
            onAction={() => window.location.reload()}
          />
          <InlineError message={en.banners.passOffline} />
        </Card>

        <Card className="flex flex-col gap-8">
          <h2 className="type-h2 text-ink">Switch system state</h2>
          <SelectCard
            compact
            title="Offline banner & Doctor Pass offline guard"
            selected={activeState === 'offline'}
            onSelect={() => setActiveState('offline')}
          />
          <SelectCard
            compact
            title="Update available banner"
            selected={activeState === 'update'}
            onSelect={() => setActiveState('update')}
          />
          <SelectCard
            compact
            title="Corrupted storage recovery screen"
            selected={activeState === 'corrupted'}
            onSelect={() => setActiveState('corrupted')}
          />
          <SelectCard
            compact
            title="Error boundary fallback screen"
            selected={activeState === 'error'}
            onSelect={() => setActiveState('error')}
          />
        </Card>
      </div>
    </AppShell>
  );
};

/* =====================================================================
   Real React Error Boundary using P34 Error Screen design
   ===================================================================== */
export class AwanErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="shell-phone p-24 flex flex-col justify-center gap-16">
          <AwanMark size={48} />
          <h1 className="type-h1 text-ink">{en.systemStates.errorTitle}</h1>
          <p className="type-body text-ink-2">{en.systemStates.errorBody}</p>
          <Button
            variant="primary"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/home';
            }}
          >
            {en.systemStates.backToHome}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
