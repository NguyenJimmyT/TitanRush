// frontend/CampusMap.tsx
import React from "react";
import { View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";

type CampusPoint = {
  id: string;
  name: string;
  type: "building" | "parking";
  latitude: number;
  longitude: number;
};

const csufCenter = {
  latitude: 33.879,     // center-ish of CSUF campus (approx)
  longitude: -117.886,  // approx
};

const campusPoints: CampusPoint[] = [
  // ==== Parking Structures ====
  {
    id: "nutwood-ps",
    name: "Nutwood Parking Structure",
    type: "parking",
    latitude: 33.8795,
    longitude: -117.8878,
  },
  {
    id: "state-college-ps",
    name: "State College Parking Structure",
    type: "parking",
    latitude: 33.8799,
    longitude: -117.8889,
  },
  {
    id: "eastside-north-ps",
    name: "Eastside North Parking Structure",
    type: "parking",
    latitude: 33.8820,
    longitude: -117.8825,
  },
  {
    id: "eastside-south-ps",
    name: "Eastside South Parking Structure",
    type: "parking",
    latitude: 33.8808,
    longitude: -117.8825,
  },

  // ==== Sample Academic Buildings ====
  {
    id: "mihaylo",
    name: "Steven G. Mihaylo Hall",
    type: "building",
    latitude: 33.8791,
    longitude: -117.8870,
  },
  {
    id: "pollak-library",
    name: "Pollak Library",
    type: "building",
    latitude: 33.8810,
    longitude: -117.8873,
  },
  {
    id: "ecs",
    name: "Engineering & Computer Science",
    type: "building",
    latitude: 33.8814,
    longitude: -117.8858,
  },
  {
    id: "khs",
    name: "Kinesiology & Health Science",
    type: "building",
    latitude: 33.8804,
    longitude: -117.8879,
  },
];

export default function CampusMap() {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: csufCenter.latitude,
          longitude: csufCenter.longitude,
          latitudeDelta: 0.01,  // zoom level
          longitudeDelta: 0.01,
        }}
      >
        {campusPoints.map((point) => (
          <Marker
            key={point.id}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            title={point.name}
            description={
              point.type === "parking" ? "Parking Structure" : "Building"
            }
            pinColor={point.type === "parking" ? "orange" : "dodgerblue"}
          />
        ))}
      </MapView>

      {/* Overlay label for context (optional) */}
      <View
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          Cal State Fullerton – Buildings & Parking
        </Text>
      </View>
    </View>
  );
}
