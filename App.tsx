import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './screens/HomeScreen';
import { ReminderProvider } from './lib/reminderStore';
import { ErrorBoundary } from './components/ErrorBoundary';

function useWebGlobalStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.setAttribute('data-pingo', 'global');
    style.textContent = `
      html, body { overflow-x: hidden; overscroll-behavior-x: none; }
      body { touch-action: pan-y; -webkit-text-size-adjust: 100%; }
      input, textarea, select { font-size: 16px !important; }
      input[type="datetime-local"] { color-scheme: dark; }
    `;
    document.head.appendChild(style);
    // Lock viewport so input focus doesn't zoom on iOS
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    return () => {
      style.remove();
    };
  }, []);
}

export default function App() {
  useWebGlobalStyles();
  return (
    <ErrorBoundary>
      <ReminderProvider>
        <StatusBar style="light" />
        <HomeScreen />
      </ReminderProvider>
    </ErrorBoundary>
  );
}
