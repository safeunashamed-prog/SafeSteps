import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import BottomNav from '../components/BottomNav';

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

type Emotion = 'scared' | 'ashamed' | 'angry' | 'numb' | 'confused' | 'guilty' | 'small' | 'panicked';

type SafetyChoice = 'yes' | 'unsure' | null;

type ResponseType =
  | 'emotional-flashback'
  | 'hypervigilance'
  | 'fight'
  | 'flight'
  | 'freeze'
  | 'fawn'
  | 'dissociation';

interface TraumaResponse {
  type: ResponseType;
  badge: string;
  explanation: string;
  suggestions: string[];
  patternText: (emotions: Emotion[], situation: string, location: string) => string;
}

interface Insight {
  date: string;
  situation: string;
  emotions: Emotion[];
  location: string;
  safety: SafetyChoice;
  responseType: ResponseType;
  responseBadge: string;
  explanation: string;
}

/* ──────────────────────────────────────────────────────────────────
   Emotion Chip Config
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
   Pattern Text Generators
   ────────────────────────────────────────────────────────────────── */

function generatePatternText(
  responseType: ResponseType,
  emotions: Emotion[],
  situation: string,
  location: string,
): string {
  const emotionLabels = emotions.map((e) => EMOTION_CHIPS.find((c) => c.id === e)?.label.toLowerCase() || e).join(', ');
  const hasSituation = situation.trim().length > 0;
  const hasLocation = location.trim().length > 0;

  const templates: Record<ResponseType, string> = {
    'emotional-flashback':
      hasSituation
        ? `You may be feeling ${emotionLabels || 'intense emotions'} because situations like "${situation.slice(0, 80)}${situation.length > 80 ? '…' : ''}" can echo past experiences. Your nervous system is reacting to a learned association, even though this moment may be different.`
        : `You may be feeling ${emotionLabels || 'intense emotions'} that echo past experiences. Your nervous system is reacting emotionally to something familiar, even if you can't name the trigger right now.`,

    hypervigilance:
      hasSituation && hasLocation
        ? `You may be feeling ${emotionLabels || 'on edge'} because your nervous system is scanning for danger in "${location}" — a response learned from past experiences where staying vigilant kept you safe. Small signals can feel like major threats.`
        : hasSituation
          ? `You may be feeling ${emotionLabels || 'on edge'} because your nervous system is scanning for danger. Small signals can feel like major threats — your body learned that noticing everything was necessary.`
          : `You may be feeling ${emotionLabels || 'on edge'} because your nervous system is in high-alert mode. It learned that missing a signal could be dangerous, so now it catches everything.`,

    fight:
      hasSituation
        ? `You may be feeling ${emotionLabels || 'anger or defensiveness'} because the situation "${situation.slice(0, 60)}${situation.length > 60 ? '…' : ''}" triggered your nervous system's protective fight response. This isn't you being difficult — your survival system is saying "never again."`
        : `You may be feeling ${emotionLabels || 'anger or defensiveness'} because your nervous system is preparing to defend itself. This isn't you being difficult or aggressive — your survival system is stepping up to protect you.`,

    flight:
      hasSituation
        ? `You may be feeling ${emotionLabels || 'the urge to escape'} because "${situation.slice(0, 60)}${situation.length > 60 ? '…' : ''}" triggered your nervous system's flight response. When leaving was once your only safe option, your body learned to escape first.`
        : `You may be feeling ${emotionLabels || 'the urge to escape'} because your nervous system is trying to get you away from what it perceives as danger. This impulse was essential when leaving was your only safe option.`,

    freeze:
      hasSituation
        ? `You may be feeling ${emotionLabels || 'stuck or shut down'} because "${situation.slice(0, 60)}${situation.length > 60 ? '…' : ''}" overwhelmed your nervous system. When fight or flight don't feel possible, your body protects you by shutting down movement — this is not weakness.`
        : `You may be feeling ${emotionLabels || 'stuck or shut down'} because your nervous system has paused all movement. When fighting or fleeing don't feel possible, freezing is a deeply biological survival strategy that kept you safe.`,

    fawn:
      hasSituation
        ? `You may be feeling ${emotionLabels || 'the need to please or shrink'} because "${situation.slice(0, 60)}${situation.length > 60 ? '…' : ''}" — especially with authority figures or criticism — triggered a learned survival pattern. Your nervous system discovered that pleasing others was the safest way through.`
        : `You may be feeling ${emotionLabels || 'the need to please or shrink'} because your nervous system learned that appeasing others was the safest way to survive. This was a brilliant survival strategy — it just might not serve you in every situation now.`,

    dissociation:
      hasSituation
        ? `You may be feeling ${emotionLabels || 'disconnected or spaced out'} because "${situation.slice(0, 60)}${situation.length > 60 ? '…' : ''}" felt overwhelming. Your mind created distance as a protective measure — when full presence was too painful, stepping back kept you safe.`
        : `You may be feeling ${emotionLabels || 'disconnected or spaced out'} because your mind is creating protective distance. This is not "zoning out" — it's a survival response that helped you endure things no one should have to endure.`,
  };

  return templates[responseType];
}

