import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius } from '../constants/tokens';

export type Urgency = 'red' | 'amber' | 'green';

export interface Reminder {
  id: number;
  title: string;
  dday: number;
  ddayLabel: string;
  next: string;
  urgency: Urgency;
  recurring?: boolean;
}

const urgencyColor: Record<Urgency, string> = {
  red: Colors.red,
  amber: Colors.amber,
  green: Colors.green,
};

const urgencyGlow: Record<Urgency, string> = {
  red: 'rgba(255,107,107,0.18)',
  amber: 'rgba(247,151,30,0.14)',
  green: 'rgba(67,233,123,0.10)',
};

function RepeatIcon() {
  return (
    <View style={styles.repeatIcon}>
      <View style={[styles.repeatLine, { borderColor: Colors.textTer }]} />
    </View>
  );
}

export function ReminderCard({ r }: { r: Reminder }) {
  const accent = urgencyColor[r.urgency];
  const glowColor = urgencyGlow[r.urgency];
  const ddayFontSize = r.dday === 0 ? 22 : 30;

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[Colors.card, Colors.cardElev]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Left color bar */}
        <View
          style={[
            styles.colorBar,
            {
              backgroundColor: accent,
              shadowColor: glowColor,
            },
          ]}
        />

        {/* Top row: title + D-day */}
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {r.title}
            </Text>
            {r.recurring && (
              <View style={styles.recurringRow}>
                <RepeatIcon />
                <Text style={styles.recurringText}>매일 반복</Text>
              </View>
            )}
          </View>
          <Text style={[styles.dday, { color: accent, fontSize: ddayFontSize }]}>
            {r.ddayLabel}
          </Text>
        </View>

        {/* Next alert chip */}
        <View style={styles.alertChip}>
          <View style={styles.alertBellWrap}>
            <Text style={[styles.bellEmoji, { color: Colors.accent }]}>🔔</Text>
          </View>
          <Text style={styles.alertText}>{r.next}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: Radius.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  card: {
    borderRadius: Radius.card,
    paddingTop: 20,
    paddingBottom: 18,
    paddingLeft: 24,
    paddingRight: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 4,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 6,
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringText: {
    fontFamily: Fonts.text,
    fontSize: 11,
    color: Colors.textTer,
  },
  dday: {
    fontFamily: Fonts.display,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.8,
    flexShrink: 0,
  },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(108,99,255,0.18)',
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 8,
  },
  alertBellWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellEmoji: {
    fontSize: 10,
    lineHeight: 12,
  },
  alertText: {
    fontFamily: Fonts.text,
    fontSize: 12,
    fontWeight: '500',
    color: '#A8A2FF',
    letterSpacing: -0.1,
  },
  repeatIcon: {
    width: 11,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatLine: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderRadius: 2,
  },
});
