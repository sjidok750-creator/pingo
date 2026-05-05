import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SwipeableReminderCard } from '../components/SwipeableReminderCard';
import { RingtonePickerScreen } from './RingtonePickerScreen';
import { AddReminderModal, AddReminderValue } from './AddReminderModal';
import { Colors, Fonts, Radius } from '../constants/tokens';
import { useReminders } from '../lib/reminderStore';
import { toDisplay } from '../lib/format';

function PlusIcon({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.9, color, fontWeight: '300', lineHeight: size }}>+</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  unit,
  valueColor = Colors.text,
}: {
  label: string;
  value: string;
  unit: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function formatUntil(ms: number): { value: string; unit: string } {
  if (ms <= 0) return { value: '0', unit: '분' };
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return { value: String(totalMin), unit: '분' };
  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (hours < 24) return { value: String(hours), unit: min ? `시간 ${min}분` : '시간' };
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return { value: String(days), unit: remH ? `일 ${remH}시간` : '일' };
}

export function HomeScreen() {
  const { ready, reminders, add, update, remove } = useReminders();
  const [ringtoneOpen, setRingtoneOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...reminders].sort((a, b) => new Date(a.fireAt).getTime() - new Date(b.fireAt).getTime()),
    [reminders],
  );

  const next = sorted.find((r) => new Date(r.fireAt).getTime() > Date.now());
  const untilNext = next ? formatUntil(new Date(next.fireAt).getTime() - Date.now()) : null;

  const editingReminder = editingId ? reminders.find((r) => r.id === editingId) : undefined;
  const editingInitial: AddReminderValue | undefined = editingReminder
    ? {
        title: editingReminder.title,
        fireAt: new Date(editingReminder.fireAt),
        recurringDaily: !!editingReminder.recurringDaily,
      }
    : undefined;

  return (
    <View style={styles.root}>
      <View style={styles.ambientGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setOpenCardId(null)}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.wordmark}>
                Pingo<Text style={styles.wordmarkDot}>.</Text>
              </Text>
              <Text style={styles.subtitle}>잊지 않을게요</Text>
            </View>
            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.7}
              onPress={() => setRingtoneOpen(true)}
            >
              <Text style={{ fontSize: 18, color: Colors.text }}>🔔</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <StatCard label="활성 알림" value={String(reminders.length)} unit="개" />
            <StatCard
              label="다음 알림까지"
              value={untilNext ? untilNext.value : '-'}
              unit={untilNext ? untilNext.unit : ''}
              valueColor={Colors.accent}
            />
          </View>

          <Text style={styles.sectionLabel}>예정된 일정</Text>

          {ready && sorted.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>아직 등록된 알림이 없어요</Text>
              <Text style={styles.emptyBody}>오른쪽 아래 + 버튼으로 첫 리마인더를 만들어보세요.</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {sorted.map((s) => {
                const display = toDisplay(s);
                return (
                  <SwipeableReminderCard
                    key={s.id}
                    r={display}
                    isOpen={openCardId === s.id}
                    onOpen={() => setOpenCardId(s.id)}
                    onClose={() => setOpenCardId((cur) => (cur === s.id ? null : cur))}
                    onEdit={() => setEditingId(s.id)}
                    onDelete={() => remove(s.id)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={0.85} onPress={() => setAddOpen(true)}>
          <LinearGradient
            colors={[Colors.accent, '#5048D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <PlusIcon color="#fff" size={24} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddReminderModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (v) => {
          await add({ title: v.title, fireAt: v.fireAt, recurringDaily: v.recurringDaily });
          setAddOpen(false);
        }}
      />

      <AddReminderModal
        visible={!!editingId}
        initial={editingInitial}
        onClose={() => setEditingId(null)}
        onSubmit={async (v) => {
          if (!editingId) return;
          await update(editingId, {
            title: v.title,
            fireAt: v.fireAt,
            recurringDaily: v.recurringDaily,
          });
          setEditingId(null);
        }}
        onDelete={async () => {
          if (!editingId) return;
          await remove(editingId);
          setEditingId(null);
        }}
      />

      <RingtonePickerScreen
        visible={ringtoneOpen}
        onClose={() => setRingtoneOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(108,99,255,0.12)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  wordmark: {
    fontFamily: Fonts.display,
    fontSize: 38,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1.4,
    lineHeight: 42,
  },
  wordmarkDot: {
    color: Colors.accent,
  },
  subtitle: {
    fontFamily: Fonts.text,
    fontSize: 14,
    color: Colors.textSec,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.chip,
    padding: 12,
    paddingLeft: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSec,
    marginBottom: 4,
    letterSpacing: 0.2,
    fontFamily: Fonts.text,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 11,
    color: Colors.textSec,
    fontFamily: Fonts.text,
  },
  sectionLabel: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    paddingTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSec,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: Fonts.text,
  },
  cardList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  empty: {
    marginHorizontal: 20,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyBody: {
    fontFamily: Fonts.text,
    fontSize: 13,
    color: Colors.textSec,
    textAlign: 'center',
  },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: 'center',
    zIndex: 30,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Radius.fab,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
});
