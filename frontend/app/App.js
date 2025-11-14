import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import CampusMap from "./CampusMap";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <CampusMap />
    </SafeAreaView>
  );
}