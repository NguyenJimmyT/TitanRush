import Button from '@/components/Button';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GridItem {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
}

const DATA = [
  {
    id: "1",
    title: "Eastside North",
    latitude: 33.881009299648376,
    longitude: -117.88180150382846,
  },
  {
    id: "2",
    title: "Eastside South",
    latitude: 33.880301186357116,
    longitude: -117.88175590627496,
  },
  {
    id: "3",
    title: "Nutwood",
    latitude: 33.879076621297024,
    longitude: -117.88856209432365,
  },
  {
    id: "4",
    title: "State College Structure",
    latitude: 33.883140284399985,
    longitude: -117.88861163250014,
  },
  {
    id: "5",
    title: "A & G",
    latitude: 33.8795,
    longitude: -117.8859,
  },
];


const spacing = 6;

export default function Building() {
  const router = useRouter();

  const handlePress = (item: GridItem) => {
    router.push({
      pathname: "/result",
      params: {
        buildingName: item.title,
        buildingLat: String(item.latitude),
        buildingLon: String(item.longitude),
      },
    });
  };

  const renderGridItem = ({ item }: ListRenderItemInfo<GridItem>) => (
    <View style={styles.itemContainer}>
      <Button title={item.title} onPress={() => handlePress(item)} />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Titan Rush' }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <Text style={styles.heading}>
            Please choose a destination (building / structure).
          </Text>

          <FlatList
            data={DATA}
            renderItem={renderGridItem}
            keyExtractor={(item: GridItem) => item.id}
            numColumns={2}
            style={styles.flatList}
            contentContainerStyle={{ padding: spacing }}
          />
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
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#18181b',
    paddingHorizontal: spacing * 2,
    marginBottom: 16,
  },
  flatList: {
    flex: 1,
    paddingTop: 18,
  },
  itemContainer: {
    flex: 1,
    margin: spacing,
  },
});
