import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../constants/tokens';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (typeof console !== 'undefined') {
      console.error('Pingo render error:', error, info?.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.root}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>앗, 화면을 그리는 중 오류가 발생했어요</Text>
            <Text style={styles.message}>{this.state.error.message}</Text>
            {this.state.error.stack ? (
              <Text style={styles.stack}>{this.state.error.stack}</Text>
            ) : null}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 24, paddingTop: 80 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  message: {
    fontFamily: Fonts.text,
    fontSize: 14,
    color: '#FF8B7A',
    marginBottom: 14,
  },
  stack: {
    fontFamily: 'Menlo, monospace' as any,
    fontSize: 11,
    color: Colors.textSec,
    lineHeight: 16,
  },
});
