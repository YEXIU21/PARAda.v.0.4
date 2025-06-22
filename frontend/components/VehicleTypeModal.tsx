import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface VehicleType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface VehicleTypeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (typeId: string) => void;
  vehicleTypes: VehicleType[];
  theme: {
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    gradientColors: [string, string];
  };
}

export default function VehicleTypeModal({
  isVisible,
  onClose,
  onSelect,
  vehicleTypes,
  theme
}: VehicleTypeModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <LinearGradient
            colors={theme.gradientColors}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Select Vehicle Type</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity 
                key={type.id}
                style={[
                  styles.vehicleTypeItem, 
                  { borderBottomColor: theme.border }
                ]}
                onPress={() => onSelect(type.id)}
              >
                <View style={styles.vehicleTypeIcon}>
                  <FontAwesome5 name={type.icon} size={24} color="#4B6BFE" />
                </View>
                <View style={styles.vehicleTypeInfo}>
                  <Text style={[styles.vehicleTypeName, { color: theme.text }]}>{type.name}</Text>
                  <Text style={[styles.vehicleTypeDesc, { color: theme.textSecondary }]}>{type.description}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={16} color="#999" />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    maxHeight: '80%',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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
  },
  vehicleTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vehicleTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  vehicleTypeInfo: {
    flex: 1,
  },
  vehicleTypeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  vehicleTypeDesc: {
    fontSize: 14,
  },
}); 