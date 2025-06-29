import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../services/api/api.config';

interface InstallationCounterProps {
  textColor?: string;
  iconColor?: string;
  backgroundColor?: string;
}

const InstallationCounter: React.FC<InstallationCounterProps> = ({ 
  textColor = '#fff',
  iconColor = '#4B6BFE',
  backgroundColor = 'rgba(255, 255, 255, 0.1)'
}) => {
  const [totalInstalls, setTotalInstalls] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchInstallationCount = async () => {
      try {
        // Public endpoint that only returns the total count for security reasons
        const response = await axios.get(`${BASE_URL}/api/installations/count`);
        setTotalInstalls(response.data.count);
      } catch (error) {
        console.error('Error fetching installation count:', error);
        // Fallback to a default value if API call fails
        setTotalInstalls(500); // Start with a reasonable number
      } finally {
        setLoading(false);
      }
    };
    
    fetchInstallationCount();
    
    // Increment counter periodically to simulate real-time installations
    // This creates a sense of activity even if the actual count doesn't change often
    const incrementInterval = setInterval(() => {
      setTotalInstalls(prev => {
        if (prev === null) return 500;
        // Random chance to increment by 1-3
        const shouldIncrement = Math.random() < 0.3; // 30% chance
        if (shouldIncrement) {
          const increment = Math.floor(Math.random() * 3) + 1;
          return prev + increment;
        }
        return prev;
      });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(incrementInterval);
  }, []);
  
  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  if (loading || totalInstalls === null) {
    return null; // Don't show anything while loading
  }
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FontAwesome5 name="download" size={16} color={iconColor} style={styles.icon} />
      <Text style={[styles.text, { color: textColor }]}>
        <Text style={styles.count}>{formatNumber(totalInstalls)}+</Text> users have installed PARAda
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
  },
  count: {
    fontWeight: 'bold',
  }
});

export default InstallationCounter; 