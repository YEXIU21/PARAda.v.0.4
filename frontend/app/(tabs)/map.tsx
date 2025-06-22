import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import MapView from '../../components/MapView';
import { router } from 'expo-router';

interface Location {
  latitude: number;
  longitude: number;
}

interface Driver {
  id: string;
  name: string;
  location: Location;
  status: string;
}

interface Route {
  id: string;
  name: string;
  path: Location[];
  color: string;
}

export default function MapScreen() {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrivers, setActiveDrivers] = useState<Driver[]>([]);
  const [activeRoutes, setActiveRoutes] = useState<Route[]>([]);

  // Fetch active drivers and routes
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Replace with actual API calls
        // const driversResponse = await getActiveDrivers();
        // const routesResponse = await getActiveRoutes();
        
        // Mock data for now
        const mockDrivers = [
          { id: '1', name: 'John Driver', location: { latitude: 14.5995, longitude: 120.9842 }, status: 'active' },
          { id: '2', name: 'Jane Driver', location: { latitude: 14.6091, longitude: 121.0223 }, status: 'active' },
          { id: '3', name: 'Mike Driver', location: { latitude: 14.5547, longitude: 121.0244 }, status: 'active' },
        ];
        
        const mockRoutes = [
          { 
            id: '1', 
            name: 'Route A', 
            path: [
              { latitude: 14.5995, longitude: 120.9842 },
              { latitude: 14.6091, longitude: 121.0223 },
              { latitude: 14.5547, longitude: 121.0244 }
            ],
            color: '#4B6BFE'
          },
          { 
            id: '2', 
            name: 'Route B', 
            path: [
              { latitude: 14.5547, longitude: 121.0244 },
              { latitude: 14.5691, longitude: 121.0423 },
              { latitude: 14.5795, longitude: 121.0342 }
            ],
            color: '#FF9500'
          }
        ];
        
        setActiveDrivers(mockDrivers);
        setActiveRoutes(mockRoutes);
      } catch (err) {
        console.error('Error fetching map data:', err);
        setError('Failed to load map data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMapData();
  }, []);

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors || [theme.primary, theme.primary]}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Map</Text>
      </LinearGradient>
      
      <View style={styles.mapContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading map data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={40} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.text }]}>Something went wrong</Text>
            <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => setIsLoading(true)}
            >
              <Text style={{ color: '#fff' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MapView 
            drivers={activeDrivers}
            routes={activeRoutes}
            isDarkMode={isDarkMode}
            showsUserLocation={true}
            followsUserLocation={false}
            showLocationButton={true}
            initialRegion={{
              latitude: 14.5995,
              longitude: 120.9842,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          />
        )}
      </View>
      
      <View style={[styles.legendContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.legendTitle, { color: theme.text }]}>Map Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#4B6BFE' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Active Drivers</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#FF9500' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Active Routes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIcon, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Pickup Points</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  legendContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
  }
}); 