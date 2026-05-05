import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './screens/HomeScreen';
import { AddReminderModal } from './screens/AddReminderModal';
import { RingtonePickerModal } from './screens/RingtonePickerModal';

export default function App() {
  const [addOpen, setAddOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ringtone, setRingtone] = useState('Radar');

  return (
    <>
      <StatusBar style="light" />
      <HomeScreen onAddPress={() => setAddOpen(true)} />
      <AddReminderModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        ringtone={ringtone}
        onPickRingtone={() => setPickerOpen(true)}
      />
      <RingtonePickerModal
        visible={pickerOpen}
        selected={ringtone}
        onSelect={(v) => { setRingtone(v); setPickerOpen(false); }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
