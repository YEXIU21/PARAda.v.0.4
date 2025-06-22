import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import MapView from './MapView';
import { getDriverLocation, getPassengerLocation } from '@/services/socket/location.socket';
import { useTheme, getThemeColors } from '@/context/ThemeContext';
import { lightMapStyle, darkMapStyle } from '@/constants/MapStyles';

interface Location {
  latitude: number;
  longitude: number;
}

interface RideMapProps {
  rideId: string;
  driverId?: string;
  passengerId?: string;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: any;
}

const RideMap: React.FC<RideMapProps> = ({ 
  rideId,
  driverId,
  passengerId,
  initialRegion,
  style
}) => {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<Location | null>(null);
  const [mapRegion, setMapRegion] = useState(initialRegion || {
    latitude: 14.6091, // Default to Manila
    longitude: 121.0223,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Function to fetch locations from the socket service
  const fetchLocations = useCallback(() => {
    setRefreshing(true);
    setLocationError(null);
    
    try {
      if (driverId) {
        const driverLoc = getDriverLocation(driverId) as Location | null;
        setDriverLocation(driverLoc);
        
        // Center map on driver if no passenger location
        if (driverLoc && !passengerLocation) {
          setMapRegion(prev => ({
            ...prev,
            latitude: driverLoc.latitude,
            longitude: driverLoc.longitude
          }));
        }
      }
      
      if (passengerId) {
        const passengerLoc = getPassengerLocation(passengerId) as Location | null;
        setPassengerLocation(passengerLoc);
        
        // Center map on passenger if no driver location
        if (passengerLoc && !driverLocation) {
          setMapRegion(prev => ({
            ...prev,
            latitude: passengerLoc.latitude,
            longitude: passengerLoc.longitude
          }));
        }
      }
      
      // If neither location is available, try to use device location
      if (!driverLocation && !passengerLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setMapRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            });
          },
          () => {
            // Silent fail - we already have default coordinates
          }
        );
      }
      
      // If both locations are available, adjust map to show both
      if (driverLocation && passengerLocation) {
        // Calculate the midpoint
        const midLat = (driverLocation.latitude + passengerLocation.latitude) / 2;
        const midLng = (driverLocation.longitude + passengerLocation.longitude) / 2;
        
        // Calculate appropriate zoom level (delta)
        const latDelta = Math.abs(driverLocation.latitude - passengerLocation.latitude) * 1.5;
        const lngDelta = Math.abs(driverLocation.longitude - passengerLocation.longitude) * 1.5;
        
        setMapRegion({
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.max(0.05, latDelta),
          longitudeDelta: Math.max(0.05, lngDelta)
        });
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocationError('Unable to fetch location data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [driverId, passengerId, driverLocation, passengerLocation]);

  // Update locations based on socket data
  useEffect(() => {
    // Fetch locations immediately
    fetchLocations();
    
    // Set up interval to fetch locations
    const interval = setInterval(fetchLocations, 5000);
    
    return () => clearInterval(interval);
  }, [fetchLocations]);
  
  const handleRefresh = () => {
    fetchLocations();
  };

  return (
    <View style={[styles.container, style]}>
      <MapView 
        initialRegion={mapRegion}
        style={styles.map}
        showsUserLocation={!driverLocation && !passengerLocation}
        locations={{
          driver: driverLocation || undefined,
          passenger: passengerLocation || undefined
        }}
        mapStyle={isDarkMode ? darkMapStyle : lightMapStyle}
      />
      
      {/* Refresh button */}
      <TouchableOpacity 
        style={[styles.refreshButton, { backgroundColor: isDarkMode ? 'rgba(30,30,30,0.7)' : 'rgba(255,255,255,0.7)' }]} 
        onPress={handleRefresh}
        disabled={refreshing}
      >
        <FontAwesome5 
          name="sync" 
          size={16} 
          color={isDarkMode ? '#fff' : '#000'} 
          style={refreshing ? styles.spinning : undefined} 
        />
      </TouchableOpacity>
      
      {/* Error message */}
      {locationError && (
        <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)' }]}>
          <Text style={[styles.errorText, { color: isDarkMode ? '#ff6b6b' : '#d63031' }]}>
            {locationError}
          </Text>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
            <Text style={[styles.retryText, { color: isDarkMode ? '#74b9ff' : '#0984e3' }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  spinning: {
    opacity: 0.7,
    transform: [{ rotateZ: '45deg' }],
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  }
});

export default RideMap; 