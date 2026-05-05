import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableReminderCard } from '../components/SwipeableReminderCard';
import { RingtonePickerScreen } from './RingtonePickerScreen';
import { AddReminderModal, AddReminderValue } from './AddReminderModal';
import { Colors, Fonts, Radius } from '../constants/tokens';
import { useReminders } from '../lib/reminderStore';
import { toDisplay } from '../lib/format';
import { primeAudio } from '../lib/notifications';

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
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function formatUntil(ms: number): { value: string; unit: string } {
  if (ms <= 0) return { value: '0', unit: 'm' };
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return { value: String(totalMin), unit: 'm' };
  const hours = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (hours < 24) return { value: String(hours), unit: min ? `h ${min}m` : 'h' };
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return { value: String(days), unit: remH ? `d ${remH}h` : 'd' };
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
              <Text style={styles.subtitle}>Stay on track</Text>
            </View>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => setRingtoneOpen(true)}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <StatCard label="Active" value={String(reminders.length)} unit="" />
            <StatCard
              label="Next in"
              value={untilNext ? untilNext.value : '—'}
              unit={untilNext ? untilNext.unit : ''}
              valueColor={Colors.accent}
            />
          </View>

          <Text style={styles.sectionLabel}>UPCOMING</Text>

          {ready && sorted.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="alarm-outline" size={28} color={Colors.textTer} />
              <Text style={styles.emptyTitle}>No reminders yet</Text>
              <Text style={styles.emptyBody}>Tap + to create your first one.</Text>
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
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            primeAudio();
            setAddOpen(true);
          }}
          style={styles.fab}
        >
          <Ionicons name="add" size={28} color="#fff" />
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
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: -120,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(218,119,86,0.10)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 4,
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
  },
  wordmark: {
    fontFamily: Fonts.display,
    fontSize: 34,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  wordmarkDot: {
    color: Colors.accent,
  },
  subtitle: {
    fontFamily: Fonts.text,
    fontSize: 13,
    color: Colors.textSec,
    letterSpacing: -0.1,
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.chip,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSec,
    marginBottom: 4,
    letterSpacing: 0.4,
    fontFamily: Fonts.text,
    fontWeight: '500',
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
    fontSize: 12,
    color: Colors.textSec,
    fontFamily: Fonts.text,
    fontWeight: '500',
  },
  sectionLabel: {
    paddingHorizontal: 22,
    paddingBottom: 10,
    paddingTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSec,
    letterSpacing: 1.2,
    fontFamily: Fonts.text,
  },
  cardList: {
    paddingHorizontal: 18,
    gap: 10,
  },
  empty: {
    marginHorizontal: 18,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  emptyBody: {
    fontFamily: Fonts.text,
    fontSize: 13,
    color: Colors.textSec,
    textAlign: 'center',
  },
  fabWrap: {
    position: 'absolute',
    right: 22,
    bottom: 32,
    zIndex: 30,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Radius.fab,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
});
