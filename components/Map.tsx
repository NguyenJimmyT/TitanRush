import React, {forwardRef} from "react";
import { ViewStyle, StyleSheet, Text, Platform } from "react-native";
import MapView, { MapViewProps, Marker as NMarker, Circle as NCircle , Polyline as NPolyline, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from 'expo-location'
import { AppleMaps, GoogleMaps } from 'expo-maps'

interface MapProps extends MapViewProps {
    style?: ViewStyle
}

const Maps = forwardRef<MapView, MapProps>((props, ref) => {
    return( 
        <MapView
            ref={ref}
            {...props}
            style={[styles.map, props.style]}
        >
            {props.children}
        </MapView>
    )
})

Maps.displayName = 'Maps'


export const Marker = NMarker;
export const Polyline = NPolyline
export const Circle = NCircle

const styles=StyleSheet.create({
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
})

export default Maps