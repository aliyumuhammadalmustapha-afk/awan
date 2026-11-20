import React from 'react';
import { Banner, TopBar, BottomNav, TabId, Button } from './index';

export interface AppShellProps {
  mode?: 'phone' | 'viewer';
  showDemoBanner?: boolean;
  bannerVariant?: 'demo' | 'offline' | 'update';
  onBack?: () => void;
  topTitle?: string;
  topRightAction?: { label: string; onClick: () => void };
  activeTab?: TabId;
  onSelectTab?: (tab: TabId) => void;
  showBottomNav?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  mode = 'phone',
  showDemoBanner = true,
  bannerVariant = 'demo',
  onBack,
  topTitle,
  topRightAction,
  activeTab = 'home',
  onSelectTab,
  showBottomNav = false,
  primaryAction,
  secondaryAction,
  children,
}) => {
  const containerClass = mode === 'viewer' ? 'shell-viewer' : 'shell-phone';

  return (
    <div className={containerClass}>
      {showDemoBanner ? <Banner variant={bannerVariant} /> : null}
      {onBack || topTitle || topRightAction ? (
        <TopBar onBack={onBack} title={topTitle} rightAction={topRightAction} />
      ) : null}
      <main className="flex-1 px-16 py-16 flex flex-col gap-24 overflow-y-auto">
        {children}
      </main>
      {primaryAction || secondaryAction || (showBottomNav && onSelectTab) ? (
        <div className="sticky-bottom shrink-0 flex flex-col">
          {primaryAction || secondaryAction ? (
            <div className="px-16 py-12 flex flex-col gap-8">
              {primaryAction ? (
                <Button
                  variant="primary"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  loading={primaryAction.loading}
                >
                  {primaryAction.label}
                </Button>
              ) : null}
              {secondaryAction ? (
                <Button variant="text" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              ) : null}
            </div>
          ) : null}
          {showBottomNav && onSelectTab ? (
            <BottomNav activeTab={activeTab} onSelect={onSelectTab} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
