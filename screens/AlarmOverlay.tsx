import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '../constants/tokens';
import { useReminders } from '../lib/reminderStore';
import { startAlarmLoop } from '../lib/notifications';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function nowLabel(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${h12}:${pad(m)}`, ampm };
}

export function AlarmOverlay() {
  const { activeAlarm, dismissAlarm, snoozeAlarm } = useReminders();
  const [tick, setTick] = useState(() => new Date());

  // Tick the clock label every 30s while overlay is shown
  useEffect(() => {
    if (!activeAlarm) return;
    const id = setInterval(() => setTick(new Date()), 30_000);
    return () => clearInterval(id);
  }, [activeAlarm]);

  // Loop the alarm tone for the entire lifetime of the overlay
  useEffect(() => {
    if (!activeAlarm) return;
    const stop = startAlarmLoop();
    return () => stop();
  }, [activeAlarm]);

  if (!activeAlarm) return null;
  const { time, ampm } = nowLabel(tick);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissAlarm}>
      <View style={styles.root}>
        <View style={styles.glow} />
        <View style={styles.top}>
          <View style={styles.bellWrap}>
            <Ionicons name="notifications" size={26} color={Colors.accent} />
            <Text style={styles.label}>ALARM</Text>
          </View>
          <View style={styles.clockBlock}>
            <Text style={styles.time}>{time}</Text>
            <Text style={styles.ampm}>{ampm}</Text>
          </View>
          <Text style={styles.title} numberOfLines={3}>
            {activeAlarm.title}
          </Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.snooze}
            activeOpacity={0.85}
            onPress={() => snoozeAlarm(5)}
          >
            <Ionicons name="moon-outline" size={20} color={Colors.text} />
            <Text style={styles.snoozeText}>Snooze · 5 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stop}
            activeOpacity={0.7}
            onPress={dismissAlarm}
          >
            <Text style={styles.stopText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0D0B',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(218,119,86,0.16)',
  },
  top: {
    alignItems: 'flex-start',
    gap: 32,
  },
  bellWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(218,119,86,0.14)',
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  label: {
    fontFamily: Fonts.text,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1.4,
  },
  clockBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  time: {
    fontFamily: Fonts.display,
    fontSize: 88,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: -3,
    lineHeight: 92,
  },
  ampm: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '500',
    color: Colors.textSec,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  bottom: {
    gap: 14,
  },
  snooze: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,247,232,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairlineStrong,
  },
  snoozeText: {
    fontFamily: Fonts.display,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  stop: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  stopText: {
    fontFamily: Fonts.text,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
    letterSpacing: 0.2,
  },
});
