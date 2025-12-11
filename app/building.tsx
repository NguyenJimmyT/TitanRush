import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ListRenderItemInfo,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import TimeSelectorModal from '@/components/TimeSelectorModal';

interface GridItem {
    id: string;
    title: string;
}

const BUILDING_DATA: GridItem[] = [
    { id: 'mcCarthy', title: 'McCarthy Hall' },
    { id: 'pollak', title: 'Pollak Library' },
    { id: 'titanSU', title: 'Titan Student Union' },
    { id: 'kinesiology', title: 'Kinesiology' },
    { id: 'ecs', title: 'Engineering & Computer Science' },
    { id: 'education', title: 'Education Classroom' },
    { id: 'business', title: 'College of Business' },
    { id: 'langsdorf', title: 'Langsdorf Hall' },
    { id: 'danBlack', title: 'Dan Black Hall' },
    { id: 'mihaylo', title: 'Mihaylo Hall' },
    { id: 'humanities', title: 'Humanities' },
    { id: 'gordon', title: 'Gordon Hall' }
];

const spacing = 6;

export default function BuildingScreen() {
    const router = useRouter();

    const { parkingId, parkingName, userLat, userLong } = useLocalSearchParams();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<GridItem | null>(null);

    const handlePress = (item: GridItem) => {
        setSelectedBuilding(item);
        setModalVisible(true)
    }

    const handleConfirmTime = (timeString: string) => {
        setModalVisible(false);

        if (selectedBuilding) {
            router.push({
                pathname: '/result',
                params: {
                    parkingId: parkingId,
                    parkingName: parkingName,
                    buildingId: selectedBuilding.id,
                    buildingName: selectedBuilding.title,
                    desiredTime: timeString,
                    userLat: userLat,
                    userLong: userLong
                },
            });
        }
    };

    const renderGridItem = ({ item }: ListRenderItemInfo<GridItem>) => (
        <View style={styles.itemContainer}>
            <Button title={item.title} onPress={() => handlePress(item)} />
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Building Selection',
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
                        <Text style={styles.heading}>Select your destination.</Text>

                        <FlatList
                            data={BUILDING_DATA}
                            renderItem={renderGridItem}
                            keyExtractor={(item: GridItem) => item.id}
                            numColumns={2}
                            style={styles.flatList}
                            contentContainerStyle={{ padding: spacing }}
                            showsVerticalScrollIndicator={true}
                        />
                    </View>

                    <TimeSelectorModal
                        visible={modalVisible}
                        onClose={() => setModalVisible(false)}
                        onConfirm={handleConfirmTime}
                        subtitle={`When do you need to be at ${selectedBuilding?.title}?`}
                    />

                </View>
            </SafeAreaView>
        </>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f4f4f5',
    },
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    contentContainer: {
        flex: 1,
        paddingTop: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: '600',
        color: '#18181b',
        paddingHorizontal: spacing * 2,
        marginBottom: 4,
    },
    subHeading: {
        fontSize: 14,
        fontWeight: '500',
        color: '#71717a',
        paddingHorizontal: spacing * 2,
        marginBottom: 16,
    },
    flatList: {
        flex: 1,
    },
    itemContainer: {
        flex: 1,
        margin: spacing,
    },
});