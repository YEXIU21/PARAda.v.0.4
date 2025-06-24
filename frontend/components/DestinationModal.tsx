import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Destination } from '../models/RideTypes';
import * as Location from 'expo-location';
import MapView, { Marker } from './MapView';
import { getPopularDestinations, searchDestinations, getNearbyDestinations } from '../services/api/destination.api';

interface DestinationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectDestination: (destination: Destination) => void;
  userLocation: Location.LocationObject | null;
  theme: {
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    gradientColors: [string, string];
  };
}

const DEFAULT_DESTINATIONS: Destination[] = [
  { name: 'Harbor View', latitude: 37.78625, longitude: -122.4314 },
  { name: 'Market Square', latitude: 37.78925, longitude: -122.4344 },
  { name: 'Central Station', latitude: 37.78825, longitude: -122.4324 },
  { name: 'Tech Plaza', latitude: 37.78525, longitude: -122.4124 },
  { name: 'Ocean Heights', latitude: 37.79025, longitude: -122.4244 }
];

const { height } = Dimensions.get('window');

export default function DestinationModal({
  isVisible,
  onClose,
  onSelectDestination,
  userLocation,
  theme
}: DestinationModalProps) {
  const [searchText, setSearchText] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [selectedMapLocation, setSelectedMapLocation] = useState<Destination | null>(null);
  
  // Load destinations when the modal becomes visible
  useEffect(() => {
    if (isVisible) {
      loadDestinations();
    }
  }, [isVisible]);
  
  // Load destinations based on user location
  const loadDestinations = async () => {
    setIsLoading(true);
    
    try {
      // Try to get nearby destinations if user location is available
      if (userLocation && userLocation.coords) {
        const nearbyDestinations = await getNearbyDestinations({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude
        }, 10);
        
        if (nearbyDestinations && nearbyDestinations.length > 0) {
          console.log('Loaded nearby destinations:', nearbyDestinations);
          setDestinations(nearbyDestinations);
          setIsLoading(false);
          return;
        }
      }
      
      // Fall back to popular destinations if nearby destinations are not available
      const popularDestinations = await getPopularDestinations();
      
      if (popularDestinations && popularDestinations.length > 0) {
        console.log('Loaded popular destinations:', popularDestinations);
        setDestinations(popularDestinations);
      } else {
        console.log('No destinations found, using default data');
        // Fall back to default destinations if API fails
        setDestinations(DEFAULT_DESTINATIONS);
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
      // Fall back to default destinations if API fails
      setDestinations(DEFAULT_DESTINATIONS);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search destinations based on user input
  const handleSearch = async (text: string) => {
    setSearchText(text);
    
    if (!text || text.trim() === '') {
      // If search text is empty, load default destinations
      loadDestinations();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const results = await searchDestinations(text);
      
      if (results && results.length > 0) {
        console.log('Search results:', results);
        setDestinations(results);
      } else {
        // If no results, show empty state
        setDestinations([]);
      }
    } catch (error) {
      console.error('Error searching destinations:', error);
      // Keep existing destinations on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDestination = (destination: Destination) => {
    onSelectDestination(destination);
    onClose();
  };
  
  const handleCreateCustomLocation = () => {
    if (!userLocation) {
      Alert.alert('Error', 'Your location is not available');
      return;
    }
    
    const userLat = userLocation.coords.latitude;
    const userLng = userLocation.coords.longitude;
    
    // Create a custom destination near the user's location
    const customPlace: Destination = {
      name: 'Custom Location',
      latitude: userLat + (Math.random() * 0.01 - 0.005), // Random position near user
      longitude: userLng + (Math.random() * 0.01 - 0.005)
    };
    
    handleSelectDestination(customPlace);
    
    // In a real implementation, this would use reverse geocoding
    // to get the actual address of the selected location
    Alert.alert(
      'Custom Location', 
      'Selected a location near you. In a production app, this would use reverse geocoding to get the actual address.'
    );
  };
  
  const handleMapPress = (event: any) => {
    // Extract coordinates from the map press event
    const { coordinate } = event.nativeEvent;
    
    if (coordinate) {
      const customPlace: Destination = {
        name: 'Selected Location',
        latitude: coordinate.latitude,
        longitude: coordinate.longitude
      };
      
      // Instead of immediately selecting, store the selected location
      setSelectedMapLocation(customPlace);
    }
  };

  const confirmMapSelection = () => {
    if (selectedMapLocation) {
      handleSelectDestination(selectedMapLocation);
    }
  };

  const cancelMapSelection = () => {
    setSelectedMapLocation(null);
  };
  
  const filteredDestinations = destinations;
  const hasNoResults = searchText !== '' && filteredDestinations.length === 0;
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, height: height * 0.7 }]}>
          <LinearGradient
            colors={theme.gradientColors}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Select Destination</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.modalBody}>
            <View style={[styles.searchBarContainer, { borderColor: theme.border }]}>
              <FontAwesome5 name="search" size={16} color="#999" />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search for a destination..."
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={handleSearch}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <FontAwesome5 name="times-circle" size={16} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.destinationTabsContainer}>
              <TouchableOpacity 
                style={[
                  styles.destinationTab, 
                  activeTab === 'list' && styles.destinationTabActive
                ]}
                onPress={() => {
                  setActiveTab('list');
                  setSelectedMapLocation(null);
                }}
              >
                <Text 
                  style={[
                    styles.destinationTabText, 
                    activeTab === 'list' && { color: '#FFFFFF' }
                  ]}
                >
                  List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.destinationTab, 
                  activeTab === 'map' && styles.destinationTabActive
                ]}
                onPress={() => setActiveTab('map')}
              >
                <Text 
                  style={[
                    styles.destinationTabText, 
                    activeTab === 'map' && { color: '#FFFFFF' }
                  ]}
                >
                  Map
                </Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'list' ? (
              <ScrollView style={styles.destinationList}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B6BFE" />
                    <Text style={[styles.loadingText, { color: theme.text }]}>Loading destinations...</Text>
                  </View>
                ) : filteredDestinations.length > 0 ? (
                  filteredDestinations.map((place, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={[styles.destinationItem, { borderBottomColor: theme.border }]}
                      onPress={() => handleSelectDestination(place)}
                    >
                      <View style={styles.destinationIconContainer}>
                        <FontAwesome5 name="map-marker-alt" size={18} color="#4B6BFE" />
                      </View>
                      <View style={styles.destinationInfo}>
                        <Text style={[styles.destinationName, { color: theme.text }]}>{place.name}</Text>
                      </View>
                      <FontAwesome5 name="chevron-right" size={14} color="#999" />
                    </TouchableOpacity>
                  ))
                ) : hasNoResults ? (
                  <View style={styles.noResultsContainer}>
                    <FontAwesome5 name="search" size={40} color="#DDDDDD" />
                    <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
                      No destinations found
                    </Text>
                    <TouchableOpacity 
                      style={styles.createCustomButton}
                      onPress={handleCreateCustomLocation}
                    >
                      <Text style={styles.createCustomButtonText}>Create Custom Location</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: userLocation?.coords?.latitude || 37.78825,
                    longitude: userLocation?.coords?.longitude || -122.4324,
                    latitudeDelta: 0.0122,
                    longitudeDelta: 0.0121,
                  }}
                  onPress={handleMapPress}
                >
                  {/* User location marker */}
                  {userLocation && (
                    <Marker
                      coordinate={{
                        latitude: userLocation.coords.latitude,
                        longitude: userLocation.coords.longitude,
                      }}
                      title="Your Location"
                    >
                      <View style={styles.userLocationMarker}>
                        <View style={styles.userLocationDot} />
                      </View>
                    </Marker>
                  )}
                  
                  {/* Destination markers */}
                  {filteredDestinations.map((place, index) => (
                    <Marker
                      key={index}
                      coordinate={{
                        latitude: place.latitude,
                        longitude: place.longitude,
                      }}
                      title={place.name}
                      onPress={() => handleSelectDestination(place)}
                    >
                      <View style={styles.destinationMarker}>
                        <FontAwesome5 name="map-pin" size={20} color="#FF3B30" />
                      </View>
                    </Marker>
                  ))}

                  {/* Selected location marker */}
                  {selectedMapLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedMapLocation.latitude,
                        longitude: selectedMapLocation.longitude,
                      }}
                      title="Selected Location"
                    >
                      <View style={styles.selectedLocationMarker}>
                        <FontAwesome5 name="map-pin" size={24} color="#FF3B30" />
                      </View>
                    </Marker>
                  )}
                </MapView>
                
                {!selectedMapLocation ? (
                  <Text style={styles.mapInstructions}>
                    Tap anywhere on the map to select a location
                  </Text>
                ) : (
                  <View style={styles.mapActionContainer}>
                    <TouchableOpacity 
                      style={styles.mapActionButton}
                      onPress={cancelMapSelection}
                    >
                      <FontAwesome5 name="times" size={16} color="white" />
                      <Text style={styles.mapActionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.mapActionButton, styles.mapConfirmButton]}
                      onPress={confirmMapSelection}
                    >
                      <FontAwesome5 name="check" size={16} color="white" />
                      <Text style={styles.mapActionButtonText}>Confirm Location</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1001,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 15,
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
    height: '100%',
  },
  destinationTabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4B6BFE',
  },
  destinationTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationTabActive: {
    backgroundColor: '#4B6BFE',
  },
  destinationTabText: {
    color: '#4B6BFE',
    fontWeight: '600',
    fontSize: 16,
  },
  destinationList: {
    flex: 1,
    marginBottom: 15,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  destinationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noResultsText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: {
    flex: 1,
  },
  mapInstructions: {
    color: '#4B6BFE',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(75, 107, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4B6BFE',
    marginTop: 4,
  },
  destinationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLocationMarker: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  createCustomButton: {
    backgroundColor: '#4B6BFE',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  createCustomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  mapActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  mapActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#999',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  mapConfirmButton: {
    backgroundColor: '#4B6BFE',
    flex: 1,
  },
  mapActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  }
}); 