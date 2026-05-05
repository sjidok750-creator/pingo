import React, { useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius } from '../constants/tokens';

const ITEM_H = 44;
const VISIBLE = 5;

function buildDates(): { label: string; full: string }[] {
  const result: { label: string; full: string }[] = [];
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const base = new Date(2026, 4, 5); // May 5 2026
  for (let i = -2; i <= 60; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const m = d.getMonth();
    const day = d.getDate();
    const dow = days[d.getDay()];
    let label = i === -1 ? '어제' : i === 0 ? '오늘' : i === 1 ? '내일' : `${months[m]} ${day}일 ${dow}`;
    result.push({ label, full: `${2026}.${m + 1}.${day}` });
  }
  return result;
}

const DATES = buildDates();
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, ' '));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const AMPM = ['오전', '오후'];

const PRE_ALERTS = ['1주 전', '3일 전', '1일 전', '12시간', '6시간', '1시간', '정각'];

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  width?: number;
}

function WheelPicker({ items, selectedIndex, onSelect, width = 80 }: WheelPickerProps) {
  const ref = useRef<ScrollView>(null);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      onSelect(clamped);
    },
    [items.length, onSelect]
  );

  return (
    <View style={[wp.wrap, { width }]}>
      <View style={wp.selector} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: selectedIndex * ITEM_H }}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
      >
        {items.map((item, i) => (
          <View key={i} style={wp.item}>
            <Text style={[wp.text, i === selectedIndex && wp.textSelected]}>{item}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={wp.fadeTop} pointerEvents="none" />
      <View style={wp.fadeBot} pointerEvents="none" />
    </View>
  );
}

const wp = StyleSheet.create({
  wrap: {
    height: ITEM_H * VISIBLE,
    overflow: 'hidden',
  },
  selector: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.13)',
    borderWidth: 0.5,
    borderColor: 'rgba(108,99,255,0.30)',
    zIndex: 1,
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.textSec, fontSize: 16, fontFamily: Fonts.text },
  textSelected: { color: Colors.text, fontSize: 17, fontWeight: '600' },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_H * 2,
    pointerEvents: 'none' as any,
  },
  fadeBot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_H * 2,
    pointerEvents: 'none' as any,
  },
});

interface Props {
  visible: boolean;
  onClose: () => void;
  ringtone: string;
  onPickRingtone: () => void;
}

