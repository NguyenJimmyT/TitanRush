import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';

interface GridItem {
  id: string;
  title: string;
}

const DATA: GridItem[] = [
  { id: '1', title: 'Eastside North' },
  { id: '2', title: 'Eastside South' },
  { id: '3', title: 'Nutwood' },
  { id: '4', title: 'State College Structure' },
  { id: '5', title: 'A & G' },
];

const spacing = 6; 

export default function building() { 
  const router = useRouter();

  const handlePress = (item: GridItem) => {
    console.log(`Navigating to result with item: ${item.title}`);
    router.push({
      pathname: '/result',
      params: { id: item.id, parking: item.title },
    });
  };

  const renderGridItem = ({ item }: ListRenderItemInfo<GridItem>) => (
    <View style={styles.itemContainer}>
      <Button title={item.title} onPress={() => handlePress(item)} />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Titan Rush'}} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <Text style={styles.heading}>Please choose a Parking Structure.</Text>
          {/* <Text style={styles.instruction}>Click on an option below to begin calculation.</Text> */}

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
});

