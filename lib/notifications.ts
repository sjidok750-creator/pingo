import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const webTimers = new Map<string, number>();
let nativeHandlersInitialized = false;

function initNativeHandlers() {
  if (nativeHandlersInitialized) return;
  nativeHandlersInitialized = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // ignore
  }
}

export async function ensurePermissionAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof (window as any).Notification === 'undefined') {
      return false;
    }
    const N = (window as any).Notification;
    if (N.permission === 'granted') return true;
    if (N.permission === 'denied') return false;
    try {
      const result = await N.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }

  try {
    initNativeHandlers();
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  } catch {
    return false;
  }
}

// A single, long-lived AudioContext that we create from a user gesture so
// that subsequent setTimeout-driven playback isn't blocked by browser
// autoplay policies (Chrome/Safari mobile).
let sharedAudioCtx: any = null;

export function primeAudio(): void {
  if (typeof window === 'undefined') return;
  const w = window as any;
  const AudioCtx = w.AudioContext || w.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === 'suspended' && typeof sharedAudioCtx.resume === 'function') {
      sharedAudioCtx.resume().catch(() => {});
    }
    // Play an inaudible blip to fully unlock on iOS Safari.
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    gain.gain.value = 0;
    osc.connect(gain).connect(sharedAudioCtx.destination);
    osc.start(0);
    osc.stop(sharedAudioCtx.currentTime + 0.01);
  } catch {
    // ignore
  }
}

function playWebRingtone() {
  if (typeof window === 'undefined') return;
  const w = window as any;
  const AudioCtx = w.AudioContext || w.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = sharedAudioCtx || (sharedAudioCtx = new AudioCtx());
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    // Repeat the pattern 3 times so it feels like a real alarm
    const tones = [880, 1046, 880];
    for (let rep = 0; rep < 3; rep++) {
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + rep * 0.9 + i * 0.22;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    }
  } catch {
    // ignore
  }
}

export async function scheduleAsync(args: {
  id: string;
  title: string;
  body: string;
  fireAt: Date;
  recurringDaily?: boolean;
}): Promise<string | null> {
  const ms = args.fireAt.getTime() - Date.now();

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    const existing = webTimers.get(args.id);
    if (existing) {
      clearTimeout(existing);
      webTimers.delete(args.id);
    }
    if (ms <= 0) return null;
    const fire = () => {
      try {
        const N = (window as any).Notification;
        if (N && N.permission === 'granted') {
          new N(args.title, { body: args.body });
        }
      } catch {}
      playWebRingtone();
      if (args.recurringDaily) {
        const next = new Date(args.fireAt.getTime() + 24 * 60 * 60 * 1000);
        scheduleAsync({ ...args, fireAt: next });
      } else {
        webTimers.delete(args.id);
      }
    };
    const safe = Math.min(ms, 24 * 60 * 60 * 1000);
    const handle = window.setTimeout(fire, safe);
    webTimers.set(args.id, handle);
    return args.id;
  }

  try {
    initNativeHandlers();
    const trigger = args.recurringDaily
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: args.fireAt.getHours(),
          minute: args.fireAt.getMinutes(),
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: args.fireAt,
        };

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: args.title,
        body: args.body,
        sound: 'default',
      },
      trigger: trigger as any,
    });
    return notifId;
  } catch {
    return null;
  }
}

export async function cancelAsync(args: {
  webId?: string;
  nativeId?: string | null;
}): Promise<void> {
  if (Platform.OS === 'web') {
    if (args.webId) {
      const handle = webTimers.get(args.webId);
      if (handle) {
        clearTimeout(handle);
        webTimers.delete(args.webId);
      }
    }
    return;
  }
  if (args.nativeId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(args.nativeId);
    } catch {
      // ignore
    }
  }
}
