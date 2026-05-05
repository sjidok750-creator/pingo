import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './screens/HomeScreen';
import { ReminderProvider } from './lib/reminderStore';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ReminderProvider>
        <StatusBar style="light" />
        <HomeScreen />
      </ReminderProvider>
    </ErrorBoundary>
  );
}
