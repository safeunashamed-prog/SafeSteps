import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/* ── Experience card definitions ───────────────────────────────── */
interface Experience {
  id: string;
  emoji: string;
  label: string;
  bg: string;
  border: string;
}

const experiences: Experience[] = [
  { id: 'panic',      emoji: '💗', label: 'Panic attack',     bg: '#FEF0F3', border: '#FDD5DA' },
  { id: 'flashback',  emoji: '🔄', label: 'Flashback',         bg: '#F3F0FB', border: '#E2DBF5' },
  { id: 'dissoc',     emoji: '☁️', label: 'Dissociation',      bg: '#F0F4F7', border: '#D8E4EE' },
  { id: 'racing',     emoji: '🌀', label: 'Racing thoughts',   bg: '#FEF8EF', border: '#FDEAD0' },
  { id: 'sleep',      emoji: '🌙', label: "Can't sleep",       bg: '#EEF4F0', border: '#D2E5D8' },
  { id: 'hypervig',   emoji: '👀', label: 'Hypervigilance',    bg: '#F5F2EE', border: '#E5DED5' },
  { id: 'overwhelm',  emoji: '🌊', label: 'Overwhelmed',       bg: '#FEF2F2', border: '#FDD5D5' },
  { id: 'crying',     emoji: '💧', label: 'Crying',            bg: '#F2F4FA', border: '#D8DFF0' },
  { id: 'frozen',     emoji: '❄️', label: 'Frozen',            bg: '#F0F7FA', border: '#D0E8F2' },
  { id: 'unsafe',     emoji: '🛡️', label: 'Feeling unsafe',    bg: '#FDF3EE', border: '#F9DDD0' },
];

/* ── Relief content for each experience ────────────────────────── */
interface ReliefData {
  emoji: string;
  heading: string;
  explanation: string;
  validation: string;
}

const reliefContent: Record<string, ReliefData> = {
  panic: {
    emoji: '💗',
    heading: 'Panic Attack',
    explanation:
      "Your body's alarm system is firing right now. Your heart races, your breath quickens, your chest might feel tight — this is your nervous system in protection mode. It's an intense wave, and it will pass. Your body isn't broken — it's responding exactly the way it learned to survive.",
    validation:
      'Panic attacks are your body doing its job too well. Many survivors experience them. This feeling is real, but it is not permanent — and you are safe in this moment.',
  },
  flashback: {
    emoji: '🔄',
    heading: 'Flashback',
    explanation:
      "A flashback is your brain reliving a past experience as if it's happening now. Your nervous system can't tell the difference between then and now — it's trying to protect you, even though the danger has passed.",
    validation:
      "This is one of the most common trauma responses. You're not losing your mind — your body is remembering something it shouldn't have to.",
  },
  dissoc: {
    emoji: '☁️',
    heading: 'Dissociation',
    explanation:
      "Your mind is creating distance from your body or your surroundings — things might feel dreamlike, foggy, or unreal. This is a protective mechanism. When reality feels like too much, your brain numbs out to keep you safe. It's not a flaw — it's a survival skill that helped you through things no one should have to endure.",
    validation:
      'Many survivors know this floating, disconnected feeling. Your mind learned to protect you this way, and it still kicks in when you feel overwhelmed. You are not broken — your brain is trying to shield you.',
  },
  racing: {
    emoji: '🌀',
    heading: 'Racing Thoughts',
    explanation:
      "Your mind is in overdrive, jumping from thought to thought without stopping. This can happen when your nervous system is on high alert — it's scanning for threats, solving problems that don't exist yet, trying to stay one step ahead. Your brain is working hard to protect you, even when there's nothing to protect you from right now.",
    validation:
      'Racing thoughts can feel exhausting and uncontrollable, but they come from a place of protection. Your mind learned that staying vigilant kept you safe. It takes time to teach it a new rhythm — and that is okay.',
  },
  sleep: {
    emoji: '🌙',
    heading: "Can't Sleep",
    explanation:
      "Sleep can be hard when your body doesn't feel safe enough to let go. Hypervigilance often peaks at night — when things get quiet, your nervous system stays on watch. This is not insomnia in the usual sense. It's your body doing what it learned to do: staying alert because letting your guard down once meant danger.",
    validation:
      'So many survivors struggle with sleep. Your body is not failing you — it is still learning that night can be restful again. Be gentle with yourself tonight.',
  },
  hypervig: {
    emoji: '👀',
    heading: 'Hypervigilance',
    explanation:
      "Your nervous system is scanning for danger — even when things are calm. Every sound, every movement, every person nearby gets processed as a potential threat. This kept you safe once. Your brain learned that missing a sign could be dangerous, so now it doesn't miss anything. It's exhausting, but it comes from a place of deep survival wisdom.",
    validation:
      "You're not paranoid or overly sensitive. Your nervous system was trained by experience to stay on high alert. That's not your fault — and with time and safety, it can learn to soften.",
  },
  overwhelm: {
    emoji: '🌊',
    heading: 'Overwhelmed',
    explanation:
      "When too much comes at you at once, your nervous system can go into overdrive. It's not a weakness — it's your body trying to process everything at full speed. Sounds feel louder, lights feel brighter, and even small tasks can feel impossible. This is a normal response to feeling flooded.",
    validation:
      "Many survivors experience this. You're not broken — your nervous system is doing its job. And you are safe now. You don't have to handle everything at once.",
  },
  crying: {
    emoji: '💧',
    heading: 'Crying',
    explanation:
      "Tears are a release valve. Crying is your body's way of discharging stress hormones — it's a healthy, natural response, not a breakdown. Your body knows when the pressure has built up too high and it finds a way to let some of it out. There is strength in letting yourself feel.",
    validation:
      'Crying is not weakness. It is your body taking care of you in the way it knows how. Let the tears come if they need to — they are doing important work.',
  },
  frozen: {
    emoji: '❄️',
    heading: 'Frozen',
    explanation:
      "Your nervous system has hit the pause button. You might feel stuck, unable to move or speak or decide. This freeze response is a survival strategy — sometimes stillness was the safest option. Your body learned that being invisible meant being safe. That strategy kept you alive, and it still activates when your nervous system senses overwhelm.",
    validation:
      'Freezing is not failure. It is one of the oldest survival responses we have. Your body is not giving up — it is protecting you the only way it knows how. Movement will return when you feel ready.',
  },
  unsafe: {
    emoji: '🛡️',
    heading: 'Feeling Unsafe',
    explanation:
      "That sense of danger — even when you know you're safe — is your nervous system doing what it learned to do. It takes time to teach your body a new baseline. Right now, your internal alarm is ringing, and it doesn't matter that there's no fire — the alarm itself feels real. Your body is not lying to you. It is responding to old patterns with the tools it has.",
    validation:
      'Feeling unsafe when you are actually safe is confusing and exhausting. It is also incredibly common among survivors. Your body is not betraying you — it is still learning that the danger has passed.',
  },
};

