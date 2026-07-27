import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, serverTimestamp, onSnapshot } from 'firebase/firestore';
import BottomNav from '../components/BottomNav';

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

type Emotion = 'scared' | 'ashamed' | 'angry' | 'numb' | 'confused' | 'guilty' | 'small' | 'panicked';

interface TriggerEntry {
  id?: string;
  date: string;
  trigger: string;
  location: string;
  emotions: Emotion[];
  intensity: number;
  whatHelped: string;
  createdAt?: any;
}

/* ──────────────────────────────────────────────────────────────────
   Emotion Chip Config (shared with Understand)
   ────────────────────────────────────────────────────────────────── */

const EMOTION_CHIPS: { id: Emotion; emoji: string; label: string }[] = [
  { id: 'scared',    emoji: '😰', label: 'Scared' },
  { id: 'ashamed',   emoji: '😞', label: 'Ashamed' },
  { id: 'angry',     emoji: '😤', label: 'Angry' },
  { id: 'numb',      emoji: '😶', label: 'Numb' },
  { id: 'confused',  emoji: '😕', label: 'Confused' },
  { id: 'guilty',    emoji: '😔', label: 'Guilty' },
  { id: 'small',     emoji: '🫥', label: 'Small' },
  { id: 'panicked',  emoji: '😵', label: 'Panicked' },
];

/* ──────────────────────────────────────────────────────────────────
   Intensity color mapping — sage → lavender → soft pink
   ────────────────────────────────────────────────────────────────── */

function getIntensityColor(value: number): { bg: string; text: string; border: string } {
  if (value <= 3) {
    // Sage — low intensity, grounded
    return {
      bg: 'var(--color-sage-50)',
      text: 'var(--color-sage-700)',
      border: 'var(--color-sage-300)',
    };
  }
  if (value <= 6) {
    // Lavender — mid intensity, noticing
    return {
      bg: 'var(--color-lavender-50)',
      text: 'var(--color-lavender-700)',
      border: 'var(--color-lavender-300)',
    };
  }
  // Soft pink — higher intensity (NOT red)
  return {
    bg: 'var(--color-pink-50)',
    text: 'var(--color-pink-700)',
    border: 'var(--color-pink-300)',
  };
}

function getIntensitySoftLabel(value: number): string {
  if (value <= 2) return 'Barely there';
  if (value <= 4) return 'Noticing it';
  if (value <= 6) return 'Hanging in there';
  if (value <= 8) return 'Pretty strong';
  return 'A lot right now';
}

/* ──────────────────────────────────────────────────────────────────
   Date formatting
   ────────────────────────────────────────────────────────────────── */

function formatFriendlyDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/* ──────────────────────────────────────────────────────────────────
   Save Trigger
   ────────────────────────────────────────────────────────────────── */

async function saveTrigger(entry: Omit<TriggerEntry, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    await addDoc(collection(db, 'triggers'), {
      ...entry,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    try {
      const stored = localStorage.getItem('safesteps-triggers');
      const triggers: TriggerEntry[] = stored ? JSON.parse(stored) : [];
      triggers.push({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as TriggerEntry);
      localStorage.setItem('safesteps-triggers', JSON.stringify(triggers));
      return true;
    } catch {
      return false;
    }
  }
}

/* ──────────────────────────────────────────────────────────────────
   Load Triggers (Firestore with localStorage fallback)
   ────────────────────────────────────────────────────────────────── */

function useTriggers(): { triggers: TriggerEntry[]; loading: boolean } {
  const [triggers, setTriggers] = useState<TriggerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try Firestore real-time listener
    const triggersQuery = query(collection(db, 'triggers'), orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      triggersQuery,
      (snapshot) => {
        const items: TriggerEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            date: data.date,
            trigger: data.trigger,
            location: data.location,
            emotions: data.emotions,
            intensity: data.intensity,
            whatHelped: data.whatHelped,
            createdAt: data.createdAt,
          });
        });
        setTriggers(items);
        setLoading(false);
      },
      () => {
        // Firestore failed — fall back to localStorage
        try {
          const stored = localStorage.getItem('safesteps-triggers');
          const items: TriggerEntry[] = stored ? JSON.parse(stored) : [];
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTriggers(items);
        } catch {
          setTriggers([]);
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { triggers, loading };
}

/* ──────────────────────────────────────────────────────────────────
   Pattern Insight Generator
   ────────────────────────────────────────────────────────────────── */

interface PatternInsight {
  total: number;
  topEmotion: string;
  topEmotionCount: number;
  commonLocation: string | null;
  commonLocationCount: number;
  daysSpan: number;
}

function generatePatternInsight(triggers: TriggerEntry[]): PatternInsight | null {
  if (triggers.length < 3) return null;

  const emotionCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  const dates = triggers.map((t) => new Date(t.date).getTime());

  for (const t of triggers) {
    for (const e of t.emotions) {
      const label = EMOTION_CHIPS.find((c) => c.id === e)?.label || e;
      emotionCounts[label] = (emotionCounts[label] || 0) + 1;
    }
    if (t.location.trim()) {
      const loc = t.location.trim().toLowerCase();
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    }
  }

  const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0] || null;

  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const daysSpan = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

  return {
    total: triggers.length,
    topEmotion: topEmotion[0],
    topEmotionCount: topEmotion[1],
    commonLocation: topLocation ? topLocation[0] : null,
    commonLocationCount: topLocation ? topLocation[1] : 0,
    daysSpan,
  };
}

