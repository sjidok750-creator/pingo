import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Fonts, Radius } from '../constants/tokens';
import { primeAudio } from '../lib/notifications';

export interface AddReminderValue {
  title: string;
  fireAt: Date;
  recurringDaily: boolean;
}

interface Props {
  visible: boolean;
  initial?: AddReminderValue;
  onClose: () => void;
  onSubmit: (v: AddReminderValue) => void;
  onDelete?: () => void;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function fromIsoLocal(s: string): Date {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return new Date(s);
  const [, y, mo, d, h, mi] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), 0, 0);
}

const QUICK_OFFSETS: { label: string; seconds: number }[] = [
  { label: '+10s', seconds: 10 },
  { label: '+1m', seconds: 60 },
  { label: '+5m', seconds: 5 * 60 },
  { label: '+1h', seconds: 60 * 60 },
  { label: '+1d', seconds: 24 * 60 * 60 },
];

export function AddReminderModal({ visible, initial, onClose, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState<Date>(() => new Date(Date.now() + 60_000));
  const [recurring, setRecurring] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initial) {
        setTitle(initial.title);
        setWhen(initial.fireAt);
        setRecurring(initial.recurringDaily);
      } else {
        setTitle('');
        setWhen(new Date(Date.now() + 60_000));
        setRecurring(false);
      }
    }
  }, [visible, initial]);

  const isEdit = !!initial;
  const canSave = title.trim().length > 0 && when.getTime() > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.headerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Reminder' : 'New Reminder'}</Text>
            <TouchableOpacity
              disabled={!canSave}
              onPress={() => {
                if (!canSave) return;
                primeAudio();
                onSubmit({ title: title.trim(), fireAt: when, recurringDaily: recurring });
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.headerDone, !canSave && styles.headerDoneDisabled]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Take vitamins"
              placeholderTextColor={Colors.textTer}
              style={styles.input}
              autoFocus={!isEdit}
            />

            <Text style={styles.label}>WHEN</Text>
            {Platform.OS === 'web' ? (
              React.createElement('input', {
                type: 'datetime-local',
                value: isoLocal(when),
                onChange: (e: any) => setWhen(fromIsoLocal(e.target.value)),
                style: webInputStyle,
              })
            ) : (
              <TextInput
                value={when.toLocaleString()}
                editable={false}
                style={styles.input}
              />
            )}

            <View style={styles.quickRow}>
              {QUICK_OFFSETS.map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={styles.quickChip}
                  activeOpacity={0.8}
                  onPress={() => setWhen(new Date(Date.now() + q.seconds * 1000))}
                >
                  <Text style={styles.quickChipText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.rowSwitch}>
              <Text style={styles.label}>REPEAT DAILY</Text>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ false: '#3A332E', true: Colors.accent }}
                thumbColor="#fff"
                ios_backgroundColor="#3A332E"
              />
            </View>

            {isEdit && onDelete ? (
              <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.85} onPress={onDelete}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.hint}>
              {Platform.OS === 'web'
                ? 'Browser notification permission is required. Reminders won’t fire if the tab is closed.'
                : 'Notification permission is required.'}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const webInputStyle = {
  background: Colors.card,
  color: Colors.text,
  border: '1px solid rgba(255,247,232,0.08)',
  borderRadius: Radius.chip,
  padding: '12px 14px',
  fontSize: 16,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  colorScheme: 'dark',
} as const;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgElev,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    paddingBottom: 16,
    maxHeight: '92%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairlineStrong,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,247,232,0.20)',
    marginTop: 8,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerCancel: {
    fontFamily: Fonts.text,
    fontSize: 15,
    color: Colors.textSec,
  },
  headerDone: {
    fontFamily: Fonts.text,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
  },
  headerDoneDisabled: {
    color: Colors.textTer,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  label: {
    fontFamily: Fonts.text,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSec,
    letterSpacing: 1.0,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickChip: {
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  quickChipText: {
    color: Colors.accent,
    fontFamily: Fonts.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  rowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  deleteBtn: {
    marginTop: 24,
    backgroundColor: 'rgba(224,120,86,0.12)',
    borderRadius: Radius.chip,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(224,120,86,0.32)',
  },
  deleteBtnText: {
    color: Colors.red,
    fontWeight: '600',
    fontFamily: Fonts.text,
    fontSize: 15,
  },
  hint: {
    marginTop: 22,
    fontSize: 12,
    color: Colors.textTer,
    fontFamily: Fonts.text,
    lineHeight: 18,
  },
});
