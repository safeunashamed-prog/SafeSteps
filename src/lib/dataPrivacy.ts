/* ═══════════════════════════════════════════════════════════════
   SafeSteps — Data & Privacy helpers

   Two jobs, both best-effort so nothing ever dead-ends:

     collectAllData()  — gather everything the app has saved for you
     clearAllData()    — remove what the app has saved for you

   Data lives in Firestore with a localStorage fallback (see
   CheckIn.tsx / Triggers.tsx / Victories.tsx / Understand.tsx).
   Reads try Firestore first and fall back to the matching
   localStorage array when Firestore is empty, unreachable or slow.

   Never included in an export — and never removed by "clear":
     safesteps-pin        (PIN lock — hash + salt only)
     safesteps-biometric  (fingerprint / face credential)

   Nothing in this file sends data anywhere. An export is written
   straight to the device via a Blob download.
   ═══════════════════════════════════════════════════════════════ */

import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { loadContacts, loadProfileInfo, type EmergencyContact } from './privacy';

/* ──────────────────────────────────────────────────────────────
   Where the data lives
   ────────────────────────────────────────────────────────────── */

export interface DataStore {
  /** Key used inside the exported JSON file. */
  key: 'checkIns' | 'insights' | 'triggers' | 'victories';
  /** Friendly name for counts and copy. */
  label: string;
  /** Firestore collection name. */
  collectionName: string;
  /** localStorage key holding the offline fallback array. */
  storageKey: string;
}

/** Order matters — collectAllData() destructures the results. */
export const DATA_STORES: DataStore[] = [
  { key: 'checkIns', label: 'check-ins', collectionName: 'checkIns', storageKey: 'safesteps-checkins' },
  { key: 'insights', label: 'insights', collectionName: 'insights', storageKey: 'safesteps-insights' },
  { key: 'triggers', label: 'triggers', collectionName: 'triggers', storageKey: 'safesteps-triggers' },
  { key: 'victories', label: 'victories', collectionName: 'victories', storageKey: 'safesteps-victories' },
];

/** Keys that are part of the app but are not the user's "data". */
const SECURITY_KEYS = new Set(['safesteps-pin', 'safesteps-biometric']);

/** localStorage prefix shared by every SafeSteps key. */
export const STORAGE_PREFIX = 'safesteps-';

/* ──────────────────────────────────────────────────────────────
   Small utilities (shared with the reminders helpers)
   ────────────────────────────────────────────────────────────── */

