import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface ToolButton {
  label: string;
  title: string;
  subtitle: string;
  path: string;
  colorClass: 'pink' | 'blue' | 'sage' | 'cream';
  icon: React.ReactNode;
}

const tools: ToolButton[] = [
  {
    label: 'Grounding',
    title: 'Help Me Right Now',
    subtitle: 'Quick relief tools',
    path: '/help',
    colorClass: 'pink',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
        <path d="M8 20C8 13.373 13.373 8 20 8s12 5.373 12 12" stroke="var(--color-pink-700)" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 20c0 6.627 5.373 12 12 12s12-5.373 12-12" stroke="var(--color-pink-700)" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="14" cy="16" rx="2.5" ry="3" fill="var(--color-pink-400)" opacity="0.4" />
        <ellipse cx="26" cy="16" rx="2.5" ry="3" fill="var(--color-pink-400)" opacity="0.4" />
        <path d="M14 28c3-4 9-4 12 0" stroke="var(--color-pink-700)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Understand',
    title: "What's Happening?",
    subtitle: 'Connect to trauma',
    path: '/understand',
    colorClass: 'blue',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
        <circle cx="20" cy="20" r="12" stroke="var(--color-blue-700)" strokeWidth="2" />
        <circle cx="14" cy="16" r="2" fill="var(--color-blue-500)" opacity="0.5" />
        <circle cx="26" cy="16" r="2" fill="var(--color-blue-500)" opacity="0.5" />
        <path d="M14 26c0 0 2.5-3 6-3s6 3 6 3" stroke="var(--color-blue-700)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="30" r="1.5" fill="var(--color-blue-500)" opacity="0.4" />
        <circle cx="16" cy="32" r="1" fill="var(--color-blue-500)" opacity="0.3" />
        <circle cx="24" cy="32" r="1" fill="var(--color-blue-500)" opacity="0.3" />
      </svg>
    ),
  },
  {
    label: 'Track',
    title: 'My Triggers',
    subtitle: 'Patterns & awareness',
    path: '/triggers',
    colorClass: 'sage',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
        <rect x="10" y="8" width="20" height="24" rx="3" stroke="var(--color-sage-800)" strokeWidth="2" />
        <line x1="14" y1="14" x2="26" y2="14" stroke="var(--color-sage-600)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="19" x2="26" y2="19" stroke="var(--color-sage-600)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="24" x2="22" y2="24" stroke="var(--color-sage-600)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="29" cy="10" r="5" fill="var(--color-sage-300)" opacity="0.5" />
        <path d="M27.5 10l1.2 1.2 2.1-2.1" stroke="var(--color-sage-700)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Reflect',
    title: 'Daily Check-In',
    subtitle: 'How are you today?',
    path: '/check-in',
    colorClass: 'cream',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
        <path d="M20 8c-1 0-3 2-3 6s2 10 3 12c1-2 3-6 3-12s-2-6-3-6z" fill="var(--color-cream-600)" opacity="0.5" />
        <path d="M14 18c0 0 2 2 6 2s6-2 6-2" stroke="var(--color-cream-700)" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 20v8" stroke="var(--color-cream-500)" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="20" cy="12" rx="8" ry="5" fill="var(--color-sunflower-400)" opacity="0.2" />
      </svg>
    ),
  },
];

