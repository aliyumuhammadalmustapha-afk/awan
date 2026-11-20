import React, { useState, useEffect } from 'react';
import { AppShell } from './ui/AppShell';
import {
  AwanMark,
  Card,
  FeatureIconCircle,
  LevelChip,
  ListRow,
  TabId,
} from './ui';
import { UiKitScreen } from './screens/dev/UiKitScreen';
import {
  P1WelcomeScreen,
  P2ToP5HowItWorksScreen,
  P6PhoneScreen,
  P7CodeScreen,
  P8NameScreen,
  P9PinScreen,
  P10WhoScreen,
  P11TopicsScreen,
  P12StageScreen,
  P13BirthScreen,
  P14PrivacyScreen,
  P15AddToHomeScreen,
  P16AllSetScreen,
  P17LockScreen,
} from './screens/onboarding/OnboardingScreens';
import {
  P18HomeScreen,
  P19CheckInStartScreen,
  P20QuestionsScreen,
  P21AddResultsScreen,
  P22OwnWordsScreen,
  P23ReviewScreen,
  P24ResultCardScreen,
  P25NextStepScreen,
} from './screens/checkin/CheckInScreens';
import {
  AwanErrorBoundary,
  P31AccountScreen,
  P34SystemStatesScreen,
} from './screens/account/AccountAndSystemScreens';
import {
  P28ShareTabScreen,
  P29CreatePassScreen,
  P32ClinicianViewScreen,
} from './screens/share/ShareAndClinicianScreens';
import {
  P26TrendScreen,
  P27ResultsTabScreen,
  P30FollowUpScreen,
} from './screens/results/TrendResultsFollowUpScreens';
import { P33DashboardScreen } from './screens/dashboard/DashboardScreen';
import { en } from './i18n';

export interface RoutePlaceholderInfo {
  code: string;
  path: string;
  title: string;
  phase: string;
  status: string;
  mode?: 'phone' | 'viewer';
  showNav?: boolean;
  tab?: TabId;
}

export const ROUTE_CATALOG: RoutePlaceholderInfo[] = [
  { code: 'P1', path: '/p1-welcome', title: 'Welcome card', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P2', path: '/p2-how-it-works', title: 'How it works (1/4): You choose when', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P3', path: '/p3-how-it-works', title: 'How it works (2/4): A clear, calm answer', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P4', path: '/p4-how-it-works', title: 'How it works (3/4): See your direction', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P5', path: '/p5-how-it-works', title: 'How it works (4/4): You stay in control', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P6', path: '/p6-phone', title: "What's your phone number?", phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P7', path: '/p7-code', title: 'Enter the 6-digit code', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P8', path: '/p8-name', title: 'What should we call you?', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P9', path: '/p9-pin', title: 'Create & confirm 4-digit PIN', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P10', path: '/p10-who', title: 'Who is this for?', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P11', path: '/p11-topics', title: 'Which topics would you like to include?', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P12', path: '/p12-stage', title: 'Where are you right now?', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P13', path: '/p13-birth', title: 'When were you born?', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P14', path: '/p14-privacy', title: 'Save your check-ins on this phone?', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P15', path: '/p15-a2hs', title: 'Add Awan to your home screen', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P16', path: '/p16-all-set', title: "You're all set", phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P17', path: '/p17-lock', title: 'Lock screen', phase: 'Phase 1', status: 'WORKING + TESTED' },
  { code: 'P18', path: '/home', title: 'Hello, Layla', phase: 'Phase 2', status: 'WORKING + TESTED', showNav: true, tab: 'home' },
  { code: 'P19', path: '/p19-checkin-start', title: 'Check my direction', phase: 'Phase 2', status: 'WORKING + TESTED' },
  { code: 'P20', path: '/p20-questions', title: 'Check-in questions', phase: 'Phase 2', status: 'WORKING + TESTED' },
  { code: 'P21', path: '/p21-add-results', title: 'Add a result?', phase: 'Phase 2', status: 'WORKING + TESTED' },
  { code: 'P22', path: '/p22-own-words', title: 'Anything in your own words?', phase: 'Phase 2', status: 'WORKING + TESTED' },
  { code: 'P23', path: '/p23-review', title: 'Review your check-in', phase: 'Phase 2', status: 'WORKING + TESTED' },
  { code: 'P24', path: '/p24-result', title: 'Your direction result', phase: 'Phase 2', status: 'WORKING + TESTED' },
  { code: 'P25', path: '/p25-next-step', title: 'Your next step', phase: 'Phase 2', status: 'WORKING + TESTED' },
  { code: 'P26', path: '/p26-trend', title: 'Your direction over time', phase: 'Phase 5', status: 'WORKING + TESTED', showNav: true, tab: 'home' },
  { code: 'P27', path: '/results', title: 'Saved results', phase: 'Phase 5', status: 'WORKING + TESTED', showNav: true, tab: 'results' },
  { code: 'P28', path: '/share', title: 'Doctor Pass sharing', phase: 'Phase 4', status: 'WORKING + TESTED', showNav: true, tab: 'share' },
  { code: 'P29', path: '/p29-create-pass', title: 'Create a Doctor Pass', phase: 'Phase 4', status: 'WORKING + TESTED' },
  { code: 'P30', path: '/p30-follow-up', title: 'Did you speak to someone?', phase: 'Phase 5', status: 'WORKING + TESTED', showNav: true, tab: 'home' },
  { code: 'P31', path: '/account', title: 'Account and privacy', phase: 'Phase 3', status: 'WORKING + TESTED', showNav: true, tab: 'account' },
  { code: 'P32', path: '/clinician-view', title: 'Clinician summary view', phase: 'Phase 4', status: 'WORKING + TESTED', mode: 'viewer' },
  { code: 'P33', path: '/dashboard', title: 'Health-system insight dashboard', phase: 'Phase 6', status: 'WORKING + TESTED', mode: 'viewer' },
  { code: 'P34', path: '/p34-system-states', title: 'System states', phase: 'Phase 3', status: 'WORKING + TESTED' },
];

