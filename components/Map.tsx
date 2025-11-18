import React from "react";
import { ViewStyle,StyleSheet } from "react-native";
import MapView, { MapViewProps, Marker as NMarker, PROVIDER_DEFAULT } from "react-native-maps";

interface MapProps extends MapViewProps {
    style?: ViewStyle
}

export default function Maps(props: MapProps) {
    return(
        <MapView
        {...props}
        style={[props.style, styles.map]}>
            {props.children}
        </MapView>
    )
}

export const Marker = NMarker;

const styles=StyleSheet.create({
    map: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
})