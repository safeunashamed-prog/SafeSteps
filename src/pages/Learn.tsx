import { useState, useCallback, useMemo } from 'react';
import BottomNav from '../components/BottomNav';

/* ── Article definitions ──────────────────────────────────────── */
interface Article {
  id: string;
  emoji: string;
  title: string;
  teaser: string;
  content: string;
}

const articles: Article[] = [
  {
    id: 'hypervigilance',
    emoji: '🔍',
    title: 'Why am I always on edge?',
    teaser: 'Your nervous system learned to scan for danger — and it hasn\'t unlearned it yet.',
    content: `When you've been through trauma, your nervous system adapts to keep you alive. It learns that danger can come from anywhere, at any time — so it stays on high alert. This is called hypervigilance, and it's not a flaw in you. It's a survival skill that worked.

You might notice it as constantly scanning rooms for exits, reading people's facial expressions for any sign of threat, or feeling your body tense up in crowded spaces. Your heart might race before you even know why. This is your brain doing exactly what it was trained to do.

The exhausting part is that your nervous system doesn't automatically know the danger has passed. It keeps running the same protective program, even in moments that are objectively safe. A raised voice, a sudden movement, or even silence can trigger that old alarm.

This isn't something you're doing wrong. It's your body remembering what it learned the hard way. With time and gentle practice — grounding, breathing, noticing safety cues — you can help your nervous system update its threat assessment. But until then, please know: being on edge doesn't mean you're broken. It means you survived.`,
  },
  {
    id: 'fawn',
    emoji: '🤝',
    title: 'Why do I people-please?',
    teaser: 'Agreeing and placating to avoid conflict — because conflict once meant danger.',
    content: `The fawn response is one of the most misunderstood trauma responses. It looks like being agreeable, helpful, or even selfless — but underneath, it's a deeply ingrained survival strategy. When pleasing others once kept you safe, your brain learned that your safety depended on managing other people's emotions.

You might find yourself automatically saying "yes" when you want to say "no," smoothing over conflicts that aren't yours to fix, or losing track of what you actually want because you're so focused on what others need. It can feel like you don't even have a self separate from what others expect of you.

This response developed because, at some point, disagreement or asserting your own needs came with real consequences. Maybe it meant punishment, withdrawal of care, or an escalation you learned to fear. Your nervous system encoded a simple rule: keep them happy, stay safe.

Unlearning this takes time. Start small — notice when you're about to agree automatically and pause. Ask yourself: "What do I actually want right now?" You don't have to act on it yet. Just noticing is enough to begin rebuilding your own internal compass. You are allowed to take up space. You are allowed to have needs.`,
  },
  {
    id: 'freeze',
    emoji: '🧊',
    title: 'Why do I freeze?',
    teaser: 'Like an animal playing dead — a survival strategy your body chose when fight or flight weren\'t options.',
    content: `Freezing is one of the most confusing trauma responses because it can look like doing nothing. But freezing is absolutely not nothing. It's an active, biological survival response — your nervous system hitting the emergency brake when fight or flight aren't possible.

In the wild, animals play dead when a predator has them cornered. The freeze response lowers heart rate, dulls pain, and can make a predator lose interest. Your body has this same wiring, and it may have activated during your trauma because fighting back or escaping wasn't safe or possible at the time.

After trauma, the freeze response can show up as feeling stuck, unable to speak, or disconnected from your body when you're stressed. You might go blank in an argument, or feel like you're watching yourself from far away. This isn't weakness — it's a deeply intelligent protective mechanism that your body is still reaching for.

Be gentle with yourself when you notice freezing. It helped you survive. Over time, you can learn to recognize it earlier and use grounding techniques to reconnect: wiggle your toes, feel the texture of something nearby, name three things you can see. Your body learned this to protect you — now it can learn new responses too.`,
  },
  {
    id: 'guilt',
    emoji: '💭',
    title: 'Why do I feel guilty?',
    teaser: 'Abusers shift blame onto survivors — and guilt can become a default feeling even when you\'ve done nothing wrong.',
    content: `Guilt after trauma is incredibly common and incredibly cruel. Many survivors carry a heavy sense that they somehow caused or deserved what happened to them — not because it's true, but because abusers work very hard to make you believe it is.

Abusers often justify their behavior by blaming the person they're hurting. "Look what you made me do." "If you hadn't..." Over time, these messages sink in. Your brain, trying to make sense of the senseless, latches onto the idea that you must have done something wrong — because the alternative (that someone chose to hurt you for no reason) is terrifying.

Guilt can also be a way your brain tries to regain a sense of control. If it was your fault, then maybe you can prevent it from happening again. This is a protective illusion — painful, but it offers a feeling of agency in a situation where you had none.

The truth is: you did not cause your trauma. You were not responsible for someone else's choice to harm you. Guilt is a feeling, not a fact — and feelings can shift with time, compassion, and support. When guilt shows up, try saying to yourself: "This feeling is old. It belongs to the past, not to who I am now."`,
  },
  {
    id: 'trust',
    emoji: '🛡️',
    title: 'Why can\'t I trust people?',
    teaser: 'Betrayal by someone who should have protected you makes trust feel dangerous — it\'s protection, not a flaw.',
    content: `Trust is not a switch you turn on and off. It's built slowly, through repeated experiences of safety and reliability — and it can be shattered in an instant by betrayal. If someone who should have protected you harmed you instead, your brain learned a devastating lesson: the people closest to you can be dangerous.

After that kind of betrayal, distrust is not a character flaw. It's a scar that formed around a wound. Your nervous system now flags intimacy and vulnerability as potential threats, because it has evidence — real, lived evidence — that opening up can lead to being hurt.

You might find yourself keeping people at arm's length, waiting for the other shoe to drop, or looking for signs that someone is going to let you down. You might push people away before they can leave you. These are protective strategies, and they make perfect sense given what you've been through.

Healing trust doesn't mean ignoring your instincts or forcing yourself to be vulnerable before you're ready. It means slowly — at your own pace — letting people earn your trust in small doses. Test the waters gently. Notice who shows up consistently. Your caution is wisdom, not weakness. It protected you once, and it still deserves respect.`,
  },
  {
    id: 'apologizing',
    emoji: '🙇',
    title: 'Why do I apologize constantly?',
    teaser: 'Saying sorry became a safety behavior — a way to de-escalate before things got worse.',
    content: `If you find yourself apologizing for things that aren't your fault — for existing, for taking up space, for having needs — you're not alone. For many survivors, "sorry" became a survival word. It was a way to de-escalate tension, to soften someone's anger, to make yourself small enough to be safe.

In an environment where the wrong word or action could trigger an explosive reaction, apologizing preemptively was a smart strategy. You learned to take the blame before blame was assigned, to smooth things over before they could spiral. It worked — at least enough to keep you safe in the moment.

Now, even when you're not in danger, that reflex may still be running. You apologize when someone bumps into you. You apologize for expressing an opinion. You apologize for things that literally aren't your responsibility. It's an automatic program your brain installed during a time when it needed to.

Becoming aware of this pattern is the first step. When you notice yourself about to say "sorry," pause. Ask yourself: "Did I actually do something wrong?" If not — and usually the answer is no — try replacing "sorry" with "thank you." Instead of "Sorry I'm late," try "Thank you for waiting." It's a small shift that can begin to rewrite an old survival script.`,
  },
  {
    id: 'compliments',
    emoji: '🪞',
    title: 'Why do compliments feel uncomfortable?',
    teaser: 'Being devalued makes kindness feel like a trap — your brain is waiting for the other shoe to drop.',
    content: `If someone says something kind about you and your immediate reaction is discomfort, suspicion, or even a physical flinch — that makes complete sense. When you've been devalued, manipulated, or hurt by people who were supposed to care about you, kindness can feel like a setup.

Your brain learned that nice words sometimes came before something bad. A compliment might have been followed by a demand. Praise might have been a tool of manipulation. Affection might have been withdrawn the moment you relaxed into it. So now, your nervous system treats kindness as a potential warning sign.

On top of that, trauma can distort your self-image. If deep down you believe you're not worthy of kindness (a belief that was likely planted by mistreatment), then receiving a compliment creates a painful gap between how someone sees you and how you see yourself. Your brain rejects the information because it doesn't match.

The next time someone offers you a kind word, try not to deflect it immediately. You don't have to believe it — just let it land. Imagine setting it gently on a shelf instead of batting it away. Over time, you might find that some of those kind words start to feel less threatening, and maybe even a little bit true. You are allowed to receive kindness. You always were.`,
  },
];

