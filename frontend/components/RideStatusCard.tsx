import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RideStatus } from '@/models/RideTypes';
import RideMap from './RideMap';

interface RideStatusCardProps {
  rideStatus: RideStatus;
  onCancel: () => void;
  onTrackDriver: () => void;
  theme: {
    card: string;
    gradientColors: [string, string];
    text: string;
    textSecondary: string;
    isDarkMode: boolean;
  };
}

export default function RideStatusCard({
  rideStatus,
  onCancel,
  onTrackDriver,
  theme
}: RideStatusCardProps) {
  const [isMapVisible, setIsMapVisible] = useState(false);
  
  const handleCancelRide = () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          onPress: onCancel,
          style: "destructive"
        }
      ]
    );
  };
  
  const showMap = () => {
    setIsMapVisible(true);
  };
  
  const hideMap = () => {
    setIsMapVisible(false);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <LinearGradient
        colors={theme.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.title}>Your Ride</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleCancelRide}>
          <FontAwesome5 name="times" size={14} color="white" />
        </TouchableOpacity>
      </LinearGradient>
      
      <View style={styles.body}>
        {rideStatus.status === 'waiting' ? (
          <View style={styles.searching}>
            <ActivityIndicator size="large" color="#4B6BFE" />
            <Text style={[styles.searchingText, { color: theme.textSecondary }]}>
              Looking for available drivers...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.driverInfo}>
              <View style={styles.driverIconContainer}>
                <FontAwesome5 
                  name={rideStatus.vehicle?.type === 'bus' ? 'bus' : 'shuttle-van'} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View style={styles.driverDetails}>
                <Text style={[styles.driverName, { color: theme.text }]}>
                  {rideStatus.vehicle?.name}
                </Text>
                {rideStatus.eta && (
                  <Text style={[styles.driverETA, { color: theme.textSecondary }]}>
                    Estimated arrival: {rideStatus.eta}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.trackButton, {
                backgroundColor: theme.isDarkMode ? '#2A3451' : '#E8EDFF'
              }]}
              onPress={showMap}
            >
              <FontAwesome5 name="location-arrow" size={16} color="#4B6BFE" />
              <Text style={styles.trackButtonText}>Track on Map</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* Map Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isMapVisible}
        onRequestClose={hideMap}
      >
        <View style={styles.mapModalContainer}>
          <View style={[styles.mapModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.mapModalHeader}>
              <Text style={[styles.mapModalTitle, { color: theme.text }]}>
                Driver Location
              </Text>
              <TouchableOpacity style={styles.mapCloseButton} onPress={hideMap}>
                <FontAwesome5 name="times" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              <RideMap 
                rideId={rideStatus.rideId || ''}
                driverId={rideStatus.driverId || ''}
                passengerId={rideStatus.passengerId || ''}
                style={styles.map}
              />
            </View>
            
            <View style={styles.mapModalFooter}>
              <View style={styles.etaContainer}>
                <FontAwesome5 name="clock" size={14} color={theme.textSecondary} />
                <Text style={[styles.etaText, { color: theme.textSecondary }]}>
                  ETA: {rideStatus.eta || 'Calculating...'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.cancelButton, { borderColor: '#FF3B30' }]}
                onPress={() => {
                  hideMap();
                  handleCancelRide();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 120,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 101,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 15,
  },
  searching: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  searchingText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4B6BFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  driverETA: {
    fontSize: 14,
    marginTop: 3,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  trackButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B6BFE',
  },
  mapModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mapModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingBottom: 30,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  mapContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    marginLeft: 8,
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
}); 