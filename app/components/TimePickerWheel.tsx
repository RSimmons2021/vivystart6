import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface TimePickerWheelProps {
  value: string;
  onChange: (value: string) => void;
}

const hours12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const minutes = Array.from({ length: 60 }, (_, i) => i);
const meridiems = ['AM', 'PM'];

const TimePickerWheel: React.FC<TimePickerWheelProps> = ({ value, onChange }) => {
  // Parse value ("HH:MM AM/PM")
  let hour = 8, minute = 0, meridiem = 'AM';
  if (value) {
    const match = value.match(/^(\d{1,2}):(\d{2}) ?(AM|PM)?$/i);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
      if (match[3]) meridiem = match[3].toUpperCase();
      // Convert 24h to 12h
      if (!match[3] && hour >= 12) {
        meridiem = hour >= 12 && hour < 24 ? 'PM' : 'AM';
        hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      }
    }
  }

  // Fix: Always fire onChange for initial value (8:00 AM) on mount
  React.useEffect(() => {
    if (!value) {
      onChange('08:00 AM');
    }
  }, []); // Only run once on mount

  const handleChange = (h: number, m: number, mer: string) => {
    // Convert to string and pass up
    onChange(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${mer}`);
  };

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={hour}
        style={styles.picker}
        onValueChange={h => handleChange(h, minute, meridiem)}
      >
        {hours12.map(h => (
          <Picker.Item key={h} label={h.toString()} value={h} />
        ))}
      </Picker>
      <Text style={styles.colon}>:</Text>
      <Picker
        selectedValue={minute}
        style={styles.picker}
        onValueChange={m => handleChange(hour, m, meridiem)}
      >
        {minutes.map(m => (
          <Picker.Item key={m} label={m.toString().padStart(2, '0')} value={m} />
        ))}
      </Picker>
      <Picker
        selectedValue={meridiem}
        style={styles.pickerMeridiem}
        onValueChange={mer => handleChange(hour, minute, mer)}
      >
        {meridiems.map(mer => (
          <Picker.Item key={mer} label={mer} value={mer} />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  picker: {
    width: 80,
    height: 180,
  },
  pickerMeridiem: {
    width: 80,
    height: 180,
  },
  colon: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
});

export default TimePickerWheel;
