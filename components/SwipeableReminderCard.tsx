import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '../constants/tokens';
import { Reminder, ReminderCard } from './ReminderCard';

const ACTION_WIDTH = 80;
const REVEAL = ACTION_WIDTH * 2; // edit + delete
const OPEN_THRESHOLD = REVEAL * 0.4;
const VELOCITY_THRESHOLD = 0.4;

export interface SwipeableReminderCardProps {
  r: Reminder;
  onEdit: () => void;
  onDelete: () => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function SwipeableReminderCard({
  r,
  onEdit,
  onDelete,
  isOpen,
  onOpen,
  onClose,
}: SwipeableReminderCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startValue = useRef(0);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isOpen ? -REVEAL : 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 18,
    }).start();
  }, [isOpen, translateX]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation((v) => {
          startValue.current = v;
        });
      },
      onPanResponderMove: (_, g) => {
        let next = startValue.current + g.dx;
        if (next > 0) next = 0;
        if (next < -REVEAL - 24) next = -REVEAL - 24; // a bit of overshoot
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const final = startValue.current + g.dx;
        const shouldOpen =
          final < -OPEN_THRESHOLD || g.vx < -VELOCITY_THRESHOLD || (isOpen && g.vx < VELOCITY_THRESHOLD && final < -OPEN_THRESHOLD);
        if (shouldOpen) {
          onOpen();
        } else {
          onClose();
        }
      },
      onPanResponderTerminate: () => {
        onClose();
      },
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      {/* Action layer (revealed when swiped) */}
      <View style={styles.actions} pointerEvents={isOpen ? 'auto' : 'none'}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          activeOpacity={0.85}
          onPress={() => {
            onClose();
            onEdit();
          }}
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          activeOpacity={0.85}
          onPress={() => {
            onClose();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Card layer (draggable) */}
      <Animated.View style={{ transform: [{ translateX }] }} {...responder.panHandlers}>
        <ReminderCard r={r} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  actions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    width: REVEAL,
  },
  actionBtn: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  editBtn: {
    backgroundColor: '#5A4A3E',
  },
  deleteBtn: {
    backgroundColor: '#B85F40',
  },
  actionLabel: {
    color: '#fff',
    fontFamily: Fonts.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