/* ── Toast component ───────────────────────────────────────────── */
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
        animation: 'fadeInUp 0.3s var(--ease-out)',
        maxWidth: '320px',
        textAlign: 'center',
      }}
    >
      {message}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Help component ────────────────────────────────────────────── */
export default function Help() {
  const [step, setStep] = useState<'select' | 'relief'>('select');
  const [selectedId, setSelectedId] = useState<string>('flashback');
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setStep('relief');
  }, []);

  const handleBack = useCallback(() => {
    setStep('select');
  }, []);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleAudio = useCallback(() => {
    setToast('Calming audio will be available soon. For now, try the breathing exercise above. 🌿');
  }, []);

  const handleFeelBetter = useCallback(() => {
    setStep('select');
  }, []);

  const relief = reliefContent[selectedId] || reliefContent.flashback;

  /* ── Styles ─────────────────────────────────────────────────── */
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
    padding: '8px 24px 6px',
    flexShrink: 0,
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 'var(--text-3xl)',
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

  return (
    <div style={pageStyle}>
      {/* ── Breathing animation keyframes ─────────────────────── */}
      <style>{`
        @keyframes breatheOuter {
          0%, 100% { transform: scale(0.85); }
          28.5%    { transform: scale(1.0); }
          57.1%    { transform: scale(1.0); }
          85.7%    { transform: scale(0.85); }
        }
        @keyframes breatheMiddle {
          0%, 100% { transform: scale(0.80); }
          28.5%    { transform: scale(1.0); }
          57.1%    { transform: scale(1.0); }
          85.7%    { transform: scale(0.80); }
        }
        @keyframes breatheInner {
          0%, 100% { transform: scale(0.75); }
          28.5%    { transform: scale(1.0); }
          57.1%    { transform: scale(1.0); }
          85.7%    { transform: scale(0.75); }
        }
      `}</style>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* STEP 1: Experience Selector                              */}
      {/* ═════════════════════════════════════════════════════════ */}
      {step === 'select' && (
        <>
          {/* Top bar */}
          <div style={topBarStyle}>
            <button
              style={{ ...iconBtnStyle, opacity: 0.3, cursor: 'default' }}
              aria-label="Back"
              disabled
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
            <h1 style={headingStyle}>What are you experiencing right now?</h1>
            <p style={subtitleStyle}>Pick what feels closest. No wrong answer.</p>
          </div>

          {/* Option cards */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '12px 24px 0',
              flex: 1,
              overflowY: 'auto',
              paddingBottom: '80px',
            }}
          >
            {experiences.map((exp) => (
              <button
                key={exp.id}
                onClick={() => handleSelect(exp.id)}
                aria-label={exp.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  minHeight: 'var(--touch-comfortable)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-xl)',
                  border: `1.5px solid ${exp.border}`,
                  background: exp.bg,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 'var(--text-md)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  textAlign: 'left' as const,
                  transition: 'transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-normal) var(--ease-default)',
                  boxShadow: 'var(--shadow-card)',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                  outline: 'none',
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-button)';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = '';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-card)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = '';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <span style={{ fontSize: '28px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>
                  {exp.emoji}
                </span>
                <span style={{ flex: 1, lineHeight: 1.3 }}>{exp.label}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
            <div style={{ minHeight: '8px' }} />
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════════ */}
      {/* STEP 2: Relief Screen                                   */}
      {/* ═════════════════════════════════════════════════════════ */}
      {step === 'relief' && (
        <>
          {/* Top bar */}
          <div style={topBarStyle}>
            <button
              style={iconBtnStyle}
              aria-label="Back to options"
              onClick={handleBack}
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

          {/* Relief content */}
          <div
            style={{
              padding: '0 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              flex: 1,
              overflowY: 'auto',
              paddingBottom: '80px',
            }}
          >
            {/* Explanation card */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-card)',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                borderLeft: '3px solid var(--color-pink-300)',
              }}
            >
              <span style={{ fontSize: '36px', marginBottom: '10px', display: 'block' }}>{relief.emoji}</span>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-tight)', marginBottom: '8px' }}>
                {relief.heading}
              </h2>
              <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
                {relief.explanation}
              </p>
            </div>

            {/* Validation banner */}
            <div
              style={{
                background: 'var(--color-cream-200)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '1px' }}>💛</span>
              <p style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-cream-700)', lineHeight: 'var(--line-height-relaxed)' }}>
                {relief.validation}
              </p>
            </div>

            {/* Grounding Exercise: 5-4-3-2-1 */}
            <div
              style={{
                background: 'var(--color-sage-50)',
                borderRadius: 'var(--radius-card)',
                padding: '20px',
                border: '1.5px solid var(--color-sage-200)',
              }}
            >
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-sage-700)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🖐️</span> The 5-4-3-2-1 Grounding Exercise
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
                {[
                  { num: 5, bg: 'var(--color-sage-200)', text: <>Look around and name <strong>5 things you can see</strong>. Say them quietly or in your head.</> },
                  { num: 4, bg: 'var(--color-sage-200)', text: <>Notice <strong>4 things you can feel</strong> — the fabric of your clothes, your feet on the floor, the air on your skin.</> },
                  { num: 3, bg: 'var(--color-sage-300)', text: <>Listen for <strong>3 things you can hear</strong>. Even tiny sounds count.</> },
                  { num: 2, bg: 'var(--color-sage-300)', text: <>Find <strong>2 things you can smell</strong>. If you can't smell anything, think of two scents you enjoy.</> },
                  { num: 1, bg: 'var(--color-sage-400)', text: <>Notice <strong>1 thing you can taste</strong>, or take a sip of water.</> },
                ].map((step) => (
                  <li key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-normal)' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-full)',
                        background: step.bg,
                        color: 'var(--color-sage-800)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {step.num}
                    </span>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Breathing Exercise */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-card)',
                padding: '24px 20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Breathe with me
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Follow the circle. No rush — take as long as you need.
              </p>

              {/* Animated breathing circles */}
              <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '16px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-pink-100)',
                    opacity: 0.3,
                    animation: 'breatheOuter 14s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: '15px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-pink-200)',
                    opacity: 0.4,
                    animation: 'breatheMiddle 14s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: '30px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-pink-400)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'breatheInner 14s ease-in-out infinite',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.2 }}>
                    Breathe<br />in…
                  </span>
                </div>
              </div>

              {/* Static timeline — always visible for accessibility */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '200px', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                <span style={{ textAlign: 'center' }}>Inhale<br />4 sec</span>
                <span style={{ textAlign: 'center' }}>Hold<br />4 sec</span>
                <span style={{ textAlign: 'center' }}>Exhale<br />6 sec</span>
              </div>
            </div>

            {/* Try calming audio */}
            <button
              onClick={handleAudio}
              aria-label="Try calming audio"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                minHeight: 'var(--touch-comfortable)',
                borderRadius: 'var(--radius-button)',
                border: '1.5px solid var(--color-blue-200)',
                background: 'var(--color-blue-50)',
                color: 'var(--color-blue-700)',
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default), transform var(--duration-fast) var(--ease-out)',
                boxShadow: 'var(--shadow-card)',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
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
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-blue-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Try calming audio
            </button>

            {/* Section divider */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span style={{ width: '60px', height: '1px', background: 'var(--color-neutral-200)' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: 'var(--color-pink-300)' }} />
              <span style={{ width: '60px', height: '1px', background: 'var(--color-neutral-200)' }} />
            </div>

            {/* I'm feeling better */}
            <button
              onClick={handleFeelBetter}
              aria-label="I'm feeling better — return to options"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: 'var(--touch-comfortable)',
                borderRadius: 'var(--radius-button)',
                border: 'none',
                background: 'var(--color-sage-500)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default), transform var(--duration-fast) var(--ease-out)',
                boxShadow: 'var(--shadow-button)',
                marginBottom: '8px',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sage-600)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sage-500)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-sage-500)';
              }}
            >
              ✨ I'm feeling better
            </button>

            <div style={{ minHeight: '8px' }} />
          </div>
        </>
      )}

      {/* Bottom navigation */}
      <BottomNav />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Hover states via CSS for desktop */}
      <style>{`
        @media (hover: hover) {
          .help-card-btn:hover {
            transform: translateY(-1px);
            box-shadow: var(--shadow-card-hover) !important;
          }
        }
      `}</style>
    </div>
  );
}
