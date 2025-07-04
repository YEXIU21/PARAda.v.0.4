import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { API_URL } from '../constants/api';

interface InstallationCounterProps {
  textColor?: string;
  iconColor?: string;
  backgroundColor?: string;
  centered?: boolean;
}

const InstallationCounter: React.FC<InstallationCounterProps> = ({
  textColor = '#000000',
  iconColor = '#4B6BFE',
  backgroundColor = 'rgba(75, 107, 254, 0.05)',
  centered = false,
}) => {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track component mount status
  const isMounted = React.useRef(true);

  useEffect(() => {
    // Set up cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchInstallationCount = async () => {
      try {
        setIsLoading(true);
        
        // Use a fallback count in case of errors
        let fallbackCount = 1500;
        
        try {
          const response = await fetch(`${API_URL}/api/installations/count`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch installation count: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Only update state if component is still mounted
          if (isMounted.current) {
            setCount(data.count || fallbackCount);
            setError(null);
          }
        } catch (err) {
          console.error('Error fetching installation count:', err);
          
          // Only update state if component is still mounted
          if (isMounted.current) {
            setError('Failed to load installation count');
            // Use fallback count
            setCount(fallbackCount);
          }
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchInstallationCount();
  }, []);

  if (isLoading) {
    return null; // Return null while loading to avoid flickering
  }

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor }, 
        centered && styles.centered
      ]}
    >
      <FontAwesome5 name="users" size={14} color={iconColor} style={styles.icon} />
      <Text style={[styles.text, { color: textColor }]}>
        {count !== null ? `${count.toLocaleString()} users have installed this app` : 'Join our growing community'}
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
  centered: {
    alignSelf: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InstallationCounter; 