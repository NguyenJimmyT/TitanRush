import React, { forwardRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';

/**
 * Web implementation of the Map component.
 * This file is loaded AUTOMATICALLY by Expo when running on the web.
 * * Since we DO NOT import 'react-native-maps' here, the web build won't crash.
 */
const Maps = forwardRef((props: any, ref: any) => {
  return(
    <View style={styles.container}>
      <Text style={styles.text}>Maps are currently supported on Mobile only.</Text>
      <Text style={styles.subText}>Web-based maps coming soon.</Text>
    </View>
  )
})

Maps.displayName = 'Maps'

export const Marker = (props: any) => null
export const Polyline = (props: any) => null

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    minHeight: 200,
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});

export default Maps