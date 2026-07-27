import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, limit, serverTimestamp, onSnapshot } from 'firebase/firestore';
import BottomNav from '../components/BottomNav';

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

type CheckInType = 'morning' | 'evening';

// Morning fields
type Mood = 'good' | 'okay' | 'low' | 'frustrated' | 'anxious';
type Sleep = 'well' | 'okay' | 'poorly';
type Energy = 'good' | 'okay' | 'low';
type Anxiety = 'calm' | 'a-little' | 'a-lot';
type Safety = 'yes' | 'mostly' | 'not-really';

// Evening emotion chips (trigger-related)
type EveningEmotion = 'scared' | 'ashamed' | 'angry' | 'numb' | 'confused' | 'guilty' | 'small' | 'panicked';

interface CheckInEntry {
  id?: string;
  type: CheckInType;
  timestamp: string;
  userId?: string;
  // Morning fields
  mood?: Mood;
  sleep?: Sleep;
  energy?: Energy;
  anxiety?: Anxiety;
  safety?: Safety;
  // Evening fields
  challenge?: string;
  win?: string;
  hadTriggers?: boolean;
  triggerEmotions?: EveningEmotion[];
  whatHelped?: string;
  createdAt?: any;
}

/* ──────────────────────────────────────────────────────────────────
   Morning Selector Configs
   ────────────────────────────────────────────────────────────────── */

const MOOD_OPTIONS: { id: Mood; emoji: string; label: string }[] = [
  { id: 'good',       emoji: '😊', label: 'Good' },
  { id: 'okay',       emoji: '😐', label: 'Okay' },
  { id: 'low',        emoji: '😔', label: 'Low' },
  { id: 'frustrated',  emoji: '😤', label: 'Frustrated' },
  { id: 'anxious',    emoji: '😰', label: 'Anxious' },
];

const SLEEP_OPTIONS: { id: Sleep; emoji: string; label: string }[] = [
  { id: 'well',   emoji: '😴', label: 'Well' },
  { id: 'okay',   emoji: '🥱', label: 'Okay' },
  { id: 'poorly', emoji: '😣', label: 'Poorly' },
];

const ENERGY_OPTIONS: { id: Energy; emoji: string; label: string }[] = [
  { id: 'good', emoji: '⚡', label: 'Good' },
  { id: 'okay', emoji: '🌤️', label: 'Okay' },
  { id: 'low',  emoji: '🔋', label: 'Low' },
];

const ANXIETY_OPTIONS: { id: Anxiety; emoji: string; label: string }[] = [
  { id: 'calm',     emoji: '🧘', label: 'Calm' },
  { id: 'a-little',  emoji: '🌊', label: 'A little' },
  { id: 'a-lot',    emoji: '🌪️', label: 'A lot' },
];

const SAFETY_OPTIONS: { id: Safety; emoji: string; label: string }[] = [
  { id: 'yes',        emoji: '💚', label: 'Yes' },
  { id: 'mostly',     emoji: '💛', label: 'Mostly' },
  { id: 'not-really',  emoji: '🤍', label: 'Not really' },
];

