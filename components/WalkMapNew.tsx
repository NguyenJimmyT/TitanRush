// components/WalkMap.tsx
import Maps, { Marker, Polyline } from "@/components/Map";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Coordinate = {
  latitude: number;
  longitude: number;
};

interface WalkMapProps {
  buildingName: string;
  start: Coordinate; // parking structure
  end: Coordinate;   // destination building
}

const WalkMap: React.FC<WalkMapProps> = ({ buildingName, start, end }) => {
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapRef = useRef<any>(null);

  useEffect(() => {
    const fetchWalkRoute = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 👇 change this IP to your machine's LAN IP
        const response = await fetch("http://192.168.0.123:8001/walk-route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            building_name: buildingName,
            start_lat: start.latitude,
            start_lon: start.longitude,
            dest_lat: end.latitude,
            dest_lon: end.longitude,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Backend error");
        }

        const data = await response.json();

        const safeRoute: Coordinate[] = (data.route || [])
          .map((p: any) => ({
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
          }))
          .filter(
            (p: Coordinate) => !isNaN(p.latitude) && !isNaN(p.longitude)
          );

        if (!safeRoute.length) {
          throw new Error("No route returned from backend.");
        }

        setRouteCoords(safeRoute);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Failed to load walking route.");
      } finally {
        setIsLoading(false);
      }
    };

    if (start && end) {
      fetchWalkRoute();
    }
  }, [buildingName, start, end]);

  // Fit map to route
  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current && isMapReady) {
      setTimeout(() => {
        if (mapRef.current.fitToCoordinates) {
          mapRef.current.fitToCoordinates(routeCoords, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }, 100);
    }
  }, [routeCoords, isMapReady]);

  const startPoint = routeCoords[0] ?? start;
  const endPoint = routeCoords[routeCoords.length - 1] ?? end;

  const initialRegion =
    startPoint && endPoint
      ? {
          latitude: (startPoint.latitude + endPoint.latitude) / 2,
          longitude: (startPoint.longitude + endPoint.longitude) / 2,
          latitudeDelta: Math.abs(startPoint.latitude - endPoint.latitude) + 0.002,
          longitudeDelta: Math.abs(startPoint.longitude - endPoint.longitude) + 0.002,
        }
      : undefined;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF7900" />
        <Text style={{ marginTop: 8 }}>Loading walking route…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <Maps
        ref={mapRef}
        initialRegion={initialRegion}
        onMapReady={() => setIsMapReady(true)}
      >
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#00FF00" strokeWidth={4} />
        )}

        {startPoint && (
          <Marker coordinate={startPoint} title="Parking Structure">
            <View style={styles.circleContainer}>
              <View style={[styles.circle, styles.startCircle]} />
            </View>
          </Marker>
        )}

        {endPoint && (
          <Marker coordinate={endPoint} title={buildingName}>
            <View style={styles.circleContainer}>
              <View style={[styles.circle, styles.endCircle]} />
            </View>
          </Marker>
        )}
      </Maps>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    borderRadius: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  circleContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  startCircle: {
    backgroundColor: "#22c55e",
  },
  endCircle: {
    backgroundColor: "#ef4444",
  },
});

export default WalkMap;
