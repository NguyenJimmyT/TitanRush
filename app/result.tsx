import { useLocalSearchParams, router, Stack } from "expo-router";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React, { useEffect,useState,useRef } from "react";
import Maps, { Marker, Polyline} from "@/components/Map";
import * as Location from "expo-location"

type Coordinate = {
    latitude: number;
    longitude: number;
}

const dummyJSON = {
    "travel_time_hr": 3,
    "travel_time_minutes": 25,
    "travel_time_sec": 12,
    "route": [
        {
            "latitude": 33.87454,
            "longitude": -117.8784
        },
        {
            "latitude": 33.8746,
            "longitude": -117.87871
        },
        {
            "latitude": 33.87463,
            "longitude": -117.8788
        },
        {
            "latitude": 33.87481,
            "longitude": -117.87875
        },
        {
            "latitude": 33.87517,
            "longitude": -117.87864
        },
        {
            "latitude": 33.8753,
            "longitude": -117.87861
        },
        {
            "latitude": 33.87539,
            "longitude": -117.87858
        },
        {
            "latitude": 33.87558,
            "longitude": -117.87852
        },
        {
            "latitude": 33.87602,
            "longitude": -117.87841
        },
        {
            "latitude": 33.87632,
            "longitude": -117.87831
        },
        {
            "latitude": 33.87681,
            "longitude": -117.87818
        },
        {
            "latitude": 33.87711,
            "longitude": -117.8781
        },
        {
            "latitude": 33.87719,
            "longitude": -117.87808
        },
        {
            "latitude": 33.87741,
            "longitude": -117.87802
        },
        {
            "latitude": 33.87747,
            "longitude": -117.878
        },
        {
            "latitude": 33.87755,
            "longitude": -117.87798
        },
        {
            "latitude": 33.87764,
            "longitude": -117.87796
        },
        {
            "latitude": 33.87782,
            "longitude": -117.87791
        },
        {
            "latitude": 33.87784,
            "longitude": -117.87801
        },
        {
            "latitude": 33.87791,
            "longitude": -117.8781
        },
        {
            "latitude": 33.87793,
            "longitude": -117.87816
        },
        {
            "latitude": 33.87799,
            "longitude": -117.87842
        },
        {
            "latitude": 33.87804,
            "longitude": -117.87864
        },
        {
            "latitude": 33.87808,
            "longitude": -117.87877
        },
        {
            "latitude": 33.87812,
            "longitude": -117.87903
        },
        {
            "latitude": 33.87817,
            "longitude": -117.87937
        },
        {
            "latitude": 33.87819,
            "longitude": -117.87965
        },
        {
            "latitude": 33.8782,
            "longitude": -117.8799
        },
        {
            "latitude": 33.8782,
            "longitude": -117.88023
        },
        {
            "latitude": 33.8782,
            "longitude": -117.88033
        },
        {
            "latitude": 33.8782,
            "longitude": -117.88041
        },
        {
            "latitude": 33.8782,
            "longitude": -117.88048
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88079
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88117
        },
        {
            "latitude": 33.87818,
            "longitude": -117.88155
        },
        {
            "latitude": 33.87818,
            "longitude": -117.88175
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88216
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88247
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88271
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88288
        },
        {
            "latitude": 33.87819,
            "longitude": -117.8833
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88367
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88415
        },
        {
            "latitude": 33.87819,
            "longitude": -117.88423
        },
        {
            "latitude": 33.87818,
            "longitude": -117.88427
        },
        {
            "latitude": 33.87818,
            "longitude": -117.88448
        },
        {
            "latitude": 33.87818,
            "longitude": -117.8849
        },
        {
            "latitude": 33.87818,
            "longitude": -117.88562
        },
        {
            "latitude": 33.87818,
            "longitude": -117.88581
        },
        {
            "latitude": 33.87818,
            "longitude": -117.886
        },
        {
            "latitude": 33.87818,
            "longitude": -117.88659
        },
        {
            "latitude": 33.87817,
            "longitude": -117.88674
        },
        {
            "latitude": 33.87817,
            "longitude": -117.88688
        },
        {
            "latitude": 33.87817,
            "longitude": -117.88709
        },
        {
            "latitude": 33.87814,
            "longitude": -117.88735
        },
        {
            "latitude": 33.87806,
            "longitude": -117.88774
        },
        {
            "latitude": 33.87801,
            "longitude": -117.88797
        },
        {
            "latitude": 33.87794,
            "longitude": -117.88823
        },
        {
            "latitude": 33.87792,
            "longitude": -117.88831
        },
        {
            "latitude": 33.87794,
            "longitude": -117.88842
        },
        {
            "latitude": 33.87786,
            "longitude": -117.88886
        },
        {
            "latitude": 33.87783,
            "longitude": -117.88912
        },
        {
            "latitude": 33.87782,
            "longitude": -117.88941
        },
        {
            "latitude": 33.87783,
            "longitude": -117.88951
        },
        {
            "latitude": 33.8779,
            "longitude": -117.88957
        },
        {
            "latitude": 33.87804,
            "longitude": -117.88957
        },
        {
            "latitude": 33.87821,
            "longitude": -117.88958
        },
        {
            "latitude": 33.87839,
            "longitude": -117.88958
        },
        {
            "latitude": 33.87845,
            "longitude": -117.88958
        },
        {
            "latitude": 33.87878,
            "longitude": -117.88959
        },
        {
            "latitude": 33.87889,
            "longitude": -117.88967
        },
        {
            "latitude": 33.87899,
            "longitude": -117.88967
        },
        {
            "latitude": 33.87906,
            "longitude": -117.88967
        },
        {
            "latitude": 33.87956,
            "longitude": -117.88967
        },
        {
            "latitude": 33.87956,
            "longitude": -117.88961
        },
        {
            "latitude": 33.87958,
            "longitude": -117.88848
        },
        {
            "latitude": 33.87937,
            "longitude": -117.88849
        },
        {
            "latitude": 33.8792,
            "longitude": -117.88849
        },
        {
            "latitude": 33.8792,
            "longitude": -117.88855
        },
    ]
};