/** Resolve fast, or give up — a hanging request should never block the page. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error('request failed'));
      },
    );
  });
}

function localArray(storageKey: string): unknown[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Firestore Timestamps and nested maps → plain JSON-friendly values. */
function toPlain(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(toPlain);

  const maybe = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
  if (typeof maybe.toDate === 'function') {
    try {
      return maybe.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof maybe.seconds === 'number' && typeof maybe.nanoseconds === 'number') {
    return new Date(maybe.seconds * 1000).toISOString();
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
  return out;
}

async function readStore(store: DataStore): Promise<unknown[]> {
  try {
    const snapshot = await withTimeout(getDocs(collection(db, store.collectionName)), 4000);
    if (!snapshot.empty) {
      const entries: unknown[] = [];
      snapshot.forEach((d) => {
        entries.push({ id: d.id, ...(toPlain(d.data()) as Record<string, unknown>) });
      });
      return entries;
    }
  } catch {
    // Offline, not signed in, or slow — fall through to what's on the device.
  }
  return localArray(store.storageKey);
}

/* ──────────────────────────────────────────────────────────────
   Gathering everything
   ────────────────────────────────────────────────────────────── */

export interface SafeStepsExport {
  app: 'SafeSteps';
  format: 'safesteps-export';
  version: 1;
  exportedAt: string;
  note: string;
  profile: { name: string };
  contacts: EmergencyContact[];
  checkIns: unknown[];
  insights: unknown[];
  triggers: unknown[];
  victories: unknown[];
  counts: Record<string, number>;
}

/** Everything the app has saved, as one plain object. Never throws. */
export async function collectAllData(): Promise<SafeStepsExport> {
  const collected = await Promise.all(DATA_STORES.map((store) => readStore(store)));
  const [checkIns, insights, triggers, victories] = collected;

  const profile = loadProfileInfo();
  const contacts = loadContacts();

  return {
    app: 'SafeSteps',
    format: 'safesteps-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    note:
      'This is a copy of your SafeSteps data, made for you. Keep it somewhere that feels safe. ' +
      'Your PIN and any fingerprint or face unlock are never included.',
    profile: { name: profile.name },
    contacts,
    checkIns,
    insights,
    triggers,
    victories,
    counts: {
      checkIns: checkIns.length,
      insights: insights.length,
      triggers: triggers.length,
      victories: victories.length,
      contacts: contacts.length,
    },
  };
}

/* ──────────────────────────────────────────────────────────────
   Downloading
   ────────────────────────────────────────────────────────────── */

/** `safesteps-my-data-YYYY-MM-DD.json` (or `.enc.json` when encrypted). */
export function exportFilename(encrypted = false): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return `safesteps-my-data-${stamp}.${encrypted ? 'enc.json' : 'json'}`;
}

/** Hand a text file to the browser as a download. Works offline. */
export function downloadFile(contents: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ──────────────────────────────────────────────────────────────
   Optional: password-protected export (AES-GCM + PBKDF2-SHA256)

   The password never leaves the device. Without it the file
   cannot be opened again, so the copy in the app says so plainly.
   ────────────────────────────────────────────────────────────── */

const PBKDF2_ITERATIONS = 250_000;

export interface EncryptedExport {
  format: 'safesteps-encrypted-export';
  version: 1;
  algorithm: 'AES-GCM-256';
  keyDerivation: string;
  createdAt: string;
  note: string;
  salt: string;
  iv: string;
  ciphertext: string;
}

/** True when this browser can encrypt a file at all. */
export function encryptionAvailable(): boolean {
  try {
    return typeof globalThis.crypto?.subtle !== 'undefined';
  } catch {
    return false;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000; // keep the argument list short for large exports
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Encrypt an export object with a password. Throws when Web Crypto is unavailable. */
export async function encryptExport(data: unknown, password: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto unavailable');

  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));

  const keyMaterial = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data, null, 2)),
  );

  const payload: EncryptedExport = {
    format: 'safesteps-encrypted-export',
    version: 1,
    algorithm: 'AES-GCM-256',
    keyDerivation: `PBKDF2-SHA256-${PBKDF2_ITERATIONS}`,
    createdAt: new Date().toISOString(),
    note:
      'Your SafeSteps data, locked with the password you chose. Keep the password somewhere safe — ' +
      'without it the file cannot be opened.',
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(payload, null, 2);
}

/* ──────────────────────────────────────────────────────────────
   Clearing everything
   ────────────────────────────────────────────────────────────── */

export interface ClearResult {
  /** How many localStorage keys were removed from this device. */
  deviceKeysRemoved: number;
  /** How many Firestore documents were removed from the account. */
  remoteDocumentsRemoved: number;
  /** True when the account side couldn't be reached (e.g. offline). */
  remoteFailed: boolean;
}

/** Remove every `safesteps-*` device key except the lock settings. */
export function clearDeviceData(): number {
  let removed = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && !SECURITY_KEYS.has(key)) keys.push(key);
    }
    for (const key of keys) {
      localStorage.removeItem(key);
      removed += 1;
    }
  } catch {
    // Storage blocked (private mode) — nothing else we can do here.
  }
  return removed;
}

/** Delete every document in the four Firestore collections. Best-effort. */
export async function clearRemoteData(): Promise<{ deleted: number; failed: boolean }> {
  let deleted = 0;
  let failed = false;
  for (const store of DATA_STORES) {
    try {
      const snapshot = await withTimeout(getDocs(collection(db, store.collectionName)), 6000);
      const ids: string[] = [];
      snapshot.forEach((d) => ids.push(d.id));
      for (const id of ids) {
        await deleteDoc(doc(db, store.collectionName, id));
        deleted += 1;
      }
    } catch {
      failed = true;
    }
  }
  return { deleted, failed };
}

/**
 * Wipe the user's saved entries — on this device and in their account.
 * The PIN / biometric settings are deliberately left untouched: clearing
 * data shouldn't quietly change how the app is protected.
 */
export async function clearAllData(): Promise<ClearResult> {
  const deviceKeysRemoved = clearDeviceData();
  const remote = await clearRemoteData();
  return {
    deviceKeysRemoved,
    remoteDocumentsRemoved: remote.deleted,
    remoteFailed: remote.failed,
  };
}