const buttonStyles = {
  pink: {
    background: 'var(--color-pink-100)',
    border: '1.5px solid var(--color-pink-200)',
    color: 'var(--color-pink-800)',
    labelColor: 'var(--color-pink-600)',
    subtitleColor: 'var(--color-pink-700)',
    hoverBg: '#FCE3E5',
  },
  blue: {
    background: 'var(--color-blue-100)',
    border: '1.5px solid var(--color-blue-200)',
    color: 'var(--color-blue-800)',
    labelColor: 'var(--color-blue-600)',
    subtitleColor: 'var(--color-blue-700)',
    hoverBg: '#DEE6F1',
  },
  sage: {
    background: 'var(--color-sage-100)',
    border: '1.5px solid var(--color-sage-200)',
    color: 'var(--color-sage-800)',
    labelColor: 'var(--color-sage-600)',
    subtitleColor: 'var(--color-sage-700)',
    hoverBg: '#DDE9D9',
  },
  cream: {
    background: 'var(--color-cream-200)',
    border: '1.5px solid var(--color-cream-300)',
    color: 'var(--color-cream-700)',
    labelColor: 'var(--color-cream-600)',
    subtitleColor: 'var(--color-cream-700)',
    hoverBg: '#FFEEBE',
  },
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
      }}
    >
      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px 24px 80px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingBottom: '24px',
          }}
        >
          {/* Sunflower Logo */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
            <ellipse cx="18" cy="5" rx="3.5" ry="7" fill="var(--color-pink-400)" opacity="0.8" transform="rotate(0 18 18)" />
            <ellipse cx="18" cy="5" rx="3.5" ry="7" fill="var(--color-pink-300)" opacity="0.8" transform="rotate(45 18 18)" />
            <ellipse cx="18" cy="5" rx="3.5" ry="7" fill="var(--color-pink-400)" opacity="0.8" transform="rotate(90 18 18)" />
            <ellipse cx="18" cy="5" rx="3.5" ry="7" fill="var(--color-pink-300)" opacity="0.8" transform="rotate(135 18 18)" />
            <ellipse cx="18" cy="5" rx="3.5" ry="7" fill="var(--color-pink-400)" opacity="0.8" transform="rotate(180 18 18)" />
            <ellipse cx="18" cy="5" rx="3.5" ry="7" fill="var(--color-pink-300)" opacity="0.8" transform="rotate(225 18 18)" />
            <ellipse cx="18" cy="5" rx="3.5" ry="7" fill="var(--color-pink-400)" opacity="0.8" transform="rotate(270 18 18)" />
            <ellipse cx="18" cy="5" rx="3.5" ry="7" fill="var(--color-pink-300)" opacity="0.8" transform="rotate(315 18 18)" />
            <circle cx="18" cy="18" r="6" fill="var(--color-cream-500)" opacity="0.9" />
            <circle cx="18" cy="18" r="3" fill="var(--color-cream-600)" opacity="0.5" />
          </svg>
          <span
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}
          >
            SafeSteps
          </span>
        </header>

        {/* Button Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {tools.map((tool) => {
            const s = buttonStyles[tool.colorClass];
            return (
              <button
                key={tool.path}
                onClick={() => navigate(tool.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  minHeight: '150px',
                  borderRadius: 'var(--radius-button)',
                  border: s.border,
                  background: s.background,
                  padding: '20px 12px',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                  fontFamily: 'var(--font-family-body)',
                  color: s.color,
                  boxShadow: 'var(--shadow-card)',
                  transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-normal) var(--ease-default), background-color var(--duration-normal) var(--ease-default)',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                  outline: 'none',
                }}
                className={`tool-btn-${tool.colorClass}`}
                onMouseEnter={(e) => {
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                    e.currentTarget.style.background = s.hoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  e.currentTarget.style.background = s.background;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.97)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-button)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2px',
                  }}
                >
                  {tool.icon}
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: s.labelColor,
                    opacity: 0.7,
                    lineHeight: 1,
                  }}
                >
                  {tool.label}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    lineHeight: 1.25,
                  }}
                >
                  {tool.title}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 400,
                    color: s.subtitleColor,
                    opacity: 0.65,
                    lineHeight: 1,
                  }}
                >
                  {tool.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider with sunflower */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ width: '80px', height: '1px', background: 'var(--color-neutral-200)' }} />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <ellipse cx="8" cy="3" rx="1.5" ry="3" fill="var(--color-pink-300)" opacity="0.7" />
            <ellipse cx="8" cy="3" rx="1.5" ry="3" fill="var(--color-pink-300)" opacity="0.7" transform="rotate(60 8 8)" />
            <ellipse cx="8" cy="3" rx="1.5" ry="3" fill="var(--color-pink-300)" opacity="0.7" transform="rotate(120 8 8)" />
            <ellipse cx="8" cy="3" rx="1.5" ry="3" fill="var(--color-pink-300)" opacity="0.7" transform="rotate(180 8 8)" />
            <ellipse cx="8" cy="3" rx="1.5" ry="3" fill="var(--color-pink-300)" opacity="0.7" transform="rotate(240 8 8)" />
            <ellipse cx="8" cy="3" rx="1.5" ry="3" fill="var(--color-pink-300)" opacity="0.7" transform="rotate(300 8 8)" />
            <circle cx="8" cy="8" r="2.5" fill="var(--color-sunflower-500)" opacity="0.8" />
            <circle cx="8" cy="8" r="1" fill="var(--color-sunflower-600)" opacity="0.5" />
          </svg>
          <div style={{ width: '80px', height: '1px', background: 'var(--color-neutral-200)' }} />
        </div>

        {/* Encouraging Message */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 400,
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)',
              maxWidth: '260px',
              margin: '0 auto',
            }}
          >
            You're safe.<br />Let's take this one step at a time.
          </p>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: '16px' }} />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
