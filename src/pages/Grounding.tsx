import { useState, useCallback } from 'react';
import BottomNav from '../components/BottomNav';

/* ── Exercise definitions ─────────────────────────────────────── */
interface Exercise {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

const exercises: Exercise[] = [
  {
    id: '54321',
    emoji: '\u{1F590}\uFE0F',
    title: '5-4-3-2-1 Grounding',
    description: 'Use your senses to anchor yourself in the present moment',
  },
  {
    id: 'box-breathing',
    emoji: '\u{1FAC1}',
    title: 'Box Breathing',
    description: 'A calming breath pattern with a gentle animated guide',
  },
  {
    id: 'butterfly-hug',
    emoji: '\u{1F98B}',
    title: 'Butterfly Hug',
    description: 'Gentle alternating tapping to soothe your nervous system',
  },
  {
    id: 'pmr',
    emoji: '\u{1F486}',
    title: 'Progressive Muscle Relaxation',
    description: 'Tense and release each muscle group, from toes to head',
  },
  {
    id: 'body-scan',
    emoji: '\u{1F9D8}',
    title: 'Body Scan',
    description: 'Guide your attention gently through each part of your body',
  },
  {
    id: 'safe-place',
    emoji: '\u{1F3E1}',
    title: 'Safe Place Visualization',
    description: 'Imagine a peaceful, safe place with all your senses',
  },
  {
    id: 'cold-water',
    emoji: '\u{1F4A7}',
    title: 'Cold Water Grounding',
    description: 'Use cool water to bring yourself back to the present',
  },
  {
    id: 'finger-breathing',
    emoji: '\u270B',
    title: '5 Finger Breathing',
    description: 'Trace each finger \u2014 inhale going up, exhale going down',
  },
];

/* ── Teal/mint accent palette (local to Grounding) ───────────── */
const teal: Record<string, string> = {
  '50': '#F0FAF7',
  '100': '#DCF3EC',
  '200': '#B8E8D9',
  '300': '#86D8C3',
  '400': '#55C2A7',
  '500': '#3DA88E',
  '600': '#2D8A74',
  '700': '#246E5D',
  '800': '#1E584A',
};

/* ── BreathingCircle ──────────────────────────────────────────── */
function BreathingCircle({
  inhale,
  hold1,
  exhale,
  hold2,
  color,
  label,
}: {
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  color: string;
  label: string;
}) {
  const total = inhale + hold1 + exhale + hold2;
  const p1 = inhale / total;
  const p2 = (inhale + hold1) / total;
  const p3 = (inhale + hold1 + exhale) / total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '130px', height: '130px' }}>
        <style>{`
          @keyframes bc-outer {
            0%, 100% { transform: scale(0.82); }
            ${p1 * 100}% { transform: scale(1.0); }
            ${p2 * 100}% { transform: scale(1.0); }
            ${p3 * 100}% { transform: scale(0.82); }
          }
          @keyframes bc-mid {
            0%, 100% { transform: scale(0.78); }
            ${p1 * 100}% { transform: scale(1.0); }
            ${p2 * 100}% { transform: scale(1.0); }
            ${p3 * 100}% { transform: scale(0.78); }
          }
          @keyframes bc-inner {
            0%, 100% { transform: scale(0.72); }
            ${p1 * 100}% { transform: scale(1.0); }
            ${p2 * 100}% { transform: scale(1.0); }
            ${p3 * 100}% { transform: scale(0.72); }
          }
          @keyframes bc-label {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
        `}</style>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--radius-full)',
            background: color,
            opacity: 0.2,
            animation: `bc-outer ${total}s ease-in-out infinite`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '14px',
            borderRadius: 'var(--radius-full)',
            background: color,
            opacity: 0.35,
            animation: `bc-mid ${total}s ease-in-out infinite`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '28px',
            borderRadius: 'var(--radius-full)',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `bc-inner ${total}s ease-in-out infinite`,
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 1.3,
              animation: `bc-label ${total}s ease-in-out infinite`,
            }}
          >
            {label}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '220px',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        <span style={{ textAlign: 'center', lineHeight: 1.3 }}>
          Inhale<br />{inhale}s
        </span>
        <span style={{ textAlign: 'center', lineHeight: 1.3 }}>
          Hold<br />{hold1}s
        </span>
        <span style={{ textAlign: 'center', lineHeight: 1.3 }}>
          Exhale<br />{exhale}s
        </span>
        {hold2 > 0 && (
          <span style={{ textAlign: 'center', lineHeight: 1.3 }}>
            Hold<br />{hold2}s
          </span>
        )}
      </div>
    </div>
  );
}

