import { StoredReminder } from './types';
import { Reminder, Urgency } from '../components/ReminderCard';

const MS_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function ddayInfo(fireAt: Date, now = new Date()): { dday: number; label: string; urgency: Urgency } {
  const days = Math.round((startOfDay(fireAt).getTime() - startOfDay(now).getTime()) / MS_DAY);
  let label = '';
  if (days === 0) label = 'D-DAY';
  else if (days > 0) label = `D-${days}`;
  else label = `D+${-days}`;

  let urgency: Urgency = 'green';
  if (days <= 0) urgency = 'red';
  else if (days <= 7) urgency = 'amber';
  return { dday: days, label, urgency };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatNextLine(fireAt: Date, now = new Date()): string {
  const diffMin = Math.max(0, Math.round((fireAt.getTime() - now.getTime()) / 60000));
  if (diffMin < 60 && fireAt.getTime() > now.getTime()) {
    return diffMin === 0 ? 'in <1m' : `in ${diffMin}m`;
  }
  const sameDay =
    fireAt.getFullYear() === now.getFullYear() &&
    fireAt.getMonth() === now.getMonth() &&
    fireAt.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    fireAt.getFullYear() === tomorrow.getFullYear() &&
    fireAt.getMonth() === tomorrow.getMonth() &&
    fireAt.getDate() === tomorrow.getDate();

  const h = fireAt.getHours();
  const m = fireAt.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, '0');
  const timePart = `${h12}:${mm} ${ampm}`;

  if (sameDay) return `Today at ${timePart}`;
  if (isTomorrow) return `Tomorrow at ${timePart}`;
  return `${MONTHS[fireAt.getMonth()]} ${fireAt.getDate()} at ${timePart}`;
}

let displayIdCounter = 0;
const idMap = new Map<string, number>();

export function toDisplay(s: StoredReminder, now = new Date()): Reminder {
  const fire = new Date(s.fireAt);
  const { dday, label, urgency } = ddayInfo(fire, now);
  let numId = idMap.get(s.id);
  if (!numId) {
    numId = ++displayIdCounter;
    idMap.set(s.id, numId);
  }
  return {
    id: numId,
    title: s.title,
    dday,
    ddayLabel: label,
    next: formatNextLine(fire, now),
    urgency,
    recurring: s.recurringDaily,
  };
}
