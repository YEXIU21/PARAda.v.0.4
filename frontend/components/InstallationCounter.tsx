import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

// Define a fallback API URL in case the import fails
const FALLBACK_API_URL = Platform.OS === 'web' ? '' : 'https://api.parada.app';

// Try to import API_URL, but use fallback if not available
let API_URL: string;
try {
  // This dynamic import approach helps avoid TypeScript errors
  const apiModule = require('../constants/api');
  API_URL = apiModule.API_URL;
} catch (error) {
  console.warn('Could not import API_URL from constants, using fallback');
  API_URL = FALLBACK_API_URL;
}

interface InstallationCounterProps {
  textColor?: string;
  iconColor?: string;
  backgroundColor?: string;
  centered?: boolean;
}

const InstallationCounter: React.FC<InstallationCounterProps> = ({
  textColor = '#333',
  iconColor = '#007AFF',
  backgroundColor = 'rgba(75, 107, 254, 0.05)',
  centered = false
}) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchInstallationCount = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/installations/count`);
        if (response.data && response.data.count !== undefined) {
          setCount(response.data.count);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching installation count:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInstallationCount();
  }, []);

  if (loading) {
    return (
      <View style={[
        styles.container, 
        { backgroundColor, alignItems: centered ? 'center' : 'flex-start' }
      ]}>
        <ActivityIndicator size="small" color={iconColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>Loading installation data...</Text>
      </View>
    );
  }

  if (error || count === null) {
    // If there's an error, we don't show anything to avoid disrupting the UI
    return null;
  }

  return (
    <View style={[
      styles.container, 
      { backgroundColor, alignItems: centered ? 'center' : 'flex-start' }
    ]}>
      <FontAwesome5 name="users" size={14} color={iconColor} style={styles.icon} />
      <Text style={[styles.counterText, { color: textColor }]}>
        <Text style={[styles.highlight, { color: iconColor }]}>{count.toLocaleString()}</Text> users have installed PARAda
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 14,
    textAlign: 'center',
  },
  highlight: {
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 12,
    marginLeft: 5,
  },
  icon: {
    marginRight: 6,
  }
});

export default InstallationCounter; 