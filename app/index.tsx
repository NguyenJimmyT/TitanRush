import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ListRenderItemInfo,
  Modal,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';

interface GridItem {
  id: string;
  title: string;
}

const PARKING_DATA: GridItem[] = [
  { id: '1', title: 'Eastside North' },
  { id: '2', title: 'Eastside South' },
  { id: '3', title: 'Nutwood' },
  { id: '4', title: 'State College Structure' },
  { id: '5', title: 'Lot A & G' },
];

const BUILDING_DATA: GridItem[] = [
  { id: 'b1', title: 'McCarthy Hall'},
  { id: 'b2', title: 'Pollak Library'},
  { id: 'b3', title: 'Titan Student Union'},
  { id: 'b4', title: 'Kinesiology'},
  { id: 'b5', title: 'Engineering & Computer Science'},
  { id: 'b6', title: 'Education Classroom'},
  { id: 'b7', title: 'College of Business'},
  { id: 'b8', title: 'Langsdorf Hall'},
  { id: 'b9', title: 'Dan Black Hall'},
  { id: 'b10', title: 'Mihaylo Hall'},
  { id: 'b11', title: 'Humanities'},
  { id: 'b12', title: 'Gordon Hall'}
]

const spacing = 6; 

export default function IndexScreen() { 
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'parking' | 'buildings'>('parking')

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GridItem | null>(null)

  const [hour, setHour] = useState(9);
  const [minute,setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  const currentData = activeTab === 'parking' ? PARKING_DATA : BUILDING_DATA;
  const headerText = activeTab === 'parking' ? 'Please choose a Parking Structure' : 'Please choose a Building';

  const incrementHour = () => setHour(h => h === 12 ? 1 : h + 1);
  const decrementHour = () => setHour(h => h === 1 ? 12 : h - 1);

  const incrementMin = () => setMinute(m => m >= 55 ? 0 : m + 5);
  const decrementMin = () => setMinute(m => m <= 0 ? 55 : m - 5);

  const togglePeriod = () => setPeriod(p => p === 'AM' ? 'PM' : 'AM');

  const formatMin = (m: number) => m.toString().padStart(2, '0');

  const handlePress = (item: GridItem) => {
    setSelectedItem(item);
    const now = new Date();
    let currentHour = now.getHours();
    const isPm = currentHour >= 12;
    if (currentHour > 12) currentHour -= 12;
    if (currentHour === 0) currentHour = 12;

    setHour(currentHour);
    setMinute(Math.ceil(now.getMinutes() / 5) * 5 >= 60 ? 0 : Math.ceil(now.getMinutes() / 5) * 5);
    setPeriod(isPm ? 'PM' : 'AM');

    setModalVisible(true);
  };

  const handleConfirmTime = () => {
    setModalVisible(false);

    if (selectedItem) {
      const timeString = `${hour}:${formatMin(minute)} ${period}`
      console.log(`Navigating to result with item: ${selectedItem.title} at ${timeString}`);

      router.push({
        pathname: '/result',
        params: {
          id: selectedItem.id,
          title: selectedItem.title,
          desiredTime: timeString,
          selectionType: activeTab
        }
      });
      }
  }

  const renderGridItem = ({ item }: ListRenderItemInfo<GridItem>) => (
    <View style={styles.itemContainer}>
      <Button title={item.title} onPress={() => handlePress(item)} />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Titan Rush', headerStyle:{ backgroundColor: '#00244e'},headerTitleStyle:{color:'white'}}} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          
          <View style={styles.contentContainer}>
            <Text style={styles.heading}>{headerText}</Text>
            
            <FlatList
              data={currentData}
              renderItem={renderGridItem}
              keyExtractor={(item: GridItem) => item.id}
              numColumns={2}
              style={styles.flatList}
              contentContainerStyle={{ padding: spacing }}
              showsVerticalScrollIndicator={false}
            />
          </View>
          {/* <Text style={styles.instruction}>Click on an option below to begin calculation.</Text> */}

          <View style={styles.tabBar}>
            <TouchableOpacity 
              onPress={() => setActiveTab('parking')} 
              style={[styles.tab, activeTab === 'parking' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'parking' && styles.activeTabText]}>
                Parking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('buildings')}
              style={[styles.tab, activeTab === 'buildings' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'buildings' && styles.activeTabText]}>
                Buildings
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            animationType='fade'
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >

            <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={1} style={styles.modalOverlay}>

              <TouchableWithoutFeedback>

                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Arrival Time</Text>
                  <Text style={styles.modalSubtitle}>
                    Select your desired arrival time for {selectedItem?.title}.
                  </Text>

                  <View style={styles.pickerContainer}>

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

                    <View style={styles.pickerColumn}>
                      <TouchableOpacity onPress={incrementMin} style={styles.arrowButton}>
                        <Text style={styles.arrowText}>▲</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeText}>{formatMin(minute)}</Text>
                      <TouchableOpacity onPress={decrementMin} style={styles.arrowButton}>
                        <Text style={styles.arrowText}>▼</Text>
                      </TouchableOpacity>
                    </View>

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

                  <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleConfirmTime} style={[styles.modalButton, styles.confirmButton]}>
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>

                </View>
                
              </TouchableWithoutFeedback>
            </TouchableOpacity>

          </Modal>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1, 
    backgroundColor: '#f4f4f5',
  },
  container: {
    flex: 1, 
    paddingTop: 16,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#18181b',
    paddingHorizontal: spacing * 2,
    marginBottom: 16,
  },
  instruction:{
    fontSize: 14,
    fontWeight: '400',
    paddingHorizontal: spacing * 2,
    paddingVertical: spacing * 2,
  },
  flatList: {
    flex: 1,
    paddingTop: 18,
  },
  itemContainer: {
    flex: 1, 
    margin: spacing, 
  },

  tabBar:{
    flexDirection: 'row',
    backgroundColor: '#00244e',
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent:'center',
    paddingVertical: 8,
  },
  activeTab: {
    //TODO
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  activeTabText: {
    color: '#ff7900',
    fontWeight: '700',
    borderBottomWidth:2,
    borderBottomColor: '#2563eb',
    paddingBottom: 2,
  },

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