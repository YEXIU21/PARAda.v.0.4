import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Platform,
  Dimensions,
  Linking,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

// PWA installation detection
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Register service worker only in development
if (process.env.NODE_ENV === 'development') {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/register-service-worker.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
}

export default function LandingPage() {
  const router = useRouter();
  const { isDarkMode, colors } = useTheme();
  const [isInstallable, setIsInstallable] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const windowWidth = Dimensions.get('window').width;
  const isMobile = windowWidth < 768;
  const [installAttempted, setInstallAttempted] = useState(false);

  // Check if PWA can be installed
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
      console.log('PWA is installable, prompt captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      console.log('PWA was installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  // Handle PWA installation
  const handleInstallClick = async () => {
    if (Platform.OS !== 'web') {
      // For non-web platforms, navigate to login
      router.push('/auth/login');
      return;
    }

    // If already installed, just navigate to the app
    if (isInstalled) {
      router.push('/auth/login');
      return;
    }

    if (deferredPromptRef.current) {
      try {
        // Show the PWA install prompt
        console.log('Triggering PWA installation prompt');
        deferredPromptRef.current.prompt();
        const choiceResult = await deferredPromptRef.current.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          // The app is being installed, we'll wait for the appinstalled event
          setInstallAttempted(true);
        } else {
          console.log('User dismissed the install prompt');
          // If user dismisses, navigate to login anyway
          router.push('/auth/login');
        }
        
        deferredPromptRef.current = null;
        setIsInstallable(false);
      } catch (error) {
        console.error('Error prompting for installation:', error);
        // If there's an error with the prompt, navigate to login
        router.push('/auth/login');
      }
    } else {
      // If PWA prompt not available, show installation instructions on mobile browsers
      if (isMobile && !installAttempted && Platform.OS === 'web') {
        const userAgent = navigator.userAgent || '';
        if (/iPhone|iPad|iPod/.test(userAgent)) {
          // iOS Safari
          Alert.alert(
            "Install PARAda",
            "To install our app: tap the Share button, then 'Add to Home Screen'",
            [{ text: "OK", onPress: () => router.push('/auth/login') }]
          );
          setInstallAttempted(true);
          return;
        } else if (/Android/.test(userAgent) && /Chrome/.test(userAgent)) {
          // Android Chrome
          Alert.alert(
            "Install PARAda",
            "To install our app: tap the menu button, then 'Add to Home Screen'",
            [{ text: "OK", onPress: () => router.push('/auth/login') }]
          );
          setInstallAttempted(true);
          return;
        }
      }
      
      // If no installation prompt is available, go to login
      router.push('/auth/login');
    }
  };

  // Features data
  const features = [
    {
      icon: 'map-marked-alt',
      title: 'Real-Time Tracking',
      description: 'Track your transportation in real-time with accurate GPS location updates.'
    },
    {
      icon: 'route',
      title: 'Route Management',
      description: 'Efficiently plan and manage transportation routes for optimal travel.'
    },
    {
      icon: 'clock',
      title: 'Scheduling',
      description: 'Easy scheduling and notifications for your transportation needs.'
    },
    {
      icon: 'user-shield',
      title: 'Secure Rides',
      description: 'Verified drivers and secure payment options for peace of mind.'
    },
    {
      icon: 'mobile-alt',
      title: 'Mobile Access',
      description: 'Access PARAda anytime, anywhere with our mobile-friendly application.'
    },
    {
      icon: 'hand-holding-usd',
      title: 'Affordable Plans',
      description: 'Choose from various subscription plans to fit your budget and needs.'
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <LinearGradient
        colors={colors.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/PARAda-Logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.logoText}>PARAda</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
          Real-Time Transportation Tracking for Smarter Travel
        </Text>
        <Text style={[styles.heroSubtitle, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>
          PARAda helps you navigate public transportation with ease, providing real-time updates and convenient scheduling
        </Text>
        
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleInstallClick}
        >
          <LinearGradient
            colors={colors.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.downloadButtonGradient}
          >
            <FontAwesome5 name={isInstallable ? "download" : "arrow-right"} size={20} color="#FFFFFF" style={styles.downloadIcon} />
            <Text style={styles.downloadButtonText}>
              {isInstallable ? 'Install App' : isInstalled ? 'Open App' : 'Get Started'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
          Key Features
        </Text>
        
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={[
              styles.featureCard, 
              { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' }
            ]}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={colors.gradientColors}
                  style={styles.featureIconBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 name={feature.icon} size={24} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.featureTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                {feature.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Call to Action */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={colors.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaBackground}
        >
          <Text style={styles.ctaTitle}>Ready to Simplify Your Transportation?</Text>
          <Text style={styles.ctaSubtitle}>
            Download PARAda now and experience hassle-free transportation tracking
          </Text>
          
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleInstallClick}
          >
            <Text style={styles.ctaButtonText}>
              {isInstallable ? 'Install App' : isInstalled ? 'Open App' : 'Get Started'}
            </Text>
            <FontAwesome5 name={isInstallable ? "download" : "arrow-right"} size={16} color="#4B6BFE" style={styles.ctaButtonIcon} />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F0F0F0' }]}>
        <View style={styles.footerColumns}>
          <View style={styles.footerColumn}>
            <Text style={[styles.footerColumnTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
              Company
            </Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>About Us</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>Careers</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>Contact</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footerColumn}>
            <Text style={[styles.footerColumnTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
              Resources
            </Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>Help Center</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footerColumn}>
            <Text style={[styles.footerColumnTitle, { color: isDarkMode ? '#FFFFFF' : '#333333' }]}>
              Connect
            </Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity style={styles.socialIcon}>
                <FontAwesome5 name="facebook" size={20} color={isDarkMode ? '#BBBBBB' : '#666666'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <FontAwesome5 name="twitter" size={20} color={isDarkMode ? '#BBBBBB' : '#666666'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <FontAwesome5 name="instagram" size={20} color={isDarkMode ? '#BBBBBB' : '#666666'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <FontAwesome5 name="linkedin" size={20} color={isDarkMode ? '#BBBBBB' : '#666666'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.copyright}>
          <Text style={[styles.copyrightText, { color: isDarkMode ? '#999999' : '#999999' }]}>
            © {new Date().getFullYear()} PARAda Transportation. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  heroSection: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 600,
  },
  downloadButton: {
    marginBottom: 40,
  },
  downloadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
  },
  downloadIcon: {
    marginRight: 10,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  heroImage: {
    width: '100%',
    height: 250,
    maxWidth: 500,
    marginBottom: 40,
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureCard: {
    width: 300,
    margin: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    marginBottom: 15,
  },
  featureIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  featureDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaSection: {
    padding: 20,
    marginTop: 40,
    marginBottom: 40,
  },
  ctaBackground: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 25,
    opacity: 0.9,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 50,
  },
  ctaButtonText: {
    color: '#4B6BFE',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  ctaButtonIcon: {
    marginTop: 1,
  },
  footer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  footerColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginBottom: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  footerColumn: {
    minWidth: 180,
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  footerColumnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  footerLink: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'center',
  },
  socialIcon: {
    marginHorizontal: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  copyright: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  copyrightText: {
    textAlign: 'center',
    fontSize: 12,
  },
}); 