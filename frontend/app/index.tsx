import React, { useEffect, useState, useRef, Suspense } from 'react';
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
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use dynamic imports with a more TypeScript-friendly approach
const IOSInstallPromptComponent = React.lazy(() => {
  if (Platform.OS === 'web' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return import('../components/IOSInstallPrompt');
  } else {
    return Promise.resolve({ default: () => null });
  }
});

// Import directly instead of using lazy loading to avoid Suspense issues
import InstallationCounter from '../components/InstallationCounter';

// PWA installation detection
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Register service worker only in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
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
  const [isChecking, setIsChecking] = useState(true);
  
  // Use ref to track component mount status
  const isMounted = useRef(true);
  
  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    // Skip this effect during server-side rendering
    if (typeof window === 'undefined') return;
    
    let isActive = true; // Local flag to prevent state updates after cleanup
    
    async function checkAuth() {
      try {
        const token = await AsyncStorage.getItem('token');
        const userDataString = await AsyncStorage.getItem('user');
        
        // If user is already logged in, redirect to their home page
        if (token && userDataString && isActive) {
          try {
            const userData = JSON.parse(userDataString);
            
            if (userData && userData.role) {
              console.log('User already authenticated, redirecting to home');
              
              // Determine the appropriate redirect based on user role
              let redirectPath = '/(tabs)';
              if (userData.role === 'support') {
                redirectPath = '/support';
              }
              
              // Save the path for persistence
              if (Platform.OS === 'web') {
                try {
                  localStorage.setItem('parada_last_path', redirectPath);
                } catch (e) {
                  console.error('Error saving path to localStorage:', e);
                }
              }
              
              // Redirect to appropriate home page
              setTimeout(() => {
                if (isActive) {
                  router.replace(redirectPath);
                }
              }, 100);
              return;
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
        
        // If we get here, user is not authenticated or there was an error
        if (isActive) {
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        if (isActive) {
          setIsChecking(false);
        }
      }
    }
    
    checkAuth();
    
    // Cleanup function
    return () => {
      isActive = false;
    };
  }, []);

  // Check if PWA can be installed - use a safer approach
  useEffect(() => {
    // Skip this effect during server-side rendering
    if (typeof window === 'undefined' || Platform.OS !== 'web') return;
    
    let isActive = true;
    
    // Function to check if app is already installed
    const checkIfInstalled = () => {
      try {
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
          if (isActive) {
            setIsInstalled(true);
          }
        }
      } catch (e) {
        console.error('Error checking if app is installed:', e);
      }
    };
    
    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      try {
        e.preventDefault();
        deferredPromptRef.current = e as BeforeInstallPromptEvent;
        if (isActive) {
          setIsInstallable(true);
        }
        console.log('PWA is installable, prompt captured');
      } catch (error) {
        console.error('Error handling install prompt:', error);
      }
    };
    
    // Handle the appinstalled event
    const handleAppInstalled = () => {
      try {
        if (isActive) {
          setIsInstalled(true);
          setIsInstallable(false);
        }
        console.log('PWA was installed successfully');
      } catch (error) {
        console.error('Error handling app installed event:', error);
      }
    };
    
    // Check on mount
    checkIfInstalled();
    
    // Safe way to add event listeners
    try {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    } catch (e) {
      console.error('Error adding event listeners:', e);
    }
    
    // Cleanup function
    return () => {
      isActive = false;
      try {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      } catch (e) {
        console.error('Error removing event listeners:', e);
      }
    };
  }, []);

  // Don't render landing page until we've checked auth
  if (isChecking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          // iOS Safari - Show detailed instructions with visual cues
          Alert.alert(
            "Install PARAda App",
            "To install our app on your iOS device:\n\n1. Tap the Share button (rectangle with arrow) at the bottom of the screen\n\n2. Scroll down and tap 'Add to Home Screen'\n\n3. Tap 'Add' in the top right corner",
            [
              { 
                text: "Show Me How", 
                onPress: () => {
                  // This would ideally show a visual guide, but for now we'll just set a flag
                  // that our IOSInstallPrompt component can use
                  if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('showIOSInstallInstructions', 'true');
                    // Force a re-render to show instructions
                    setInstallAttempted(true);
                  }
                } 
              },
              { text: "Later", onPress: () => router.push('/auth/login') }
            ]
          );
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
      
      {/* iOS Install Prompt - Wrapped in Suspense for SSR compatibility */}
      <Suspense fallback={<View/>}>
        <IOSInstallPromptComponent />
      </Suspense>
      
      {/* Header - Updated to match login page */}
      <LinearGradient
        colors={colors.gradientColors}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/PARAda-Logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>PARAda</Text>
            <Text style={styles.headerSubtitle}>Real-Time Transportation Tracking</Text>
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
        
        <View style={styles.buttonAndCounterContainer}>
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
          
          {/* Installation Counter - now below the button, without Suspense */}
          <View style={styles.installationCounterWrapper}>
            <InstallationCounter 
              textColor={isDarkMode ? '#FFFFFF' : '#333333'}
              iconColor={colors.primary}
              backgroundColor={isDarkMode ? 'rgba(75, 107, 254, 0.1)' : 'rgba(75, 107, 254, 0.05)'}
              centered={true}
            />
          </View>
        </View>
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
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of users who are already experiencing the benefits of PARAda
          </Text>
          
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.ctaButtonText}>Sign Up Now</Text>
          </TouchableOpacity>
          
          {/* Installation Counter in CTA section - without Suspense */}
          <View style={styles.ctaInstallationCounter}>
            <InstallationCounter 
              textColor="#FFFFFF"
              iconColor="#FFFFFF"
              backgroundColor="rgba(255, 255, 255, 0.1)"
              centered={true}
            />
          </View>
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
              Support
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@parada.com')}>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>support@parada.com</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:help@parada.com')}>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>help@parada.com</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:customerservice@parada.com')}>
              <Text style={[styles.footerLink, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>customerservice@parada.com</Text>
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
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61574439785965')}
              >
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
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  headerTextContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
  },
  logo: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
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
  buttonAndCounterContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  downloadButton: {
    width: '100%',
    marginBottom: 16,
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
  installationCounterWrapper: {
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
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
  ctaGradient: {
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#4B6BFE',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ctaInstallationCounter: {
    marginTop: 15,
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 