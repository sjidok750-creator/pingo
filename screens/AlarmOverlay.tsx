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

function dateLabel(d: Date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function usePulse(active: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);
  return v;
}

export function AlarmOverlay() {
  const { activeAlarm, dismissAlarm, snoozeAlarm } = useReminders();
  const [tick, setTick] = useState(() => new Date());
  const pulse = usePulse(!!activeAlarm);

  useEffect(() => {
    if (!activeAlarm) return;
    const id = setInterval(() => setTick(new Date()), 30_000);
    return () => clearInterval(id);
  }, [activeAlarm]);

  useEffect(() => {
    if (!activeAlarm) return;
    const stop = startAlarmLoop();
    return () => stop();
  }, [activeAlarm]);

  if (!activeAlarm) return null;
  const { time, ampm } = nowLabel(tick);
  const date = dateLabel(tick);
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const iconScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  // Two layouts:
  //   Foreground (default): centered alert card overlaying current screen
  //   Returned-from-background: black full-screen alarm (iOS lock-style)
  if (activeAlarm.firedWhileHidden) {
    return (
      <Modal visible transparent={false} animationType="fade" onRequestClose={dismissAlarm}>
        <View style={fs.root}>
          <View style={fs.header}>
            <Text style={fs.date}>{date}</Text>
            <Text style={fs.bigTime}>
              {time}
              <Text style={fs.ampm}> {ampm}</Text>
            </Text>
          </View>

          <View style={fs.middle}>
            <View style={fs.iconWrap}>
              <Animated.View
                style={[fs.halo, { transform: [{ scale: haloScale }], opacity: haloOpacity }]}
              />
              <Animated.View style={[fs.iconShell, { transform: [{ scale: iconScale }] }]}>
                <Image source={APP_ICON} style={fs.icon} />
              </Animated.View>
            </View>

            <View style={fs.tagRow}>
              <Ionicons name="alarm" size={14} color={Colors.accent} />
              <Text style={fs.tag}>ALARM</Text>
            </View>

            <Text style={fs.title} numberOfLines={4}>
              {activeAlarm.title}
            </Text>
          </View>

          <View style={fs.bottom}>
            <TouchableOpacity
              style={fs.snooze}
              activeOpacity={0.85}
              onPress={() => snoozeAlarm(5)}
            >
              <Ionicons name="moon-outline" size={20} color={Colors.text} />
              <Text style={fs.snoozeText}>Snooze</Text>
              <Text style={fs.snoozeHint}>5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={fs.stop}
              activeOpacity={0.85}
              onPress={dismissAlarm}
            >
              <Ionicons name="stop" size={18} color="#fff" />
              <Text style={fs.stopText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Foreground: centered card
  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissAlarm}>
      <View style={card.backdrop}>
        <View style={card.card}>
          <View style={card.iconWrap}>
            <Animated.View
              style={[
                card.halo,
                { transform: [{ scale: haloScale }], opacity: haloOpacity },
              ]}
            />
            <Animated.View style={[card.iconShell, { transform: [{ scale: iconScale }] }]}>
              <Image source={APP_ICON} style={card.icon} />
            </Animated.View>
          </View>

          <View style={card.tagRow}>
            <Ionicons name="alarm" size={14} color={Colors.accent} />
            <Text style={card.tag}>ALARM · {time} {ampm}</Text>
          </View>

          <Text style={card.title} numberOfLines={3}>
            {activeAlarm.title}
          </Text>

          <View style={card.btnRow}>
            <TouchableOpacity
              style={[card.btn, card.snooze]}
              activeOpacity={0.85}
              onPress={() => snoozeAlarm(5)}
            >
              <Ionicons name="moon-outline" size={18} color={Colors.text} />
              <Text style={card.snoozeText}>Snooze</Text>
              <Text style={card.snoozeHint}>5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[card.btn, card.stop]}
              activeOpacity={0.85}
              onPress={dismissAlarm}
            >
              <Ionicons name="stop" size={18} color="#fff" />
              <Text style={card.stopText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ICON_SIZE = 84;
const HALO_SIZE = 132;

// Foreground: centered alert card
const card = StyleSheet.create({
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
  icon: { width: ICON_SIZE, height: ICON_SIZE },
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
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
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

// Returned-from-background: black full-screen lock-style alarm
const fs = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: { alignItems: 'center', gap: 4 },
  date: {
    fontFamily: Fonts.text,
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,247,232,0.65)',
    letterSpacing: 0.2,
  },
  bigTime: {
    fontFamily: Fonts.display,
    fontSize: 92,
    fontWeight: '200',
    color: '#fff',
    letterSpacing: -3,
    lineHeight: 96,
  },
  ampm: {
    fontFamily: Fonts.display,
    fontSize: 28,
    fontWeight: '400',
    color: 'rgba(255,247,232,0.65)',
    letterSpacing: -0.5,
  },
  middle: { alignItems: 'center', gap: 18 },
  iconWrap: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundColor: 'rgba(218,119,86,0.36)',
  },
  iconShell: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1B1916',
    shadowColor: Colors.accentDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(218,119,86,0.18)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
  },
  tag: {
    fontFamily: Fonts.text,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.4,
    lineHeight: 30,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  bottom: { gap: 12 },
  snooze: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  snoozeText: {
    fontFamily: Fonts.display,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },
  snoozeHint: {
    fontFamily: Fonts.text,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginLeft: 2,
  },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accentDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  stopText: {
    fontFamily: Fonts.display,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
});
