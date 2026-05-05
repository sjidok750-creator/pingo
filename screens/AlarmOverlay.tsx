import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '../constants/tokens';
import { useReminders } from '../lib/reminderStore';
import { startAlarmLoop } from '../lib/notifications';

const APP_ICON = require('../assets/icon.png');

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

  // Subtle pulse on the app-icon halo while ringing
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!activeAlarm) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [activeAlarm, pulse]);

  // Refresh clock label every 30s while ringing
  useEffect(() => {
    if (!activeAlarm) return;
    const id = setInterval(() => setTick(new Date()), 30_000);
    return () => clearInterval(id);
  }, [activeAlarm]);

  // Loop the alarm tone for the full lifetime of the overlay
  useEffect(() => {
    if (!activeAlarm) return;
    const stop = startAlarmLoop();
    return () => stop();
  }, [activeAlarm]);

  if (!activeAlarm) return null;
  const { time, ampm } = nowLabel(tick);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const iconScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissAlarm}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Animated.View
              style={[
                styles.halo,
                { transform: [{ scale: haloScale }], opacity: haloOpacity },
              ]}
            />
            <Animated.View style={[styles.iconShell, { transform: [{ scale: iconScale }] }]}>
              <Image source={APP_ICON} style={styles.icon} />
            </Animated.View>
          </View>

          <View style={styles.tagRow}>
            <Ionicons name="alarm" size={14} color={Colors.accent} />
            <Text style={styles.tag}>ALARM · {time} {ampm}</Text>
          </View>

          <Text style={styles.title} numberOfLines={3}>
            {activeAlarm.title}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.snooze]}
              activeOpacity={0.85}
              onPress={() => snoozeAlarm(5)}
            >
              <Ionicons name="moon-outline" size={18} color={Colors.text} />
              <Text style={styles.snoozeText}>Snooze</Text>
              <Text style={styles.snoozeHint}>5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.stop]}
              activeOpacity={0.85}
              onPress={dismissAlarm}
            >
              <Ionicons name="stop" size={18} color="#fff" />
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ICON_SIZE = 84;
const HALO_SIZE = 132;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,7,6,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.bgElev,
    borderRadius: Radius.modal,
    paddingTop: 32,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairlineStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 14,
  },
  iconWrap: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundColor: 'rgba(218,119,86,0.32)',
  },
  iconShell: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
    shadowColor: Colors.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentSoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    marginBottom: 14,
  },
  tag: {
    fontFamily: Fonts.text,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1.0,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.4,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 26,
    paddingHorizontal: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: Radius.pill,
  },
  snooze: {
    backgroundColor: 'rgba(255,247,232,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairlineStrong,
  },
  snoozeText: {
    fontFamily: Fonts.display,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  snoozeHint: {
    fontFamily: Fonts.text,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSec,
    marginLeft: 2,
  },
  stop: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  stopText: {
    fontFamily: Fonts.display,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