/* ──────────────────────────────────────────────────────────────────
   All 7 Trauma Responses
   ────────────────────────────────────────────────────────────────── */

const TRAUMA_RESPONSES: Record<ResponseType, Omit<TraumaResponse, 'patternText'>> = {
  'emotional-flashback': {
    type: 'emotional-flashback',
    badge: 'Emotional flashback',
    explanation:
      'An emotional flashback is when you feel the same intense emotions you felt during a past trauma — but without remembering the memory itself. Your body is reliving the feeling, even though your mind isn\'t replaying the event. This is why a boss\'s criticism can feel as devastating as something that happened years ago. Your nervous system doesn\'t know the difference between "then" and "now" — it just knows the feeling is familiar and tries to protect you.',
    suggestions: [
      'Gently remind yourself: "I am Safe Steps. The danger I\'m feeling is from the past, not the present."',
      'Look around and name 3 things you can see. This helps orient your brain to the present moment.',
      'Place your hand on your chest. Feel your breath moving in and out. Your body is with you right now.',
    ],
  },
  hypervigilance: {
    type: 'hypervigilance',
    badge: 'Hypervigilance',
    explanation:
      'Hypervigilance is when your nervous system is constantly scanning for danger — even when you\'re in a safe environment. It\'s like your internal alarm system is stuck at maximum sensitivity. Small things that others might not notice — a change in someone\'s tone, a door closing too loudly, someone standing too close — can feel like major threats. This developed because at some point, staying hyper-aware was necessary for your survival. Your brain learned that missing a small signal could be dangerous, so now it catches everything.',
    suggestions: [
      'Try the 5-4-3-2-1 grounding exercise: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.',
      'If you can, find a quieter spot for a few minutes. Your nervous system needs a break from input.',
      'Remind yourself: "My alarm system is working. It\'s keeping me safe, even if it\'s a little too sensitive right now."',
    ],
  },
  fight: {
    type: 'fight',
    badge: 'Fight response',
    explanation:
      'The fight response is your nervous system preparing to defend itself. When you feel sudden anger, irritation, or the urge to push back — even in situations that don\'t logically call for it — your body may be reacting to a past experience where fighting back wasn\'t safe, and now it\'s finally asserting itself. This isn\'t you being "difficult" or "aggressive." It\'s your survival system saying "never again."',
    suggestions: [
      'If you notice tension building, try pushing your palms against a wall or desk — it gives your body a physical outlet without hurting anyone.',
      'Take 3 slow, deep breaths before responding. Your reaction is valid, but you deserve the space to choose how to express it.',
      'If possible, step away for a moment. Your nervous system needs to register that you are not in the same situation it remembers.',
    ],
  },
  flight: {
    type: 'flight',
    badge: 'Flight response',
    explanation:
      'The flight response is your body\'s impulse to escape. When you feel a sudden urge to leave, run, quit, or disappear — your nervous system is trying to get you away from what it perceives as danger. This response was essential when leaving was the only safe option. Now, it can show up as wanting to quit a job after criticism, leaving a conversation that feels uncomfortable, or avoiding situations that remind your body of past danger.',
    suggestions: [
      'If you can, give yourself permission to take a brief physical break — a bathroom visit, stepping outside, a short walk.',
      'Breathe slowly and tell yourself: "I can stay or I can leave. Either choice is okay. I am in control right now."',
      'Once you feel steadier, check in: is leaving what you actually want, or is it an old pattern? Either answer is valid.',
    ],
  },
  freeze: {
    type: 'freeze',
    badge: 'Freeze response',
    explanation:
      'The freeze response happens when your nervous system decides that fighting or running aren\'t possible — so it shuts down movement instead. You might feel stuck, unable to speak, mentally blank, or physically immobilized. This is not weakness. Freezing is a deeply biological survival strategy — many animals do it. It\'s your body\'s way of saying "if I can\'t escape, maybe I can wait this out." It kept you safe then. It\'s just not as helpful now.',
    suggestions: [
      'Start small: wiggle your fingers and toes. Even tiny movements can help your nervous system unfreeze.',
      'Name out loud one thing you can see. Speaking — even quietly — reconnects your voice and your body.',
      'There is no rush. Your body is protecting you. When you\'re ready, try shifting your weight gently from one side to the other.',
    ],
  },
  fawn: {
    type: 'fawn',
    badge: 'Fawn response',
    explanation:
      'Fawning is when your nervous system learned that pleasing others was the safest way to survive. When someone criticizes you or seems unhappy — even in normal professional or social situations — your body may instinctively go into people-pleasing mode: over-apologizing, shrinking yourself, agreeing when you don\'t actually agree, or trying desperately to smooth things over. This isn\'t weakness. It was a brilliant survival strategy. It just might not serve you in situations where you\'re actually safe and your needs matter too.',
    suggestions: [
      'Remind yourself: "I am safe in this moment. This person is not my past."',
      'Place your hand on your chest and take three slow breaths. Your body needs to know the threat has passed.',
      'If you can, step away for a moment — a bathroom break, a short walk — to reset your nervous system.',
    ],
  },
  dissociation: {
    type: 'dissociation',
    badge: 'Dissociation',
    explanation:
      'Dissociation is your mind\'s way of creating distance from something that feels overwhelming. You might feel spaced out, disconnected from your body, like you\'re watching yourself from far away, or like things aren\'t quite real. This is a protective mechanism — when being fully present was too painful, your brain learned to step back. It\'s not "zoning out" or being distracted. It\'s a deeply ingrained survival response that helped you endure things no one should have to endure.',
    suggestions: [
      'Try touching something with an interesting texture — a soft sweater, a cool surface, something bumpy. Physical sensation can help you reconnect.',
      'Name 5 things you can see right now, out loud if possible. Describe them in detail — color, shape, texture.',
      'If you can, hold something cold like a glass of water or an ice cube wrapped in a cloth. Temperature can be a gentle anchor back to your body.',
    ],
  },
};

