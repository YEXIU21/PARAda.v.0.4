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
  const [step, setStep] = useState(1); // For multi-step instructions
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
      
      // Check if this is the user's second visit (good time to show the prompt)
      const visitCount = parseInt(localStorage.getItem('visitCount') || '0', 10);
      if (visitCount === 2 && !isDismissed) {
        setIsVisible(isIOSDevice && !isInStandaloneMode);
      }
      
      // Update visit count
      localStorage.setItem('visitCount', (visitCount + 1).toString());
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
  
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Don't render anything if not on iOS or already installed or dismissed
  if (Platform.OS !== 'web' || !isIOS || isStandalone || !isVisible) {
    return null;
  }
  
  // Determine which instruction to show based on step
  const renderInstructionContent = () => {
    switch(step) {
      case 1:
        return (
          <>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 1: Tap the Share icon</Text>
            <View style={styles.imageContainer}>
              <FontAwesome5 name="share" size={40} color={colors.primary} style={styles.instructionImage} />
            </View>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Tap the Share icon in your browser's toolbar
            </Text>
          </>
        );
      case 2:
        return (
          <>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 2: Find "Add to Home Screen"</Text>
            <View style={styles.imageContainer}>
              <FontAwesome5 name="plus-square" size={40} color={colors.primary} style={styles.instructionImage} />
            </View>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Scroll down in the share menu and tap "Add to Home Screen"
            </Text>
          </>
        );
      case 3:
        return (
          <>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 3: Tap "Add"</Text>
            <View style={styles.imageContainer}>
              <FontAwesome5 name="check-circle" size={40} color={colors.primary} style={styles.instructionImage} />
            </View>
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Tap "Add" in the top right corner to install PARAda to your home screen
            </Text>
          </>
        );
      default:
        return null;
    }
  };

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
        
        {renderInstructionContent()}
        
        <View style={styles.navigationContainer}>
          {step > 1 && (
            <TouchableOpacity 
              style={[styles.navButton, { backgroundColor: colors.card }]}
              onPress={handleBack}
            >
              <FontAwesome5 name="arrow-left" size={16} color={colors.text} />
              <Text style={[styles.navButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.navButtonText}>
              {step < 3 ? 'Next' : 'Got it'}
            </Text>
            {step < 3 && <FontAwesome5 name="arrow-right" size={16} color="#FFFFFF" style={styles.navIcon} />}
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          {[1, 2, 3].map(i => (
            <View 
              key={i}
              style={[
                styles.progressDot,
                { backgroundColor: i <= step ? colors.primary : colors.border }
              ]}
            />
          ))}
        </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    height: 100,
  },
  instructionImage: {
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navIcon: {
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
}); 