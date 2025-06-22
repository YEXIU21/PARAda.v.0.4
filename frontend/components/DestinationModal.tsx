import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Destination } from '@/models/RideTypes';
import * as Location from 'expo-location';
import MapView, { Marker } from '@/components/MapView';

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
  const [suggestedDestinations] = useState<Destination[]>(DEFAULT_DESTINATIONS);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  
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
      
      handleSelectDestination(customPlace);
    }
  };
  
  const filteredDestinations = suggestedDestinations.filter(place => 
    searchText === '' || 
    place.name.toLowerCase().includes(searchText.toLowerCase())
  );
  
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
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
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
                onPress={() => setActiveTab('list')}
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
              {filteredDestinations.map((place, index) => (
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
              ))}
              
              {hasNoResults && (
                <View style={styles.noResultsContainer}>
                  <FontAwesome5 name="search" size={40} color="#DDDDDD" />
                  <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
                    No results found
                  </Text>
                </View>
              )}
            </ScrollView>
            ) : (
              <View style={[styles.mapFallbackContainer, { backgroundColor: theme.card }]}>
                <View style={styles.mapFallbackHeader}>
                  <FontAwesome5 name="map" size={24} color="#4B6BFE" />
                  <Text style={[styles.mapFallbackTitle, { color: theme.text }]}>
                    Select from Popular Destinations
                  </Text>
                </View>
                
                <ScrollView style={styles.mapFallbackList}>
                  {suggestedDestinations.map((place, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={[styles.mapFallbackItem, { 
                        backgroundColor: theme.card === '#FFFFFF' ? '#F5F8FF' : '#2A3451',
                        borderColor: theme.border 
                      }]}
                      onPress={() => handleSelectDestination(place)}
                    >
                      <View style={styles.mapFallbackIconContainer}>
                        <FontAwesome5 name="map-marker-alt" size={20} color="#4B6BFE" />
                      </View>
                      <View style={styles.mapFallbackItemContent}>
                        <Text style={[styles.mapFallbackItemTitle, { color: theme.text }]}>
                          {place.name}
                        </Text>
                        <Text style={[styles.mapFallbackItemSubtitle, { color: theme.textSecondary }]}>
                          Tap to select this destination
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <View style={styles.mapFallbackNote}>
                  <FontAwesome5 name="info-circle" size={16} color="#4B6BFE" style={{ marginRight: 8 }} />
                  <Text style={[styles.mapFallbackNoteText, { color: theme.textSecondary }]}>
                    Map view is currently unavailable. Please select from the list of destinations.
                  </Text>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.useCurrentLocationButton}
              onPress={handleCreateCustomLocation}
            >
              <FontAwesome5 name="location-arrow" size={16} color="#4B6BFE" style={{ marginRight: 10 }} />
              <Text style={styles.useCurrentLocationText}>Drop Pin Near Me</Text>
            </TouchableOpacity>
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
  mapFallbackContainer: {
    flex: 1,
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mapFallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mapFallbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mapFallbackList: {
    flex: 1,
  },
  mapFallbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  mapFallbackIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mapFallbackItemContent: {
    flex: 1,
  },
  mapFallbackItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  mapFallbackItemSubtitle: {
    fontSize: 14,
    marginTop: 3,
  },
  mapFallbackNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(75, 107, 254, 0.1)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  mapFallbackNoteText: {
    fontSize: 14,
    flex: 1,
  },
  useCurrentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EDFF',
    paddingVertical: 15,
    borderRadius: 8,
  },
  useCurrentLocationText: {
    color: '#4B6BFE',
    fontSize: 16,
    fontWeight: '500',
  }
}); 