import React, { useState, useRef, useEffect } from 'react';
import { Icon, IconName, FeatureIconCircle, AwanMark } from './icons';
import { AdviceLevel } from '../engine/evaluator';
import { en } from '../i18n';

export { Icon, FeatureIconCircle, AwanMark };
export type { IconName };

/* =====================================================================
   1. BUTTON (primary, secondary, text, destructive; states: default,
      pressed, disabled, loading with preserved width)
   ===================================================================== */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'destructive';
  loading?: boolean;
  pressed?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  pressed = false,
  fullWidth = true,
  disabled,
  children,
  className = '',
  ...rest
}) => {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
      ? 'btn-secondary'
      : variant === 'destructive'
      ? 'btn-destructive'
      : 'btn-text';

  return (
    <button
      type="button"
      data-state={pressed ? 'pressed' : 'default'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center type-body-medium cursor-pointer select-none ${
        fullWidth ? 'w-full' : ''
      } ${variantClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center">
          <span className="spinner-ring" aria-label="Loading" />
        </span>
      ) : (
        children
      )}
    </button>
  );
};

/* =====================================================================
   2. CARD (surface, 1px border, radius 16, padding 16 or 20 for hero)
   ===================================================================== */
export const Card: React.FC<{
  hero?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ hero = false, className = '', children }) => (
  <div
    className={`bg-surface border-1 radius-card shadow-card ${
      hero ? 'p-20' : 'p-16'
    } ${className}`}
  >
    {children}
  </div>
);

/* =====================================================================
   3. LEVEL CHIP (pill, 32px high, icon 16 + label 14 medium; large 40px)
   ===================================================================== */
const LEVEL_STYLES: Record<
  AdviceLevel,
  { bg: string; text: string; icon: IconName; label: string }
> = {
  L0: { bg: 'bg-l0', text: 'text-l0', icon: 'circle-check', label: en.levels.L0.label },
  L1: { bg: 'bg-l1', text: 'text-l1', icon: 'message-circle', label: en.levels.L1.label },
  L2: { bg: 'bg-l2', text: 'text-l2', icon: 'clock', label: en.levels.L2.label },
  L3: { bg: 'bg-l3', text: 'text-l3', icon: 'phone-call', label: en.levels.L3.label },
  U: { bg: 'bg-u', text: 'text-u', icon: 'circle-help', label: en.levels.U.label },
};

export const LevelChip: React.FC<{
  level: AdviceLevel;
  large?: boolean;
}> = ({ level, large = false }) => {
  const cfg = LEVEL_STYLES[level] || LEVEL_STYLES.U;
  return (
    <span
      className={`inline-flex items-center gap-8 radius-pill px-12 ${
        large ? 'h-chip-lg type-body-medium' : 'h-chip type-supporting-medium'
      } ${cfg.bg} ${cfg.text}`}
    >
      <Icon name={cfg.icon} size={16} />
      <span>{cfg.label}</span>
    </span>
  );
};

/* =====================================================================
   4. TOP BAR & BOTTOM NAV
   ===================================================================== */
export const TopBar: React.FC<{
  onBack?: () => void;
  title?: string;
  rightAction?: { label: string; onClick: () => void };
}> = ({ onBack, title, rightAction }) => (
  <header className="h-topbar px-16 flex items-center justify-between bg-canvas shrink-0">
    <div className="flex items-center gap-8">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={en.common.back}
          className="w-tap h-tap inline-flex items-center justify-center radius-control bg-canvas border-none cursor-pointer text-ink"
        >
          <Icon name="arrow-left" size={24} />
        </button>
      ) : null}
      {title ? <span className="type-body-medium text-ink">{title}</span> : null}
    </div>
    {rightAction ? (
      <Button variant="text" fullWidth={false} onClick={rightAction.onClick}>
        {rightAction.label}
      </Button>
    ) : null}
  </header>
);

export type TabId = 'home' | 'results' | 'share' | 'account';