/* ── StepItem ─────────────────────────────────────────────────── */
function StepItem({
  num,
  children,
  bg,
}: {
  num?: number;
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: 'var(--text-base)',
        color: 'var(--color-text-primary)',
        lineHeight: 'var(--line-height-normal)',
      }}
    >
      {num !== undefined && (
        <span
          style={{
            width: '26px',
            height: '26px',
            borderRadius: 'var(--radius-full)',
            background: bg || teal['200'],
            color: teal['800'],
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {num}
        </span>
      )}
      <span>{children}</span>
    </li>
  );
}

/* ── Exercise 1: 5-4-3-2-1 ────────────────────────────────────── */
function Exercise54321() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        This exercise uses all five senses to bring your awareness back to the present moment. Take your time with each step.
      </p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0 }}>
        <StepItem num={1} bg={teal['200']}>
          Look around and name <strong>5 things you can see</strong>. Say them quietly or in your head. Notice colors, shapes, textures.
        </StepItem>
        <StepItem num={2} bg={teal['200']}>
          Notice <strong>4 things you can feel</strong> &mdash; the fabric of your clothes, your feet on the floor, the air on your skin.
        </StepItem>
        <StepItem num={3} bg={teal['300']}>
          Listen for <strong>3 things you can hear</strong>. Even tiny sounds count &mdash; a distant hum, your own breath, the rustle of fabric.
        </StepItem>
        <StepItem num={4} bg={teal['300']}>
          Find <strong>2 things you can smell</strong>. If you cannot smell anything right now, think of two scents you enjoy.
        </StepItem>
        <StepItem num={5} bg={teal['400']}>
          Notice <strong>1 thing you can taste</strong>. Take a sip of water, or notice the taste already in your mouth.
        </StepItem>
      </ul>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', lineHeight: 'var(--line-height-normal)' }}>
        When you are finished, take one more deep breath. You are here, now. You are safe.
      </p>
    </div>
  );
}

/* ── Exercise 2: Box Breathing ────────────────────────────────── */
function ExerciseBoxBreathing() {
  const [variant, setVariant] = useState<'4-4-4-4' | '4-4-6'>('4-4-4-4');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', textAlign: 'center' }}>
        Follow the circle with your breath. Let it set the pace &mdash; there is no rush.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: teal['50'],
          borderRadius: 'var(--radius-full)',
          padding: '4px',
        }}
      >
        <button
          onClick={() => setVariant('4-4-4-4')}
          aria-label="Box breathing: 4-4-4-4"
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: variant === '4-4-4-4' ? teal['500'] : 'transparent',
            color: variant === '4-4-4-4' ? '#FFFFFF' : teal['700'],
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background var(--duration-normal) var(--ease-default), color var(--duration-normal) var(--ease-default)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          4-4-4-4
        </button>
        <button
          onClick={() => setVariant('4-4-6')}
          aria-label="Extended exhale breathing: 4-4-6"
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: variant === '4-4-6' ? teal['500'] : 'transparent',
            color: variant === '4-4-6' ? '#FFFFFF' : teal['700'],
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background var(--duration-normal) var(--ease-default), color var(--duration-normal) var(--ease-default)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          4-4-6
        </button>
      </div>

      {variant === '4-4-4-4' ? (
        <BreathingCircle inhale={4} hold1={4} exhale={4} hold2={4} color={teal['500']} label="Breathe in..." />
      ) : (
        <BreathingCircle inhale={4} hold1={4} exhale={6} hold2={0} color={teal['500']} label="Breathe in..." />
      )}

      <div style={{ background: teal['50'], borderRadius: 'var(--radius-lg)', padding: '16px', width: '100%' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: teal['700'], lineHeight: 'var(--line-height-normal)', margin: 0 }}>
          <strong>How it works:</strong> Box breathing helps your nervous system settle by giving it a steady, predictable rhythm.
          {variant === '4-4-6' && ' The longer exhale activates your body\u2019s relaxation response more deeply.'}
          {' '}Repeat for 3\u20135 rounds or as long as feels right.
        </p>
      </div>
    </div>
  );
}

