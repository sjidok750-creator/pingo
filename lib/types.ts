export type Urgency = 'red' | 'amber' | 'green';

export interface StoredReminder {
  id: string;
  title: string;
  // ISO timestamp of next fire time
  fireAt: string;
  // Recurring daily at the same time (simple flag for now)
  recurringDaily?: boolean;
  // Selected ringtone id (matches RingtonePicker entries)
  ringtoneId?: string;
  // Native notification identifier (for cancellation on native)
  nativeNotifId?: string | null;
  // Web setTimeout id (volatile, not persisted)
  webTimerId?: number | null;
}
