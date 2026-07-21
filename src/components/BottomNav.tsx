import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" />
      </svg>
    ),
  },
  {
    path: '/learn',
    label: 'Learn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    path: '/victories',
    label: 'Victories',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M12 15l-3.5 2 1-4-3-2.5h4L12 7l1.5 3.5h4l-3 2.5 1 4z" />
      </svg>
    ),
  },
  {
    path: '/triggers',
    label: 'Insights',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="10" y="7" width="4" height="14" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '64px',
        background: '#FFFFFF',
        borderTop: '0.5px solid var(--color-border-subtle)',
        flexShrink: 0,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-sticky)',
      }}
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-label={`${item.label}${isActive ? ', current page' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '8px 0',
              minWidth: '48px',
              minHeight: '48px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font-family-body)',
              color: isActive ? 'var(--color-pink-500)' : 'var(--color-neutral-400)',
              transition: 'color var(--duration-normal) var(--ease-default)',
            }}
          >
            {item.icon}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
