import { useLocalSearchParams, router, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import Maps, {Marker} from "@/components/Map";
import * as Location from "expo-location"


export default function result() {
    const params = useLocalSearchParams<{ title: string }>();
    


    return(
        <>
            <Stack.Screen options={{ title: `Navigation to ${params.title? params.title : ""}`}}/>
            <View style={styles.container}>
                <Text>{params.title ? params.title : "Dummy Text"}</Text>
            </View>
            <View style={styles.mapContainer}>
                <Maps
                //provider={PROVIDER_GOOGLE} 
                style={styles.map}
                initialRegion={{
                    latitude: 33.88252,
                    longitude: -117.88506,
                    latitudeDelta: 0.0022,
                    longitudeDelta: 0.0121
                }}>
                    <Marker
                        coordinate={{latitude: 33.88252, longitude: -117.88506}}
                        title="CSUF">

                    </Marker>
                </Maps>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        // justifyContent: "center",
        alignItems: "center",
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
})