/* ═══════════════════════════════════════════════════════════════
   SafeSteps — Reminders

   One optional, fully opt-in daily nudge. Two honest halves:

     1. Browser notification permission — asked for only when the
        user turns the switch on, never on load.
     2. An in-app gentle note on the Profile page that appears when
        the reminder is on and no check-in exists for today.

   There is no scheduler: the app can't send a timed push on its
   own, so we don't pretend to. The in-app note is the real,
   working part — it never pressures, and it disappears the moment
   a check-in exists for today.

   Key:
     safesteps-reminders  { enabled: boolean }
   ═══════════════════════════════════════════════════════════════ */

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './firebase';
import { withTimeout } from './dataPrivacy';

const REMINDERS_KEY = 'safesteps-reminders';
const LOCAL_CHECKINS_KEY = 'safesteps-checkins';

export interface ReminderPrefs {
  enabled: boolean;
}

/* ──────────────────────────────────────────────────────────────
   Preference
   ────────────────────────────────────────────────────────────── */

export function loadReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) return { enabled: false };
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return { enabled: parsed.enabled === true };
  } catch {
    return { enabled: false };
  }
}

export function saveReminderPrefs(enabled: boolean): void {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify({ enabled }));
  } catch {
    // Storage blocked — the switch still works for this visit.
  }
}

/* ──────────────────────────────────────────────────────────────
   Browser notification permission
   ────────────────────────────────────────────────────────────── */

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/** True when this browser knows about notifications at all. */
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): PermissionState {
  try {
    if (!notificationsSupported()) return 'unsupported';
    const state = Notification.permission;
    return state === 'granted' || state === 'denied' ? state : 'default';
  } catch {
    return 'unsupported';
  }
}

/**
 * Ask the browser once, at the moment the user opts in.
 * Returns 'unsupported' rather than throwing when unavailable.
 */
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result === 'granted' || result === 'denied' ? result : 'default';
  } catch {
    return notificationPermission();
  }
}

/* ──────────────────────────────────────────────────────────────
   "Have I checked in today?"
   ────────────────────────────────────────────────────────────── */

function parseDate(value: unknown): Date | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value && typeof value === 'object') {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === 'function') {
      try {
        return maybe.toDate();
      } catch {
        return null;
      }
    }
    if (typeof maybe.seconds === 'number') return new Date(maybe.seconds * 1000);
  }
  return null;
}

function isToday(value: unknown): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function entryDate(entry: unknown): unknown {
  if (!entry || typeof entry !== 'object') return null;
  const o = entry as Record<string, unknown>;
  return o.timestamp ?? o.createdAt ?? null;
}

/**
 * True when a check-in already exists for today. Checks the device
 * first (instant), then Firestore — never throws, never hangs.
 */
export async function hasCheckedInToday(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_CHECKINS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.some((entry) => isToday(entryDate(entry)))) return true;
  } catch {
    // Ignore — try the account side below.
  }

  try {
    const snapshot = await withTimeout(getDocs(query(collection(db, 'checkIns'), limit(10))), 4000);
    let found = false;
    snapshot.forEach((d) => {
      if (isToday(entryDate(d.data()))) found = true;
    });
    return found;
  } catch {
    return false;
  }
}
