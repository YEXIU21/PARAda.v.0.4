import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Add proper type for iOS Safari's standalone property
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export default function IOSInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web') return;

    // More comprehensive iOS detection
    const userAgent = navigator.userAgent || '';
    const isIOSDevice = /iPhone|iPad|iPod/.test(userAgent) || 
                       (/Mac/.test(userAgent) && 'maxTouchPoints' in navigator && (navigator as any).maxTouchPoints > 1); // Detect iPad Pro with iPadOS
    setIsIOS(isIOSDevice);

    // Check if already installed (in standalone mode)
    const isInStandaloneMode = window.navigator.standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Check if the user has previously dismissed the prompt
    let isDismissed = false;
    if (typeof localStorage !== 'undefined') {
      isDismissed = localStorage.getItem('iosInstallPromptDismissed') === 'true';
      
      // Check if we should explicitly show the instructions
      const shouldShow = localStorage.getItem('showIOSInstallInstructions') === 'true';
      if (shouldShow) {
        // Clear the flag once we've seen it
        localStorage.removeItem('showIOSInstallInstructions');
        setIsVisible(isIOSDevice && !isInStandaloneMode);
        return;
      }
    }

    // Only show for iOS devices that aren't in standalone mode and haven't dismissed
    setIsVisible(isIOSDevice && !isInStandaloneMode && !isDismissed);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store in localStorage that user has dismissed the prompt
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('iosInstallPromptDismissed', 'true');
    }
  };

  // Don't render anything if not on iOS or already installed or dismissed
  if (Platform.OS !== 'web' || !isIOS || isStandalone || !isVisible) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? colors.card : colors.background }
    ]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Install PARAda on your iPhone
          </Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <FontAwesome5 name="times" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.text, { color: colors.text }]}>
          Install this app on your home screen for a better experience:
        </Text>
        
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionStep}>
            <FontAwesome5 name="share" size={20} color={colors.primary} style={styles.icon} />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              1. Tap the Share icon in your browser
            </Text>
          </View>
          
          <View style={styles.instructionStep}>
            <FontAwesome5 name="plus-square" size={20} color={colors.primary} style={styles.icon} />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              2. Scroll down and tap "Add to Home Screen"
            </Text>
          </View>
          
          <View style={styles.instructionStep}>
            <FontAwesome5 name="check-circle" size={20} color={colors.primary} style={styles.icon} />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              3. Tap "Add" to confirm
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleDismiss}
        >
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 1000,
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD',
  },
  content: {
    padding: 16,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
  },
  instructionsContainer: {
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  instructionText: {
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 