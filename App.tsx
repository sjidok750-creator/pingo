import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './screens/HomeScreen';
import { ReminderProvider } from './lib/reminderStore';

export default function App() {
  return (
    <ReminderProvider>
      <StatusBar style="light" />
      <HomeScreen />
    </ReminderProvider>
  );
}
