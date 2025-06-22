import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Destination } from '../models/RideTypes';

interface VehicleType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface RequestRideModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRequestRide: () => void;
  hasLocation: boolean;
  selectedDestination: Destination | null;
  selectedVehicleType: string | null;
  isRequestingRide: boolean;
  vehicleTypes: VehicleType[];
  onSelectVehicleType: (typeId: string) => void;
  theme: {
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    gradientColors: [string, string];
  };
  openDestinationModal: () => void;
}

export default function RequestRideModal({
  isVisible,
  onClose,
  onRequestRide,
  hasLocation,
  selectedDestination,
  selectedVehicleType,
  isRequestingRide,
  vehicleTypes,
  onSelectVehicleType,
  theme,
  openDestinationModal
}: RequestRideModalProps) {
  const isButtonDisabled = !selectedDestination || !selectedVehicleType || isRequestingRide;
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: '85%' }]}>
          <LinearGradient
            colors={theme.gradientColors}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Request a Ride</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.modalBody}>
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.rideLocationContainer, { borderBottomColor: theme.border, borderBottomWidth: 1, paddingBottom: 15 }]}>
              <View style={styles.rideLocationRow}>
                <View style={styles.rideLocationDot} />
                <View style={styles.rideLocationTextContainer}>
                  <Text style={[styles.rideLocationLabel, { color: theme.textSecondary }]}>Your location</Text>
                  <Text style={[styles.rideLocationValue, { color: theme.text }]}>
                    {hasLocation ? 'Current Location' : 'Loading...'}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.rideLocationDashedLine, { backgroundColor: theme.border }]} />
              
              <View style={styles.rideLocationRow}>
                <View style={[styles.rideLocationDot, { backgroundColor: '#FF3B30' }]} />
                <View style={styles.rideLocationTextContainer}>
                  <Text style={[styles.rideLocationLabel, { color: theme.textSecondary }]}>Destination</Text>
                  <TouchableOpacity 
                    style={[styles.selectDestinationButton, { borderBottomColor: theme.border }]}
                    onPress={openDestinationModal}
                  >
                    <Text style={[styles.selectDestinationText, { 
                      color: selectedDestination ? theme.text : '#999' 
                    }]}>
                      {selectedDestination ? selectedDestination.name : 'Select destination'}
                    </Text>
                    <FontAwesome5 name="chevron-right" size={14} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.rideOptionContainer}>
              <Text style={[styles.rideOptionTitle, { color: theme.text }]}>Available Vehicles</Text>
              {vehicleTypes.map(type => (
                <TouchableOpacity 
                  key={type.id}
                  style={[
                    styles.rideOptionItem,
                    { borderColor: theme.border, backgroundColor: theme.card },
                    selectedVehicleType === type.id && [
                      styles.rideOptionItemSelected,
                      { backgroundColor: theme.card === '#FFFFFF' ? '#F5F8FF' : '#2A3451' }
                    ]
                  ]}
                  onPress={() => onSelectVehicleType(type.id)}
                >
                  <View style={styles.rideOptionIcon}>
                    <FontAwesome5 name={type.icon} size={20} color="#4B6BFE" />
                  </View>
                  <View style={styles.rideOptionInfo}>
                    <Text style={[styles.rideOptionName, { color: theme.text }]}>{type.name}</Text>
                    <Text style={[styles.rideOptionETA, { color: theme.textSecondary }]}>
                      Available
                    </Text>
                  </View>
                  {selectedVehicleType === type.id && (
                    <FontAwesome5 name="check-circle" size={20} color="#4B6BFE" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
              <View style={styles.spacer} />
            </ScrollView>
            
            <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.requestRideButton,
                isButtonDisabled && styles.requestRideButtonDisabled
              ]}
              onPress={onRequestRide}
              disabled={isButtonDisabled}
            >
              {isRequestingRide ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.requestRideButtonText}>Request Ride</Text>
              )}
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    maxHeight: '80%',
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  scrollContent: {
    flex: 1,
  },
  rideLocationContainer: {
    marginBottom: 20,
  },
  rideLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  rideLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4B6BFE',
    marginRight: 15,
  },
  rideLocationDashedLine: {
    width: 2,
    height: 30,
    marginLeft: 5,
    marginVertical: 5,
    borderStyle: 'dashed',
  },
  rideLocationTextContainer: {
    flex: 1,
  },
  rideLocationLabel: {
    fontSize: 12,
    marginBottom: 3,
  },
  rideLocationValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectDestinationButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  selectDestinationText: {
    fontSize: 16,
  },
  rideOptionContainer: {
    marginBottom: 20,
  },
  rideOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rideOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
  rideOptionItemSelected: {
    borderColor: '#4B6BFE',
  },
  rideOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rideOptionInfo: {
    flex: 1,
  },
  rideOptionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rideOptionETA: {
    fontSize: 14,
    marginTop: 2,
  },
  requestRideButton: {
    backgroundColor: '#4B6BFE',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  requestRideButtonDisabled: {
    backgroundColor: '#B3B3B3',
  },
  requestRideButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    marginTop: 15,
    width: '100%',
    paddingHorizontal: 5,
    paddingBottom: 10,
  },
  spacer: {
    height: 20,
  },
}); 