/* ── Exercise 3: Butterfly Hug ────────────────────────────────── */
function ExerciseButterflyHug() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        The butterfly hug is a self-soothing technique that uses bilateral stimulation &mdash; gentle, alternating tapping &mdash; to help your nervous system settle.
      </p>

      {/* Visual illustration */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <div style={{ width: '120px', height: '140px', position: 'relative' }}>
          <div
            style={{
              width: '60px',
              height: '90px',
              borderRadius: '30px 30px 20px 20px',
              background: teal['100'],
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                background: teal['200'],
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
            <div style={{ position: 'absolute', top: '16px', left: '-14px', width: '88px', height: '50px' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '36px',
                  height: '44px',
                  borderRadius: '50% 50% 30% 50%',
                  background: teal['300'],
                  opacity: 0.7,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  width: '36px',
                  height: '44px',
                  borderRadius: '50% 50% 50% 30%',
                  background: teal['300'],
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0 }}>
        <StepItem num={1} bg={teal['200']}>
          Cross your arms over your chest so your fingertips rest just below your collarbone &mdash; left hand on right shoulder area, right hand on left.
        </StepItem>
        <StepItem num={2} bg={teal['200']}>
          Begin <strong>tapping gently and slowly</strong>, alternating left and right &mdash; like the wings of a butterfly.
        </StepItem>
        <StepItem num={3} bg={teal['300']}>
          Breathe slowly and deeply as you tap. You might close your eyes or soften your gaze.
        </StepItem>
        <StepItem num={4} bg={teal['300']}>
          While tapping, you might bring to mind a safe image, a calming memory, or simply notice the rhythm of the taps.
        </StepItem>
        <StepItem num={5} bg={teal['400']}>
          Continue for 1&ndash;2 minutes, or until you notice your body beginning to settle. There is no rush.
        </StepItem>
      </ul>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', lineHeight: 'var(--line-height-normal)' }}>
        Some people find it helpful to hum a gentle tune or repeat a comforting phrase while tapping. Do what feels right for you.
      </p>
    </div>
  );
}

/* ── Exercise 4: PMR ──────────────────────────────────────────── */
function ExercisePMR() {
  const groups = [
    { name: 'Feet & toes', instruction: 'Curl your toes tightly and press your feet into the floor. Hold the tension for 5 seconds... then release. Feel the warmth and heaviness as your feet relax.' },
    { name: 'Calves & shins', instruction: 'Point your toes toward your knees, tightening your calves. Hold... and release. Let your lower legs feel heavy and soft.' },
    { name: 'Thighs', instruction: 'Squeeze your thigh muscles tight, pressing your knees together. Hold for 5 seconds... and let go. Notice the difference between tension and relaxation.' },
    { name: 'Stomach & core', instruction: 'Tighten your stomach muscles as if bracing for a gentle tap. Hold... then release. Let your belly soften with each breath.' },
    { name: 'Chest & back', instruction: 'Take a deep breath in, pulling your shoulders back gently and expanding your chest. Hold for a moment... exhale and let everything soften.' },
    { name: 'Hands & forearms', instruction: 'Make tight fists and curl your wrists inward. Feel the tension in your hands and forearms. Hold... release. Shake out your hands gently if you like.' },
    { name: 'Shoulders', instruction: 'Hunch your shoulders up toward your ears as high as they go. Hold the squeeze... then let them drop completely. Feel the release.' },
    { name: 'Neck & jaw', instruction: 'Gently tilt your head forward, pressing your chin toward your chest. At the same time, clench your jaw lightly. Hold... release. Roll your head gently side to side.' },
    { name: 'Face', instruction: 'Scrunch up your entire face &mdash; squeeze your eyes shut, purse your lips, furrow your brow. Hold... and then let it all go. Feel your face soften.' },
    { name: 'Whole body', instruction: 'Take one more deep breath and tense your entire body for 5 seconds &mdash; everything at once. Then exhale fully and let everything go. Rest in the stillness for a moment.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        Progressive muscle relaxation helps you notice the difference between tension and relaxation in your body. Work through each group slowly, at your own pace.
      </p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, margin: 0 }}>
        {groups.map((g, i) => (
          <li
            key={i}
            style={{
              background: teal['50'],
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--line-height-normal)',
              borderLeft: `3px solid ${teal['300']}`,
            }}
          >
            <strong style={{ color: teal['700'] }}>{g.name}</strong>
            <span style={{ color: 'var(--color-text-secondary)' }}> &mdash; {g.instruction}</span>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', lineHeight: 'var(--line-height-normal)' }}>
        Take as long as you need with each muscle group. Some people find it helps to repeat an area that feels especially tight.
      </p>
    </div>
  );
}

/* ── Exercise 5: Body Scan ────────────────────────────────────── */
function ExerciseBodyScan() {
  const bodyParts = [
    { part: 'Feet', guidance: 'Bring your attention to your feet. Notice any sensations &mdash; warmth, coolness, tingling, pressure against the floor. There is nothing to change. Just notice.' },
    { part: 'Ankles & lower legs', guidance: 'Move your awareness slowly upward to your ankles, your shins, your calves. Feel the weight of your legs resting. Notice any tension or ease.' },
    { part: 'Knees & thighs', guidance: 'Let your attention rest on your knees, then your thighs. Feel the contact with the chair or surface beneath you. Notice the temperature of your skin.' },
    { part: 'Hips & pelvis', guidance: 'Bring awareness to your hips and pelvic area. Feel the gentle rise and fall with each breath. Notice any holding or softening here.' },
    { part: 'Lower back & belly', guidance: 'Move to your lower back and belly. Notice the movement of your belly as you breathe &mdash; rising on the inhale, softening on the exhale.' },
    { part: 'Chest & upper back', guidance: 'Bring awareness to your chest and upper back. Feel your ribcage expanding and contracting. Notice your heartbeat &mdash; steady, reliable, keeping you alive.' },
    { part: 'Shoulders', guidance: 'Notice your shoulders. Are they lifted or dropped? Tense or soft? There is nothing to fix. Just let them be as they are, and notice.' },
    { part: 'Arms & hands', guidance: 'Move down both arms to your elbows, forearms, wrists, hands, and fingertips. Feel the air on your skin. Notice any tingling, warmth, or stillness.' },
    { part: 'Neck & throat', guidance: 'Bring gentle awareness to your neck and throat. Notice any tightness or ease. Let your throat soften &mdash; you do not need to speak or do anything right now.' },
    { part: 'Jaw & face', guidance: 'Notice your jaw &mdash; is it clenched or relaxed? Let it soften. Feel your cheeks, your eyes, your forehead. Let the muscles around your eyes grow heavy and soft.' },
    { part: 'Top of head', guidance: 'Finally, bring awareness to the very top of your head. Then expand your awareness to include your whole body &mdash; breathing, resting, alive.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        A body scan invites you to bring gentle, curious awareness to each part of your body &mdash; without judgment, without the need to change anything.
      </p>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        Find a comfortable position &mdash; sitting or lying down. You might close your eyes or soften your gaze. Take a few slow breaths to arrive.
      </p>
      <div
        style={{
          background: teal['50'],
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          border: `1px solid ${teal['200']}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {bodyParts.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: teal['600'],
                background: teal['100'],
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
                flexShrink: 0,
                minWidth: '26px',
                textAlign: 'center',
              }}
            >
              {i + 1}
            </span>
            <div>
              <strong style={{ color: teal['700'], fontSize: 'var(--text-sm)' }}>{item.part}</strong>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', margin: '4px 0 0' }}>
                {item.guidance}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', lineHeight: 'var(--line-height-normal)' }}>
        When you are ready, gently wiggle your fingers and toes. Open your eyes slowly if they were closed. Take a moment before you move on.
      </p>
    </div>
  );
}

/* ── Exercise 6: Safe Place ───────────────────────────────────── */
function ExerciseSafePlace() {
  const sensoryPrompts = [
    { emoji: '\u{1F441}\uFE0F', sense: 'Sight', text: 'What do you see? Soft colors, gentle light, familiar shapes? Picture the details &mdash; the texture of a wall, the way light falls across the floor.' },
    { emoji: '\u{1F442}', sense: 'Sound', text: 'What can you hear in this place? Perhaps gentle wind, birdsong, distant water, or comforting silence. Let those sounds fill your awareness.' },
    { emoji: '\u{1F590}\uFE0F', sense: 'Touch', text: 'What do you feel against your skin? A soft blanket, warm sun, a cool breeze, smooth wood? Notice the textures and temperatures around you.' },
    { emoji: '\u{1F443}', sense: 'Smell', text: 'What scents are present? Fresh air, lavender, coffee, rain, or something else that feels comforting and familiar.' },
    { emoji: '\u2764\uFE0F', sense: 'Feeling', text: 'How does your body feel in this place? Notice any sense of ease, lightness, or calm. Let yourself rest in that feeling for as long as you need.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        This exercise guides you to create a peaceful, safe place in your imagination &mdash; a mental refuge you can return to whenever you need.
      </p>
      <div style={{ background: teal['50'], borderRadius: 'var(--radius-lg)', padding: '16px', borderLeft: `3px solid ${teal['400']}` }}>
        <p style={{ fontSize: 'var(--text-base)', color: teal['700'], lineHeight: 'var(--line-height-normal)', fontWeight: 500, margin: 0 }}>
          {'\u{1F33F}'} <strong>First, find your safe place.</strong> It might be real or imagined &mdash; a beach, a forest, a cozy room, a garden. Somewhere you feel calm and protected. Take a moment to picture it.
        </p>
      </div>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        Now, explore your safe place through each of your senses. Go slowly &mdash; there is no rush.
      </p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0 }}>
        {sensoryPrompts.map((sp, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '12px 14px',
              background: i % 2 === 0 ? teal['50'] : 'transparent',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ fontSize: '22px', flexShrink: 0 }}>{sp.emoji}</span>
            <div>
              <strong style={{ fontSize: 'var(--text-sm)', color: teal['700'] }}>{sp.sense}</strong>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)', margin: '4px 0 0' }}>
                {sp.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', lineHeight: 'var(--line-height-normal)' }}>
        You can return to this place anytime &mdash; it belongs to you. The more you visit, the easier it becomes to find your way back.
      </p>
    </div>
  );
}

/* ── Exercise 7: Cold Water ───────────────────────────────────── */
function ExerciseColdWater() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        Cold water can help activate your body&apos;s calming response and bring you back to the present moment. This is a simple, gentle technique.
      </p>
      <div style={{ background: teal['50'], borderRadius: 'var(--radius-lg)', padding: '16px', borderLeft: `3px solid ${teal['400']}` }}>
        <p style={{ fontSize: 'var(--text-base)', color: teal['700'], lineHeight: 'var(--line-height-relaxed)', fontWeight: 500, margin: 0 }}>
          {'\u{1F499}'} <strong>Important:</strong> Use cool water &mdash; not painfully cold. If you do not have access to water, holding something cool (like a smooth stone or a cold glass) can also work.
        </p>
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0 }}>
        <StepItem num={1} bg={teal['200']}>
          Go to a sink. Turn on the cold water and let it run for a moment.
        </StepItem>
        <StepItem num={2} bg={teal['200']}>
          Cup your hands and <strong>splash cool water gently on your face</strong>. Notice the sensation &mdash; the temperature, the wetness, the way it feels on your cheeks, your forehead.
        </StepItem>
        <StepItem num={3} bg={teal['300']}>
          You can also <strong>run cool water over your wrists</strong> &mdash; this area has many blood vessels close to the skin, so it can feel especially grounding.
        </StepItem>
        <StepItem num={4} bg={teal['300']}>
          As the water touches your skin, <strong>describe the sensation to yourself</strong>. &ldquo;This feels cool. It is wet. I can feel it on my skin.&rdquo; Simple, factual observations.
        </StepItem>
        <StepItem num={5} bg={teal['400']}>
          Take a few slow, deep breaths while you feel the coolness. Stay with the sensation for as long as it feels grounding.
        </StepItem>
      </ul>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', lineHeight: 'var(--line-height-normal)' }}>
        When you are ready, gently pat your face dry with a soft towel. Notice if anything feels different now compared to a few moments ago.
      </p>
    </div>
  );
}

/* ── Exercise 8: 5 Finger Breathing ───────────────────────────── */
function ExerciseFingerBreathing() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
        This simple exercise combines breath with gentle touch. Use one hand to trace the outline of your other hand, breathing in as you go up each finger and out as you go down.
      </p>

      {/* Visual illustration */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
        <div style={{ position: 'relative', width: '160px', height: '170px' }}>
          <svg
            viewBox="0 0 160 200"
            width="160"
            height="170"
            style={{ overflow: 'visible' }}
          >
            <rect x="50" y="80" width="60" height="80" rx="10" fill={teal['100']} stroke={teal['300']} strokeWidth="2" />
            <path d="M50 120 Q30 130 35 150 Q40 160 50 155" fill={teal['100']} stroke={teal['300']} strokeWidth="2" />
            <rect x="55" y="40" width="14" height="45" rx="7" fill={teal['100']} stroke={teal['300']} strokeWidth="2" />
            <rect x="73" y="28" width="14" height="57" rx="7" fill={teal['100']} stroke={teal['300']} strokeWidth="2" />
            <rect x="91" y="38" width="14" height="47" rx="7" fill={teal['100']} stroke={teal['300']} strokeWidth="2" />
            <rect x="109" y="58" width="12" height="27" rx="6" fill={teal['100']} stroke={teal['300']} strokeWidth="2" />
          </svg>

          {/* Labels positioned absolutely */}
          {[
            { top: '10px', left: '28px' },
            { top: '82px', left: '28px' },
            { top: '4px', left: '44px' },
            { top: '88px', left: '43px' },
            { top: '10px', left: '62px' },
            { top: '82px', left: '62px' },
            { top: '20px', left: '80px' },
            { top: '78px', left: '80px' },
            { top: '40px', left: '106px' },
            { top: '78px', left: '106px' },
          ].map((pos, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                fontSize: '9px',
                fontWeight: 600,
                color: teal['600'],
              }}
            >
              {i % 2 === 0 ? '\u2191 in' : '\u2193 out'}
            </span>
          ))}
          <span
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              fontWeight: 500,
              color: teal['600'],
              whiteSpace: 'nowrap',
            }}
          >
            Trace with your other hand
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: '-22px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '9px',
              color: teal['400'],
              whiteSpace: 'nowrap',
            }}
          >
            {'Inhale \u2191  \u00B7  Exhale \u2193'}
          </span>
        </div>
      </div>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0 }}>
        <StepItem num={1} bg={teal['200']}>
          Hold one hand out in front of you, fingers spread gently. With the index finger of your other hand, place it at the base of your thumb on the outside edge.
        </StepItem>
        <StepItem num={2} bg={teal['200']}>
          Slowly trace up the outside of your thumb as you <strong>inhale</strong>. Pause at the tip.
        </StepItem>
        <StepItem num={3} bg={teal['300']}>
          Trace down the inside of your thumb as you <strong>exhale</strong>.
        </StepItem>
        <StepItem num={4} bg={teal['300']}>
          Continue with each finger: <strong>inhale going up</strong> the outside, <strong>exhale going down</strong> the inside. Go as slowly as feels comfortable.
        </StepItem>
        <StepItem num={5} bg={teal['400']}>
          After tracing all five fingers, pause and notice how you feel. You might switch hands and repeat if you would like.
        </StepItem>
      </ul>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', fontStyle: 'italic', lineHeight: 'var(--line-height-normal)' }}>
        This exercise takes about one minute. You can do it anywhere, anytime &mdash; it is discreet and always available.
      </p>
    </div>
  );
}

/* ── Main Grounding component ─────────────────────────────────── */
export default function Grounding() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const renderExerciseContent = (id: string) => {
    switch (id) {
      case '54321': return <Exercise54321 />;
      case 'box-breathing': return <ExerciseBoxBreathing />;
      case 'butterfly-hug': return <ExerciseButterflyHug />;
      case 'pmr': return <ExercisePMR />;
      case 'body-scan': return <ExerciseBodyScan />;
      case 'safe-place': return <ExerciseSafePlace />;
      case 'cold-water': return <ExerciseColdWater />;
      case 'finger-breathing': return <ExerciseFingerBreathing />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <div style={{ padding: '28px 24px 16px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--letter-spacing-tight)' }}>
          {'\u{1F331}'} Grounding Library
        </h1>
        <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', marginTop: '6px' }}>
          A peaceful collection of grounding exercises. Explore at your own pace &mdash; there is no wrong way to be here.
        </p>
      </div>

      {/* Exercise cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 24px', flex: 1, paddingBottom: '80px' }}>
        {exercises.map((ex) => {
          const isExpanded = expandedId === ex.id;

          return (
            <div
              key={ex.id}
              style={{
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-card)',
                boxShadow: isExpanded ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
                overflow: 'hidden',
                transition: 'box-shadow var(--duration-normal) var(--ease-default)',
              }}
            >
              {/* Card header */}
              <button
                onClick={() => toggleExpanded(ex.id)}
                aria-expanded={isExpanded}
                aria-label={`${ex.title}: ${ex.description}${isExpanded ? ' \u2014 expanded' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  minHeight: 'var(--touch-comfortable)',
                  padding: '16px 18px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-body)',
                  textAlign: 'left' as const,
                  WebkitTapHighlightColor: 'transparent',
                  outline: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '28px',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isExpanded ? teal['100'] : teal['50'],
                    borderRadius: 'var(--radius-md)',
                    transition: 'background var(--duration-normal) var(--ease-default)',
                  }}
                >
                  {ex.emoji}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-md)',
                      fontWeight: 600,
                      color: isExpanded ? teal['700'] : 'var(--color-text-primary)',
                      lineHeight: 'var(--line-height-tight)',
                      margin: 0,
                      transition: 'color var(--duration-normal) var(--ease-default)',
                    }}
                  >
                    {ex.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)', margin: '4px 0 0' }}>
                    {ex.description}
                  </p>
                </div>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="20"
                  height="20"
                  style={{
                    flexShrink: 0,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform var(--duration-normal) var(--ease-out)',
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  style={{
                    padding: '0 18px 20px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    paddingTop: '16px',
                    animation: 'gfade var(--duration-normal) var(--ease-out)',
                  }}
                >
                  {renderExerciseContent(ex.id)}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ minHeight: '8px' }} />
      </div>

      <style>{`
        @keyframes gfade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes gfade {
            from { opacity: 1; }
            to   { opacity: 1; }
          }
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <BottomNav />
    </div>
  );
}
