import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Help from './Help';
import {
  loadProfileInfo,
  saveProfileInfo,
  loadContacts,
  saveContacts,
  type EmergencyContact,
  loadPinRecord,
  setPin,
  verifyPin,
  disablePin,
  resetPin,
  pinEnabled,
  lockNow,
  unlock,
  getLocked,
  subscribeLock,
  getBiometricRecord,
  isBiometricAvailable,
  enrollBiometric,
  verifyBiometric,
  clearBiometric,
} from '../lib/privacy';

/* ═══════════════════════════════════════════════════════════════
   Profile & Settings — Profile info, Privacy & Safety (PIN lock),
   and Emergency contacts. Everything here is device-local.
   ═══════════════════════════════════════════════════════════════ */

/* ── Toast (matches CheckIn's pattern) ────────────────────────── */

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
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  );
}

/* ── Shared primitives: card, field, buttons, sheet ──────────── */

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-bg-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 600,
        color: 'var(--color-text-primary)',
        lineHeight: 'var(--line-height-tight)',
      }}
    >
      {children}
    </div>
  );
}

function CardNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 'var(--text-base)',
        color: 'var(--color-text-secondary)',
        margin: '4px 0 0',
        lineHeight: 'var(--line-height-relaxed)',
      }}
    >
      {children}
    </p>
  );
}

const inputFieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 'var(--touch-min)',
  padding: '12px 16px',
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

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
  autoComplete?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputFieldStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-sage-400)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
        }}
      />
    </div>
  );
}

type ButtonVariant = 'primary' | 'sage' | 'warm' | 'ghost' | 'danger';

const BUTTON_VARIANTS: Record<ButtonVariant, { bg: string; text: string; hover: string }> = {
  primary: { bg: 'var(--color-pink-500)', text: '#FFFFFF', hover: 'var(--color-pink-600)' },
  sage: { bg: 'var(--color-sage-500)', text: '#FFFFFF', hover: 'var(--color-sage-600)' },
  warm: { bg: 'var(--color-cream-200)', text: 'var(--color-neutral-800)', hover: 'var(--color-cream-300)' },
  ghost: { bg: 'transparent', text: 'var(--color-blue-600)', hover: 'var(--color-blue-50)' },
  danger: { bg: 'var(--color-pink-100)', text: 'var(--color-pink-700)', hover: 'var(--color-pink-200)' },
};

