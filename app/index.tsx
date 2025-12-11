import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ListRenderItemInfo,
  Alert,
  Modal,
  TouchableOpacity,
  Platform,
  Pressable,
  ActivityIndicator,
  Linking
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import * as Location from 'expo-location'

interface GridItem {
  id: string;
  title: string;
  searchPattern: string;
}

const PARKING_DATA: GridItem[] = [
  { id: 'eastsideNorth', title: 'Eastside North', searchPattern: 'GridView_All_Label_AllSpots_2' },
  { id: 'eastsideSouth', title: 'Eastside South', searchPattern: 'GridView_All_Label_AllSpots_3' },
  { id: 'nutwood', title: 'Nutwood', searchPattern: 'GridView_All_Label_AllSpots_0' },
  { id: 'stateCollege', title: 'State College Structure', searchPattern: 'GridView_All_Label_AllSpots_1' },
  { id: 'lotAG', title: 'Lot A & G', searchPattern: 'GridView_All_Label_AllSpots_4' },
];

const spacing = 6;

export default function IndexScreen() {
  const router = useRouter();

  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)

  const [parkingSpots, setParkingSpots] = useState<Record<string, number>>({});
  const [isLoadingParking, setLoadingParking] = useState(true);

  useEffect(()=>{
    requestLocation();
    fetchParkingCounts();
  }, [])

  const fetchParkingCounts = async () => {
    setLoadingParking(true);
    try{
      const response = await fetch('https://parking.fullerton.edu/parkinglotcounts/mobile.aspx');
      const html = await response.text();

      const counts: Record<string, number> = {};

      PARKING_DATA.forEach(item => {
        const regex = new RegExp(`id="${item.searchPattern}">(\\d+)</span>`);
        const match = html.match(regex);
        if (match && match[1]){
          counts[item.id] = parseInt(match[1], 10);
        }
      });

      setParkingSpots(counts);
    } catch (e) {
      console.log("Failed to fetch parking spot availability: ",e)
    } finally {
      setLoadingParking(false);
    }
  }
  
  const requestLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null)

    try{
      console.log("Requesting Location Permissions...")

      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Permission Status:",status)

      if (status !== 'granted'){
        setLocationError('Permission denied. Please enable in settings.');
        setIsLoadingLocation(false);
        return
      }

      console.log("Getting current position...");
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(locationResult);
      console.log("... Done!")
    } catch (e: any) {
      console.error("Location Error:", e);
      setLocationError(e.message || 'Error fetching location');
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handlePress = (item: GridItem) => {
    if (isLoadingLocation) {
      Alert.alert("Please wait", "Determining your location...");
      return;
    }

    router.push({
      pathname: '/building',
      params: {
        parkingId: item.id,
        parkingName: item.title,
        userLat: location?.coords.latitude,
        userLong: location?.coords.longitude,
      },
    });
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const renderGridItem = ({ item }: ListRenderItemInfo<GridItem>) => {
    const count = parkingSpots[item.id]
    
    return(
      <View style={styles.itemContainer}>
        <Button title={item.title} onPress={() => handlePress(item)} />
        {/* TODO: Possibly add live data on available spaces */}
        <View style={{marginTop: 6, alignItems: 'center',justifyContent:'center',height:20}}>
          {isLoadingParking ? (
            <ActivityIndicator size="small" color='#00244e' />
          ) : count !== undefined ? (
            <Text style={{fontSize: 12}}>
              <Text style={{ fontWeight: '700', color: count > 0 ? '#16a34a' : '#dc2626' }}>
                {count}
              </Text>
              <Text style={{ color: '#71717a' }}> spaces available.</Text>
            </Text>
          ) : (
            <Text style={{fontSize: 12, color: '#a1a1aa', fontStyle: 'italic'}}>Offline</Text>
          )}
        </View>
      </View>
    )
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Titan Rush',
          headerStyle: {
            backgroundColor: '#00244e'
          },
          headerTitleStyle: { color: 'white' },
          headerTintColor:'white',
          headerTitleAlign: 'center',
        }}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>

          <View style={styles.contentContainer}>
            {isLoadingLocation && (
              <View style={styles.locationStatus}>
                <ActivityIndicator size={'small'} color='#FF7900' />
                <Text>Getting current location...</Text>
              </View>
            )}
            {!isLoadingLocation && !locationError && (
              <View style={{flex: 1}}>
                <Text style={styles.heading}>Select a desired parking structure.</Text>

                <FlatList
                  data={PARKING_DATA}
                  renderItem={renderGridItem}
                  keyExtractor={(item: GridItem) => item.id}
                  numColumns={2}
                  style={styles.flatList}
                  contentContainerStyle={{ padding: spacing }}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
            {!isLoadingLocation && locationError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {locationError}
                </Text>

                {locationError.toLowerCase().includes('denied') && (
                  <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
                    <Text style={styles.settingsText}> Open Settings</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={requestLocation} style={styles.retryButton}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  instruction: {
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
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing * 2,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#717171a',
    fontWeight: '500',
    paddingHorizontal: spacing * 2,
  },
  errorContainer:{
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingsButton: {
    backgroundColor: '#00244e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  retryButton: {
    paddingVertical: 12,
  },
  retryText: {
    color: '#00244e',
    fontWeight: '500',
    fontSize: 16
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#00244e',
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderBottomWidth: 2,
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