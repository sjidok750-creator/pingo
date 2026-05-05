import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '../constants/tokens';

type WaveType = 'sine' | 'square' | 'triangle' | 'sawtooth';

type Ringtone = {
  id: string;
  name: string;
  freq: number;
  type: WaveType;
  pattern?: number[];
};

const STANDARD: Ringtone[] = [
  { id: 'pingo', name: 'Pingo', freq: 880, type: 'sine', pattern: [0.12, 0.08, 0.12] },
  { id: 'pulse', name: 'Pulse', freq: 660, type: 'square', pattern: [0.08, 0.06, 0.08, 0.06, 0.12] },
  { id: 'soft', name: 'Soft', freq: 740, type: 'triangle', pattern: [0.18, 0.14, 0.22] },
  { id: 'chime', name: 'Chime', freq: 1046, type: 'sine', pattern: [0.16, 0.12, 0.2] },
  { id: 'beam', name: 'Beam', freq: 520, type: 'sawtooth', pattern: [0.1, 0.1, 0.16] },
];

const CLASSIC: Ringtone[] = [
  { id: 'classic-bell', name: 'Classic Bell', freq: 1320, type: 'sine', pattern: [0.22, 0.18, 0.3] },
  { id: 'old-phone', name: 'Old Phone', freq: 480, type: 'square', pattern: [0.4, 0.2, 0.4] },
  { id: 'wood', name: 'Wood Block', freq: 392, type: 'triangle', pattern: [0.08, 0.08, 0.08, 0.08] },
  { id: 'analog', name: 'Analog', freq: 587, type: 'sawtooth', pattern: [0.14, 0.1, 0.14, 0.1, 0.18] },
];

function playTone(rt: Ringtone) {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  const w = window as any;
  const AudioCtx = w.AudioContext || w.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const pattern = rt.pattern && rt.pattern.length > 0 ? rt.pattern : [0.25];
  const gap = 0.06;
  let t = now;
  pattern.forEach((dur, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = rt.type;
    const detune = i % 2 === 0 ? 0 : 4;
    osc.frequency.value = rt.freq;
    osc.detune.value = detune * 100;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur + gap;
  });
  const total = (t - now) * 1000 + 50;
  setTimeout(() => {
    ctx.close().catch(() => {});
  }, total);
}

function RingtoneRow({
  rt,
  selected,
  onSelect,
  isLast,
}: {
  rt: Ringtone;
  selected: boolean;
  onSelect: (id: string) => void;
  isLast: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowDivider, selected && styles.rowSelected]}
      activeOpacity={0.7}
      onPress={() => {
        onSelect(rt.id);
        playTone(rt);
      }}
    >
      <Text style={styles.rowText}>{rt.name}</Text>
      <View style={styles.rowRight}>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => playTone(rt)}
          style={styles.playBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="play" size={11} color={Colors.accent} style={{ marginLeft: 1 }} />
        </TouchableOpacity>
        {selected ? (
          <Ionicons name="checkmark" size={20} color={Colors.accent} />
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export function RingtonePickerScreen({
  visible,
  onClose,
  initialId = 'pingo',
}: {
  visible: boolean;
  onClose: () => void;
  initialId?: string;
}) {
  const [selected, setSelected] = useState<string>(initialId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.headerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sound</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.headerDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>STANDARD</Text>
            <View style={styles.group}>
              {STANDARD.map((rt, i) => (
                <RingtoneRow
                  key={rt.id}
                  rt={rt}
                  selected={selected === rt.id}
                  onSelect={setSelected}
                  isLast={i === STANDARD.length - 1}
                />
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 22 }]}>CLASSIC</Text>
            <View style={styles.group}>
              {CLASSIC.map((rt, i) => (
                <RingtoneRow
                  key={rt.id}
                  rt={rt}
                  selected={selected === rt.id}
                  onSelect={setSelected}
                  isLast={i === CLASSIC.length - 1}
                />
              ))}
            </View>

            {Platform.OS !== 'web' ? (
              <Text style={styles.platformNote}>
                Preview is supported on web only.
              </Text>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

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
    maxHeight: '88%',
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
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  sectionLabel: {
    fontFamily: Fonts.text,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSec,
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingLeft: 4,
  },
  group: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  rowSelected: {
    backgroundColor: Colors.accentSoft,
  },
  rowText: {
    fontFamily: Fonts.text,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformNote: {
    marginTop: 18,
    textAlign: 'center',
    color: Colors.textTer,
    fontSize: 12,
    fontFamily: Fonts.text,
  },
});