const EVENING_EMOTION_CHIPS: { id: EveningEmotion; emoji: string; label: string }[] = [
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
   Save Check-In (Firestore with localStorage fallback)
   ────────────────────────────────────────────────────────────────── */

async function saveCheckIn(entry: Omit<CheckInEntry, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    await addDoc(collection(db, 'checkIns'), {
      ...entry,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    try {
      const stored = localStorage.getItem('safesteps-checkins');
      const checkins: CheckInEntry[] = stored ? JSON.parse(stored) : [];
      checkins.push({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as CheckInEntry);
      localStorage.setItem('safesteps-checkins', JSON.stringify(checkins));
      return true;
    } catch {
      return false;
    }
  }
}

/* ──────────────────────────────────────────────────────────────────
   Load Check-Ins (Firestore with localStorage fallback)
   ────────────────────────────────────────────────────────────────── */

function useCheckIns(): { checkIns: CheckInEntry[]; loading: boolean } {
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkInsQuery = query(collection(db, 'checkIns'), orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      checkInsQuery,
      (snapshot) => {
        const items: CheckInEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            type: data.type,
            timestamp: data.timestamp,
            userId: data.userId,
            mood: data.mood,
            sleep: data.sleep,
            energy: data.energy,
            anxiety: data.anxiety,
            safety: data.safety,
            challenge: data.challenge,
            win: data.win,
            hadTriggers: data.hadTriggers,
            triggerEmotions: data.triggerEmotions,
            whatHelped: data.whatHelped,
            createdAt: data.createdAt,
          });
        });
        setCheckIns(items);
        setLoading(false);
      },
      () => {
        try {
          const stored = localStorage.getItem('safesteps-checkins');
          const items: CheckInEntry[] = stored ? JSON.parse(stored) : [];
          items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setCheckIns(items);
        } catch {
          setCheckIns([]);
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { checkIns, loading };
}

/* ──────────────────────────────────────────────────────────────────
   Weekly count helper
   ────────────────────────────────────────────────────────────────── */

function countThisWeek(checkIns: CheckInEntry[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  return checkIns.filter((c) => new Date(c.timestamp) >= startOfWeek).length;
}

/* ──────────────────────────────────────────────────────────────────
   Toast Component
   ────────────────────────────────────────────────────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
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
   Morning Check-In Form
   ────────────────────────────────────────────────────────────────── */

interface MorningFormProps {
  onSave: (entry: Omit<CheckInEntry, 'id' | 'createdAt'>) => void;
  saving: boolean;
}

function MorningForm({ onSave, saving }: MorningFormProps) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [sleep, setSleep] = useState<Sleep | null>(null);
  const [energy, setEnergy] = useState<Energy | null>(null);
  const [anxiety, setAnxiety] = useState<Anxiety | null>(null);
  const [safety, setSafety] = useState<Safety | null>(null);

  const canSave = mood !== null && sleep !== null && energy !== null && anxiety !== null && safety !== null;

  const handleSave = useCallback(() => {
    if (!canSave || saving) return;
    onSave({
      type: 'morning',
      timestamp: new Date().toISOString(),
      mood: mood!,
      sleep: sleep!,
      energy: energy!,
      anxiety: anxiety!,
      safety: safety!,
    });
  }, [canSave, saving, onSave, mood, sleep, energy, anxiety, safety]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Mood */}
      <SelectorGroup
        label="How are you feeling?"
        options={MOOD_OPTIONS}
        selected={mood}
        onSelect={(id) => setMood(id as Mood)}
        accentColor="amber"
      />

      {/* Sleep */}
      <SelectorGroup
        label="How did you sleep?"
        options={SLEEP_OPTIONS}
        selected={sleep}
        onSelect={(id) => setSleep(id as Sleep)}
        accentColor="amber"
      />

      {/* Energy */}
      <SelectorGroup
        label="How's your energy?"
        options={ENERGY_OPTIONS}
        selected={energy}
        onSelect={(id) => setEnergy(id as Energy)}
        accentColor="amber"
      />

      {/* Anxiety */}
      <SelectorGroup
        label="How's your anxiety right now?"
        options={ANXIETY_OPTIONS}
        selected={anxiety}
        onSelect={(id) => setAnxiety(id as Anxiety)}
        accentColor="amber"
      />

      {/* Safety */}
      <SelectorGroup
        label="Do you feel safe today?"
        options={SAFETY_OPTIONS}
        selected={safety}
        onSelect={(id) => setSafety(id as Safety)}
        accentColor="amber"
      />

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        aria-label="Save morning check-in"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          minHeight: 'var(--touch-comfortable)',
          padding: '12px 24px',
          borderRadius: 'var(--radius-button)',
          border: 'none',
          background: canSave && !saving
            ? 'var(--color-amber-500)'
            : 'var(--color-neutral-200)',
          color: canSave && !saving ? '#FFFFFF' : 'var(--color-text-tertiary)',
          fontSize: 'var(--text-md)',
          fontWeight: 600,
          cursor: canSave && !saving ? 'pointer' : 'default',
          transition: 'var(--transition-color)',
          boxShadow: canSave ? 'var(--shadow-button)' : 'none',
          fontFamily: 'var(--font-family-body)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {saving ? '☀️ Saving...' : '☀️ Save morning check-in'}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Evening Check-In Form
   ────────────────────────────────────────────────────────────────── */

interface EveningFormProps {
  onSave: (entry: Omit<CheckInEntry, 'id' | 'createdAt'>) => void;
  saving: boolean;
}

function EveningForm({ onSave, saving }: EveningFormProps) {
  const [challenge, setChallenge] = useState('');
  const [win, setWin] = useState('');
  const [hadTriggers, setHadTriggers] = useState<boolean>(false);
  const [triggerEmotions, setTriggerEmotions] = useState<EveningEmotion[]>([]);
  const [whatHelped, setWhatHelped] = useState('');

  const canSave = challenge.trim().length > 0 || win.trim().length > 0;

  const toggleEmotion = useCallback((emotion: EveningEmotion) => {
    setTriggerEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion],
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!canSave || saving) return;
    onSave({
      type: 'evening',
      timestamp: new Date().toISOString(),
      challenge: challenge.trim(),
      win: win.trim(),
      hadTriggers,
      triggerEmotions: hadTriggers ? triggerEmotions : [],
      whatHelped: whatHelped.trim(),
    });
  }, [canSave, saving, onSave, challenge, win, hadTriggers, triggerEmotions, whatHelped]);

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    padding: '14px 16px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border-subtle)',
    background: 'var(--color-bg-card)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--line-height-relaxed)',
    fontFamily: 'var(--font-family-body)',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color var(--duration-normal) var(--ease-default)',
  };

  const textInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border-subtle)',
    background: 'var(--color-bg-card)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--text-base)',
    lineHeight: 'var(--line-height-relaxed)',
    fontFamily: 'var(--font-family-body)',
    outline: 'none',
    transition: 'border-color var(--duration-normal) var(--ease-default)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Challenge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          htmlFor="evening-challenge"
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          🌙 What was your biggest challenge today?
        </label>
        <textarea
          id="evening-challenge"
          value={challenge}
          onChange={(e) => setChallenge(e.target.value)}
          placeholder="Anything that felt hard..."
          style={textareaStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-amber-400)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; }}
        />
      </div>

      {/* Win */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          htmlFor="evening-win"
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          ⭐ What was your biggest win today?
        </label>
        <textarea
          id="evening-win"
          value={win}
          onChange={(e) => setWin(e.target.value)}
          placeholder="Even getting out of bed counts"
          style={textareaStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-amber-400)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; }}
        />
      </div>

      {/* Triggers toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Any triggers today?
        </span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ToggleButton
            selected={!hadTriggers}
            onClick={() => setHadTriggers(false)}
            label="No"
            emoji="✖️"
          />
          <ToggleButton
            selected={hadTriggers}
            onClick={() => setHadTriggers(true)}
            label="Yes"
            emoji="⚠️"
          />
        </div>
      </div>

      {/* Trigger emotions (only if yes) */}
      {hadTriggers && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            How did it make you feel?
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {EVENING_EMOTION_CHIPS.map((chip) => {
              const isSelected = triggerEmotions.includes(chip.id);
              return (
                <button
                  key={chip.id}
                  onClick={() => toggleEmotion(chip.id)}
                  aria-pressed={isSelected}
                  aria-label={chip.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: `1.5px solid ${isSelected ? 'var(--color-lavender-400)' : 'var(--color-border-subtle)'}`,
                    background: isSelected ? 'var(--color-lavender-50)' : 'var(--color-bg-card)',
                    color: isSelected ? 'var(--color-lavender-700)' : 'var(--color-text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'var(--transition-color)',
                    fontFamily: 'var(--font-family-body)',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '40px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{chip.emoji}</span>
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* What helped */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          htmlFor="evening-helped"
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          🌿 What helped?
        </label>
        <input
          id="evening-helped"
          type="text"
          value={whatHelped}
          onChange={(e) => setWhatHelped(e.target.value)}
          placeholder="Anything that made it a little easier..."
          style={textInputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-amber-400)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; }}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        aria-label="Save evening check-in"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          minHeight: 'var(--touch-comfortable)',
          padding: '12px 24px',
          borderRadius: 'var(--radius-button)',
          border: 'none',
          background: canSave && !saving
            ? 'var(--color-amber-500)'
            : 'var(--color-neutral-200)',
          color: canSave && !saving ? '#FFFFFF' : 'var(--color-text-tertiary)',
          fontSize: 'var(--text-md)',
          fontWeight: 600,
          cursor: canSave && !saving ? 'pointer' : 'default',
          transition: 'var(--transition-color)',
          boxShadow: canSave ? 'var(--shadow-button)' : 'none',
          fontFamily: 'var(--font-family-body)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {saving ? '🌙 Saving...' : '🌙 Save evening check-in'}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Shared Components: SelectorGroup, ToggleButton
   ────────────────────────────────────────────────────────────────── */

interface Option {
  id: string;
  emoji: string;
  label: string;
}

function SelectorGroup({
  label,
  options,
  selected,
  onSelect,
  accentColor,
}: {
  label: string;
  options: Option[];
  selected: string | null;
  onSelect: (id: string) => void;
  accentColor: 'amber' | 'sage' | 'pink';
}) {
  // Map accentColor to token colors
  const accentMap = {
    amber: {
      selectedBg: 'var(--color-amber-100)',
      selectedBorder: 'var(--color-amber-400)',
      selectedText: 'var(--color-amber-700)',
      hoverBg: 'var(--color-amber-50)',
    },
    sage: {
      selectedBg: 'var(--color-sage-100)',
      selectedBorder: 'var(--color-sage-400)',
      selectedText: 'var(--color-sage-700)',
      hoverBg: 'var(--color-sage-50)',
    },
    pink: {
      selectedBg: 'var(--color-pink-100)',
      selectedBorder: 'var(--color-pink-400)',
      selectedText: 'var(--color-pink-700)',
      hoverBg: 'var(--color-pink-50)',
    },
  };

  const colors = accentMap[accentColor];

  return (
    <fieldset
      style={{
        border: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <legend
        style={{
          fontSize: 'var(--text-md)',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          padding: 0,
          marginBottom: '2px',
        }}
      >
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              role="radio"
              aria-checked={isSelected}
              aria-label={opt.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                width: '72px',
                minHeight: 'var(--touch-min)',
                padding: '10px 6px',
                borderRadius: 'var(--radius-xl)',
                border: `2px solid ${isSelected ? colors.selectedBorder : 'var(--color-border-subtle)'}`,
                background: isSelected ? colors.selectedBg : 'var(--color-bg-card)',
                color: isSelected ? colors.selectedText : 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'var(--transition-color)',
                boxShadow: isSelected ? 'var(--shadow-button)' : 'none',
                fontFamily: 'var(--font-family-body)',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = colors.hoverBg;
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-card)';
              }}
            >
              <span style={{ fontSize: '26px', lineHeight: 1 }}>{opt.emoji}</span>
              <span style={{ lineHeight: 1.3, textAlign: 'center' }}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ToggleButton({
  selected,
  onClick,
  label,
  emoji,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  emoji: string;
}) {
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: 'var(--radius-full)',
        border: `2px solid ${selected ? 'var(--color-amber-400)' : 'var(--color-border-subtle)'}`,
        background: selected ? 'var(--color-amber-100)' : 'var(--color-bg-card)',
        color: selected ? 'var(--color-amber-700)' : 'var(--color-text-secondary)',
        fontSize: 'var(--text-base)',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'var(--transition-color)',
        fontFamily: 'var(--font-family-body)',
        WebkitTapHighlightColor: 'transparent',
        minHeight: 'var(--touch-min)',
        minWidth: '80px',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: '18px' }}>{emoji}</span>
      {label}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Progress Section
   ────────────────────────────────────────────────────────────────── */

function ProgressSection({ count }: { count: number }) {
  let message: string;
  if (count === 0) {
    message = 'Your first check-in is waiting when you\'re ready.';
  } else if (count === 1) {
    message = 'That\'s a great start. One moment of reflection at a time.';
  } else if (count <= 3) {
    message = 'You\'re building a gentle rhythm. That takes courage.';
  } else if (count <= 5) {
    message = 'Look at you, showing up for yourself. That matters.';
  } else {
    message = 'You\'re doing beautiful work taking care of yourself this week.';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '20px 24px',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-amber-50)',
        border: '1px solid var(--color-amber-200)',
        textAlign: 'center' as const,
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          color: 'var(--color-amber-700)',
        }}
      >
        This week: {count} check-in{count !== 1 ? 's' : ''}
      </div>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-amber-600)',
          lineHeight: 'var(--line-height-relaxed)',
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Main CheckIn Page
   ────────────────────────────────────────────────────────────────── */

export default function CheckIn() {
  const navigate = useNavigate();

  // Tab state
  const [tab, setTab] = useState<CheckInType>('morning');

  // Save state
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Load check-ins for progress
  const { checkIns } = useCheckIns();
  const weeklyCount = countThisWeek(checkIns);

  /* ── Handlers ────────────────────────────────────────────── */

  const handleSave = useCallback(async (entry: Omit<CheckInEntry, 'id' | 'createdAt'>) => {
    setSaving(true);
    const saved = await saveCheckIn(entry);
    if (saved) {
      const affirmation = entry.type === 'morning'
        ? '☀️ Take it one step at a time today.'
        : '🌙 Rest well. Tomorrow is a new day.';
      setToast(affirmation);
    } else {
      setToast('Something went wrong. Please try again.');
    }
    setSaving(false);
  }, []);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /* ── Shared Styles ───────────────────────────────────────── */

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

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0',
    padding: '16px 24px 0',
    flexShrink: 0,
  };

  const scrollContentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px 96px',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  };

  return (
    <div style={pageStyle}>
      {/* Top Bar */}
      <div style={topBarStyle}>
        <button
          onClick={handleHome}
          style={iconBtnStyle}
          aria-label="Back to home"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
          Daily Check-In
        </span>
        <div style={{ width: 'var(--touch-min)' }} /> {/* spacer */}
      </div>

      {/* Header */}
      <div style={headerStyle}>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          🌅 Daily Check-In
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            margin: '6px 0 0',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          A gentle moment to check in with yourself — morning or evening.
        </p>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        <button
          onClick={() => setTab('morning')}
          aria-pressed={tab === 'morning'}
          aria-label="Morning check-in"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '12px 16px',
            minHeight: 'var(--touch-min)',
            border: 'none',
            borderBottom: `3px solid ${tab === 'morning' ? 'var(--color-amber-500)' : 'transparent'}`,
            background: 'transparent',
            color: tab === 'morning' ? 'var(--color-amber-700)' : 'var(--color-text-tertiary)',
            fontSize: 'var(--text-md)',
            fontWeight: tab === 'morning' ? 600 : 500,
            cursor: 'pointer',
            transition: 'var(--transition-color)',
            fontFamily: 'var(--font-family-body)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ fontSize: '20px' }}>☀️</span>
          Morning
        </button>
        <button
          onClick={() => setTab('evening')}
          aria-pressed={tab === 'evening'}
          aria-label="Evening check-in"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '12px 16px',
            minHeight: 'var(--touch-min)',
            border: 'none',
            borderBottom: `3px solid ${tab === 'evening' ? 'var(--color-amber-500)' : 'transparent'}`,
            background: 'transparent',
            color: tab === 'evening' ? 'var(--color-amber-700)' : 'var(--color-text-tertiary)',
            fontSize: 'var(--text-md)',
            fontWeight: tab === 'evening' ? 600 : 500,
            cursor: 'pointer',
            transition: 'var(--transition-color)',
            fontFamily: 'var(--font-family-body)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ fontSize: '20px' }}>🌙</span>
          Evening
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={scrollContentStyle}>
        {/* Progress Section */}
        <ProgressSection count={weeklyCount} />

        {/* Form */}
        {tab === 'morning' ? (
          <MorningForm onSave={handleSave} saving={saving} />
        ) : (
          <EveningForm onSave={handleSave} saving={saving} />
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
