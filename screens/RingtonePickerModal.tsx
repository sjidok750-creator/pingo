import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Colors, Fonts, Radius } from '../constants/tokens';

const RINGTONES: { group: 'STANDARD' | 'CLASSIC'; name: string; isDefault?: boolean }[] = [
  { group: 'STANDARD', name: 'Radar', isDefault: true },
  { group: 'STANDARD', name: 'Apex' },
  { group: 'STANDARD', name: 'Beacon' },
  { group: 'STANDARD', name: 'Bulletin' },
  { group: 'STANDARD', name: 'Chimes' },
  { group: 'STANDARD', name: 'Circuit' },
  { group: 'STANDARD', name: 'Constellation' },
  { group: 'STANDARD', name: 'Cosmic' },
  { group: 'STANDARD', name: 'Crystals' },
  { group: 'STANDARD', name: 'Hillside' },
  { group: 'STANDARD', name: 'Illuminate' },
  { group: 'STANDARD', name: 'Night Owl' },
  { group: 'STANDARD', name: 'Prism' },
  { group: 'STANDARD', name: 'Pulse' },
  { group: 'STANDARD', name: 'Reflection' },
  { group: 'CLASSIC', name: 'Alarm' },
  { group: 'CLASSIC', name: 'Bells' },
  { group: 'CLASSIC', name: 'Chord' },
  { group: 'CLASSIC', name: 'Digital' },
  { group: 'CLASSIC', name: 'Doorbell' },
  { group: 'CLASSIC', name: 'Duck' },
  { group: 'CLASSIC', name: 'Flourish' },
  { group: 'CLASSIC', name: 'Marimba' },
  { group: 'CLASSIC', name: 'Motorcycle' },
  { group: 'CLASSIC', name: 'Old Car Horn' },
  { group: 'CLASSIC', name: 'Piano Riff' },
  { group: 'CLASSIC', name: 'Pinball' },
  { group: 'CLASSIC', name: 'Robot' },
  { group: 'CLASSIC', name: 'Signal' },
  { group: 'CLASSIC', name: 'Timba' },
  { group: 'CLASSIC', name: 'Xylophone' },
];

type Item = { type: 'header'; group: string } | { type: 'row'; name: string; isDefault?: boolean; group: string };

function buildList(query: string): Item[] {
  const filtered = query
    ? RINGTONES.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : RINGTONES;

  const groups = ['STANDARD', 'CLASSIC'] as const;
  const result: Item[] = [];
  for (const g of groups) {
    const rows = filtered.filter((r) => r.group === g);
    if (rows.length === 0) continue;
    result.push({ type: 'header', group: g });
    for (const r of rows) {
      result.push({ type: 'row', name: r.name, isDefault: r.isDefault, group: r.group });
    }
  }
  return result;
}

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export function RingtonePickerModal({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const list = buildList(query);

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
            <Text style={s.back}>‹ 새 알림</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>알림음</Text>
          <View style={{ width: 80 }} />
        </View>

        <SafeAreaView style={{ flex: 1 }}>
          <Text style={s.pageTitle}>알림음 선택</Text>

          {/* Search */}
          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="검색"
              placeholderTextColor={Colors.textSec}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <FlatList
            data={list}
            keyExtractor={(item, i) => `${item.type}-${i}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return <Text style={s.groupLabel}>{item.group}</Text>;
              }
              const isSelected = item.name === selected;
              return (
                <TouchableOpacity
                  style={[s.row, isSelected && s.rowSelected]}
                  onPress={() => onSelect(item.name)}
                  activeOpacity={0.75}
                >
                  <View style={s.rowLeft}>
                    {isSelected && (
                      <View style={s.checkCircle}>
                        <Text style={s.checkMark}>✓</Text>
                      </View>
                    )}
                    <View style={!isSelected && { marginLeft: 36 }}>
                      <Text style={[s.rowName, isSelected && s.rowNameSelected]}>{item.name}</Text>
                      {item.isDefault && <Text style={s.defaultTag}>기본</Text>}
                    </View>
                  </View>
                  <TouchableOpacity style={s.playBtn} activeOpacity={0.7}>
                    <Text style={s.playIcon}>▶</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontSize: 16, color: Colors.accent, fontFamily: Fonts.text },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, fontFamily: Fonts.display },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    fontFamily: Fonts.display,
    paddingHorizontal: 20,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: Colors.hairline,
  },
  searchIcon: { fontSize: 14, marginRight: 8, color: Colors.textSec },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.text,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSec,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    fontFamily: Fonts.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.hairline,
  },
  rowSelected: {
    backgroundColor: 'rgba(108,99,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  rowName: { fontSize: 16, color: Colors.text, fontFamily: Fonts.text },
  rowNameSelected: { color: Colors.accent, fontWeight: '600' },
  defaultTag: { fontSize: 11, color: Colors.textSec, fontFamily: Fonts.text, marginTop: 2 },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 0.5,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 11, color: Colors.textSec },
});