export const BottomNav: React.FC<{
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
}> = ({ activeTab, onSelect }) => {
  const tabs: Array<{ id: TabId; label: string; icon: IconName }> = [
    { id: 'home', label: en.nav.home, icon: 'calendar-check' },
    { id: 'results', label: en.nav.results, icon: 'file-text' },
    { id: 'share', label: en.nav.share, icon: 'share-2' },
    { id: 'account', label: en.nav.account, icon: 'user' },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="h-bottomnav bg-surface border-t-1 grid grid-cols-4 items-center px-8 shrink-0"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-4 min-h-tap border-none bg-surface cursor-pointer radius-control ${
              isActive ? 'text-primary' : 'text-ink-2'
            }`}
          >
            <span
              className={`px-12 py-4 radius-pill inline-flex items-center justify-center ${
                isActive ? 'bg-primary-tint text-primary' : ''
              }`}
            >
              <Icon name={tab.icon} size={24} />
            </span>
            <span className="type-caption-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

/* =====================================================================
   5. STEP DOTS & PROGRESS BAR (4px, primary, animated width)
   ===================================================================== */
export const StepDots: React.FC<{
  total: number;
  current: number;
  onSelect?: (index: number) => void;
}> = ({ total, current, onSelect }) => (
  <div className="flex items-center justify-center gap-8" role="tablist" aria-label="Steps">
    {Array.from({ length: total }).map((_, idx) => {
      const active = idx === current;
      return (
        <button
          key={idx}
          type="button"
          role="tab"
          aria-selected={active}
          aria-label={`Step ${idx + 1} of ${total}`}
          onClick={() => onSelect?.(idx)}
          className={`h-progress radius-pill border-none cursor-pointer transition-calm ${
            active ? 'bg-primary px-12' : 'bg-switch-off p-4'
          }`}
        />
      );
    })}
  </div>
);

export const ProgressBar: React.FC<{
  value: number; // 0 to 100
  label?: string;
}> = ({ value, label = 'Progress' }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full h-progress bg-banner radius-pill overflow-hidden"
    >
      <div
        className="h-full bg-primary transition-calm"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

/* =====================================================================
   6. SWITCH (52x32 track, always paired with label and description)
   ===================================================================== */
export const Switch: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled = false }) => (
  <div className="flex items-center justify-between gap-16 min-h-row py-8">
    <div className="flex flex-col gap-4 flex-1">
      <span className="type-body-medium text-ink">{label}</span>
      {description ? <span className="type-supporting text-ink-2">{description}</span> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="switch-track"
    >
      <span className="switch-thumb" />
    </button>
  </div>
);

/* =====================================================================
   7. LIST ROW (56px minimum, icon/avatar start, title 16, supporting 14)
   ===================================================================== */
export const ListRow: React.FC<{
  icon?: IconName;
  avatarText?: string;
  title: string;
  supporting?: string;
  onClick?: () => void;
  endSlot?: React.ReactNode;
  showChevron?: boolean;
}> = ({ icon, avatarText, title, supporting, onClick, endSlot, showChevron = false }) => {
  const content = (
    <>
      <div className="flex items-center gap-12 flex-1 text-start">
        {icon ? (
          <div className="icon-circle-48">
            <Icon name={icon} size={24} />
          </div>
        ) : null}
        {avatarText ? (
          <div className="icon-circle-48 type-body-medium">{avatarText}</div>
        ) : null}
        <div className="flex flex-col gap-4 flex-1">
          <span className="type-body-medium text-ink">{title}</span>
          {supporting ? <span className="type-supporting text-ink-2">{supporting}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-8 shrink-0">
        {endSlot}
        {showChevron ? <Icon name="chevron-right" size={20} className="text-ink-2" /> : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full min-h-row py-12 px-16 flex items-center justify-between gap-12 bg-surface border-1 radius-control cursor-pointer text-start"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="w-full min-h-row py-12 px-16 flex items-center justify-between gap-12 bg-surface border-1 radius-control">
      {content}
    </div>
  );
};

/* =====================================================================
   8. SELECT CARD (radio or checkbox; selected = 2px primary border,
      primary-tint fill and check icon; compact variant for 5+ options)
   ===================================================================== */
export const SelectCard: React.FC<{
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
  multi?: boolean;
}> = ({ title, description, selected, onSelect, compact = false, multi = false }) => (
  <button
    type="button"
    role={multi ? 'checkbox' : 'radio'}
    aria-checked={selected}
    onClick={onSelect}
    className={`w-full flex items-center justify-between gap-12 radius-control cursor-pointer text-start transition-calm ${
      compact ? 'py-12 px-16 min-h-tap' : 'p-16 min-h-row'
    } ${selected ? 'border-2-primary bg-primary-tint' : 'border-1 bg-surface'}`}
  >
    <div className="flex flex-col gap-4 flex-1">
      <span className="type-body-medium text-ink">{title}</span>
      {description ? <span className="type-supporting text-ink-2">{description}</span> : null}
    </div>
    <span className={`shrink-0 ${selected ? 'text-primary' : 'text-ink-2'}`}>
      {selected ? <Icon name="circle-check" size={24} /> : null}
    </span>
  </button>
);

/* =====================================================================
   9. INLINE ERROR (icon + words, never colour alone, ink with plum icon)
   ===================================================================== */
export const InlineError: React.FC<{
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ message, actionLabel, onAction }) => (
  <div
    role="alert"
    aria-live="polite"
    className="flex items-start gap-8 p-12 radius-control bg-plum-tint border-1-plum"
  >
    <Icon name="info" size={20} className="text-plum shrink-0" />
    <div className="flex flex-col gap-4 flex-1">
      <span className="type-supporting text-ink">{message}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="type-supporting-medium text-primary bg-plum-tint border-none cursor-pointer text-start"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  </div>
);

/* =====================================================================
   10. TEXT FIELD & PHONE FIELD (+234 and +971 first, searchable sheet)
   ===================================================================== */
export const TextField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  maxLength?: number;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
}> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  helper,
  error,
  maxLength,
  multiline = false,
  type = 'text',
  autoComplete,
}) => (
  <div className="flex flex-col gap-8 w-full">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="type-supporting-medium text-ink">
        {label}
      </label>
      {typeof maxLength === 'number' ? (
        <span className="type-caption text-ink-2">
          {value.length}/{maxLength}
        </span>
      ) : null}
    </div>
    {multiline ? (
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full p-12 bg-surface border-1 radius-control type-body text-ink"
      />
    ) : (
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-tap px-12 bg-surface border-1 radius-control type-body text-ink"
      />
    )}
    {helper ? <span className="type-supporting text-ink-2">{helper}</span> : null}
    {error ? <InlineError message={error} /> : null}
  </div>
);

const COUNTRY_CODES = [
  { code: '+234', country: 'Nigeria (+234)' },
  { code: '+971', country: 'UAE (+971)' },
  { code: '+966', country: 'Saudi Arabia (+966)' },
  { code: '+20', country: 'Egypt (+20)' },
  { code: '+233', country: 'Ghana (+233)' },
  { code: '+254', country: 'Kenya (+254)' },
  { code: '+27', country: 'South Africa (+27)' },
  { code: '+974', country: 'Qatar (+974)' },
  { code: '+965', country: 'Kuwait (+965)' },
  { code: '+968', country: 'Oman (+968)' },
  { code: '+973', country: 'Bahrain (+973)' },
  { code: '+44', country: 'United Kingdom (+44)' },
  { code: '+1', country: 'United States / Canada (+1)' },
  { code: '+91', country: 'India (+91)' },
];

export const PhoneField: React.FC<{
  countryCode: string;
  onCountryChange: (code: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  error?: string;
}> = ({ countryCode, onCountryChange, phone, onPhoneChange, error }) => {
  return (
    <div className="flex flex-col gap-8 w-full">
      <label htmlFor="awan-phone-input" className="type-supporting-medium text-ink">
        Phone number
      </label>
      <div className="flex items-center gap-8">
        <select
          id="awan-country-code-select"
          aria-label="Select country code"
          value={countryCode}
          onChange={(e) => onCountryChange(e.target.value)}
          className="min-h-tap px-12 bg-surface border-1 radius-control type-body-medium text-ink cursor-pointer shrink-0"
        >
          {COUNTRY_CODES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.country}
            </option>
          ))}
        </select>
        <input
          id="awan-phone-input"
          type="tel"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="801 234 5678"
          className="flex-1 min-h-tap px-12 bg-surface border-1 radius-control type-body text-ink"
        />
      </div>
      {error ? <InlineError message={error} /> : null}
    </div>
  );
};

/* =====================================================================
   11. OTP BOXES (6 boxes, auto-advance, paste support)
   ===================================================================== */
export const OtpBoxes: React.FC<{
  value: string;
  onChange: (val: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleDigit = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (clean.length > 1) {
      const sliced = clean.slice(0, 6);
      onChange(sliced);
      const focusIdx = Math.min(5, sliced.length);
      refs.current[focusIdx]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = clean;
    onChange(next.join(''));
    if (clean && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-6 gap-8" role="group" aria-label="6-digit verification code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : undefined}
            aria-label={`Digit ${i + 1}`}
            value={d}
            maxLength={6}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !d && i > 0) {
                refs.current[i - 1]?.focus();
              }
            }}
            className="w-full min-h-tap text-center bg-surface border-1 radius-control type-h2 text-ink"
          />
        ))}
      </div>
      {error ? <InlineError message={error} /> : null}
    </div>
  );
};

/* =====================================================================
   12. PIN PAD (3x4 keys, 64px height, four dot indicators)
   ===================================================================== */
export const PinPad: React.FC<{
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
  disabled?: boolean;
}> = ({ value, onChange, maxLength = 4, disabled = false }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

  const handleKey = (k: string) => {
    if (disabled) return;
    if (k === 'clear') {
      onChange('');
    } else if (k === 'back') {
      onChange(value.slice(0, -1));
    } else if (value.length < maxLength) {
      onChange(value + k);
    }
  };

  return (
    <div className="flex flex-col items-center gap-24 w-full">
      <div
        className="flex items-center justify-center gap-12"
        role="status"
        aria-label={`${value.length} of ${maxLength} PIN digits entered`}
      >
        {Array.from({ length: maxLength }).map((_, i) => {
          const filled = i < value.length;
          return (
            <span
              key={i}
              className={`p-8 radius-pill border-1 ${
                filled ? 'bg-primary border-primary' : 'bg-surface'
              }`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-12 w-full">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => handleKey(k)}
            aria-label={k === 'back' ? 'Delete last digit' : k === 'clear' ? 'Clear PIN' : `Digit ${k}`}
            className="h-pin-key bg-surface border-1 radius-control type-h2 text-ink cursor-pointer flex items-center justify-center"
          >
            {k === 'back' ? <Icon name="arrow-left" size={20} /> : k === 'clear' ? 'Clear' : k}
          </button>
        ))}
      </div>
    </div>
  );
};

/* =====================================================================
   13. STEPPER (months) & MONTH YEAR PICKER (two selects)
   ===================================================================== */
export const Stepper: React.FC<{
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  unitLabel?: string;
}> = ({ label, value, onChange, min = 0, max = 120, unitLabel = 'months' }) => (
  <div className="flex items-center justify-between gap-16 p-16 bg-surface border-1 radius-card">
    <div className="flex flex-col gap-4">
      <span className="type-body-medium text-ink">{label}</span>
      <span className="type-supporting text-ink-2">
        {value} {unitLabel}
      </span>
    </div>
    <div className="flex items-center gap-12">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-tap h-tap radius-control border-1 bg-surface type-h2 text-ink cursor-pointer"
      >
        -
      </button>
      <span className="type-h2 text-ink px-8">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-tap h-tap radius-control border-1 bg-surface type-h2 text-ink cursor-pointer"
      >
        +
      </button>
    </div>
  </div>
);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MonthYearPicker: React.FC<{
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}> = ({ month, year, onChange }) => {
  const years = Array.from({ length: 45 }, (_, i) => 2008 - i);
  return (
    <div className="grid grid-cols-2 gap-12 w-full">
      <div className="flex flex-col gap-8">
        <label htmlFor="birth-month-select" className="type-supporting-medium text-ink">
          Birth month
        </label>
        <select
          id="birth-month-select"
          value={month}
          onChange={(e) => onChange(Number(e.target.value), year)}
          className="min-h-tap px-12 bg-surface border-1 radius-control type-body text-ink"
        >
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-8">
        <label htmlFor="birth-year-select" className="type-supporting-medium text-ink">
          Birth year
        </label>
        <select
          id="birth-year-select"
          value={year}
          onChange={(e) => onChange(month, Number(e.target.value))}
          className="min-h-tap px-12 bg-surface border-1 radius-control type-body text-ink"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

/* =====================================================================
   14. FILE ATTACH (PDF, JPG, PNG up to 5MB, preview, Remove, errors)
   ===================================================================== */
export interface AttachedFileInfo {
  name: string;
  sizeBytes: number;
  type: string;
  previewUrl?: string;
}

export const FileAttach: React.FC<{
  file: AttachedFileInfo | null;
  onSelectFile: (file: AttachedFileInfo | null) => void;
  error?: string;
  onFallbackTypeValues?: () => void;
}> = ({ file, onSelectFile, error, onFallbackTypeValues }) => {
  const [localError, setLocalError] = useState<string | undefined>(error);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setLocalError('Only PDF, JPG or PNG files are supported.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setLocalError('That file is larger than 5 MB.');
      return;
    }
    setLocalError(undefined);
    onSelectFile({
      name: f.name,
      sizeBytes: f.size,
      type: f.type,
    });
  };

  const displayError = error || localError;

  return (
    <div className="flex flex-col gap-12 w-full">
      {!file ? (
        <label
          htmlFor="awan-file-attach"
          className="min-h-row p-16 bg-surface border-1 radius-card flex items-center justify-between gap-12 cursor-pointer"
        >
          <div className="flex items-center gap-12">
            <FeatureIconCircle name="paperclip" />
            <div className="flex flex-col gap-4">
              <span className="type-body-medium text-ink">Choose PDF, JPG or PNG</span>
              <span className="type-supporting text-ink-2">Up to 5 MB · Stays on this phone</span>
            </div>
          </div>
          <input
            id="awan-file-attach"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInput}
            className="overflow-hidden"
            style={{ width: '1px', height: '1px', opacity: 0 }}
          />
        </label>
      ) : (
        <Card className="flex items-center justify-between gap-12">
          <div className="flex items-center gap-12">
            <FeatureIconCircle name="file-text" />
            <div className="flex flex-col gap-4">
              <span className="type-body-medium text-ink">{file.name}</span>
              <span className="type-supporting text-ink-2">
                {Math.max(1, Math.round(file.sizeBytes / 1024))} KB · Preview ready
              </span>
            </div>
          </div>
          <Button
            variant="text"
            fullWidth={false}
            onClick={() => onSelectFile(null)}
          >
            {en.common.remove}
          </Button>
        </Card>
      )}
      {displayError ? (
        <InlineError
          message={displayError}
          actionLabel="Type the values instead"
          onAction={onFallbackTypeValues}
        />
      ) : null}
    </div>
  );
};

/* =====================================================================
   15. SEGMENTED CONTROL & CHIPS
   ===================================================================== */
export const SegmentedControl: React.FC<{
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}> = ({ options, value, onChange }) => (
  <div
    role="radiogroup"
    aria-label="Duration options"
    className="grid grid-cols-3 gap-8 p-4 bg-banner radius-control"
  >
    {options.map((opt) => {
      const active = opt.id === value;
      return (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(opt.id)}
          className={`min-h-tap px-12 radius-control type-supporting-medium cursor-pointer border-none transition-calm ${
            active ? 'bg-surface text-primary shadow-card' : 'bg-banner text-ink-2'
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export const Chips: React.FC<{
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}> = ({ options, selectedIds, onToggle }) => (
  <div className="flex flex-wrap gap-8" role="group" aria-label="Choices">
    {options.map((opt) => {
      const selected = selectedIds.includes(opt.id);
      return (
        <button
          key={opt.id}
          type="button"
          aria-pressed={selected}
          onClick={() => onToggle(opt.id)}
          className={`min-h-tap px-16 radius-pill type-supporting-medium cursor-pointer inline-flex items-center gap-8 transition-calm ${
            selected ? 'border-2-primary bg-primary-tint text-primary' : 'border-1 bg-surface text-ink'
          }`}
        >
          {selected ? <Icon name="circle-check" size={16} /> : null}
          <span>{opt.label}</span>
        </button>
      );
    })}
  </div>
);

/* =====================================================================
   16. BANNER (32px, caption 12, banner-bg, info icon. Variants: demo,
       offline, update)
   ===================================================================== */
export const Banner: React.FC<{
  variant?: 'demo' | 'offline' | 'update';
  customText?: string;
  onAction?: () => void;
  actionLabel?: string;
}> = ({ variant = 'demo', customText, onAction, actionLabel }) => {
  const defaultText =
    variant === 'offline'
      ? en.banners.offline
      : variant === 'update'
      ? en.banners.updateAvailable
      : en.banners.demo;

  return (
    <div
      role="status"
      className="h-banner px-16 py-4 bg-banner text-banner flex items-center justify-between gap-8 shrink-0"
    >
      <div className="flex items-center gap-8">
        <Icon name="info" size={16} />
        <span className="type-caption-medium">{customText || defaultText}</span>
      </div>
      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="type-caption-medium text-primary bg-banner border-none cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

/* =====================================================================
   17. SHEET (bottom sheet, grab handle, scrim, focus trap)
   ===================================================================== */
export const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full bg-surface radius-sheet shadow-sheet p-20 flex flex-col gap-16 shell-phone"
        style={{ minHeight: 'auto' }}
      >
        <div className="flex flex-col items-center gap-12">
          <span className="w-tap h-progress bg-switch-off radius-pill" aria-hidden="true" />
          <div className="w-full flex items-center justify-between">
            <h2 className="type-h2 text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={en.common.close}
              className="w-tap h-tap inline-flex items-center justify-center bg-surface border-none radius-control cursor-pointer text-ink"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

/* =====================================================================
   18. STAT TILE, TIMELINE ITEM, EMPTY STATE, SOURCE TAG
   ===================================================================== */
export const StatTile: React.FC<{
  value: string;
  label: string;
  supporting?: string;
}> = ({ value, label, supporting }) => (
  <Card className="flex flex-col gap-8">
    <span className="type-h1 text-ink">{value}</span>
    <span className="type-body-medium text-ink">{label}</span>
    {supporting ? <span className="type-supporting text-ink-2">{supporting}</span> : null}
  </Card>
);

export const TimelineItem: React.FC<{
  date: string;
  level: AdviceLevel;
  summary: string;
  source?: 'self-reported' | 'lab-reported' | 'recalled' | 'lab-uploaded-unverified';
}> = ({ date, level, summary, source }) => (
  <div className="flex items-start gap-12 p-16 bg-surface border-1 radius-card">
    <div className="flex flex-col gap-8 flex-1">
      <div className="flex items-center justify-between gap-8 flex-wrap">
        <span className="type-supporting-medium text-ink-2">{date}</span>
        {source ? <SourceTag kind={source} /> : null}
      </div>
      <div>
        <LevelChip level={level} />
      </div>
      <p className="type-body text-ink">{summary}</p>
    </div>
  </div>
);

export const EmptyState: React.FC<{
  message: string;
  actionLabel: string;
  onAction: () => void;
  icon?: IconName;
}> = ({ message, actionLabel, onAction, icon = 'calendar-check' }) => (
  <Card className="flex flex-col items-start gap-16">
    <FeatureIconCircle name={icon} />
    <p className="type-body text-ink">{message}</p>
    <Button variant="primary" onClick={onAction}>
      {actionLabel}
    </Button>
  </Card>
);

export type SourceTagKind =
  | 'self-reported'
  | 'lab-reported'
  | 'recalled'
  | 'lab-uploaded-unverified';

export const SourceTag: React.FC<{ kind: SourceTagKind }> = ({ kind }) => {
  const map: Record<SourceTagKind, { label: string; icon: IconName }> = {
    'self-reported': { label: en.sourceTags.selfReported, icon: 'user' },
    'lab-reported': { label: en.sourceTags.labReported, icon: 'file-text' },
    recalled: { label: en.sourceTags.recalled, icon: 'clock' },
    'lab-uploaded-unverified': {
      label: en.sourceTags.labUploadedUnverified,
      icon: 'paperclip',
    },
  };
  const item = map[kind];
  return (
    <span className="inline-flex items-center gap-4 px-8 py-4 radius-pill bg-banner text-banner type-caption-medium">
      <Icon name={item.icon} size={16} />
      <span>{item.label}</span>
    </span>
  );
};
