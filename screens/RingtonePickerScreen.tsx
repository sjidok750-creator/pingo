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
  { id: 'pingo', name: 'Pingo (기본)', freq: 880, type: 'sine', pattern: [0.12, 0.08, 0.12] },
  { id: 'pulse', name: '펄스', freq: 660, type: 'square', pattern: [0.08, 0.06, 0.08, 0.06, 0.12] },
  { id: 'soft', name: '소프트 벨', freq: 740, type: 'triangle', pattern: [0.18, 0.14, 0.22] },
  { id: 'chime', name: '차임', freq: 1046, type: 'sine', pattern: [0.16, 0.12, 0.2] },
  { id: 'beam', name: '빔', freq: 520, type: 'sawtooth', pattern: [0.1, 0.1, 0.16] },
];

const CLASSIC: Ringtone[] = [
  { id: 'classic-bell', name: '클래식 벨', freq: 1320, type: 'sine', pattern: [0.22, 0.18, 0.3] },
  { id: 'old-phone', name: '구형 전화', freq: 480, type: 'square', pattern: [0.4, 0.2, 0.4] },
  { id: 'wood', name: '우드 블록', freq: 392, type: 'triangle', pattern: [0.08, 0.08, 0.08, 0.08] },
  { id: 'analog', name: '아날로그', freq: 587, type: 'sawtooth', pattern: [0.14, 0.1, 0.14, 0.1, 0.18] },
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
    // Slight pitch variance per note for melodic feel
    const detune = i % 2 === 0 ? 0 : 4; // semitones-ish via detune cents
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
  // Auto-close context after playback finishes
  const total = (t - now) * 1000 + 50;
  setTimeout(() => {
    ctx.close().catch(() => {});
  }, total);
}

function RingtoneRow({
  rt,
  selected,
  onSelect,
}: {
  rt: Ringtone;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      activeOpacity={0.75}
      onPress={() => {
        onSelect(rt.id);
        playTone(rt);
      }}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.dot, selected && styles.dotSelected]}>
          {selected ? <View style={styles.dotInner} /> : null}
        </View>
        <Text style={styles.rowText}>{rt.name}</Text>
      </View>
      <TouchableOpacity
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => playTone(rt)}
        style={styles.playBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.playGlyph}>▶</Text>
      </TouchableOpacity>
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
              <Text style={styles.headerCancel}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>벨소리</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.headerDone}>완료</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>STANDARD</Text>
            <View style={styles.group}>
              {STANDARD.map((rt) => (
                <RingtoneRow
                  key={rt.id}
                  rt={rt}
                  selected={selected === rt.id}
                  onSelect={setSelected}
                />
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 22 }]}>CLASSIC</Text>
            <View style={styles.group}>
              {CLASSIC.map((rt) => (
                <RingtoneRow
                  key={rt.id}
                  rt={rt}
                  selected={selected === rt.id}
                  onSelect={setSelected}
                />
              ))}
            </View>

            {Platform.OS !== 'web' ? (
              <Text style={styles.platformNote}>
                ※ 미리듣기는 웹에서 지원됩니다.
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
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    paddingBottom: 16,
    maxHeight: '88%',
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
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  group: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowSelected: {
    backgroundColor: 'rgba(108,99,255,0.08)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowText: {
    fontFamily: Fonts.text,
    fontSize: 15,
    color: Colors.text,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.textTer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSelected: {
    borderColor: Colors.accent,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(108,99,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  playGlyph: {
    color: Colors.accent,
    fontSize: 12,
    marginLeft: 2,
  },
  platformNote: {
    marginTop: 18,
    textAlign: 'center',
    color: Colors.textTer,
    fontSize: 12,
    fontFamily: Fonts.text,
  },
});