function ActionButton({
  variant = 'primary',
  onClick,
  disabled,
  children,
  style,
  ariaLabel,
}: {
  variant?: ButtonVariant;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const v = BUTTON_VARIANTS[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
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
        background: disabled ? 'var(--color-neutral-200)' : v.bg,
        color: disabled ? 'var(--color-text-tertiary)' : v.text,
        fontSize: 'var(--text-md)',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'var(--transition-color)',
        boxShadow: disabled ? 'none' : 'var(--shadow-button)',
        fontFamily: 'var(--font-family-body)',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Bottom sheet container — the established "gentle modal" on mobile. */
function BottomSheet({
  onCancel,
  children,
}: {
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        // neutral-800 at a deeper tint than --color-bg-overlay — calm, never harsh
        background: 'rgba(74, 68, 57, 0.42)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--color-bg-primary)',
          borderTopLeftRadius: 'var(--radius-2xl)',
          borderTopRightRadius: 'var(--radius-2xl)',
          padding: '24px 24px calc(28px + env(safe-area-inset-bottom))',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PIN pad — dots + hidden numeric input, used by the gate and
   by the profile PIN flows. mode="verify" auto-submits when the
   entered length matches; mode="set" uses a Continue button
   (4–6 digits).
   ═══════════════════════════════════════════════════════════════ */

function PinPad({
  title,
  subtitle,
  mode,
  length,
  busy = false,
  submitLabel = 'Continue',
  onSubmit,
  onCancel,
}: {
  title: string;
  subtitle?: string;
  mode: 'set' | 'verify';
  length?: number;
  busy?: boolean;
  submitLabel?: string;
  onSubmit: (pin: string) => Promise<boolean> | void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const slotCount = mode === 'verify' ? length ?? 4 : 6;
  const canContinue = mode === 'set' && value.length >= 4 && !busy;

  const submit = useCallback(async () => {
    if (busy || value.length === 0) return;
    if (mode === 'verify' && value.length !== length) return;
    if (mode === 'set' && (value.length < 4 || value.length > 6)) return;
    const result = await onSubmit(value);
    if (result === false) {
      setError(
        mode === 'verify'
          ? "That doesn't match. Take a breath and try again."
          : "Those didn't match. Let's try once more.",
      );
      setValue('');
      inputRef.current?.focus();
    }
  }, [busy, value, mode, length, onSubmit]);

  // Verify mode: submit as soon as the right number of digits is entered.
  useEffect(() => {
    if (mode !== 'verify' || !length || value.length !== length || value.length === 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await onSubmit(value);
      if (!cancelled && result === false) {
        setError("That doesn't match. Take a breath and try again.");
        setValue('');
        inputRef.current?.focus();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, mode, length, onSubmit]);

  const handleChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 6);
      setValue(digits);
      if (error) setError(null);
    },
    [error],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-relaxed)',
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Dots row (tap to focus the hidden input) */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
          padding: '6px 0',
          cursor: 'text',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', minHeight: '18px' }}>
          {Array.from({ length: slotCount }).map((_, i) => (
            <span
              key={i}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: 'var(--radius-full)',
                background: i < value.length ? 'var(--color-sage-600)' : 'var(--color-neutral-300)',
                transition: 'background var(--duration-fast) var(--ease-out)',
              }}
            />
          ))}
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={6}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
          aria-label={title}
          style={{
            position: 'fixed',
            left: -9999,
            top: -9999,
            width: '1px',
            height: '1px',
            opacity: 0,
          }}
        />
      </div>

      {error && (
        <p
          role="alert"
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-feedback-error)',
            margin: 0,
            lineHeight: 'var(--line-height-relaxed)',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}

      {mode === 'set' ? (
        <ActionButton variant="sage" onClick={() => void submit()} disabled={!canContinue}>
          {busy ? 'Working…' : submitLabel}
        </ActionButton>
      ) : (
        busy && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
              Checking…
            </span>
          </div>
        )
      )}

      {onCancel && (
        <ActionButton variant="ghost" onClick={onCancel}>
          Cancel
        </ActionButton>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PIN flow sheets — set (2 steps), verify current (change/disable)
   ═══════════════════════════════════════════════════════════════ */

/** Two-step sheet: choose a new PIN, then confirm it. */
function SetPinSheet({
  onDone,
  onCancel,
}: {
  onDone: (pin: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [first, setFirst] = useState('');

  const handleFirst = useCallback(async (pin: string): Promise<boolean> => {
    setFirst(pin);
    setStep(2);
    return true;
  }, []);

  const handleConfirm = useCallback(
    async (pin: string): Promise<boolean> => {
      if (pin !== first) return false;
      onDone(pin);
      return true;
    },
    [first, onDone],
  );

  return (
    <BottomSheet onCancel={onCancel}>
      {step === 1 ? (
        <PinPad
          mode="set"
          title="Choose a PIN"
          subtitle="4 to 6 digits. Something easy to remember, hard for others to guess."
          submitLabel="Continue"
          onSubmit={handleFirst}
          onCancel={onCancel}
        />
      ) : (
        <PinPad
          mode="verify"
          length={first.length}
          title="Confirm your PIN"
          subtitle="Enter it once more, so we know it's the one you meant."
          onSubmit={handleConfirm}
          onCancel={onCancel}
        />
      )}
    </BottomSheet>
  );
}

/** One-step sheet that asks for the current PIN before an action. */
function VerifyCurrentSheet({
  title,
  subtitle,
  onVerified,
  onCancel,
}: {
  title: string;
  subtitle: string;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const record = loadPinRecord();

  const handle = useCallback(
    async (pin: string): Promise<boolean> => {
      setBusy(true);
      const ok = await verifyPin(pin);
      setBusy(false);
      if (ok) onVerified();
      return ok;
    },
    [onVerified],
  );

  return (
    <BottomSheet onCancel={onCancel}>
      <PinPad
        mode="verify"
        length={record?.length ?? 4}
        title={title}
        subtitle={subtitle}
        onSubmit={handle}
        onCancel={onCancel}
        busy={busy}
      />
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Contact sheet — add / edit an emergency contact
   ═══════════════════════════════════════════════════════════════ */

function ContactSheet({
  initial,
  onSave,
  onCancel,
}: {
  initial: EmergencyContact | null;
  onSave: (data: Omit<EmergencyContact, 'id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [relationship, setRelationship] = useState(initial?.relationship ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const canSave = name.trim().length > 0;

  const handleSave = useCallback(() => {
    onSave({ name: name.trim(), relationship: relationship.trim(), phone: phone.trim() });
  }, [name, relationship, phone, onSave]);

  return (
    <BottomSheet onCancel={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <CardTitle>{initial ? 'Edit contact' : 'Add a contact'}</CardTitle>
          <CardNote>Just for you — SafeSteps never reaches out to them.</CardNote>
        </div>
        <Field
          id="contact-name"
          label="Name"
          value={name}
          onChange={setName}
          placeholder="What should we call them?"
          autoComplete="off"
        />
        <Field
          id="contact-relationship"
          label="Relationship"
          value={relationship}
          onChange={setRelationship}
          placeholder="Friend, therapist, family member…"
          autoComplete="off"
        />
        <Field
          id="contact-phone"
          label="Phone (optional)"
          value={phone}
          onChange={setPhone}
          placeholder="Their number, if you'd like it here"
          inputMode="tel"
          autoComplete="off"
        />
        <ActionButton variant="sage" onClick={handleSave} disabled={!canSave}>
          Save contact
        </ActionButton>
        <ActionButton variant="ghost" onClick={onCancel}>
          Cancel
        </ActionButton>
      </div>
    </BottomSheet>
  );
}

/** Gentle confirmation sheet (used for removing a contact). */
function ConfirmSheet({
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <BottomSheet onCancel={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardNote>{body}</CardNote>
        </div>
        <ActionButton variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </ActionButton>
        <ActionButton variant="warm" onClick={onCancel}>
          {cancelLabel}
        </ActionButton>
      </div>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PinGate — the app-wide privacy lock.

   Wraps the whole route tree (see App.tsx). When the PIN is
   enabled and the app is locked, it renders an opaque full-screen
   gate instead of the app, so nothing behind it is visible or
   reachable. "Help Me Right Now" opens on top of the gate — help
   stays one tap away without ever bypassing the PIN.
   ═══════════════════════════════════════════════════════════════ */

export function PinGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(getLocked);
  const [helpOpen, setHelpOpen] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [gateBusy, setGateBusy] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => subscribeLock(setLocked), []);

  // Safety net: if a record stops being enabled while locked (e.g. it was
  // cleared elsewhere), don't trap the user behind a gate with no PIN.
  useEffect(() => {
    if (locked && pinEnabled() === false) unlock();
  }, [locked]);

  const record = loadPinRecord();
  const bioEnrolled = getBiometricRecord() !== null;

  const handleUnlockSubmit = useCallback(async (pin: string): Promise<boolean> => {
    setGateBusy(true);
    const ok = await verifyPin(pin);
    setGateBusy(false);
    if (ok) unlock();
    return ok;
  }, []);

  const handleBiometricUnlock = useCallback(async () => {
    setBioBusy(true);
    const ok = await verifyBiometric();
    setBioBusy(false);
    if (ok) unlock();
  }, []);

  const handleForgotReset = useCallback(() => {
    resetPin();
    unlock();
  }, []);

  if (!locked) return <>{children}</>;

  return (
    <>
      {/* ── The gate ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-tooltip)',
          background: 'var(--color-bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 24px calc(32px + env(safe-area-inset-bottom))',
          overflowY: 'auto',
        }}
      >
        <div style={{ flex: 1 }} />

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '40px', lineHeight: 1 }}>🌿</span>
        </div>

        {forgot ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
              maxWidth: 480,
              padding: '24px 20px',
              borderRadius: 'var(--radius-card)',
              background: 'var(--color-bg-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <CardTitle>Reset your PIN?</CardTitle>
              <CardNote>
                Resetting your PIN will unlock the app and let you set a new one whenever
                you're ready. Everything you've saved stays on this device.
              </CardNote>
            </div>
            <ActionButton variant="warm" onClick={handleForgotReset}>
              Reset my PIN
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => setForgot(false)}>
              Keep trying my PIN
            </ActionButton>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 480 }}>
            <PinPad
              mode="verify"
              length={record?.length ?? 4}
              title="SafeSteps is locked"
              subtitle="Enter your PIN to open your space."
              onSubmit={handleUnlockSubmit}
              busy={gateBusy}
            />
          </div>
        )}

        {!forgot && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: 'center',
              marginTop: '20px',
            }}
          >
            {bioEnrolled && (
              <button
                onClick={() => void handleBiometricUnlock()}
                disabled={bioBusy}
                aria-label="Unlock with fingerprint or face"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: 'var(--touch-min)',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--color-sage-300)',
                  background: 'var(--color-sage-50)',
                  color: 'var(--color-sage-700)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 500,
                  cursor: bioBusy ? 'default' : 'pointer',
                  fontFamily: 'var(--font-family-body)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {bioBusy ? 'Waiting for your device…' : 'Unlock with fingerprint or face'}
              </button>
            )}
            <button
              onClick={() => setHelpOpen(true)}
              aria-label="Help Me Right Now"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'var(--touch-min)',
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-pink-600)',
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                fontFamily: 'var(--font-family-body)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-full)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              💗 Help Me Right Now
            </button>
            <button
              onClick={() => setForgot(true)}
              aria-label="Forgot your PIN"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'var(--touch-min)',
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-tertiary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 400,
                fontFamily: 'var(--font-family-body)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-full)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Forgot your PIN?
            </button>
          </div>
        )}

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-tertiary)',
            margin: '24px 0 0',
            lineHeight: 'var(--line-height-relaxed)',
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          This keeps the app private on this device. It is not encryption.
        </p>

        <div style={{ flex: 1 }} />
      </div>

      {/* ── Help on top of the gate (never a way around the PIN) ── */}
      {helpOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'calc(var(--z-tooltip) + 1)',
            background: 'var(--color-bg-primary)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px 4px',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setHelpOpen(false)}
              aria-label="Back to lock screen"
              style={{
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
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
              Help Me Right Now
            </span>
            <div style={{ width: 'var(--touch-min)' }} />
          </div>
          <div className="pin-help-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            <Help />
          </div>
          {/* Hide the Help page's own bottom nav inside the locked overlay —
              navigation must stay behind the gate. */}
          <style>{`.pin-help-scroll nav { display: none !important; }`}</style>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Profile page
   ═══════════════════════════════════════════════════════════════ */

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

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
  padding: '4px 24px 8px',
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

/** Switch row used for the (optional) biometric toggle. */
function SwitchRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '8px 0',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
            marginTop: '2px',
          }}
        >
          {hint}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        style={{
          position: 'relative',
          width: '52px',
          height: '32px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: checked ? 'var(--color-sage-500)' : 'var(--color-neutral-300)',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'background var(--duration-normal) var(--ease-default)',
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '23px' : '3px',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: 'var(--shadow-button)',
            transition: 'left var(--duration-normal) var(--ease-out)',
          }}
        />
      </button>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  /* Profile name */
  const [name, setName] = useState(() => loadProfileInfo().name);
  const [nameDraft, setNameDraft] = useState(() => loadProfileInfo().name);

  /* Emergency contacts */
  const [contacts, setContacts] = useState<EmergencyContact[]>(loadContacts);
  const [contactSheet, setContactSheet] = useState<{ contact: EmergencyContact | null } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<EmergencyContact | null>(null);

  /* PIN lock */
  const [pinRecord, setPinRecord] = useState(loadPinRecord);
  const [pinFlow, setPinFlow] = useState<null | { kind: 'set' | 'change' | 'disable'; verifying: boolean }>(null);

  /* Biometric (optional enhancement) */
  const [bioSupported, setBioSupported] = useState(false);
  const [bioOn, setBioOn] = useState(() => getBiometricRecord() !== null);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    isBiometricAvailable().then((ok) => {
      if (alive) setBioSupported(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* ── Handlers ─────────────────────────────────────────────── */

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleSaveName = useCallback(() => {
    const clean = nameDraft.trim();
    saveProfileInfo(clean);
    setName(clean);
    setToast(clean ? `Lovely. We'll call you ${clean} from now on.` : "Okay — we'll just say hi for now.");
  }, [nameDraft]);

  const handlePinSet = useCallback(
    async (pin: string) => {
      try {
        await setPin(pin);
      } catch {
        setPinFlow(null);
        setToast('Hmm — PIN lock needs a secure connection to work on this device.');
        return;
      }
      setPinRecord(loadPinRecord());
      setPinFlow(null);
      setToast('Your PIN is set. Use Lock now anytime.');
    },
    [],
  );

  const handlePinChangeVerified = useCallback(() => {
    setPinFlow({ kind: 'change', verifying: false });
  }, []);

  const handlePinDisableVerified = useCallback(() => {
    disablePin();
    clearBiometric();
    setPinRecord(loadPinRecord());
    setBioOn(false);
    setPinFlow(null);
    setToast("PIN lock is off. You can turn it on whenever you're ready.");
  }, []);

  const handleLockNow = useCallback(() => {
    lockNow();
  }, []);

  const handleBioToggle = useCallback(
    async (on: boolean) => {
      if (on) {
        setBioBusy(true);
        const ok = await enrollBiometric();
        setBioBusy(false);
        setBioOn(ok);
        setToast(ok
          ? 'Fingerprint or face unlock is ready.'
          : "That didn't work on this device right now. You can keep using your PIN.");
      } else {
        clearBiometric();
        setBioOn(false);
        setToast('Fingerprint or face unlock is off.');
      }
    },
    [],
  );

  const handleContactSave = useCallback(
    (data: Omit<EmergencyContact, 'id'>) => {
      const editingId = contactSheet?.contact?.id ?? null;
      setContacts((prev) => {
        const next = editingId
          ? prev.map((c) => (c.id === editingId ? { ...data, id: editingId } : c))
          : [...prev, { ...data, id: crypto.randomUUID() }];
        saveContacts(next);
        return next;
      });
      setToast(editingId ? `${data.name} is updated.` : `${data.name} is saved to your list.`);
      setContactSheet(null);
    },
    [contactSheet],
  );

  const handleContactRemove = useCallback(() => {
    if (!removeTarget) return;
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== removeTarget.id);
      saveContacts(next);
      return next;
    });
    setToast(`Removed ${removeTarget.name} from your list.`);
    setRemoveTarget(null);
  }, [removeTarget]);

  const pinOn = pinRecord?.enabled === true;
  const nameUnchanged = nameDraft.trim() === name;

  return (
    <div style={pageStyle}>
      {/* Top bar */}
      <div style={topBarStyle}>
        <button onClick={handleHome} style={iconBtnStyle} aria-label="Back to home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
          Profile
        </span>
        <div style={{ width: 'var(--touch-min)' }} />
      </div>

      {/* Header — warm greeting */}
      <div style={headerStyle}>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          {name ? `Hi, ${name}` : 'Welcome back'} 🌿
        </h1>
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            margin: '6px 0 0',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          Your space, your settings. Everything here stays on this device.
        </p>
      </div>

      {/* Scrollable content */}
      <div style={scrollContentStyle}>
        {/* ── 1. Profile info ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={sectionLabelStyle}>Profile info</span>
          <SectionCard>
            <div>
              <CardTitle>What should we call you?</CardTitle>
              <CardNote>
                A nickname or your first name — whatever feels like you. It's optional,
                and it stays on this device.
              </CardNote>
            </div>
            <Field
              id="profile-name"
              label="Your name"
              value={nameDraft}
              onChange={setNameDraft}
              placeholder="e.g. Sam"
              autoComplete="off"
            />
            <ActionButton variant="primary" onClick={handleSaveName} disabled={nameUnchanged}>
              Save name
            </ActionButton>
          </SectionCard>
        </div>

        {/* ── 2. Privacy & Safety — PIN lock ───────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={sectionLabelStyle}>Privacy &amp; Safety</span>
          <SectionCard>
            <div>
              <CardTitle>{pinOn ? '🔒 PIN lock is on' : '🔓 No PIN set'}</CardTitle>
              <CardNote>
                {pinOn
                  ? 'SafeSteps asks for your PIN when it opens, and you can lock it anytime with one tap.'
                  : 'A PIN keeps your space private if someone else picks up your phone. It\'s completely optional — set one whenever you\'re ready.'}
              </CardNote>
            </div>

            {pinOn ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ActionButton variant="warm" onClick={() => setPinFlow({ kind: 'change', verifying: true })}>
                  Change PIN
                </ActionButton>
                <ActionButton variant="ghost" onClick={() => setPinFlow({ kind: 'disable', verifying: true })}>
                  Turn off PIN
                </ActionButton>
                <ActionButton variant="sage" onClick={handleLockNow}>
                  🔒 Lock now
                </ActionButton>
              </div>
            ) : (
              <ActionButton
                variant="warm"
                onClick={() => setPinFlow({ kind: 'set', verifying: false })}
              >
                Set a PIN
              </ActionButton>
            )}

            {pinOn && bioSupported && (
              <SwitchRow
                label="Unlock with fingerprint or face"
                hint="A quick way to open SafeSteps without typing your PIN."
                checked={bioOn}
                disabled={bioBusy}
                onChange={(next) => void handleBioToggle(next)}
              />
            )}

            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-tertiary)',
                margin: 0,
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              This keeps the app private on this device. It is not encryption — a strong
              passcode on your phone itself is the deepest protection.
            </p>
          </SectionCard>
        </div>

        {/* ── 3. Emergency contacts ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={sectionLabelStyle}>Emergency contacts</span>
          <SectionCard>
            <div>
              <CardTitle>Your people</CardTitle>
              <CardNote>
                People you want to remember — a friend, a therapist, a family member.
                This list is just for you.
              </CardNote>
            </div>

            {contacts.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '28px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-cream-100)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '30px', lineHeight: 1 }}>🌿</span>
                <p
                  style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    lineHeight: 'var(--line-height-relaxed)',
                  }}
                >
                  No contacts yet. You might add someone you'd want to remember — a
                  friend, a therapist, a family member. There's no rush; this list is
                  just for you.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 0',
                      borderBottom: '0.5px solid var(--color-border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--text-md)',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {c.name}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.relationship}
                        {c.phone ? ` · ${c.phone}` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => setContactSheet({ contact: c })}
                      aria-label={`Edit ${c.name}`}
                      style={{
                        ...iconBtnStyle,
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setRemoveTarget(c)}
                      aria-label={`Remove ${c.name}`}
                      style={{
                        ...iconBtnStyle,
                        color: 'var(--color-pink-400)',
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <ActionButton
              variant="warm"
              onClick={() => setContactSheet({ contact: null })}
              ariaLabel="Add a contact"
            >
              ＋ Add a contact
            </ActionButton>
          </SectionCard>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-bg-card-alt)',
              border: '1px solid var(--color-pink-200)',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1.4, flexShrink: 0 }}>💚</span>
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--color-pink-700)',
                margin: 0,
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              SafeSteps never contacts these people. They are here as a private reminder
              for you. Nothing here is sent anywhere.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <BottomNav />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* PIN flow sheets */}
      {pinFlow?.kind === 'set' && !pinFlow.verifying && (
        <SetPinSheet onDone={(pin) => void handlePinSet(pin)} onCancel={() => setPinFlow(null)} />
      )}
      {pinFlow?.verifying && (
        <VerifyCurrentSheet
          title={pinFlow.kind === 'change' ? 'Your current PIN' : 'Turn off PIN lock'}
          subtitle={
            pinFlow.kind === 'change'
              ? 'Enter your current PIN first, then you can choose a new one.'
              : 'Enter your current PIN to turn the lock off.'
          }
          onVerified={pinFlow.kind === 'change' ? handlePinChangeVerified : handlePinDisableVerified}
          onCancel={() => setPinFlow(null)}
        />
      )}

      {/* Contact sheets */}
      {contactSheet && (
        <ContactSheet
          initial={contactSheet.contact}
          onSave={handleContactSave}
          onCancel={() => setContactSheet(null)}
        />
      )}
      {removeTarget && (
        <ConfirmSheet
          title={`Remove ${removeTarget.name}?`}
          body="This only removes them from this list on your device. Nothing is sent anywhere."
          confirmLabel="Remove"
          cancelLabel="Keep them"
          onConfirm={handleContactRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}