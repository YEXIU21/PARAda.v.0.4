import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NoSubscriptionOverlayProps {
  onSelectVehiclePress: () => void;
  isDarkMode: boolean;
  isPendingApproval?: boolean;
  theme: {
    card: string;
    text: string;
    textSecondary: string;
    background?: string;
  };
}

export default function NoSubscriptionOverlay({
  onSelectVehiclePress,
  isDarkMode,
  isPendingApproval = false,
  theme
}: NoSubscriptionOverlayProps) {
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Check if this is a new user
  useEffect(() => {
    const checkIfNewUser = async () => {
      const newUserFlag = await AsyncStorage.getItem('isNewUser');
      setIsNewUser(newUserFlag === 'true');
    };
    
    checkIfNewUser();
  }, []);

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
    ]}>
      <View style={[styles.content, { backgroundColor: isDarkMode ? '#1E1E1E' : theme.card }]}>
        <View style={[styles.iconContainer, { 
          backgroundColor: isDarkMode ? '#2A2E3A' : '#E8EDFF',
          borderColor: isPendingApproval ? '#FF9500' : 'transparent',
          borderWidth: isPendingApproval ? 2 : 0
        }]}>
          <FontAwesome5 
            name={isPendingApproval ? "clock" : isNewUser ? "star" : "map-marked-alt"} 
            size={40} 
            color={isPendingApproval ? "#FF9500" : isNewUser ? "#4B9BFE" : "#4B6BFE"} 
          />
        </View>
        
        {isPendingApproval ? (
          <>
            <Text style={[styles.title, { color: theme.text }]}>Subscription Pending</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Your subscription is pending approval from the administrator. You'll get access to PARAda maps once verified.
            </Text>
            
            <View style={styles.pendingBadge}>
              <FontAwesome5 name="hourglass-half" size={16} color="#FF9500" />
              <Text style={styles.pendingText}>Awaiting Verification</Text>
            </View>
          </>
        ) : isNewUser ? (
          <>
            <Text style={[styles.title, { color: theme.text }]}>Welcome to PARAda!</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              To start using our transportation services, please select a subscription plan that fits your needs.
            </Text>
            
            <TouchableOpacity 
              style={[styles.selectButton, { backgroundColor: '#4B9BFE' }]}
              onPress={onSelectVehiclePress}
            >
              <Text style={styles.selectButtonText}>View Subscription Plans</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.text }]}>Get Access to PARAda Maps</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Subscribe to access real-time tracking and transportation services
            </Text>
            
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={onSelectVehiclePress}
            >
              <Text style={styles.selectButtonText}>View Subscription Plans</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  content: {
    width: '85%',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  selectButton: {
    backgroundColor: '#4B6BFE',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  pendingText: {
    color: '#FF9500',
    fontWeight: 'bold',
    marginLeft: 8,
  }
}); 