/* ──────────────────────────────────────────────────────────────────
   Heuristic Mapping Engine
   ────────────────────────────────────────────────────────────────── */

interface MappingResult {
  responseType: ResponseType;
  confidence: number; // 0-1, informational only
}

function mapToResponse(
  emotions: Emotion[],
  situation: string,
  location: string,
  safety: SafetyChoice,
): MappingResult {
  const scores: Record<ResponseType, number> = {
    'emotional-flashback': 0,
    hypervigilance: 0,
    fight: 0,
    flight: 0,
    freeze: 0,
    fawn: 0,
    dissociation: 0,
  };

  const lowerSituation = situation.toLowerCase();
  const lowerLocation = location.toLowerCase();

  /* ── Emotion → Response scoring ──────────────────────────── */
  const emotionSet = new Set(emotions);

  if (emotions.length >= 4) {
    scores['emotional-flashback'] += 4; // multiple emotions = flashback
  }

  if (emotionSet.has('scared') && emotionSet.has('panicked')) {
    scores['flight'] += 3;
    scores['hypervigilance'] += 2;
  }

  if ((emotionSet.has('ashamed') && emotionSet.has('guilty') && emotionSet.has('small'))
      || (emotionSet.has('ashamed') && emotionSet.has('guilty'))
      || (emotionSet.has('guilty') && emotionSet.has('small'))) {
    scores['fawn'] += 4;
  }

  if (emotionSet.has('angry')) {
    scores['fight'] += 4;
  }

  if (emotionSet.has('numb') && emotionSet.has('confused')) {
    scores['dissociation'] += 3;
    scores['freeze'] += 2;
  }

  if (emotionSet.has('small') && emotions.length === 1) {
    scores['fawn'] += 2;
    scores['freeze'] += 2;
  }

  if (emotionSet.has('scared') && emotionSet.has('small')) {
    scores['emotional-flashback'] += 3;
  }

  if (emotionSet.has('panicked') && emotionSet.has('confused')) {
    scores['emotional-flashback'] += 3;
  }

  if (emotionSet.has('guilty') && emotionSet.has('ashamed')) {
    scores['fawn'] += 3;
  }

  if (emotionSet.has('numb') && emotions.length === 1) {
    scores['dissociation'] += 3;
  }

  /* ── Situation keywords → fine-tuning ─────────────────────── */
  const keywordMap: [string[], ResponseType, number][] = [
    [['boss', 'manager', 'supervisor', 'criticized', 'corrected', 'feedback', 'work'], 'fawn', 3],
    [['crowded', 'crowd', 'store', 'mall', 'public', 'people', 'watching'], 'hypervigilance', 3],
    [['crowded', 'crowd', 'store', 'mall', 'public', 'people', 'watching'], 'flight', 2],
    [['yelled', 'screamed', 'raised voice', 'shouting', 'loud'], 'emotional-flashback', 3],
    [['yelled', 'screamed', 'raised voice', 'shouting', 'loud'], 'hypervigilance', 2],
    [['touched', 'grabbed', 'cornered', 'trapped', "couldn't leave", 'could not leave'], 'fight', 3],
    [['touched', 'grabbed', 'cornered', 'trapped', "couldn't leave", 'could not leave'], 'freeze', 2],
    [['ignored', 'dismissed', 'overlooked', "didn't listen", 'talked over', 'did not listen'], 'emotional-flashback', 3],
    [['argument', 'fight', 'conflict', 'confrontation'], 'fight', 2],
    [['argument', 'fight', 'conflict', 'confrontation'], 'flight', 2],
    [['froze', "couldn't move", 'stuck', "couldn't speak", 'blank', 'could not move', 'could not speak'], 'freeze', 4],
    [['spaced out', 'not real', 'dream', 'floating', 'watching myself', 'numb'], 'dissociation', 4],
    [['apologized', 'sorry', 'fixed it', 'smoothed', 'people-pleasing', 'people pleasing'], 'fawn', 3],
  ];

  for (const [keywords, responseType, weight] of keywordMap) {
    for (const kw of keywords) {
      if (lowerSituation.includes(kw)) {
        scores[responseType] += weight;
        break; // one match per keyword group
      }
    }
  }

  /* ── Location context ─────────────────────────────────────── */
  if (lowerLocation.includes('work') || lowerLocation.includes('office') || lowerLocation.includes('meeting')) {
    scores['fawn'] += 2;
  }
  if (lowerLocation.includes('home') || lowerLocation.includes('house') || lowerLocation.includes('apartment')) {
    scores['emotional-flashback'] += 2;
  }
  if (lowerLocation.includes('store') || lowerLocation.includes('mall') || lowerLocation.includes('grocery')) {
    scores['hypervigilance'] += 2;
  }
  if (lowerLocation.includes('outside') || lowerLocation.includes('street') || lowerLocation.includes('walking')) {
    scores['hypervigilance'] += 2;
  }
  if (lowerLocation.includes('family') || lowerLocation.includes('parent') || lowerLocation.includes('partner')) {
    scores['fawn'] += 2;
    scores['emotional-flashback'] += 2;
  }

  /* ── Safety concern elevates hypervigilance ───────────────── */
  if (safety === 'unsure') {
    scores['hypervigilance'] += 3;
  }

  /* ── Find highest-scoring response ────────────────────────── */
  let bestType: ResponseType = 'emotional-flashback';
  let bestScore = scores['emotional-flashback'];

  for (const [type, score] of Object.entries(scores) as [ResponseType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // If no scores at all (all zero), default to emotional flashback
  if (bestScore === 0) {
    return { responseType: 'emotional-flashback', confidence: 0.1 };
  }

  // Normalize confidence roughly (max possible is about 15)
  const confidence = Math.min(bestScore / 12, 1);

  return { responseType: bestType, confidence };
}

/* ──────────────────────────────────────────────────────────────────
   Save Insight
   ────────────────────────────────────────────────────────────────── */

async function saveInsight(insight: Insight): Promise<boolean> {
  try {
    // Try Firestore first
    await addDoc(collection(db, 'insights'), {
      ...insight,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    // Fall back to localStorage
    try {
      const stored = localStorage.getItem('safesteps-insights');
      const insights: Insight[] = stored ? JSON.parse(stored) : [];
      insights.push({ ...insight, createdAt: new Date().toISOString() } as any);
      localStorage.setItem('safesteps-insights', JSON.stringify(insights));
      return true;
    } catch {
      return false;
    }
  }
}

/* ──────────────────────────────────────────────────────────────────
   Toast Component
   ────────────────────────────────────────────────────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
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
   Understand Component
   ────────────────────────────────────────────────────────────────── */

export default function Understand() {
  const navigate = useNavigate();

  // Step management
  const [step, setStep] = useState<'input' | 'understanding'>('input');

  // Form state — preserved when going back
  const [situation, setSituation] = useState('');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [location, setLocation] = useState('');
  const [safety, setSafety] = useState<SafetyChoice>(null);

  // Result state
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Derived: is there any input?
  const hasInput = situation.trim().length > 0 || emotions.length > 0 || safety !== null;

  /* ── Handlers ────────────────────────────────────────────── */

  const toggleEmotion = useCallback((emotion: Emotion) => {
    setEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion],
    );
  }, []);

  const handleSafetySelect = useCallback((choice: SafetyChoice) => {
    setSafety((prev) => (prev === choice ? null : choice));
  }, []);

  const handleUnderstand = useCallback(() => {
    const result = mapToResponse(emotions, situation, location, safety);
    setMappingResult(result);
    setStep('understanding');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [emotions, situation, location, safety]);

  const handleBackToInput = useCallback(() => {
    setStep('input');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleGrounding = useCallback(() => {
    navigate('/help');
  }, [navigate]);

  const handleSave = useCallback(async () => {
    if (!mappingResult) return;
    const response = TRAUMA_RESPONSES[mappingResult.responseType];
    const insight: Insight = {
      date: new Date().toISOString(),
      situation,
      emotions,
      location,
      safety,
      responseType: mappingResult.responseType,
      responseBadge: response.badge,
      explanation: response.explanation,
    };

    const saved = await saveInsight(insight);
    if (saved) {
      setToast('💾 Insight saved! You can review it later in your Victory Journal.');
    } else {
      setToast('Something went wrong saving your insight. Please try again.');
    }
  }, [mappingResult, situation, emotions, location, safety]);

  /* ── Derived data for Step 2 ─────────────────────────────── */

  const responseData = mappingResult
    ? TRAUMA_RESPONSES[mappingResult.responseType]
    : null;

  const patternText = mappingResult && responseData
    ? generatePatternText(mappingResult.responseType, emotions, situation, location)
    : '';

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
    marginBottom: '4px',
  };

  const toolBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--color-blue-600)',
    background: 'var(--color-blue-50)',
    alignSelf: 'flex-start',
    marginBottom: '12px',
  };

  const contentStyle: React.CSSProperties = {
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    flex: 1,
    paddingBottom: '80px',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 'var(--text-2xl)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    lineHeight: 'var(--line-height-tight)',
    letterSpacing: 'var(--letter-spacing-tight)',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 'var(--text-md)',
    color: 'var(--color-text-secondary)',
    lineHeight: 'var(--line-height-relaxed)',
    marginTop: '6px',
  };

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div style={pageStyle}>
      {/* ═══════════════════════════════════════════════════════ */}
      {/* Top Bar (shared across both steps)                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div style={topBarStyle}>
        <button
          style={iconBtnStyle}
          aria-label={step === 'understanding' ? 'Go back to edit' : 'Go back'}
          onClick={step === 'understanding' ? handleBackToInput : () => navigate(-1)}
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* STEP 1: Input Screen                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'input' && (
        <>
          {/* Header */}
          <div style={headerStyle}>
            <div style={toolBadgeStyle}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-blue-400)', flexShrink: 0 }} />
              What's Happening to Me?
            </div>
            <h1 style={headingStyle}>Let's figure this out together</h1>
            <p style={subtitleStyle}>Sometimes our reactions don't match the moment. Let's gently explore why.</p>
          </div>

          {/* Content */}
          <div style={{ ...contentStyle, overflowY: 'auto' }}>
            {/* What happened? */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="what-happened"
                style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-text-primary)' }}
              >
                What happened?
              </label>
              <textarea
                id="what-happened"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Describe what's going on..."
                style={{
                  width: '100%',
                  minHeight: '110px',
                  padding: '16px',
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
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-blue-400)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(125, 152, 199, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* How are you feeling? */}
            <div>
              <label style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-text-primary)', display: 'block', marginBottom: '10px' }}>
                How are you feeling?
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
                          ? '1.5px solid var(--color-blue-300)'
                          : '1.5px solid var(--color-border-subtle)',
                        background: selected ? 'var(--color-blue-50)' : 'var(--color-bg-card)',
                        fontFamily: 'var(--font-family-body)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 500,
                        color: selected ? 'var(--color-blue-700)' : 'var(--color-text-primary)',
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

            {/* Where are you? */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                htmlFor="where-are-you"
                style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-text-primary)' }}
              >
                Where are you?
              </label>
              <input
                id="where-are-you"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., at work, at home, at the store..."
                style={{
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
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-blue-400)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(125, 152, 199, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Safety Check */}
            <div style={{
              background: 'var(--color-cream-100)',
              borderRadius: 'var(--radius-xl)',
              padding: '18px',
              border: '1.5px solid var(--color-cream-200)',
            }}>
              <p style={{
                fontSize: 'var(--text-md)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                marginBottom: '12px',
              }}>
                Are you physically safe right now?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleSafetySelect('yes')}
                  aria-pressed={safety === 'yes'}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: 'var(--touch-comfortable)',
                    padding: '14px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: safety === 'yes'
                      ? '3px solid var(--color-sage-400)'
                      : '1.5px solid var(--color-sage-200)',
                    background: 'var(--color-sage-100)',
                    fontFamily: 'var(--font-family-body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    color: 'var(--color-sage-700)',
                    cursor: 'pointer',
                    transition: 'transform var(--duration-fast) var(--ease-out)',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    outline: safety === 'yes' ? '3px solid var(--color-sage-400)' : 'none',
                    outlineOffset: '2px',
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = '';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = '';
                  }}
                >
                  <span aria-hidden="true">🛡️</span> Yes, I'm safe
                </button>
                <button
                  onClick={() => handleSafetySelect('unsure')}
                  aria-pressed={safety === 'unsure'}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: 'var(--touch-comfortable)',
                    padding: '14px 12px',
                    borderRadius: 'var(--radius-button)',
                    border: safety === 'unsure'
                      ? '3px solid var(--color-cream-500)'
                      : '1.5px solid var(--color-cream-300)',
                    background: 'var(--color-cream-200)',
                    fontFamily: 'var(--font-family-body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    color: 'var(--color-neutral-700)',
                    cursor: 'pointer',
                    transition: 'transform var(--duration-fast) var(--ease-out)',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    outline: safety === 'unsure' ? '3px solid var(--color-cream-500)' : 'none',
                    outlineOffset: '2px',
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = '';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = '';
                  }}
                >
                  <span aria-hidden="true">🤔</span> I'm not sure
                </button>
              </div>
            </div>

            {/* Unsafe alert */}
            {safety === 'unsure' && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-cream-100)',
                  border: '1.5px solid var(--color-cream-300)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-neutral-700)',
                  lineHeight: 'var(--line-height-relaxed)',
                }}
              >
                <span style={{ fontSize: '22px', flexShrink: 0 }} aria-hidden="true">💛</span>
                <span>
                  Your safety matters. If you're in immediate danger, please reach out for help. The <strong>Help Me Right Now</strong> tool is here when you need it — no judgment, ever.
                </span>
              </div>
            )}

            {/* Help Me Understand Button */}
            <button
              onClick={handleUnderstand}
              disabled={!hasInput}
              aria-label="Help me understand"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: 'var(--touch-comfortable)',
                padding: '16px 24px',
                borderRadius: 'var(--radius-button)',
                border: 'none',
                background: hasInput ? 'var(--color-blue-500)' : 'var(--color-blue-500)',
                opacity: hasInput ? 1 : 0.5,
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                color: 'var(--color-text-on-accent)',
                cursor: hasInput ? 'pointer' : 'not-allowed',
                transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-normal) var(--ease-default), background var(--duration-normal) var(--ease-default)',
                boxShadow: hasInput ? 'var(--shadow-button)' : 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                outline: 'none',
                marginTop: 'auto',
              }}
              onMouseDown={(e) => {
                if (hasInput) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-blue-600)';
                }
              }}
              onMouseUp={(e) => {
                if (hasInput) {
                  (e.currentTarget as HTMLButtonElement).style.transform = '';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-blue-500)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasInput) {
                  (e.currentTarget as HTMLButtonElement).style.transform = '';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-blue-500)';
                }
              }}
            >
              ✨ Help me understand
            </button>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* STEP 2: Understanding Screen                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {step === 'understanding' && responseData && (
        <>
          {/* Header */}
          <div style={headerStyle}>
            <div style={toolBadgeStyle}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-blue-400)', flexShrink: 0 }} />
              What's Happening to Me?
            </div>
            <h1 style={headingStyle}>Here's what might be happening…</h1>
          </div>

          {/* Content */}
          <div style={{ ...contentStyle, overflowY: 'auto' }}>
            {/* Pattern Explanation Card */}
            <div style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              borderLeft: '3px solid var(--color-blue-300)',
            }}>
              <h3 style={{
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--color-blue-600)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span aria-hidden="true">🧠</span> Connecting the dots
              </h3>
              <p style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--line-height-relaxed)',
                color: 'var(--color-text-secondary)',
              }}>
                {patternText}
              </p>
            </div>

            {/* Response Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-blue-50)',
              color: 'var(--color-blue-700)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              border: '1px solid var(--color-blue-200)',
              alignSelf: 'flex-start',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--color-blue-400)',
                flexShrink: 0,
              }} aria-hidden="true" />
              {responseData.badge}
            </div>

            {/* What is this response? */}
            <div style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              borderLeft: '3px solid var(--color-blue-300)',
            }}>
              <h3 style={{
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--color-blue-600)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span aria-hidden="true">💡</span> What's a "{responseData.badge.toLowerCase()}"?
              </h3>
              <p style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--line-height-relaxed)',
                color: 'var(--color-text-secondary)',
              }}>
                {responseData.explanation}
              </p>
            </div>

            {/* Suggestions Card */}
            <div style={{
              background: 'var(--color-sage-50)',
              borderRadius: 'var(--radius-card)',
              padding: '18px',
              border: '1px solid var(--color-sage-100)',
            }}>
              <h4 style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--color-sage-700)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span aria-hidden="true">🌿</span> What might help right now
              </h4>
              <ul style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: 0,
                margin: 0,
              }}>
                {responseData.suggestions.map((suggestion, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: 'var(--text-base)',
                    lineHeight: 'var(--line-height-relaxed)',
                    color: 'var(--color-text-primary)',
                  }}>
                    <span style={{
                      flexShrink: 0,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--color-sage-400)',
                      marginTop: '7px',
                    }} aria-hidden="true" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Validation Card */}
            <div style={{
              background: 'var(--color-pink-50)',
              borderRadius: 'var(--radius-card)',
              padding: '18px',
              border: '1px solid var(--color-pink-100)',
              textAlign: 'center' as const,
            }}>
              <p style={{
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                color: 'var(--color-pink-700)',
                lineHeight: 'var(--line-height-relaxed)',
                fontStyle: 'italic',
                margin: 0,
              }}>
                <span aria-hidden="true">🌸</span> This reaction makes sense given what you've been through. <strong>You're not overreacting.</strong>
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              <button
                onClick={handleGrounding}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  minHeight: 'var(--touch-comfortable)',
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-button)',
                  border: '1.5px solid var(--color-sage-200)',
                  background: 'var(--color-sage-50)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: 'var(--color-sage-700)',
                  cursor: 'pointer',
                  transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-normal) var(--ease-default), background var(--duration-normal) var(--ease-default)',
                  boxShadow: 'var(--shadow-card)',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  outline: 'none',
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sage-100)';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = '';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sage-50)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = '';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sage-50)';
                }}
              >
                <span aria-hidden="true">🌱</span> Try a grounding exercise
              </button>
              <button
                onClick={handleSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  minHeight: 'var(--touch-comfortable)',
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-button)',
                  border: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 500,
                  color: 'var(--color-blue-600)',
                  cursor: 'pointer',
                  transition: 'background var(--duration-normal) var(--ease-default)',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  outline: 'none',
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-blue-50)';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span aria-hidden="true">💾</span> Save this insight
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Hover states via CSS for desktop */}
      <style>{`
        @media (hover: hover) {
          .understand-chip:hover {
            border-color: var(--color-blue-200) !important;
            background: var(--color-blue-50) !important;
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