/* ──────────────────────────────────────────────────────────────────
   Toast Component
   ────────────────────────────────────────────────────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--color-bg-card)',
        color: 'var(--color-text-primary)',
        padding: '14px 24px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)',
        fontSize: 'var(--text-base)',
        fontWeight: 500,
        zIndex: 'var(--z-toast)',
        maxWidth: '320px',
        textAlign: 'center' as const,
      }}
    >
      {message}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Triggers Component
   ────────────────────────────────────────────────────────────────── */

export default function Triggers() {
  const navigate = useNavigate();

  // Form state
  const [trigger, setTrigger] = useState('');
  const [location, setLocation] = useState('');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [intensity, setIntensity] = useState<number>(5);
  const [whatHelped, setWhatHelped] = useState('');
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // History
  const { triggers, loading } = useTriggers();

  // Pattern insight
  const patternInsight = generatePatternInsight(triggers);

  // Derived
  const canSave = trigger.trim().length > 0 || emotions.length > 0;

  /* ── Handlers ────────────────────────────────────────────── */

  const toggleEmotion = useCallback((emotion: Emotion) => {
    setEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);

    const entry = {
      date: new Date().toISOString(),
      trigger: trigger.trim(),
      location: location.trim(),
      emotions,
      intensity,
      whatHelped: whatHelped.trim(),
    };

    const saved = await saveTrigger(entry);
    if (saved) {
      setToast('🌸 Trigger logged. Your awareness is a strength.');
      // Reset form
      setTrigger('');
      setLocation('');
      setEmotions([]);
      setIntensity(5);
      setWhatHelped('');
    } else {
      setToast('Something went wrong. Please try again.');
    }
    setSaving(false);
  }, [canSave, saving, trigger, location, emotions, intensity, whatHelped]);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /* ── Shared Styles ────────────────────────────────────────── */

  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'var(--color-bg-primary)',
  };

  const topBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 4px',
    flexShrink: 0,
  };

  const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--touch-min)',
    height: 'var(--touch-min)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'background var(--duration-normal) var(--ease-default)',
    WebkitTapHighlightColor: 'transparent',
  };

  const headerStyle: React.CSSProperties = {
    padding: '4px 24px 0',
    flexShrink: 0,
  };

  const scrollContentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '0 24px 96px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-card)',
    padding: '20px',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--text-md)',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 'var(--touch-comfortable)',
    padding: '0 16px',
    borderRadius: 'var(--radius-input)',
    border: '1.5px solid var(--color-border-subtle)',
    background: 'var(--color-bg-card)',
    fontFamily: 'var(--font-family-body)',
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color var(--duration-normal) var(--ease-default)',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    padding: '14px 16px',
    borderRadius: 'var(--radius-input)',
    border: '1.5px solid var(--color-border-subtle)',
    background: 'var(--color-bg-card)',
    fontFamily: 'var(--font-family-body)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--line-height-relaxed)',
    color: 'var(--color-text-primary)',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color var(--duration-normal) var(--ease-default)',
  };

  const focusHandler = (colorVar: string) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = colorVar;
      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(148, 112, 189, 0.12)`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
      e.currentTarget.style.boxShadow = 'none';
    },
  });

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div style={pageStyle}>
      {/* Top Bar */}
      <div style={topBarStyle}>
        <button
          style={iconBtnStyle}
          aria-label="Go back"
          onClick={() => navigate(-1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          style={iconBtnStyle}
          aria-label="Return home"
          onClick={handleHome}
        >
          <svg viewBox="0 0 24 24" fill="var(--color-pink-400)" width="22" height="22">
            <path d="M12 2L3 9v11a1 1 0 001 1h5v-7h6v7h5a1 1 0 001-1V9l-9-7z" />
          </svg>
        </button>
      </div>

      {/* Header */}
      <div style={headerStyle}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          color: 'var(--color-lavender-600)',
          background: 'var(--color-lavender-50)',
          alignSelf: 'flex-start',
          marginBottom: '12px',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-lavender-400)', flexShrink: 0 }} />
          My Triggers
        </div>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--line-height-tight)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}>
          Track what comes up
        </h1>
        <p style={{
          fontSize: 'var(--text-md)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--line-height-relaxed)',
          marginTop: '6px',
        }}>
          Logging your triggers helps you spot patterns — gently, at your own pace.
        </p>
      </div>

      {/* Scroll Content */}
      <div style={scrollContentStyle}>
        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 1: Log a New Trigger                          */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div style={{ ...cardStyle, borderLeft: '3px solid var(--color-lavender-300)' }}>
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--color-lavender-700)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span aria-hidden="true">📋</span> Log a trigger
          </h2>

          {/* What triggered you? */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="trigger-input" style={labelStyle}>
              What triggered you?
            </label>
            <textarea
              id="trigger-input"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="Describe what happened — no pressure to be detailed..."
              style={textareaStyle}
              {...focusHandler('var(--color-lavender-400)')}
            />
          </div>

          {/* Where were you? */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="location-input" style={labelStyle}>
              Where were you?
            </label>
            <input
              id="location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., at work, at home, at the store..."
              style={inputStyle}
              {...focusHandler('var(--color-lavender-400)')}
            />
          </div>

          {/* How did you feel? */}
          <div>
            <label style={{ ...labelStyle, marginBottom: '10px' }}>
              How did you feel?
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {EMOTION_CHIPS.map((chip) => {
                const selected = emotions.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    onClick={() => toggleEmotion(chip.id)}
                    aria-pressed={selected}
                    aria-label={`${chip.label}${selected ? ', selected' : ', not selected'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-chip)',
                      border: selected
                        ? '1.5px solid var(--color-lavender-300)'
                        : '1.5px solid var(--color-border-subtle)',
                      background: selected ? 'var(--color-lavender-50)' : 'var(--color-bg-card)',
                      fontFamily: 'var(--font-family-body)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                      color: selected ? 'var(--color-lavender-700)' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      transition: 'transform var(--duration-fast) var(--ease-out), border-color var(--duration-normal) var(--ease-default), background var(--duration-normal) var(--ease-default)',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none',
                      touchAction: 'manipulation',
                      outline: 'none',
                    }}
                    onMouseDown={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)';
                    }}
                    onMouseUp={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = '';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = '';
                    }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }} aria-hidden="true">{chip.emoji}</span>
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* How intense was it? */}
          <div>
            <label style={{ ...labelStyle, marginBottom: '8px' }}>
              How intense was it?
            </label>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-tertiary)',
              marginBottom: '10px',
            }}>
              {getIntensitySoftLabel(intensity)}
            </p>
            <div style={{
              display: 'flex',
              gap: '6px',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                const colors = getIntensityColor(num);
                const isActive = intensity === num;
                return (
                  <button
                    key={num}
                    onClick={() => setIntensity(num)}
                    aria-label={`Intensity ${num} out of 10${isActive ? ', selected' : ''}`}
                    aria-pressed={isActive}
                    style={{
                      flex: '1 0 0',
                      minWidth: '36px',
                      height: 'var(--touch-min)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-md)',
                      border: isActive
                        ? `2.5px solid ${colors.border}`
                        : `1.5px solid ${colors.border}`,
                      background: isActive ? colors.bg : 'var(--color-bg-card)',
                      fontFamily: 'var(--font-family-body)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: isActive ? 700 : 500,
                      color: colors.text,
                      cursor: 'pointer',
                      transition: 'transform var(--duration-fast) var(--ease-out), background var(--duration-normal) var(--ease-default)',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none',
                      touchAction: 'manipulation',
                      outline: 'none',
                      opacity: isActive ? 1 : 0.7,
                    }}
                    onMouseDown={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)';
                    }}
                    onMouseUp={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = '';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = '';
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            {/* Gentle labels at ends */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              padding: '0 4px',
            }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sage-600)' }}>gentle</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-pink-500)' }}>a lot</span>
            </div>
          </div>

          {/* What helped? */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="what-helped-input" style={labelStyle}>
              Did anything help you feel better?
            </label>
            <input
              id="what-helped-input"
              type="text"
              value={whatHelped}
              onChange={(e) => setWhatHelped(e.target.value)}
              placeholder="e.g., deep breathing, a walk, talking to a friend..."
              style={inputStyle}
              {...focusHandler('var(--color-lavender-400)')}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            aria-label="Save this trigger"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              minHeight: 'var(--touch-comfortable)',
              padding: '16px 24px',
              borderRadius: 'var(--radius-button)',
              border: 'none',
              background: 'var(--color-lavender-500)',
              opacity: canSave && !saving ? 1 : 0.5,
              fontFamily: 'var(--font-family-body)',
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: '#FFFFFF',
              cursor: canSave && !saving ? 'pointer' : 'not-allowed',
              transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-normal) var(--ease-default), background var(--duration-normal) var(--ease-default)',
              boxShadow: canSave ? 'var(--shadow-button)' : 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              outline: 'none',
            }}
            onMouseDown={(e) => {
              if (canSave && !saving) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-lavender-600)';
              }
            }}
            onMouseUp={(e) => {
              if (canSave && !saving) {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-lavender-500)';
              }
            }}
            onMouseLeave={(e) => {
              if (canSave && !saving) {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-lavender-500)';
              }
            }}
          >
            {saving ? 'Saving...' : '💜 Save'}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PATTERN INSIGHT BANNER                                 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {patternInsight && (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: 'var(--color-lavender-50)',
              borderRadius: 'var(--radius-card)',
              padding: '18px',
              border: '1.5px solid var(--color-lavender-100)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>🔍</span>
              <span style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--color-lavender-700)',
              }}>
                A gentle pattern is emerging
              </span>
            </div>
            <p style={{
              fontSize: 'var(--text-base)',
              lineHeight: 'var(--line-height-relaxed)',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}>
              You've logged{' '}
              <strong>{patternInsight.total} triggers</strong>{' '}
              {patternInsight.daysSpan <= 7
                ? `this week`
                : patternInsight.daysSpan <= 30
                  ? `this month`
                  : `over the past ${patternInsight.daysSpan} days`}
              . The most common feeling was{' '}
              <strong>{patternInsight.topEmotion}</strong>
              {patternInsight.commonLocation && patternInsight.commonLocationCount >= 2 && (
                <>
                  , and being at{' '}
                  <strong>{patternInsight.commonLocation}</strong>{' '}
                  came up a few times
                </>
              )}
              . Your nervous system might be extra alert in that environment.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 2: Trigger History                             */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}>
            Your trigger history
          </h2>

          {loading && (
            <p style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-tertiary)',
              textAlign: 'center',
              padding: '32px 0',
            }}>
              Loading your triggers...
            </p>
          )}

          {!loading && triggers.length === 0 && (
            <div style={{
              ...cardStyle,
              textAlign: 'center',
              padding: '32px 20px',
              borderLeft: '3px solid var(--color-lavender-100)',
            }}>
              <span aria-hidden="true" style={{ fontSize: '36px' }}>🌸</span>
              <p style={{
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
              }}>
                No triggers logged yet. When you're ready, use the form above to start tracking.
              </p>
            </div>
          )}

          {!loading && triggers.map((entry) => {
            const intensityColors = getIntensityColor(entry.intensity);
            return (
              <div
                key={entry.id || entry.date}
                style={{
                  ...cardStyle,
                  gap: '12px',
                }}
              >
                {/* Date row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-lavender-600)',
                  }}>
                    {formatFriendlyDate(entry.date)}
                  </span>
                  {/* Intensity badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: intensityColors.bg,
                    color: intensityColors.text,
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    border: `1px solid ${intensityColors.border}`,
                  }}>
                    {entry.intensity}/10
                  </span>
                </div>

                {/* Trigger snippet */}
                {entry.trigger && (
                  <p style={{
                    fontSize: 'var(--text-base)',
                    lineHeight: 'var(--line-height-relaxed)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {entry.trigger}
                  </p>
                )}

                {/* Emotion chips (small, non-interactive) */}
                {entry.emotions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {entry.emotions.map((emotion) => {
                      const chip = EMOTION_CHIPS.find((c) => c.id === emotion);
                      if (!chip) return null;
                      return (
                        <span
                          key={emotion}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-lavender-50)',
                            border: '1px solid var(--color-lavender-100)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            color: 'var(--color-lavender-700)',
                          }}
                        >
                          <span style={{ fontSize: '12px', lineHeight: 1 }} aria-hidden="true">{chip.emoji}</span>
                          {chip.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* What helped */}
                {entry.whatHelped && (
                  <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--line-height-relaxed)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-cream-50)',
                    border: '1px solid var(--color-cream-100)',
                  }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-sage-600)' }}>What helped: </span>
                    {entry.whatHelped}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Hover + reduced-motion styles */}
      <style>{`
        @media (hover: hover) {
          .trigger-chip:hover {
            border-color: var(--color-lavender-200) !important;
            background: var(--color-lavender-50) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