export default function Result() {
    const { title, desiredTime, selectionType } = useLocalSearchParams()

    const [routeCoords, setRouteCoords] = useState<{ latitude: number,longitude: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    const [leaveTime, setLeaveTime] = useState('');

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
                if (!title) {
                    throw new Error('Missing destination information!');
                }

                console.log(`Fetching route to ${title} `)

                await new Promise(r => setTimeout(r, 1000));

                if(desiredTime) {
                    const calculatedTime = calculateLeaveTime(
                        desiredTime as string,
                        dummyJSON.travel_time_hr,
                        dummyJSON.travel_time_minutes,
                        dummyJSON.travel_time_sec
                    );
                    setLeaveTime(calculatedTime)
                }

                const polyLineCoords = dummyJSON.route

                const safeData: Coordinate[] = polyLineCoords.map(point => ({
                    latitude: Number(point.latitude),
                    longitude: Number(point.longitude),
                })).filter(point => !isNaN(point.latitude) && !isNaN(point.longitude));

                setRouteCoords(safeData);
            } catch (err) {
                console.error(err)
                setError("Failed to load route.");
            } finally {
                setIsLoading(false)
            }
        };

        fetchRoute();
    }, [title]);

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

    return(
        <>
            <Stack.Screen options={{ title: `Route to ${title}`, headerTintColor:'white',headerTitleAlign: 'center' ,headerStyle:{ backgroundColor: '#00244e'},headerTitleStyle:{color:'white'} }}/>

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

                    <View style={styles.mapContainer}>
                        <Maps
                            ref={mapRef}
                            initialRegion={initialRegion}
                            onMapReady={() => setIsMapReady(true)}
                        >
                            {routeCoords.length > 0 && (
                            <Polyline 
                                coordinates={routeCoords}
                                strokeColor="#00244e"
                                strokeWidth={4}
                            />
                            )}

                            {startPoint && (
                                <Marker coordinate={startPoint} anchor={{x: 0.5, y: 0.5}} title="Start">
                                    <View style={styles.circleContainer}>
                                        <View style={[styles.circle, styles.startCircle]} />
                                    </View>
                                </Marker>
                            )}

                            {endPoint && (
                                <Marker coordinate={endPoint} anchor={{ x: 0.5, y: 0.5}} title="Destination">
                                    <View style={styles.circleContainer}>
                                        <View style={[styles.circle, styles.endCircle]} />
                                    </View>
                                </Marker>
                            )}
                            
                            <Marker
                                coordinate={{latitude: 33.88252, longitude: -117.88506}}
                                title="CSUF">

                            </Marker>
                        </Maps>
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
        alignItems: "center",
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
        flex: 1,
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
        zIndex: 10
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
})