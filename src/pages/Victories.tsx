import { useState, useCallback, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, serverTimestamp, onSnapshot, Timestamp } from 'firebase/firestore';

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

interface VictoryEntry {
  id?: string;
  date: string;          // YYYY-MM-DD
  items: string[];
  createdAt?: Timestamp | string;
}

/* ──────────────────────────────────────────────────────────────────
   Default Victory List
   ────────────────────────────────────────────────────────────────── */

const DEFAULT_VICTORIES: string[] = [
  'Got out of bed',
  'Took a shower',
  'Ate a meal',
  'Left the house',
  'Set a boundary',
  'Asked for help',
  'Went to work',
  'Attended therapy',
  'Drank water',
  'Took medication',
];

/* ──────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────── */

function todayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function friendlyDate(dateStr: string): string {
  const today = todayDateStr();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const parts = dateStr.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

/* ──────────────────────────────────────────────────────────────────
   Save / Load (Firestore + localStorage fallback)
   ────────────────────────────────────────────────────────────────── */

/** Replace (or create) the victory entry for a given date. Used for toggling. */
async function upsertVictoryDay(dateStr: string, items: string[]): Promise<boolean> {
  if (items.length === 0) {
    // If empty, still save as an entry with empty items so the day is recorded.
    // But we could also just delete it. Let's always save so the user sees the day.
  }
  try {
    await addDoc(collection(db, 'victories'), {
      date: dateStr,
      items,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    try {
      const stored = localStorage.getItem('safesteps-victories');
      const entries: VictoryEntry[] = stored ? JSON.parse(stored) : [];
      const idx = entries.findIndex((e) => e.date === dateStr);
      if (idx >= 0) {
        entries[idx] = { ...entries[idx], items };
      } else {
        entries.push({ date: dateStr, items, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
      }
      localStorage.setItem('safesteps-victories', JSON.stringify(entries));
      return true;
    } catch {
      return false;
    }
  }
}

function useVictories(): { entries: VictoryEntry[]; loading: boolean } {
  const [entries, setEntries] = useState<VictoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const victoriesQuery = query(collection(db, 'victories'), orderBy('createdAt', 'desc'), limit(200));

    const unsubscribe = onSnapshot(
      victoriesQuery,
      (snapshot) => {
        const items: VictoryEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            date: data.date,
            items: data.items ?? [],
            createdAt: data.createdAt,
          });
        });
        // deduplicate by date (keep first — most recent)
        const seen = new Set<string>();
        const deduped: VictoryEntry[] = [];
        for (const item of items) {
          if (!seen.has(item.date)) {
            seen.add(item.date);
            deduped.push(item);
          }
        }
        deduped.sort((a, b) => b.date.localeCompare(a.date));
        setEntries(deduped);
        setLoading(false);
      },
      () => {
        try {
          const stored = localStorage.getItem('safesteps-victories');
          const items: VictoryEntry[] = stored ? JSON.parse(stored) : [];
          const seen = new Set<string>();
          const deduped: VictoryEntry[] = [];
          for (const item of items) {
            if (!seen.has(item.date)) {
              seen.add(item.date);
              deduped.push(item);
            }
          }
          deduped.sort((a, b) => b.date.localeCompare(a.date));
          setEntries(deduped);
        } catch {
          setEntries([]);
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { entries, loading };
}

/* ──────────────────────────────────────────────────────────────────
   Shared Styles
   ────────────────────────────────────────────────────────────────── */

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'var(--color-bg-primary)',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 24px 8px',
  flexShrink: 0,
};

const scrollContentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px 24px 96px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '2px',
};

/* ──────────────────────────────────────────────────────────────────
   Curved Checkmark Icon
   ────────────────────────────────────────────────────────────────── */

function CheckmarkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Victory Chip (checkable item)
   ────────────────────────────────────────────────────────────────── */

interface VictoryChipProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

function VictoryChip({ label, checked, onToggle }: VictoryChipProps) {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    minHeight: 'var(--touch-min)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-xl)',
    border: checked
      ? '2px solid var(--color-sage-400)'
      : '2px solid var(--color-border-subtle)',
    background: checked
      ? 'var(--color-sage-50)'
      : 'var(--color-bg-card)',
    color: checked
      ? 'var(--color-sage-700)'
      : 'var(--color-text-primary)',
    fontSize: 'var(--text-md)',
    fontWeight: checked ? 600 : 400,
    cursor: 'pointer',
    transition: 'all var(--duration-normal) var(--ease-out)',
    boxShadow: checked ? 'var(--shadow-button)' : 'var(--shadow-card)',
    fontFamily: 'var(--font-family-body)',
    WebkitTapHighlightColor: 'transparent',
    textAlign: 'left' as const,
    lineHeight: 'var(--line-height-normal)',
    animation: checked ? 'none' : 'none',
  };

  // Subtle check animation via a keyframe
  const iconContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: checked ? 'var(--color-sage-500)' : 'transparent',
    color: checked ? '#FFFFFF' : 'var(--color-text-tertiary)',
    flexShrink: 0,
    transition: 'all var(--duration-normal) var(--ease-out)',
  };

  return (
    <button
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={`${label}${checked ? ' — completed' : ''}`}
      style={style}
      onMouseEnter={(e) => {
        if (!checked) e.currentTarget.style.background = 'var(--color-sage-50)';
      }}
      onMouseLeave={(e) => {
        if (!checked) e.currentTarget.style.background = 'var(--color-bg-card)';
      }}
    >
      <span style={iconContainerStyle}>
        {checked ? <CheckmarkIcon size={18} /> : <CircleIcon size={18} />}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Today's Summary Card
   ────────────────────────────────────────────────────────────────── */

function TodaySummary({ count, items }: { count: number; items: string[] }) {
  if (count === 0) return null;

  let message: string;
  if (count === 1) {
    message = 'That one thing counts. Really.';
  } else if (count <= 3) {
    message = 'You\'re showing up for yourself.';
  } else if (count <= 6) {
    message = 'Look at all those wins. You\'re doing it.';
  } else {
    message = 'What a beautiful day of small victories.';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px 24px',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-pink-50)',
        border: '1px solid var(--color-pink-200)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '28px' }}>🌻</span>
        <span
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--color-pink-700)',
          }}
        >
          {message}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              display: 'inline-flex',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-pink-100)',
              color: 'var(--color-pink-600)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Saved Indicator
   ────────────────────────────────────────────────────────────────── */

