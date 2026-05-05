import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ReminderCard, Reminder } from '../components/ReminderCard';
import { Colors, Fonts, Radius } from '../constants/tokens';

const DUMMY_REMINDERS: Reminder[] = [
  {
    id: 1,
    title: '비타민 복용',
    dday: 0,
    ddayLabel: 'D-DAY',
    next: '오늘 오후 9시 알림',
    urgency: 'red',
    recurring: true,
  },
  {
    id: 2,
    title: '계약서 제출 마감',
    dday: 3,
    ddayLabel: 'D-3',
    next: '내일 오전 9시 알림',
    urgency: 'amber',
  },
  {
    id: 3,
    title: '자동차 정기검사',
    dday: 12,
    ddayLabel: 'D-12',
    next: '5월 17일 오전 10시 알림',
    urgency: 'green',
  },
];

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

function NavTab({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={navStyles.tab} onPress={onPress} activeOpacity={0.7}>
      {icon}
      <Text style={[navStyles.tabLabel, active && navStyles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function HomeScreen({ onAddPress }: { onAddPress: () => void }) {
  return (
    <View style={styles.root}>
      <View style={styles.ambientGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.wordmark}>
                Pingo<Text style={styles.wordmarkDot}>.</Text>
              </Text>
              <Text style={styles.subtitle}>잊지 않을게요</Text>
            </View>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
              <Text style={{ fontSize: 18, color: Colors.text }}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={styles.statsRow}>
            <StatCard label="활성 알림" value="3" unit="개" />
            <StatCard
              label="다음 알림까지"
              value="4"
              unit="시간 12분"
              valueColor={Colors.accent}
            />
          </View>

          {/* Section label */}
          <Text style={styles.sectionLabel}>예정된 일정</Text>

          {/* Reminder cards */}
          <View style={styles.cardList}>
            {DUMMY_REMINDERS.map((r) => (
              <ReminderCard key={r.id} r={r} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating + button */}
      <View style={styles.fabWrap} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={0.85} onPress={onAddPress}>
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

      {/* Bottom nav */}
      <View style={styles.navWrap} pointerEvents="box-none">
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} tint="dark" style={styles.navBar}>
            <NavTabRow onAddPress={onAddPress} />
          </BlurView>
        ) : (
          <View style={[styles.navBar, styles.navBarAndroid]}>
            <NavTabRow onAddPress={onAddPress} />
          </View>
        )}
      </View>
    </View>
  );
}

function NavTabRow({ onAddPress }: { onAddPress: () => void }) {
  return (
    <>
      <NavTab
        label="홈"
        active
        icon={<Text style={{ fontSize: 20, color: Colors.accent }}>⌂</Text>}
      />
      <NavTab
        label="추가"
        onPress={onAddPress}
        icon={<Text style={{ fontSize: 20, color: Colors.textSec }}>+</Text>}
      />
      <NavTab
        label="설정"
        icon={<Text style={{ fontSize: 20, color: Colors.textSec }}>⚙</Text>}
      />
    </>
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
    paddingBottom: 200,
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
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 110,
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
  navWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 20,
  },
  navBar: {
    height: 68,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  navBarAndroid: {
    backgroundColor: 'rgba(22,22,30,0.92)',
  },
});

const navStyles = StyleSheet.create({
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontFamily: Fonts.text,
    fontSize: 10.5,
    fontWeight: '500',
    color: Colors.textSec,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '600',
    color: Colors.accent,
  },
  bellWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
