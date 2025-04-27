import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimePickerWheelProps {
  value: string;
  onChange: (value: string) => void;
}

function parseTimeString(time: string): Date {
  // Expects 'hh:mm AM/PM'
  const match = time.match(/^(\d{1,2}):(\d{2}) ?(AM|PM)$/i);
  let date = new Date();
  if (match) {
    let hour = parseInt(match[1], 10);
    let minute = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    date.setHours(hour, minute, 0, 0);
  } else {
    date.setHours(8, 0, 0, 0); // fallback to 8:00 AM
  }
  return date;
}

function formatTimeTo12Hour(date: Date): string {
  let hour = date.getHours();
  let minute = date.getMinutes();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

const TimePickerWheel: React.FC<TimePickerWheelProps> = ({ value, onChange }) => {
  const [show, setShow] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState(parseTimeString(value));

  React.useEffect(() => {
    setInternalDate(parseTimeString(value));
  }, [value]);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // iOS stays open, Android closes
    if (selectedDate) {
      setInternalDate(selectedDate);
      onChange(formatTimeTo12Hour(selectedDate));
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosModalContent}>
              <DateTimePicker
                value={internalDate}
                mode="time"
                display="spinner"
                onChange={handleChange}
                textColor="#000"
                style={{ backgroundColor: '#fff' }}
              />
              <TouchableOpacity style={styles.doneButton} onPress={() => setShow(false)}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}
      <TouchableOpacity style={styles.timeButton} onPress={() => setShow(true)}>
        <Text style={styles.timeButtonText}>{value || '08:00 AM'}</Text>
      </TouchableOpacity>
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={internalDate}
          mode="time"
          display="spinner"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  timeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    minWidth: 120,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '500',
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  iosModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: '#9c5dc0',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TimePickerWheel;
