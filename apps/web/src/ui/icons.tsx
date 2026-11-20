import React from 'react';

export type IconName =
  | 'calendar-check'
  | 'list-checks'
  | 'trending-up'
  | 'shield'
  | 'lock'
  | 'bell'
  | 'share-2'
  | 'file-text'
  | 'paperclip'
  | 'user'
  | 'eye-off'
  | 'clock'
  | 'circle-check'
  | 'circle-help'
  | 'message-circle'
  | 'phone-call'
  | 'info'
  | 'chevron-right'
  | 'arrow-left'
  | 'x'
  | 'download'
  | 'trash-2'
  | 'log-out'
  | 'qr-code'
  | 'copy';

export interface IconProps {
  name: IconName;
  size?: 16 | 20 | 24;
  label?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, label, className = '' }) => {
  const renderPaths = () => {
    switch (name) {
      case 'calendar-check':
        return (
          <>
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <path d="m9 16 2 2 4-4" />
          </>
        );
      case 'list-checks':
        return (
          <>
            <path d="m3 17 2 2 4-4" />
            <path d="m3 7 2 2 4-4" />
            <path d="M13 6h8" />
            <path d="M13 12h8" />
            <path d="M13 18h8" />
          </>
        );
      case 'trending-up':
        return (
          <>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </>
        );
      case 'shield':
        return <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />;
      case 'lock':
        return (
          <>
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        );
      case 'bell':
        return (
          <>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </>
        );
      case 'share-2':
        return (
          <>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
          </>
        );
      case 'file-text':
        return (
          <>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
          </>
        );
      case 'paperclip':
        return <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />;
      case 'user':
        return (
          <>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        );
      case 'eye-off':
        return (
          <>
            <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
            <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
            <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
            <path d="m2 2 20 20" />
          </>
        );
      case 'clock':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </>
        );
      case 'circle-check':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </>
        );
      case 'circle-help':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </>
        );
      case 'message-circle':
        return <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />;
      case 'phone-call':
        return (
          <>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            <path d="M14.05 2a9 9 0 0 1 8 7.94" />
            <path d="M14.05 6A5 5 0 0 1 18 10" />
          </>
        );
      case 'info':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </>
        );
      case 'chevron-right':
        return <path d="m9 18 6-6-6-6" />;
      case 'arrow-left':
        return (
          <>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </>
        );
      case 'x':
        return (
          <>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </>
        );
      case 'download':
        return (
          <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </>
        );
      case 'trash-2':
        return (
          <>
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </>
        );
      case 'log-out':
        return (
          <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </>
        );
      case 'qr-code':
        return (
          <>
            <rect width="5" height="5" x="3" y="3" rx="1" />
            <rect width="5" height="5" x="16" y="3" rx="1" />
            <rect width="5" height="5" x="3" y="16" rx="1" />
            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
            <path d="M21 21v.01" />
            <path d="M12 7v3a2 2 0 0 1-2 2H7" />
            <path d="M3 12h.01" />
            <path d="M12 3h.01" />
            <path d="M12 16v.01" />
            <path d="M16 12h1" />
            <path d="M21 12v.01" />
            <path d="M12 21v-1" />
          </>
        );
      case 'copy':
        return (
          <>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`shrink-0 ${className}`}
    >
      {renderPaths()}
    </svg>
  );
};

export const FeatureIconCircle: React.FC<{ name: IconName; label?: string }> = ({ name, label }) => (
  <div className="icon-circle-48" aria-label={label}>
    <Icon name={name} size={24} />
  </div>
);

export const AwanMark: React.FC<{ animated?: boolean; size?: number; label?: string }> = ({
  animated = false,
  size = 48,
  label = 'Awan mark',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    role="img"
    aria-label={label}
    className="radius-control bg-primary shrink-0"
  >
    <rect width="48" height="48" rx="12" className="text-primary" fill="currentColor" />
    <path
      d="M12 31C16 19 32 19 36 31"
      stroke="var(--color-surface)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray={animated ? '60' : undefined}
      style={animated ? { animation: 'arcDraw 600ms ease-out forwards' } : undefined}
    />
  </svg>
);