/* ── Lilac accent palette (local to Learn) ────────────────────── */
const lilac: Record<string, string> = {
  '50': '#F7F5FA',
  '100': '#EEE9F5',
  '200': '#DDD3EC',
  '300': '#C7B4E0',
  '400': '#AD90D1',
  '500': '#9470BD',
  '600': '#7C56A8',
  '700': '#64428C',
  '800': '#4E336E',
};

/* ── Learn page component ─────────────────────────────────────── */
export default function Learn() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase().trim();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.teaser.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q),
    );
  }, [search]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setExpandedId(null); // collapse any open card when searching
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearch('');
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '28px 24px 0', flexShrink: 0 }}>
        <h1
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
            letterSpacing: 'var(--letter-spacing-tight)',
          }}
        >
          📖 Trauma Education
        </h1>
        <p
          style={{
            fontSize: 'var(--text-md)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
            marginTop: '6px',
          }}
        >
          Gentle answers to questions you might be carrying. Read at your own pace — there is no test and no right way to be here.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ padding: '20px 24px 8px', flexShrink: 0 }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Search icon */}
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
              position: 'absolute',
              left: '16px',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>

          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="What would you like to understand?"
            aria-label="Search trauma education articles"
            style={{
              width: '100%',
              minHeight: 'var(--touch-comfortable)',
              padding: '14px 48px 14px 48px',
              border: `1.5px solid ${search.trim() ? lilac['300'] : 'var(--color-border-subtle)'}`,
              borderRadius: 'var(--radius-button)',
              background: 'var(--color-bg-card)',
              fontSize: 'var(--text-base)',
              fontFamily: 'var(--font-family-body)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              WebkitAppearance: 'none',
              transition: 'border-color var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = lilac['400'];
              e.currentTarget.style.boxShadow = `0 0 0 3px ${lilac['100']}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = search.trim() ? lilac['300'] : 'var(--color-border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          {/* Clear button */}
          {search.trim() && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: lilac['100'],
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                padding: 0,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke={lilac['600']}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="16"
                height="16"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search result count */}
        {search.trim() && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: '8px',
              paddingLeft: '4px',
            }}
          >
            {filteredArticles.length === 0
              ? 'No articles found. Try a different search.'
              : `Showing ${filteredArticles.length} ${filteredArticles.length === 1 ? 'article' : 'articles'}`}
          </p>
        )}
      </div>

      {/* Article cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px 24px',
          flex: 1,
          paddingBottom: '80px',
        }}
      >
        {filteredArticles.map((article) => {
          const isExpanded = expandedId === article.id;

          return (
            <div
              key={article.id}
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
                onClick={() => toggleExpanded(article.id)}
                aria-expanded={isExpanded}
                aria-label={`${article.title}: ${article.teaser}${isExpanded ? ' — expanded' : ''}`}
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
                    background: isExpanded ? lilac['100'] : lilac['50'],
                    borderRadius: 'var(--radius-md)',
                    transition: 'background var(--duration-normal) var(--ease-default)',
                  }}
                >
                  {article.emoji}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-md)',
                      fontWeight: 600,
                      color: isExpanded ? lilac['700'] : 'var(--color-text-primary)',
                      lineHeight: 'var(--line-height-tight)',
                      margin: 0,
                      transition: 'color var(--duration-normal) var(--ease-default)',
                    }}
                  >
                    {article.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--line-height-normal)',
                      margin: '4px 0 0',
                    }}
                  >
                    {article.teaser}
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
                    animation: 'lfade var(--duration-normal) var(--ease-out)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text-primary)',
                      lineHeight: 'var(--line-height-relaxed)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {article.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {filteredArticles.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '40px' }}>📭</span>
            <p
              style={{
                fontSize: 'var(--text-md)',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
              }}
            >
              No articles match your search.
            </p>
            <button
              onClick={clearSearch}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-button)',
                border: `1.5px solid ${lilac['200']}`,
                background: lilac['50'],
                color: lilac['700'],
                fontSize: 'var(--text-base)',
                fontFamily: 'var(--font-family-body)',
                fontWeight: 500,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Clear search
            </button>
          </div>
        )}

        <div style={{ minHeight: '8px' }} />
      </div>

      <style>{`
        @keyframes lfade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes lfade {
            from { opacity: 1; }
            to   { opacity: 1; }
          }
        }
      `}</style>

      <BottomNav />
    </div>
  );
}
