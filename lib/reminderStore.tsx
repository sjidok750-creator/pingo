import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredReminder } from './types';
import { cancelAsync, ensurePermissionAsync, scheduleAsync, setAlarmFireHandler } from './notifications';

export interface ActiveAlarm {
  id: string;
  title: string;
  firedAt: number;
}

const STORAGE_KEY = '@pingo/reminders/v1';

interface Ctx {
  ready: boolean;
  reminders: StoredReminder[];
  add: (input: NewReminder) => Promise<StoredReminder>;
  update: (id: string, patch: Partial<NewReminder>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  scheduleTest: (seconds: number, title?: string) => Promise<StoredReminder>;
  // In-app alarm overlay state
  activeAlarm: ActiveAlarm | null;
  dismissAlarm: () => void;
  snoozeAlarm: (minutes?: number) => void;
}

export interface NewReminder {
  title: string;
  fireAt: Date;
  recurringDaily?: boolean;
  ringtoneId?: string;
}

const ReminderContext = createContext<Ctx | null>(null);

export function useReminders(): Ctx {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminders must be used inside <ReminderProvider>');
  return ctx;
}

function genId(): string {
  return `r_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

async function persist(list: StoredReminder[]) {
  try {
    const safe = list.map(({ webTimerId, ...rest }) => rest);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // ignore
  }
}

async function load(): Promise<StoredReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredReminder[];
  } catch {
    return [];
  }
}

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<StoredReminder[]>([]);
  const [ready, setReady] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  const remindersRef = useRef(reminders);
  remindersRef.current = reminders;

  // Receive alarm-fire callbacks from the scheduling layer.
  useEffect(() => {
    setAlarmFireHandler(({ id, title }) => {
      setActiveAlarm({ id, title, firedAt: Date.now() });
    });
    return () => setAlarmFireHandler(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await load();
        if (!mounted) return;
        setReminders(list);
        setReady(true);
        // Re-schedule on web (timers are volatile across reloads)
        for (const r of list) {
          try {
            const fire = new Date(r.fireAt);
            if (fire.getTime() > Date.now() || r.recurringDaily) {
              await scheduleAsync({
                id: r.id,
                title: 'Pingo 알림',
                body: r.title,
                fireAt: fire,
                recurringDaily: r.recurringDaily,
              });
            }
          } catch {
            // continue with next reminder
          }
        }
      } catch {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const add = useCallback(async (input: NewReminder): Promise<StoredReminder> => {
    const granted = await ensurePermissionAsync();
    const id = genId();
    let nativeNotifId: string | null = null;
    if (granted) {
      nativeNotifId = await scheduleAsync({
        id,
        title: 'Pingo 알림',
        body: input.title,
        fireAt: input.fireAt,
        recurringDaily: input.recurringDaily,
      });
    }
    const next: StoredReminder = {
      id,
      title: input.title,
      fireAt: input.fireAt.toISOString(),
      recurringDaily: !!input.recurringDaily,
      ringtoneId: input.ringtoneId,
      nativeNotifId,
    };
    const updated = [...remindersRef.current, next];
    setReminders(updated);
    persist(updated);
    return next;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<NewReminder>) => {
    const current = remindersRef.current.find((r) => r.id === id);
    if (!current) return;
    await cancelAsync({ webId: id, nativeId: current.nativeNotifId });
    const merged: StoredReminder = {
      ...current,
      title: patch.title ?? current.title,
      fireAt: (patch.fireAt ?? new Date(current.fireAt)).toISOString(),
      recurringDaily: patch.recurringDaily ?? current.recurringDaily,
      ringtoneId: patch.ringtoneId ?? current.ringtoneId,
    };
    const granted = await ensurePermissionAsync();
    let nativeNotifId: string | null = null;
    if (granted) {
      nativeNotifId = await scheduleAsync({
        id: merged.id,
        title: 'Pingo 알림',
        body: merged.title,
        fireAt: new Date(merged.fireAt),
        recurringDaily: merged.recurringDaily,
      });
    }
    merged.nativeNotifId = nativeNotifId;
    const updatedList = remindersRef.current.map((r) => (r.id === id ? merged : r));
    setReminders(updatedList);
    persist(updatedList);
  }, []);

  const remove = useCallback(async (id: string) => {
    const current = remindersRef.current.find((r) => r.id === id);
    if (current) {
      await cancelAsync({ webId: id, nativeId: current.nativeNotifId });
    }
    const updatedList = remindersRef.current.filter((r) => r.id !== id);
    setReminders(updatedList);
    persist(updatedList);
  }, []);

  const scheduleTest = useCallback(
    async (seconds: number, title = 'Test alarm'): Promise<StoredReminder> => {
      const fireAt = new Date(Date.now() + seconds * 1000);
      return add({ title, fireAt });
    },
    [add],
  );

  const dismissAlarm = useCallback(() => {
    setActiveAlarm(null);
  }, []);

  const snoozeAlarm = useCallback(
    (minutes = 5) => {
      const current = activeAlarm;
      setActiveAlarm(null);
      if (!current) return;
      const fireAt = new Date(Date.now() + minutes * 60 * 1000);
      // Reuse the original reminder id so a Stop later still cancels it.
      scheduleAsync({
        id: current.id,
        title: 'Pingo',
        body: current.title,
        fireAt,
      }).catch(() => {});
    },
    [activeAlarm],
  );

  const value = useMemo(
    () => ({
      ready,
      reminders,
      add,
      update,
      remove,
      scheduleTest,
      activeAlarm,
      dismissAlarm,
      snoozeAlarm,
    }),
    [ready, reminders, add, update, remove, scheduleTest, activeAlarm, dismissAlarm, snoozeAlarm],
  );

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>;
}