function extractQueryState(search: string): string {
  const params = new URLSearchParams(search || '');
  return (
    params.get('state') ||
    params.get('step') ||
    params.get('choice') ||
    params.get('mode') ||
    params.get('level') ||
    params.get('sub') ||
    params.get('q') ||
    ''
  );
}

export const App: React.FC = () => {
  const [route, setRoute] = useState<string>(() => {
    const path = window.location.pathname;
    if (path && path !== '/') return path;
    return '/p1-welcome';
  });
  const [queryState, setQueryState] = useState<string>(() =>
    extractQueryState(window.location.search)
  );

  useEffect(() => {
    const handlePop = () => {
      setRoute(window.location.pathname || '/p1-welcome');
      setQueryState(extractQueryState(window.location.search));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = (nextUrl: string) => {
    window.history.pushState({}, '', nextUrl);
    const [pathname, search] = nextUrl.split('?');
    setRoute(pathname || '/p1-welcome');
    setQueryState(extractQueryState(search || ''));
  };

  const renderScreen = () => {
    if (route === '/ui-kit') {
      return <UiKitScreen onNavigate={navigate} />;
    }

    // Phase 1 Onboarding & Lock Screens (P1 - P17)
    if (route === '/' || route === '/p1-welcome') {
      return <P1WelcomeScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p2-how-it-works') {
      return <P2ToP5HowItWorksScreen onNavigate={navigate} cardIndex={0} />;
    }
    if (route === '/p3-how-it-works') {
      return <P2ToP5HowItWorksScreen onNavigate={navigate} cardIndex={1} />;
    }
    if (route === '/p4-how-it-works') {
      return <P2ToP5HowItWorksScreen onNavigate={navigate} cardIndex={2} />;
    }
    if (route === '/p5-how-it-works') {
      return <P2ToP5HowItWorksScreen onNavigate={navigate} cardIndex={3} />;
    }
    if (route === '/p6-phone') {
      return <P6PhoneScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p7-code') {
      return <P7CodeScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p8-name') {
      return <P8NameScreen onNavigate={navigate} />;
    }
    if (route === '/p9-pin') {
      return <P9PinScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p10-who') {
      return <P10WhoScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p11-topics') {
      return <P11TopicsScreen onNavigate={navigate} />;
    }
    if (route === '/p12-stage') {
      return <P12StageScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p13-birth') {
      return <P13BirthScreen onNavigate={navigate} />;
    }
    if (route === '/p14-privacy') {
      return <P14PrivacyScreen onNavigate={navigate} />;
    }
    if (route === '/p15-a2hs') {
      return <P15AddToHomeScreen onNavigate={navigate} />;
    }
    if (route === '/p16-all-set') {
      return <P16AllSetScreen onNavigate={navigate} />;
    }
    if (route === '/p17-lock') {
      return <P17LockScreen onNavigate={navigate} queryState={queryState} />;
    }

    // Phase 2 Home, Check-In, Lab Results, Review, Result Card & Next Step (P18 - P25)
    if (route === '/home') {
      return <P18HomeScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p19-checkin-start') {
      return <P19CheckInStartScreen onNavigate={navigate} />;
    }
    if (route === '/p20-questions') {
      return <P20QuestionsScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p21-add-results') {
      return <P21AddResultsScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p22-own-words') {
      return <P22OwnWordsScreen onNavigate={navigate} />;
    }
    if (route === '/p23-review') {
      return <P23ReviewScreen onNavigate={navigate} />;
    }
    if (route === '/p24-result') {
      return <P24ResultCardScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p25-next-step') {
      return <P25NextStepScreen onNavigate={navigate} />;
    }

    // Phase 3 Account & 8 Subpages (P31) + System States (P34)
    if (route === '/account') {
      return <P31AccountScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p34-system-states') {
      return <P34SystemStatesScreen onNavigate={navigate} queryState={queryState} />;
    }

    // Phase 4 Share Tab (P28), Create Doctor Pass (P29), Clinician View (P32)
    if (route === '/share') {
      return <P28ShareTabScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p29-create-pass') {
      return <P29CreatePassScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/clinician-view' || route.startsWith('/p/')) {
      return <P32ClinicianViewScreen onNavigate={navigate} queryState={queryState} />;
    }

    // Phase 5 Trend (P26), Results Tab (P27), Follow-up Cards (P30)
    if (route === '/p26-trend') {
      return <P26TrendScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/results') {
      return <P27ResultsTabScreen onNavigate={navigate} queryState={queryState} />;
    }
    if (route === '/p30-follow-up') {
      return <P30FollowUpScreen onNavigate={navigate} queryState={queryState} />;
    }

    // Phase 6 Health-System Dashboard (P33)
    if (route === '/dashboard') {
      return <P33DashboardScreen onNavigate={navigate} queryState={queryState} />;
    }

    if (route === '/routes') {
      return (
        <AppShell
          topTitle="Route directory (P1–P34)"
          topRightAction={{ label: 'UI Kit', onClick: () => navigate('/ui-kit') }}
          showBottomNav
          activeTab="home"
          onSelectTab={(tab) => {
            if (tab === 'home') navigate('/home');
            if (tab === 'results') navigate('/results');
            if (tab === 'share') navigate('/share');
            if (tab === 'account') navigate('/account');
          }}
          primaryAction={{
            label: 'Open P31 Account (/account)',
            onClick: () => navigate('/account'),
          }}
        >
          <div className="flex items-center gap-12">
            <AwanMark size={48} />
            <div className="flex flex-col gap-4">
              <h1 className="type-h1 text-ink">Awan route directory</h1>
              <p className="type-supporting text-ink-2">
                P1 to P25, P31 and P34 are WORKING + TESTED.
              </p>
            </div>
          </div>

          <Card className="flex flex-col gap-12">
            <h2 className="type-h2 text-ink">All screens (P1–P34)</h2>
            <div className="flex flex-col gap-8">
              {ROUTE_CATALOG.map((item) => (
                <ListRow
                  key={item.code}
                  title={`${item.code} · ${item.title}`}
                  supporting={`${item.phase} · ${item.path} · ${item.status}`}
                  showChevron
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          </Card>
        </AppShell>
      );
    }

    const matched =
      ROUTE_CATALOG.find((r) => r.path === route) || ROUTE_CATALOG[25];

    return (
      <AppShell
        mode={matched.mode || 'phone'}
        onBack={() => navigate('/routes')}
        topTitle={`${matched.code} · ${matched.phase}`}
        topRightAction={{ label: 'UI Kit', onClick: () => navigate('/ui-kit') }}
        showBottomNav={Boolean(matched.showNav)}
        activeTab={matched.tab || 'home'}
        onSelectTab={(tab) => {
          if (tab === 'home') navigate('/home');
          if (tab === 'results') navigate('/results');
          if (tab === 'share') navigate('/share');
          if (tab === 'account') navigate('/account');
        }}
        primaryAction={{
          label: en.common.continue,
          onClick: () => navigate('/routes'),
        }}
      >
        <div className="flex flex-col gap-16">
          <FeatureIconCircle name="calendar-check" />
          <h1 className="type-h1 text-ink">{matched.title}</h1>
          <Card className="flex flex-col gap-12">
            <div className="flex items-center justify-between">
              <span className="type-body-medium text-ink">
                {matched.code} route placeholder ({en.common.demoLabel})
              </span>
              <LevelChip level="L0" />
            </div>
            <p className="type-body text-ink-2">
              Scheduled for full implementation in {matched.phase}.
            </p>
          </Card>
        </div>
      </AppShell>
    );
  };

  return <AwanErrorBoundary>{renderScreen()}</AwanErrorBoundary>;
};
