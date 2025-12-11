import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform
} from 'react-native'

interface TimeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (timeString: string) => void;
  title?: string;
  subtitle?: string;
}

export default function TimeSelectorModal({
  visible,
  onClose,
  onConfirm,
  title = 'Arrival Time',
  subtitle = 'Please select your desired arrival time.'
}: TimeSelectorModalProps) {

  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (visible) {
      const now = new Date();
      let currentHour = now.getHours();
      const isPm = currentHour >= 12;

      if (currentHour > 12) currentHour -= 12;
      if (currentHour === 0) currentHour = 12;

      let nextMin = Math.ceil(now.getMinutes() / 5) * 5;
      if (nextMin >= 60) {
        nextMin = 0;
        currentHour = currentHour === 12 ? 1 : currentHour + 1;
      }

      setHour(currentHour);
      setMinute(nextMin);
      setPeriod(isPm ? 'PM' : 'AM');
    }
  }, [visible])

  const incrementHour = () => setHour(h => h === 12 ? 1 : h + 1);
  const decrementHour = () => setHour(h => h === 1 ? 12 : h - 1);

  const incrementMin = () => setMinute(m => m >= 55 ? 0 : m + 5);
  const decrementMin = () => setMinute(m => m <= 0 ? 55 : m - 5);

  const togglePeriod = () => setPeriod(p => p === 'AM' ? 'PM' : 'AM');

  const formatMin = (m: number) => m.toString().padStart(2, '0');

  const handleConfirm = () => {
    const timeString = `${hour}:${formatMin(minute)} ${period}`;
    onConfirm(timeString)
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Pressable>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalSubtitle}>{subtitle}</Text>

            {/* Time Picker Controls */}
            <View style={styles.pickerContainer}>
              
              {/* Hour Column */}
              <View style={styles.pickerColumn}>
                <TouchableOpacity onPress={incrementHour} style={styles.arrowButton}>
                  <Text style={styles.arrowText}>▲</Text>
                </TouchableOpacity>
                <Text style={styles.timeText}>{hour}</Text>
                <TouchableOpacity onPress={decrementHour} style={styles.arrowButton}>
                  <Text style={styles.arrowText}>▼</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.colon}>:</Text>

              {/* Minute Column */}
              <View style={styles.pickerColumn}>
                <TouchableOpacity onPress={incrementMin} style={styles.arrowButton}>
                  <Text style={styles.arrowText}>▲</Text>
                </TouchableOpacity>
                <Text style={styles.timeText}>{formatMin(minute)}</Text>
                <TouchableOpacity onPress={decrementMin} style={styles.arrowButton}>
                  <Text style={styles.arrowText}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* AM/PM Column */}
              <View style={[styles.pickerColumn, styles.periodColumn]}>
                <TouchableOpacity onPress={togglePeriod} style={styles.periodButton}>
                  <Text style={[styles.periodText, period === 'AM' && styles.periodActive]}>AM</Text>
                </TouchableOpacity>
                <View style={styles.periodDivider} />
                <TouchableOpacity onPress={togglePeriod} style={styles.periodButton}>
                  <Text style={[styles.periodText, period === 'PM' && styles.periodActive]}>PM</Text>
                </TouchableOpacity>
              </View>

            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#18181b',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 24,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    padding: 16,
  },
  pickerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  arrowButton: {
    padding: 8,
  },
  arrowText: {
    fontSize: 18,
    color: '#52525b',
  },
  timeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#18181b',
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  colon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#18181b',
    marginHorizontal: 8,
    paddingBottom: 4,
  },
  periodColumn: {
    marginLeft: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    paddingVertical: 4,
    width: 60,
  },
  periodButton: {
    paddingVertical: 6,
    width: '100%',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  periodActive: {
    color: '#2563eb',
    fontWeight: '800',
  },
  periodDivider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    width: '80%',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f4f4f5',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#52525b',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});