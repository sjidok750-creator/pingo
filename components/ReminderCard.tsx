import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export function ReminderCard({ r }: { r: Reminder }) {
  const accent = urgencyColor[r.urgency];
  const ddayFontSize = r.dday === 0 ? 20 : 26;

  return (
    <View style={styles.card}>
      <View style={[styles.colorBar, { backgroundColor: accent }]} />

      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {r.title}
          </Text>
          {r.recurring && (
            <View style={styles.recurringRow}>
              <Ionicons name="repeat" size={12} color={Colors.textTer} />
              <Text style={styles.recurringText}>Daily</Text>
            </View>
          )}
        </View>
        <Text style={[styles.dday, { color: accent, fontSize: ddayFontSize }]}>
          {r.ddayLabel}
        </Text>
      </View>

      <View style={styles.alertChip}>
        <Ionicons name="notifications-outline" size={11} color={Colors.accent} />
        <Text style={styles.alertText}>{r.next}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    paddingTop: 18,
    paddingBottom: 16,
    paddingLeft: 22,
    paddingRight: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 21,
    marginBottom: 5,
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
    fontWeight: '500',
  },
  dday: {
    fontFamily: Fonts.display,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.6,
    flexShrink: 0,
  },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentSoft,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 8,
  },
  alertText: {
    fontFamily: Fonts.text,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.accent,
    letterSpacing: -0.1,
  },
});
