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
  // yyyy-MM-ddTHH:mm in local time, suitable for input[type=datetime-local]
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
  { label: '+10초', seconds: 10 },
  { label: '+1분', seconds: 60 },
  { label: '+5분', seconds: 5 * 60 },
  { label: '+1시간', seconds: 60 * 60 },
  { label: '+1일', seconds: 24 * 60 * 60 },
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
              <Text style={styles.headerCancel}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEdit ? '리마인더 수정' : '새 리마인더'}</Text>
            <TouchableOpacity
              disabled={!canSave}
              onPress={() => {
                if (!canSave) return;
                onSubmit({ title: title.trim(), fireAt: when, recurringDaily: recurring });
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.headerDone, !canSave && styles.headerDoneDisabled]}>저장</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>제목</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="예: 비타민 복용"
              placeholderTextColor={Colors.textTer}
              style={styles.input}
              autoFocus={!isEdit}
            />

            <Text style={styles.label}>알림 시각</Text>
            {Platform.OS === 'web' ? (
              // Use native HTML datetime picker on web for reliability
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
              <Text style={styles.label}>매일 반복</Text>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ false: '#3A3A55', true: Colors.accent }}
                thumbColor="#fff"
              />
            </View>

            {isEdit && onDelete ? (
              <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.85} onPress={onDelete}>
                <Text style={styles.deleteBtnText}>삭제</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.hint}>
              {Platform.OS === 'web'
                ? '※ 웹에서는 브라우저 알림 권한이 필요하며, 탭이 닫혀 있으면 알림이 트리거되지 않을 수 있습니다.'
                : '※ 디바이스 알림 권한이 필요합니다.'}
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
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: Radius.chip,
  padding: '12px 14px',
  fontSize: 15,
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
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    paddingBottom: 16,
    maxHeight: '92%',
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
    paddingTop: 8,
    paddingBottom: 28,
    gap: 8,
  },
  label: {
    fontFamily: Fonts.text,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSec,
    letterSpacing: 0.4,
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.text,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    backgroundColor: 'rgba(108,99,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.chip,
  },
  quickChipText: {
    color: Colors.accent,
    fontFamily: Fonts.text,
    fontSize: 13,
    fontWeight: '600',
  },
  rowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  deleteBtn: {
    marginTop: 22,
    backgroundColor: 'rgba(192,57,43,0.18)',
    borderRadius: Radius.chip,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(192,57,43,0.4)',
  },
  deleteBtnText: {
    color: '#FF8B7A',
    fontWeight: '600',
    fontFamily: Fonts.text,
    fontSize: 15,
  },
  hint: {
    marginTop: 18,
    fontSize: 12,
    color: Colors.textTer,
    fontFamily: Fonts.text,
    lineHeight: 18,
  },
});
