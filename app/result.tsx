import { useLocalSearchParams, router, Stack } from "expo-router";
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import React, { useEffect,useState,useRef } from "react";
import Maps, { Marker, Polyline} from "@/components/Map";
import {useSafeAreaInsets} from "react-native-safe-area-context"
import JimmySON from "../assets/JSON/JimmySON.json" with { type: "json" };
import JulienSON from "../assets/JSON/JulienSON.json" with {type: "json" };

type Coordinate = {
    latitude: number;
    longitude: number;
}


export default function Result() {
    const { 
        parkingId,
        parkingName,
        buildingId,
        buildingName,
        desiredTime,
        userLat,
        userLong
    } = useLocalSearchParams()

    const insets = useSafeAreaInsets();

    const [routeCoords, setRouteCoords] = useState<{ latitude: number,longitude: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    const [leaveTime, setLeaveTime] = useState('');

    const [route, setRoute] = useState<{total_time_parking: any,distance: any, travel_time_hr: number, travel_time_minutes: number, travel_time_sec: number, route: any}>(null)
    const [walk, setWalk] = useState<{building_name: string, route: any[], total_distance_m: number, total_distance_miles: number, walk_time_hours: number, walk_time_minutes: number, walk_time_seconds: number} | null>(null)

    const mapRef = useRef<any>(null);

    const calculateLeaveTime = (arrivalStr: string, durHrs: number, durMins: number, durSecs: number) =>{
        if (!arrivalStr) return '';

        const [timePart, modifier] = arrivalStr.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number)

        if (hours === 12){
            hours = modifier === 'PM' ? 12 : 0;
        } else if (modifier === 'PM') {
            hours += 12;
        }
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(0);
        date.setHours(date.getHours() - durHrs);
        date.setMinutes(date.getMinutes() - durMins);
        date.setSeconds(date.getSeconds() - durSecs);
        let resultHours = date.getHours();
        const resultMinutes = date.getMinutes();
        const ampm = resultHours >= 12 ? 'PM' : 'AM';

        resultHours = resultHours %12;
        resultHours = resultHours ? resultHours : 12;

        const minStr = resultMinutes < 10 ? '0' + resultMinutes : resultMinutes

        return `${resultHours}:${minStr} ${ampm}`
    }

    useEffect(() => {
        const fetchRoute = async () => {
            try{
                setIsLoading(true);
                if (!parkingName || !buildingName) {
                    throw new Error('Missing destination information!');
                }

                console.log(`Fetching route to ${parkingName} `)

                const routePromise = new Promise<{total_time_parking: any,distance: any, travel_time_hr: number, travel_time_minutes: number, travel_time_sec: number, route: any}>(async (resolve,reject) => {
                    
                    try {
                        const response = await fetch('https://titanrush.onrender.com/estimate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                lat: Number(userLat),
                                long: Number(userLong),
                                dest: parkingId
                            })
                        });
                        const data = await response.json();
                        resolve(data);
                    } catch(e) { reject(e); }
                    

                });

                const buildingPromise = new Promise<{building_name: string, route: any[], total_distance_m: number, total_distance_miles: number, walk_time_hours: number, walk_time_minutes: number, walk_time_seconds: number}>(async (resolve, reject) => {
                    
                    try {
                        const response = await fetch("https://titanrush.onrender.com/walk-route", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                parking_name: parkingId,
                                building_name: buildingId
                            })
                        });
                        const data = await response.json();
                        resolve(data);
                    } catch(e) { reject(e); }
                    

                })

                const [routeData, buildingData] = await Promise.all([
                    routePromise,
                    buildingPromise
                ])
                setRoute(routeData)
                setWalk(buildingData)

                if(desiredTime) {
                    const calculatedTime = calculateLeaveTime(
                        desiredTime as string,
                        (routeData.travel_time_hr + buildingData.walk_time_hours),
                        (routeData.travel_time_minutes + buildingData.walk_time_minutes),
                        (routeData.travel_time_sec + buildingData.walk_time_seconds)
                    );
                    setLeaveTime(calculatedTime)
                }

                const polyLineCoords = routeData.route.routes[0].legs[0].points

                const safeData: Coordinate[] = polyLineCoords.map((point: { latitude: any; longitude: any; }) => ({
                    latitude: Number(point.latitude),
                    longitude: Number(point.longitude),
                })).filter((point: { latitude: number; longitude: number; }) => !isNaN(point.latitude) && !isNaN(point.longitude));

                setRouteCoords(safeData);
            } catch (err) {
                console.error("Failed: ",err)
                setError("Failed to load route.");
            } finally {
                setIsLoading(false)
            }
        };

        fetchRoute();
    }, [parkingName, buildingName, desiredTime, userLat, userLong, parkingId, buildingId]);

    useEffect(() => {
        if (routeCoords.length > 0 && mapRef.current && isMapReady){
            setTimeout(() => {
                if (mapRef.current.fitToCoordinates) {
                    mapRef.current.fitToCoordinates(routeCoords, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true,
                    });
                }
            }, 100)
        }
    }, [routeCoords, isMapReady])

    const startPoint = routeCoords.length > 0 ? routeCoords[0] : null;
    const endPoint = routeCoords.length > 0 ? routeCoords[routeCoords.length - 1] : null;

    const initialRegion = startPoint ? {
        latitude: startPoint.latitude,
        longitude: startPoint.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    } : undefined;

    const handleWalkNav = () => {
        router.push({
            pathname: '/walkResult',
            params: {
                parkingName: parkingName,
                buildingName: buildingName,
                desiredTime: desiredTime,
                userLat: userLat,
                userLong: userLong,
                route: JSON.stringify(walk?.route),
                walkHours: walk?.walk_time_hours,
                walkMins: walk?.walk_time_minutes,
                walkSecs: walk?.walk_time_seconds
            }
        })
    }

    return(
        <>
            <Stack.Screen options={{ title: `Route to ${parkingName}`, headerTintColor:'white',headerTitleAlign: 'center' ,headerStyle:{ backgroundColor: '#00244e'},headerTitleStyle:{color:'white'} }}/>

            {isLoading && (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size={"large"} color='#FF7900' />
                    <Text style={{ marginTop: 10}}>Calculating Route...</Text>
                </View>
            )}

            {!isLoading && error && (
                <View style={styles.centerContainer}>
                    <Text style={{color:'red'}}>{error}</Text>
                </View>
            )}

            {!isLoading && !error &&(

                <>
                    <View style={styles.mapContainer}>
                        <Maps
                            ref={mapRef}
                            initialRegion={initialRegion}
                            onMapReady={() => setIsMapReady(true)}
                            showsUserLocation={true}
                        >
                            {routeCoords.length > 0 && (
                            <Polyline 
                                coordinates={routeCoords}
                                strokeColor="#FF7900"
                                strokeWidth={4}
                            />
                            )}

                            {endPoint && (
                                <Marker coordinate={endPoint}/>
                            )}
                            
                        </Maps>
                    </View>
                    
                    <View style={styles.headerContainer}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerItem}>
                                <Text style={styles.headerLabel}>Estimated arrival by:</Text>
                                <Text style={styles.headerTime}>{desiredTime || '--:--'}</Text>
                            </View>

                            <View style={styles.headerDivider} />

                            <View style={styles.headerItem}>
                                <Text style={styles.headerLabel}>Leave by:</Text>
                                <Text style={styles.headerTime}>{leaveTime || '--:--'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.footerContainer, {paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <Text style={styles.headerLabel}>
                            Estimated Parking time:
                        </Text>
                        <Text style={styles.headerTime}>{route.total_time_parking+" mins" ||'--:--'}</Text>

                        <TouchableOpacity style={styles.walkButton} onPress={handleWalkNav}>
                            <Text style={styles.walkButtonText}>Navigate to Class</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: "center",
        // alignItems: "center",
        position: 'relative'
    },
    centerContainer:{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    circleContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    circle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.3,
        shadowRadius: 1.5,
        elevation: 2,
    },
    startCircle: {
        backgroundColor: '#34C759',
    },
    endCircle: {
        backgroundColor: '#FF3B30'
    },
    mapContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },

    headerContainer: {
        backgroundColor: '#00244e',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius:24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    headerRow:{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    headerItem:{
        alignItems:'center'
    },
    headerDivider:{
        width:1,
        height: '80%',
        backgroundColor:'#e4e4e7',
        marginHorizontal: 16,
    },
    headerLabel: {
        fontSize:12,
        color: 'white',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    headerTime: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ff7900',
        fontVariant: ['tabular-nums'],
    },
    footerContainer: {
        backgroundColor: '#00244e',
        paddingTop: 20,
        paddingHorizontal: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width:0,height:-4},
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    walkButton: {
        backgroundColor: '#F47900',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30
    },
    walkButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16
    },
})