export function AddReminderModal({ visible, onClose, ringtone, onPickRingtone }: Props) {
  const [title, setTitle] = useState('');
  const [dateIdx, setDateIdx] = useState(2); // 내일
  const [ampmIdx, setAmpmIdx] = useState(0);
  const [hourIdx, setHourIdx] = useState(8); // 9시
  const [minIdx, setMinIdx] = useState(0);
  const [alerts, setAlerts] = useState<string[]>([]);

  const toggleAlert = (a: string) =>
    setAlerts((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const selectedDate = DATES[dateIdx]?.label ?? '';
  const selectedTime = `${AMPM[ampmIdx]} ${HOURS[hourIdx]}:${MINUTES[minIdx]}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      transparent={Platform.OS !== 'ios'}
      onRequestClose={onClose}
    >
      {Platform.OS !== 'ios' && <View style={s.overlay} />}
      <View style={s.sheet}>
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.cancel}>취소</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>새 알림</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Title input */}
          <TextInput
            style={s.titleInput}
            placeholder="어떤 일을 잊지 말아야 하나요?"
            placeholderTextColor={Colors.textSec}
            value={title}
            onChangeText={setTitle}
            multiline
          />

          {/* Date & Time section */}
          <Text style={s.sectionLabel}>날짜 및 시간</Text>
          <View style={s.card}>
            {/* Date row */}
            <View style={s.dateRow}>
              <Text style={s.rowLabel}>날짜</Text>
              <TouchableOpacity style={s.dateBadge}>
                <Text style={s.dateBadgeText}>{`2026년 ${selectedDate}`}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.separator} />
            {/* Time row */}
            <View style={s.dateRow}>
              <Text style={s.rowLabel}>시간</Text>
              <View style={s.timeBadge}>
                <Text style={s.dateBadgeText}>{selectedTime}</Text>
              </View>
            </View>
          </View>

          {/* Wheel pickers */}
          <View style={s.wheelsCard}>
            <WheelPicker items={DATES.map((d) => d.label)} selectedIndex={dateIdx} onSelect={setDateIdx} width={130} />
            <View style={s.wheelDivider} />
            <WheelPicker items={AMPM} selectedIndex={ampmIdx} onSelect={setAmpmIdx} width={60} />
            <WheelPicker items={HOURS} selectedIndex={hourIdx} onSelect={setHourIdx} width={50} />
            <Text style={s.colon}>:</Text>
            <WheelPicker items={MINUTES} selectedIndex={minIdx} onSelect={setMinIdx} width={50} />
          </View>

          {/* Pre-alerts */}
          <Text style={s.sectionLabel}>사전 알림</Text>
          <View style={s.chipRow}>
            {PRE_ALERTS.map((a) => {
              const on = alerts.includes(a);
              return (
                <TouchableOpacity
                  key={a}
                  style={[s.chip, on && s.chipOn]}
                  onPress={() => toggleAlert(a)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{a}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ringtone row */}
          <Text style={s.sectionLabel}>알림음</Text>
          <TouchableOpacity style={s.card} onPress={onPickRingtone} activeOpacity={0.8}>
            <View style={s.ringtoneRow}>
              <Text style={s.rowLabel}>알림음</Text>
              <View style={s.ringtoneRight}>
                <Text style={s.ringtoneValue}>{ringtone}</Text>
                <Text style={s.chevron}>›</Text>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Save button */}
        <View style={s.footer}>
          <SafeAreaView>
            <TouchableOpacity activeOpacity={0.85} onPress={onClose}>
              <LinearGradient
                colors={[Colors.accent, '#5048D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.saveBtn}
              >
                <Text style={s.saveTxt}>저장하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Platform.OS !== 'ios' ? Radius.modal : 0,
    borderTopRightRadius: Platform.OS !== 'ios' ? Radius.modal : 0,
    marginTop: Platform.OS !== 'ios' ? 60 : 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cancel: { fontSize: 16, color: Colors.textSec, fontFamily: Fonts.text },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, fontFamily: Fonts.display },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  titleInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: 0.5,
    borderColor: Colors.hairline,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.text,
    minHeight: 80,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSec,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: Fonts.text,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: 0.5,
    borderColor: Colors.hairline,
    marginBottom: 24,
    overflow: 'hidden',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 16, color: Colors.text, fontFamily: Fonts.text },
  dateBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timeBadge: {
    backgroundColor: 'rgba(108,99,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dateBadgeText: { color: Colors.text, fontWeight: '600', fontSize: 14, fontFamily: Fonts.text },
  separator: { height: 0.5, backgroundColor: Colors.hairline, marginHorizontal: 16 },
  wheelsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    borderWidth: 0.5,
    borderColor: Colors.hairline,
    marginBottom: 24,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  wheelDivider: { width: 0.5, height: ITEM_H * VISIBLE, backgroundColor: Colors.hairline, marginHorizontal: 4 },
  colon: { color: Colors.text, fontSize: 20, fontWeight: '600', marginHorizontal: 2 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.chip,
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.hairline,
  },
  chipOn: {
    backgroundColor: 'rgba(108,99,255,0.18)',
    borderColor: Colors.accent,
  },
  chipText: { fontSize: 14, color: Colors.textSec, fontFamily: Fonts.text },
  chipTextOn: { color: Colors.accent, fontWeight: '600' },
  ringtoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ringtoneRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ringtoneValue: { fontSize: 15, color: Colors.textSec, fontFamily: Fonts.text },
  chevron: { fontSize: 20, color: Colors.textSec, marginTop: -1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.hairline,
  },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTxt: { color: '#fff', fontSize: 17, fontWeight: '700', fontFamily: Fonts.display },
});
