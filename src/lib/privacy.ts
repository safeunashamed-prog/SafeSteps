/* ═══════════════════════════════════════════════════════════════
   SafeSteps — Privacy & Safety helpers
   Everything here is device-local (localStorage + Web Crypto).
   Nothing in this file touches the network or Firestore.

   Keys:
     safesteps-profile    { name: string }
     safesteps-contacts   EmergencyContact[]
     safesteps-pin        { salt, hash, enabled, length }
     safesteps-biometric  { credentialId }   (optional platform authenticator)
   ═══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────────
   Profile name
   ────────────────────────────────────────────────────────────── */

export interface ProfileInfo {
  name: string;
}

const PROFILE_KEY = 'safesteps-profile';

export function loadProfileInfo(): ProfileInfo {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { name: '' };
    const parsed = JSON.parse(raw) as Partial<ProfileInfo>;
    return { name: typeof parsed.name === 'string' ? parsed.name.trim() : '' };
  } catch {
    return { name: '' };
  }
}

export function saveProfileInfo(name: string): void {
  const clean = name.trim();
  if (clean) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: clean }));
  } else {
    localStorage.removeItem(PROFILE_KEY);
  }
}

/* ──────────────────────────────────────────────────────────────
   Emergency contacts (private reminder list — never dialled)
   ────────────────────────────────────────────────────────────── */

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

const CONTACTS_KEY = 'safesteps-contacts';

export function loadContacts(): EmergencyContact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is EmergencyContact => {
      if (!c || typeof c !== 'object') return false;
      const o = c as Record<string, unknown>;
      return (
        typeof o.id === 'string' &&
        typeof o.name === 'string' &&
        typeof o.relationship === 'string' &&
        typeof o.phone === 'string'
      );
    });
  } catch {
    return [];
  }
}

export function saveContacts(contacts: EmergencyContact[]): void {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

/* ──────────────────────────────────────────────────────────────
   PIN lock — SHA-256 + random salt, never plaintext
   ────────────────────────────────────────────────────────────── */

export interface PinRecord {
  salt: string;
  hash: string;
  enabled: boolean;
  /** Length of the stored PIN (4–6) so the lock screen can match it. */
  length: number;
}

const PIN_KEY = 'safesteps-pin';

export function loadPinRecord(): PinRecord | null {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PinRecord>;
    if (
      typeof parsed.salt !== 'string' ||
      typeof parsed.hash !== 'string' ||
      typeof parsed.enabled !== 'boolean' ||
      typeof parsed.length !== 'number'
    ) {
      return null;
    }
    return { salt: parsed.salt, hash: parsed.hash, enabled: parsed.enabled, length: parsed.length };
  } catch {
    return null;
  }
}

function savePinRecord(record: PinRecord): void {
  localStorage.setItem(PIN_KEY, JSON.stringify(record));
}

export function removePinRecord(): void {
  localStorage.removeItem(PIN_KEY);
}

export function pinEnabled(): boolean {
  return loadPinRecord()?.enabled === true;
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 over `${salt}:${pin}`. Throws if Web Crypto is unavailable. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto unavailable — PIN lock needs a secure connection.');
  }
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Set (or replace) the PIN: new salt + hash, enabled. 4–6 digits expected. */
export async function setPin(pin: string): Promise<void> {
  const salt = randomHex(16);
  const hash = await hashPin(pin, salt);
  savePinRecord({ salt, hash, enabled: true, length: pin.length });
}

export async function verifyPin(pin: string): Promise<boolean> {
  const record = loadPinRecord();
  if (!record || record.enabled !== true) return false;
  try {
    const hash = await hashPin(pin, record.salt);
    return hash === record.hash;
  } catch {
    return false;
  }
}

/** Turn the lock off but keep the record shape; a future PIN replaces it. */
export function disablePin(): void {
  const record = loadPinRecord();
  if (record) savePinRecord({ ...record, enabled: false });
}

/** Full reset (used by "Forgot PIN"): removes the record and biometric. */
export function resetPin(): void {
  removePinRecord();
  clearBiometric();
}

/* ──────────────────────────────────────────────────────────────
   Lock state — in-memory, synced across components (gate + page)
   ────────────────────────────────────────────────────────────── */

let locked = loadPinRecord()?.enabled === true;
const lockListeners = new Set<(locked: boolean) => void>();

export function getLocked(): boolean {
  return locked;
}

export function subscribeLock(cb: (locked: boolean) => void): () => void {
  lockListeners.add(cb);
  return () => {
    lockListeners.delete(cb);
  };
}

function setLocked(next: boolean): void {
  if (locked === next) return;
  locked = next;
  lockListeners.forEach((cb) => cb(locked));
}

export function lockNow(): void {
  setLocked(true);
}

export function unlock(): void {
  setLocked(false);
}

/* ──────────────────────────────────────────────────────────────
   Biometric unlock (optional enhancement — platform authenticator)

   Gracefully degrades: if WebAuthn isn't available or anything
   fails, the PIN remains the way in. The biometric credential is
   stored per-device only.
   ────────────────────────────────────────────────────────────── */

const BIOMETRIC_KEY = 'safesteps-biometric';

interface BiometricRecord {
  credentialId: string;
}

export function getBiometricRecord(): BiometricRecord | null {
  try {
    const raw = localStorage.getItem(BIOMETRIC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BiometricRecord>;
    return typeof parsed.credentialId === 'string' ? { credentialId: parsed.credentialId } : null;
  } catch {
    return null;
  }
}

export function clearBiometric(): void {
  localStorage.removeItem(BIOMETRIC_KEY);
}

/** True when the browser has a usable platform authenticator (face/fingerprint). */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
    if (!window.isSecureContext) return false;
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Register this device's fingerprint/face credential. True on success. */
export async function enrollBiometric(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    const challenge = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(32)));
    const userHandle = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'SafeSteps' },
        user: { id: userHandle, name: 'safesteps', displayName: 'SafeSteps' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    if (!credential) return false;
    localStorage.setItem(
      BIOMETRIC_KEY,
      JSON.stringify({ credentialId: bytesToBase64(new Uint8Array(credential.rawId)) }),
    );
    return true;
  } catch {
    return false;
  }
}

/** Ask the device for fingerprint/face. True on success. */
export async function verifyBiometric(): Promise<boolean> {
  try {
    const record = getBiometricRecord();
    if (!record || !window.PublicKeyCredential) return false;
    const challenge = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(32)));
    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: base64ToBytes(record.credentialId) }],
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    return credential !== null;
  } catch {
    return false;
  }
}