function SavedIndicator({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        color: 'var(--color-sage-600)',
        padding: '4px 8px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-sage-50)',
        animation: 'fadeInOut 2s ease-in-out',
      }}
    >
      <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
      </svg>
      Saved
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Victory History Card (Expandable)
   ────────────────────────────────────────────────────────────────── */

function HistoryCard({ entry }: { entry: VictoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isToday = entry.date === todayDateStr();

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-card)',
    background: 'var(--color-bg-card)',
    border: isToday ? '2px solid var(--color-pink-300)' : '1px solid var(--color-border-subtle)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
  };

  const headerRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    cursor: 'pointer',
    minHeight: 'var(--touch-min)',
    WebkitTapHighlightColor: 'transparent',
    border: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-family-body)',
    width: '100%',
    textAlign: 'left' as const,
  };

  return (
    <div style={cardStyle}>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${friendlyDate(entry.date)} — ${entry.items.length} victor${entry.items.length !== 1 ? 'ies' : 'y'}`}
        style={headerRowStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>
            {isToday ? '🌻' : '💫'}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {friendlyDate(entry.date)}
            </span>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {entry.items.length} victory {entry.items.length !== 1 ? 'moments' : 'moment'}
            </span>
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="20"
          height="20"
          style={{
            color: 'var(--color-text-tertiary)',
            transition: 'transform var(--duration-normal) var(--ease-out)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '0 20px 16px',
            animation: 'expandIn 250ms var(--ease-out)',
          }}
        >
          {entry.items.length === 0 && (
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-tertiary)',
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              No victories logged this day — and that's okay.
            </p>
          )}
          {entry.items.map((item) => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-sage-50)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-sage-700)',
                fontWeight: 500,
              }}
            >
              <span style={{ color: 'var(--color-sage-500)', display: 'flex' }}>
                <CheckmarkIcon size={16} />
              </span>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Main Victories Page
   ────────────────────────────────────────────────────────────────── */

export default function Victories() {
  // Today's checked items
  const [todayItems, setTodayItems] = useState<string[]>([]);
  // Custom victories added by the user (persisted in state during session)
  const [customVictories, setCustomVictories] = useState<string[]>([]);
  // New custom input
  const [customInput, setCustomInput] = useState('');
  // Track "saved" indicator pulse
  const [saveTrigger, setSaveTrigger] = useState(0);
  // Track last saved state key to avoid duplicate saves
  const [lastSaved, setLastSaved] = useState<string>('');

  // Load history
  const { entries, loading } = useVictories();

  // Sync today's items from loaded data
  useEffect(() => {
    const today = todayDateStr();
    const todayEntry = entries.find((e) => e.date === today);
    if (todayEntry && todayEntry.items.length > 0) {
      setTodayItems((prev) => {
        // Only update if different
        if (JSON.stringify(prev.sort()) !== JSON.stringify([...todayEntry.items].sort())) {
          return [...todayEntry.items];
        }
        return prev;
      });
    }
  }, [entries]);

  /* ── Checkable item list (defaults + customs) ────────────────── */
  const allVictoryOptions = [...DEFAULT_VICTORIES, ...customVictories];

  /* ── Toggle handler with auto-save ──────────────────────────── */
  const handleToggle = useCallback(
    async (label: string) => {
      setTodayItems((prev) => {
        const next = prev.includes(label)
          ? prev.filter((i) => i !== label)
          : [...prev, label];

        const nextKey = [...next].sort().join('|');
        if (nextKey === lastSaved) return prev; // prevent duplicate save

        // Auto-save
        const today = todayDateStr();
        upsertVictoryDay(today, next).then((ok) => {
          if (ok) {
            setSaveTrigger((s) => s + 1);
            setLastSaved(nextKey);
          }
        });

        return next;
      });
    },
    [lastSaved],
  );

  /* ── Add custom victory ─────────────────────────────────────── */
  const handleAddCustom = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (allVictoryOptions.includes(trimmed)) {
      setCustomInput('');
      return;
    }
    setCustomVictories((prev) => [...prev, trimmed]);
    setCustomInput('');
  }, [customInput, allVictoryOptions]);

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustom();
      }
    },
    [handleAddCustom],
  );

  /* ── Today summary ──────────────────────────────────────────── */
  const todayCount = todayItems.length;

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              🌻 Victory Journal
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                margin: '4px 0 0',
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              Every step forward is worth noticing.
            </p>
          </div>
          <SavedIndicator visible={saveTrigger > 0} key={saveTrigger} />
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={scrollContentStyle}>
        {/* Today's Summary */}
        <TodaySummary count={todayCount} items={todayItems} />

        {/* Quick-add checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={sectionLabel}>Today's Victories</span>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 2px',
              lineHeight: 'var(--line-height-relaxed)',
            }}
          >
            Tap anything you did today. No pressure — even one counts.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allVictoryOptions.map((label) => (
              <VictoryChip
                key={label}
                label={label}
                checked={todayItems.includes(label)}
                onToggle={() => handleToggle(label)}
              />
            ))}
          </div>

          {/* Add your own */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginTop: '4px',
            }}
          >
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder="+ Add your own…"
              aria-label="Add your own victory"
              style={{
                flex: 1,
                minHeight: 'var(--touch-min)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-xl)',
                border: '2px dashed var(--color-border-default)',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-md)',
                fontFamily: 'var(--font-family-body)',
                outline: 'none',
                transition: 'border-color var(--duration-normal) var(--ease-default)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-pink-400)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-default)';
              }}
            />
            <button
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
              aria-label="Add custom victory"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 'var(--touch-min)',
                minHeight: 'var(--touch-min)',
                borderRadius: '50%',
                border: 'none',
                background: customInput.trim()
                  ? 'var(--color-pink-500)'
                  : 'var(--color-neutral-200)',
                color: customInput.trim() ? '#FFFFFF' : 'var(--color-text-tertiary)',
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                cursor: customInput.trim() ? 'pointer' : 'default',
                transition: 'var(--transition-color)',
                fontFamily: 'var(--font-family-body)',
                WebkitTapHighlightColor: 'transparent',
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Victory History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={sectionLabel}>History</span>
          {loading && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '20px' }}>
              Loading your victories...
            </p>
          )}
          {!loading && entries.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '32px 24px',
                borderRadius: 'var(--radius-card)',
                background: 'var(--color-cream-100)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '32px' }}>💫</span>
              <p
                style={{
                  fontSize: 'var(--text-md)',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 'var(--line-height-relaxed)',
                }}
              >
                Your victory story starts here. Tap anything you do today — no win is too small.
              </p>
            </div>
          )}
          {!loading &&
            entries.map((entry) => (
              <HistoryCard key={entry.date} entry={entry} />
            ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
