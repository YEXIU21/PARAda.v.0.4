import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IOSInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    const checkIfShouldShow = async () => {
      // Only show on iOS
      if (Platform.OS !== 'web' || !isIOS()) {
        return;
      }
      
      // Check if user has dismissed before
      const hasPromptBeenDismissed = await AsyncStorage.getItem('ios_install_prompt_dismissed');
      const lastPromptTime = await AsyncStorage.getItem('ios_install_prompt_time');
      const currentTime = new Date().getTime();
      
      // Show prompt if not dismissed or if it's been more than 7 days since last prompt
      if (!hasPromptBeenDismissed || 
          (lastPromptTime && (currentTime - parseInt(lastPromptTime)) > 7 * 24 * 60 * 60 * 1000)) {
        // Check if the app is not already installed
        if (!isInStandaloneMode()) {
          setShowPrompt(true);
          // Update last prompt time
          await AsyncStorage.setItem('ios_install_prompt_time', currentTime.toString());
        }
      }
    };
    
    checkIfShouldShow();
  }, []);
  
  const isIOS = () => {
    // Use type assertion for browser-specific property
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };
  
  const isInStandaloneMode = () => {
    // Use type assertion for iOS-specific property
    return (window.navigator as any).standalone === true;
  };
  
  const dismissPrompt = async () => {
    setShowPrompt(false);
    await AsyncStorage.setItem('ios_install_prompt_dismissed', 'true');
  };
  
  if (!showPrompt) {
    return null;
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.promptContainer}>
        <Text style={styles.title}>Install PARAda on your iOS device</Text>
        <Text style={styles.description}>
          Tap <AntDesign name="sharealt" size={16} color="#007AFF" /> then "Add to Home Screen" for a better experience
        </Text>
        <Pressable style={styles.dismissButton} onPress={dismissPrompt}>
          <Text style={styles.dismissText}>Not Now</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
    padding: 10,
  },
  promptContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  dismissText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default IOSInstallPrompt; 