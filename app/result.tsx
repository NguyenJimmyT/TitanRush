import WalkMap from "@/components/WalkMapNew";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Result() {
  const {
    buildingName,
    buildingLat,
    buildingLon,
  } = useLocalSearchParams();

  // 🅿️ HARD-CODED PARKING STRUCTURE (Nutwood)
  const parkingCoord = {
    latitude: 33.879076621297024,
    longitude: -117.88856209432365,
  };

  // 🎯 Building coordinate passed in
  const buildingCoord =
    buildingLat && buildingLon
      ? {
          latitude: Number(buildingLat),
          longitude: Number(buildingLon),
        }
      : null;

  const name = (buildingName || "Selected Building").toString();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Walking Route",
          headerStyle: { backgroundColor: "#00244e" },
          headerTitleStyle: { color: "white" },
          headerTintColor: "white",
        }}
      />

      <View style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerCard}>
            <Text style={styles.headerLabel}>Walking Route To</Text>
            <Text style={styles.headerTitle}>{name}</Text>

            {buildingCoord && (
              <Text style={styles.headerSub}>
                Building @ {buildingCoord.latitude.toFixed(6)},{" "}
                {buildingCoord.longitude.toFixed(6)}
              </Text>
            )}

            <Text style={styles.headerSub}>
              Parking (Nutwood) @ {parkingCoord.latitude.toFixed(6)},{" "}
              {parkingCoord.longitude.toFixed(6)}
            </Text>
          </View>

          {!buildingCoord ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>No building coordinates provided.</Text>
              <Text style={styles.helperText}>
                Pass buildingLat & buildingLon into /result via router.push().
              </Text>
            </View>
          ) : (
            <View style={styles.mapWrapper}>
              {/* 👇 WalkMap now receives a HARDCODED start (Nutwood) & dynamic building end */}
              <WalkMap
                buildingName={name}
                start={parkingCoord}     // 🚀 ALWAYS START HERE
                end={buildingCoord}      // 🎯 Destination
              />
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  headerCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  headerLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  headerTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  headerSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
  },
  mapWrapper: {
    flex: 1,
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#020617",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    color: "#f87171",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  helperText: {
    color: "#e2e8f0",
    fontSize: 13,
    textAlign: "center",
  },
});

