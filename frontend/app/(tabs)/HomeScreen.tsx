import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StatusBar,
  ActivityIndicator,
  Animated,
  ScrollView,
  PanResponder,
  Modal,
  Image,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import MapView, { Marker, Polyline } from '../../components/MapView';
import * as Location from 'expo-location';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

// Import API services
import { getSubscriptionPlans, getUserSubscription, createSubscription } from '../../services/api/subscription.api';
import { BASE_URL } from '../../services/api/api.config';
import * as routeApi from '../../services/api/route.api';
import * as locationSocket from '../../services/socket/location.socket';
import { initializeSocket, disconnectSocket, getSocket } from '../../services/socket/socket.service';

// Import the VehicleAccess service
import { hasAccessToVehicleType, getAccessibleVehicleTypes } from '../../services/VehicleAccess';

// Import the vehicle API service
import { getNearbyVehicles } from '../../services/api/vehicle.api';

// Add type definition for subscription
interface SubscriptionResponse {
  _id: string;
  userId: string;
  type: string;
  planId: string;
  expiryDate: string;
  verification?: {
    verified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
  };
  paymentDetails?: {
    method: string;
    referenceNumber: string;
    paymentDate: string;
  };
}

// Components
import FeedbackForm from '../../components/FeedbackForm';
import { scheduleVehicleArrivalNotification, NotificationPermissionRequest } from '../../components/NotificationService';
import VehicleTypeModal from '../../components/VehicleTypeModal';
import SubscriptionView from '../../components/SubscriptionView';
import DestinationModal from '../../components/DestinationModal';
import NoSubscriptionOverlay from '../../components/NoSubscriptionOverlay';
import RequestRideModal from '../../components/RequestRideModal';
import RideStatusCard from '../../components/RideStatusCard';
import AdminDashboard from '../../components/AdminDashboard';
import GCashPaymentModal from '../../components/GCashPaymentModal';

// Context
import { useAuth, UserRole } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Constants and Types
import { lightMapStyle, darkMapStyle } from '../../constants/MapStyles';
import { Subscription, defaultSubscriptionPlans, SubscriptionId } from '../../constants/SubscriptionPlans';
import { vehicleTypes, VehicleTypeId } from '../../constants/VehicleTypes';
import { Vehicle, defaultVehicles } from '../../constants/VehicleData';
import { Route, defaultRoutes } from '../../constants/RouteData';
import { defaultPassengers } from '../../constants/PassengerData';
import { 
  Passenger, 
  RideStatus, 
  PassengerStatus,
  Destination
} from '../../models/RideTypes';

// Styles
import { homeScreenStyles } from '../../styles/HomeScreenStyles';

// Ensure images are available
const paymentImages = {
  gcash: require('../../assets/images/gcash.jpg'),
  logo: require('../../assets/images/PARAda-Logo.png'),
  instapay: require('../../assets/images/gcash.jpg') // Using gcash.jpg as a placeholder for the InstaPay QR code
};


export default function HomeScreen() {
  // Location and status states
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI interaction states
  const [showFeedback, setShowFeedback] = useState(false);
  const bottomSheetHeight = useRef(new Animated.Value(180)).current;
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const COLLAPSED_HEIGHT = 180;
  const EXPANDED_HEIGHT = 400;
  
  // Data states
  const [vehicles, setVehicles] = useState<Vehicle[]>(defaultVehicles);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>(defaultPassengers);
  
  // Subscription states
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleTypeId | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionId | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Subscription[]>(defaultSubscriptionPlans);
  const [isStudentDiscountEnabled, setIsStudentDiscountEnabled] = useState(true);
  const [studentDiscountPercent, setStudentDiscountPercent] = useState(20);
  const [showGCashPaymentModal, setShowGCashPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<{
    id: SubscriptionId;
    name: string;
    price: string;
  } | null>(null);
  
  // Admin states
  const [showAdminPriceModal, setShowAdminPriceModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Subscription | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<{planId: string, featureIdx: number} | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(true);
  
  // Driver states
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRouteManagementModal, setShowRouteManagementModal] = useState(false);
  
  // Passenger states
  const [showRequestRideModal, setShowRequestRideModal] = useState(false);
  const [showMyRideModal, setShowMyRideModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isRequestingRide, setIsRequestingRide] = useState(false);
  const [myRideStatus, setMyRideStatus] = useState<RideStatus>({ status: 'none' });
  
  // Add a new state variable for pending subscription
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const router = useRouter();
  const { isDarkMode, colors } = useTheme();
  
  // Theme colors
  const theme = {
    background: colors.background,
    card: colors.card,
    primary: colors.primary,
    primaryDark: colors.secondary,
    text: colors.text,
    textSecondary: colors.textSecondary,
    border: colors.border,
    marker: isDarkMode ? '#272727' : '#FFFFFF',
    danger: colors.error,
    success: colors.success,
    warning: colors.warning,
    gradientColors: colors.gradientColors,
    mapStyle: isDarkMode ? darkMapStyle : lightMapStyle,
    inputBackground: colors.inputBackground,
    inactiveItem: colors.inactiveItem,
  };
  
  // PanResponder for bottom sheet with improved dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        bottomSheetHeight.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        // Get current value and offset
        const currentValue = (bottomSheetHeight as any)._value || 0;
        const currentOffset = (bottomSheetHeight as any)._offset || 0;
        
        // Calculate new height with constraints
        const newHeight = Math.max(
          COLLAPSED_HEIGHT, 
          Math.min(EXPANDED_HEIGHT, currentValue + currentOffset - gestureState.dy)
        );
        
        // Set the new height
        bottomSheetHeight.setValue(newHeight - currentOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        bottomSheetHeight.flattenOffset();
        
        // Get current value
        const currentValue = (bottomSheetHeight as any)._value || 0;
        
        // Determine whether to expand or collapse based on gesture and current position
        if (gestureState.dy < -20) {
          // Dragging up
          expandBottomSheet();
        } else if (gestureState.dy > 20) {
          // Dragging down
          collapseBottomSheet();
        } else {
          // Small movement, snap to closest position
          if (currentValue < (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2) {
            collapseBottomSheet();
          } else {
            expandBottomSheet();
          }
        }
      },
      // Always capture the touch
      onPanResponderTerminationRequest: () => false
    })
  ).current;
  
  // Map ref
  const mapRef = useRef<any>(null);
  
  // Check local storage for pending subscription
  const checkLocalPendingSubscription = async () => {
    try {
      // Set a timeout to prevent hanging on this function
      const timeout = setTimeout(() => {
        console.log('Subscription check timed out, proceeding with default values');
        setHasSubscription(false);
        setIsPendingApproval(false);
        setIsLoading(false);
      }, 5000);
      
      // Check if this is a brand new registration
      const isNewRegistration = await AsyncStorage.getItem('isNewRegistration') === 'true';
      
      // Only consider a user new if it's explicitly marked as a new registration
      const isNewUser = isNewRegistration;
      
      // For brand new registrations, we should never show pending approval
      if (isNewUser) {
        console.log('Brand new registration detected, clearing any subscription data');
        await AsyncStorage.removeItem('userSubscription');
        setIsPendingApproval(false);
        setHasSubscription(false);
        clearTimeout(timeout);
        return;
      }
      
      // Always fetch fresh data from the API
      try {
        console.log('Fetching fresh subscription data from API');
        const subscription = await getUserSubscription();
        
        if (subscription) {
          console.log('Retrieved subscription from backend:', subscription);
          
          // Check if the subscription is pending or verified
          if (subscription.verification?.verified) {
            console.log('Setting verified subscription state');
            setHasSubscription(true);
            setIsPendingApproval(false);
            setSelectedVehicleType(subscription.type as VehicleTypeId);
            setSelectedSubscription(subscription.planId as SubscriptionId);
            
            // Store verified subscription in AsyncStorage
            const verifiedSub = {
              type: subscription.type,
              plan: subscription.planId,
              verified: true,
              approved: true,
              expiryDate: subscription.expiryDate || '',
              referenceNumber: subscription.paymentDetails?.referenceNumber || '',
              paymentDate: subscription.paymentDetails?.paymentDate || new Date().toISOString()
            };
            
            await AsyncStorage.setItem('userSubscription', JSON.stringify(verifiedSub));
          } 
          // Handle pending subscription
          else if ((subscription.verification?.status === 'pending' || subscription.pending) && 
                  subscription.paymentDetails && 
                  subscription.paymentDetails.referenceNumber) {
            console.log('Setting pending approval state');
            setIsPendingApproval(true);
            setHasSubscription(false);
            setSelectedVehicleType(subscription.type as VehicleTypeId);
            setSelectedSubscription(subscription.planId as SubscriptionId);
            
            // Store pending subscription in AsyncStorage for persistence
            const pendingSub = {
              type: subscription.type,
              plan: subscription.planId,
              expiryDate: subscription.expiryDate || '',
              referenceNumber: subscription.paymentDetails.referenceNumber,
              paymentDate: subscription.paymentDetails.paymentDate || new Date().toISOString(),
              approved: false,
              verified: false
            };
            
            await AsyncStorage.setItem('userSubscription', JSON.stringify(pendingSub));
          } else {
            console.log('Subscription is neither verified nor pending');
            setIsPendingApproval(false);
            setHasSubscription(false);
            await AsyncStorage.removeItem('userSubscription');
          }
        } else {
          console.log('No subscription found in API');
          setIsPendingApproval(false);
          setHasSubscription(false);
          await AsyncStorage.removeItem('userSubscription');
        }
      } catch (apiError: any) {
        if (apiError.response && apiError.response.status === 404) {
          // 404 means no subscription found, which is expected for users without subscriptions
          console.log('No subscription found (404)');
          setIsPendingApproval(false);
          setHasSubscription(false);
          await AsyncStorage.removeItem('userSubscription');
        } else {
          console.error('Error checking API for subscription:', apiError);
          
          // Try to use locally stored data if available
          try {
            const storedSubscription = await AsyncStorage.getItem('userSubscription');
            if (storedSubscription) {
              const parsedSub = JSON.parse(storedSubscription);
              console.log('Using locally stored subscription data in checkLocalPendingSubscription:', parsedSub);
              
              if (parsedSub.verified) {
                setHasSubscription(true);
                setIsPendingApproval(false);
                setSelectedVehicleType(parsedSub.type === 'all' ? 'latransco' : parsedSub.type as VehicleTypeId);
                setSelectedSubscription(parsedSub.plan as SubscriptionId);
              } else if (parsedSub.referenceNumber) {
                setIsPendingApproval(true);
                setHasSubscription(false);
                setSelectedVehicleType(parsedSub.type === 'all' ? 'latransco' : parsedSub.type as VehicleTypeId);
                setSelectedSubscription(parsedSub.plan as SubscriptionId);
              } else {
                // No valid data
                setIsPendingApproval(false);
                setHasSubscription(false);
                await AsyncStorage.removeItem('userSubscription');
              }
            } else {
              // Reset to default state if no local storage data
              setIsPendingApproval(false);
              setHasSubscription(false);
            }
          } catch (storageError) {
            console.error('Error reading from AsyncStorage:', storageError);
            // Reset to default state on error
            setIsPendingApproval(false);
            setHasSubscription(false);
          }
        }
      }
      
      clearTimeout(timeout);
    } catch (error) {
      console.error('Error checking local subscription status:', error);
      // Reset to default state on error
      setIsPendingApproval(false);
      setHasSubscription(false);
      // Also remove any potentially corrupted subscription data
      await AsyncStorage.removeItem('userSubscription');
    }
  };
  
  // Effect to load routes and subscribe to updates
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Set a timeout to avoid hanging in the loading state
        const timeout = setTimeout(() => {
          console.log('Loading data timed out, proceeding with default values');
          setIsLoading(false);
        }, 8000);
        
        // Load saved subscription plans
        try {
          const plans = await getSubscriptionPlans();
          if (plans && plans.length > 0) {
            setSubscriptionPlans(plans);
          } else {
            console.log('No subscription plans returned, using defaults');
            setSubscriptionPlans(defaultSubscriptionPlans);
          }
        } catch (plansError) {
          console.error('Error loading subscription plans:', plansError);
          // Continue with default plans if API fails
          setSubscriptionPlans(defaultSubscriptionPlans);
        }
        
        // For admin and driver users, automatically grant subscription access
        if (user?.role === 'admin' || user?.role === 'driver') {
          setHasSubscription(true);
          setIsPendingApproval(false); // Ensure this is false for admin/driver
          setSelectedVehicleType(user?.role === 'driver' ? 'jeep' : 'latransco');
          setSelectedSubscription('premium');
          setIsLoading(false);
          clearTimeout(timeout);
          return;
        }
        
        // Check if user has a verified subscription from user object
        if (user?.subscription && user.subscription.verified) {
          setSelectedVehicleType(user.subscription.type === 'all' ? 'latransco' : user.subscription.type as VehicleTypeId);
          setSelectedSubscription(user.subscription.plan as SubscriptionId);
          setHasSubscription(true);
          setIsPendingApproval(false); // Ensure this is false for verified users
        
          // Get list of accessible vehicle types
          try {
            const accessibleTypes = getAccessibleVehicleTypes(user);
            console.log('User has access to these vehicle types:', accessibleTypes);
          } catch (accessError) {
            console.error('Error getting accessible vehicle types:', accessError);
            // Continue with default access
          }
        
          setIsLoading(false);
          clearTimeout(timeout);
          return;
        }
        
        // Check if user has any local subscription data first
        // This ensures we show pending approval state immediately after login
        try {
          await checkLocalPendingSubscription();
        } catch (localCheckError) {
          console.error('Error checking local subscription:', localCheckError);
          // Continue with API check on error
        }
        
        // For non-admin users, check subscription from backend
        try {
          // Check if this is a brand new registration
          const isNewRegistration = await AsyncStorage.getItem('isNewRegistration') === 'true';
          
          // Only consider a user new if it's explicitly marked as a new registration
          const isNewUser = isNewRegistration;
          
          // For brand new registrations, explicitly clear any subscription data
          if (isNewUser) {
            console.log('Brand new registration detected in loadData, clearing subscription data');
            await AsyncStorage.removeItem('userSubscription');
            setIsPendingApproval(false);
            setHasSubscription(false);
          } 
          // Skip subscription check for brand new registrations
          else {
            try {
              console.log('Attempting to get user subscription from API...');
              const subscription = await getUserSubscription();
              
              if (subscription) {
                console.log('Retrieved subscription from backend:', subscription);
                
                // Check if the subscription is verified
                if (subscription.verification?.verified) {
                  console.log('Setting verified subscription state');
                  setSelectedVehicleType(subscription.type === 'all' ? 'latransco' : subscription.type as VehicleTypeId);
                  setSelectedSubscription(subscription.planId as SubscriptionId);
                  setHasSubscription(true);
                  setIsPendingApproval(false); // Ensure this is false for verified users
                  
                  // Store verified subscription in AsyncStorage
                  const verifiedSub = {
                    type: subscription.type,
                    plan: subscription.planId,
                    expiryDate: subscription.expiryDate,
                    referenceNumber: subscription.paymentDetails?.referenceNumber || '',
                    paymentDate: subscription.paymentDetails?.paymentDate || new Date().toISOString(),
                    approved: true,
                    verified: true
                  };
                  await AsyncStorage.setItem('userSubscription', JSON.stringify(verifiedSub));
                } 
                // Check for pending subscription - either by status or pending flag
                else if ((subscription.verification?.status === 'pending' || subscription.pending) &&
                         subscription.paymentDetails && 
                         subscription.paymentDetails.referenceNumber) {
                  console.log('Setting pending approval state from backend data - payment made with reference:', 
                              subscription.paymentDetails.referenceNumber);
                  setIsPendingApproval(true);
                  setHasSubscription(false);
                  setSelectedVehicleType(subscription.type === 'all' ? 'latransco' : subscription.type as VehicleTypeId);
                  setSelectedSubscription(subscription.planId as SubscriptionId);
                  
                  // Store pending subscription in AsyncStorage for persistence
                  const pendingSub = {
                    type: subscription.type,
                    plan: subscription.planId,
                    expiryDate: subscription.expiryDate,
                    referenceNumber: subscription.paymentDetails.referenceNumber,
                    paymentDate: subscription.paymentDetails.paymentDate || new Date().toISOString(),
                    approved: false,
                    verified: false
                  };
                  await AsyncStorage.setItem('userSubscription', JSON.stringify(pendingSub));
                } else {
                  // No valid payment reference number or invalid state, don't show pending approval
                  console.log('No valid subscription state found');
                  setIsPendingApproval(false);
                  setHasSubscription(false);
                  await AsyncStorage.removeItem('userSubscription');
                }
              } else {
                // No subscription found from backend
                console.log('No subscription found from backend API');
                setIsPendingApproval(false);
                setHasSubscription(false);
                await AsyncStorage.removeItem('userSubscription');
              }
            } catch (error) {
              console.error('Error fetching subscription from API:', error);
              if ((error as any).response && (error as any).response.status === 404) {
                // 404 means no subscription found, which is expected for users without subscriptions
                console.log('No subscription found (404) - expected for new users');
                setIsPendingApproval(false);
                setHasSubscription(false);
              } else {
                console.error('Error fetching subscription:', error);
                // Use the locally stored subscription data if API fails for any reason other than 404
                try {
                  const storedSubscription = await AsyncStorage.getItem('userSubscription');
                  if (storedSubscription) {
                    const parsedSub = JSON.parse(storedSubscription);
                    console.log('Using locally stored subscription data:', parsedSub);
                    
                    if (parsedSub.verified) {
                      setHasSubscription(true);
                      setIsPendingApproval(false);
                      setSelectedVehicleType(parsedSub.type === 'all' ? 'latransco' : parsedSub.type as VehicleTypeId);
                      setSelectedSubscription(parsedSub.plan as SubscriptionId);
                    } else if (parsedSub.referenceNumber) {
                      setIsPendingApproval(true);
                      setHasSubscription(false);
                    } else {
                      // No valid data in stored subscription
                      setIsPendingApproval(false);
                      setHasSubscription(false);
                    }
                  } else {
                    console.log('No local subscription data found, proceeding without subscription');
                    setIsPendingApproval(false);
                    setHasSubscription(false);
                  }
                } catch (storageError) {
                  console.error('Error reading from AsyncStorage:', storageError);
                  // Default to no subscription on error
                  setIsPendingApproval(false);
                  setHasSubscription(false);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
          // Default to no subscription on any error
          setIsPendingApproval(false);
          setHasSubscription(false);
        }
        
        // Load routes if user has access
        try {
          // Use type assertion to fix the comparison
          const userRole = user?.role as UserRole;
          if (userRole === 'admin' || userRole === 'driver' || 
              (user?.subscription && user.subscription.verified)) {
            const routeData = await routeApi.getRoutes({ active: true });
            if (routeData && routeData.length > 0) {
              setRoutes(routeData);
            } else {
              // Fall back to default routes if no data
              setRoutes(defaultRoutes);
            }
          } else {
            // Set default routes for users without access
            setRoutes(defaultRoutes);
          }
        } catch (routeError) {
          console.error('Error loading routes:', routeError);
          // Continue with default routes if API fails
          setRoutes(defaultRoutes);
        }
        
        // Load nearby vehicles using real data if location is available
        if (location && location.coords) {
          try {
            const nearbyVehicles = await getNearbyVehicles({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }, 10); // 10km radius
            
            if (nearbyVehicles && nearbyVehicles.length > 0) {
              console.log('Loaded real vehicle data:', nearbyVehicles);
              setVehicles(nearbyVehicles);
            } else {
              console.log('No nearby vehicles found, using default data');
              // Fall back to default vehicles if no real data
              setVehicles(defaultVehicles);
            }
          } catch (vehicleError) {
            console.error('Error loading nearby vehicles:', vehicleError);
            // Fall back to default vehicles if API fails
            setVehicles(defaultVehicles);
          }
        } else {
          // Use default vehicles if no location
          setVehicles(defaultVehicles);
        }
        
        clearTimeout(timeout);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        // Ensure we set default values for critical state variables
        setSubscriptionPlans(defaultSubscriptionPlans);
        setVehicles(defaultVehicles);
        setRoutes(defaultRoutes);
        setIsPendingApproval(false);
        if (user?.role === 'admin' || user?.role === 'driver') {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Set up socket connection
    try {
      initializeSocket();
    } catch (socketError) {
      console.error('Error initializing socket:', socketError);
    }
    
    return () => {
      // Clean up socket connection
      try {
        disconnectSocket();
      } catch (socketError) {
        console.error('Error disconnecting socket:', socketError);
      }
    };
  }, [user, location]);

  // Add a function to refresh vehicle data when location changes
  const refreshNearbyVehicles = async () => {
    if (!location || !location.coords) return;
    
    try {
      const nearbyVehicles = await getNearbyVehicles({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }, 10);
      
      if (nearbyVehicles && nearbyVehicles.length > 0) {
        console.log('Refreshed real vehicle data:', nearbyVehicles);
        setVehicles(nearbyVehicles);
      }
    } catch (error) {
      console.error('Error refreshing nearby vehicles:', error);
      // Don't update vehicles on error to keep existing data
    }
  };
  
  // Add effect to refresh vehicles when location changes
  useEffect(() => {
    if (location && location.coords) {
      refreshNearbyVehicles();
    }
  }, [location]);

  // Update socket event handler to receive real-time vehicle updates
  useEffect(() => {
    // Get the socket from the service
    const socketInstance = getSocket();
    
    if (socketInstance) {
      // Subscribe to vehicle updates
      socketInstance.on('vehicle_updates', (data) => {
        if (data && data.vehicles && Array.isArray(data.vehicles)) {
          console.log('Received real-time vehicle updates:', data.vehicles);
          setVehicles(data.vehicles);
        }
      });
      
      return () => {
        socketInstance.off('vehicle_updates');
      };
    }
  }, []);
  
  // Effect to initialize bottom sheet position
  useEffect(() => {
    if (user?.role === 'passenger' && hasSubscription) {
      // Set initial position
      bottomSheetHeight.setValue(COLLAPSED_HEIGHT);
      setIsBottomSheetExpanded(false);
    }
  }, [user?.role, hasSubscription]);
  
  // Location permission effect
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        // Use a more user-friendly error message that indicates limited functionality
        setErrorMsg('Location unavailable. Some features may be limited.');
        // Set a default location for the map (use a central location in your service area)
        setLocation({
          coords: {
            latitude: 10.3157, // Default to Cebu City, Philippines
            longitude: 123.8854,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);
  
  // Admin dashboard effect
  useEffect(() => {
    if (user?.role === 'admin') {
      setShowAdminDashboard(true);
    }
  }, [user]);
  
  // Bottom sheet animation functions
  const expandBottomSheet = () => {
    Animated.spring(bottomSheetHeight, {
      toValue: EXPANDED_HEIGHT,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    setIsBottomSheetExpanded(true);
  };

  const collapseBottomSheet = () => {
    Animated.spring(bottomSheetHeight, {
      toValue: COLLAPSED_HEIGHT,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    setIsBottomSheetExpanded(false);
  };

  const toggleBottomSheet = () => {
    if (!isBottomSheetExpanded) {
      expandBottomSheet();
    } else {
      collapseBottomSheet();
    }
  };
  
  // Feature functions
  const selectVehicleType = (type: string) => {
    setSelectedVehicleType(type as VehicleTypeId);
    setShowVehicleTypeModal(false);
    setShowSubscriptionModal(true);
  };

  // Modified to skip vehicle type selection for subscription
  const showSubscriptionOptions = () => {
    // Skip vehicle type selection and go directly to subscription modal
    setShowSubscriptionModal(true);
  };

  const subscribeToService = (planId: SubscriptionId) => {
    // Find the selected plan details
    const selectedPlan = subscriptionPlans.find(plan => plan.id === planId);
    
    if (selectedPlan) {
      // Set the selected plan for payment
      setSelectedPlanForPayment({
        id: planId,
        name: selectedPlan.name,
        price: String(selectedPlan.price) // Convert to string if it's a number
      });
      
      // Close subscription modal and show GCash payment modal
      setShowSubscriptionModal(false);
      setShowGCashPaymentModal(true);
    } else {
      Alert.alert('Error', 'Could not find the selected subscription plan. Please try again.');
    }
  };
  
  const handlePaymentSuccess = async (planId: SubscriptionId, referenceNumber: string) => {
    try {
      // Store the selected plan and vehicle type for when approval happens
      setSelectedSubscription(planId);
      
      // Create subscription data
      const subscriptionData = {
        planId: planId,
        type: 'all', // Use 'all' to allow access to all vehicle types
        referenceNumber: referenceNumber,
        paymentMethod: 'gcash',
        autoRenew: false,
        studentDiscount: {
          applied: user?.accountType === 'student',
          percentage: studentDiscountPercent
        }
      };
      
      let savedSuccessfully = false;
      let subscriptionResponse = null;
      
      // Try to use the backend API first
      try {
        subscriptionResponse = await createSubscription(subscriptionData);
        console.log('Subscription created successfully via API:', subscriptionResponse);
        savedSuccessfully = true;
      } catch (apiError) {
        console.warn('API call failed, using AsyncStorage fallback:', apiError);
        savedSuccessfully = false;
      }
      
      // Always store in AsyncStorage as a backup (even if API succeeds)
      // This ensures the subscription status persists across app restarts
      try {
        const now = new Date();
        const expiry = new Date(now);
        expiry.setDate(expiry.getDate() + (planId === 'annual' ? 365 : 30));
        
        const subscriptionDataLocal = {
          username: user?.username || 'User',
          type: 'all', // Use 'all' to allow access to all vehicle types
          plan: planId,
          expiryDate: expiry.toISOString(),
          referenceNumber: referenceNumber,
          paymentDate: now.toISOString(),
          approved: false,
          verified: false
        };
        
        await AsyncStorage.setItem('userSubscription', JSON.stringify(subscriptionDataLocal));
        console.log('Subscription saved to AsyncStorage');
        savedSuccessfully = true;
      } catch (storageError) {
        console.error('Error saving to AsyncStorage:', storageError);
        if (!savedSuccessfully) {
          throw new Error('Failed to save subscription data');
        }
      }
      
      // Set pending approval state to true
      setIsPendingApproval(true);
      setHasSubscription(false); // Make sure subscription is not active until approved
      
      // Close the payment modal
      setShowGCashPaymentModal(false);
      
      // Display success message
      Alert.alert(
        'Payment Received',
        'Your payment has been submitted and is pending approval. You will be notified once your subscription is verified.',
        [{ text: 'OK' }]
      );
      
      // Force a reload of the subscription data
      await checkLocalPendingSubscription();
    } catch (error) {
      console.error('Error saving subscription:', error);
      Alert.alert('Subscription Error', 'Could not process your subscription. Please try again.');
    }
  };

  const sendNotification = async (vehicle: Vehicle) => {
    try {
      // Check if nearby vehicle notifications are enabled in settings
      const systemSettings = await AsyncStorage.getItem('systemSettings');
      let nearbyVehicleNotificationsEnabled = true; // Default to true if setting not found
      
      if (systemSettings) {
        const parsedSettings = JSON.parse(systemSettings);
        if (parsedSettings.nearbyVehicleNotifications !== undefined) {
          nearbyVehicleNotificationsEnabled = parsedSettings.nearbyVehicleNotifications;
        }
      }
      
      // Only proceed if notifications are enabled
      if (!nearbyVehicleNotificationsEnabled) {
        console.log('Nearby vehicle notifications are disabled in settings');
        Alert.alert(
          'Notifications Disabled',
          'Nearby vehicle notifications are currently disabled. You can enable them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Settings', 
              onPress: () => {
                // Navigate to settings screen
                router.push('/(tabs)/system-settings');
              }
            }
          ]
        );
        return;
      }
      
      const success = await scheduleVehicleArrivalNotification(vehicle.name, vehicle.eta);
      
      if (success) {
      Alert.alert(
        'Notification Set', 
        `You will be notified when ${vehicle.name} is approaching.`
      );
      }
      // No need for else case as the scheduleVehicleArrivalNotification function
      // will handle showing fallback notifications internally
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to set notification. Please try again.');
    }
  };
  
  // Function to start listening for ride status updates via socket
  const startRideStatusListener = async (rideId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user) return;
      
      // Initialize socket connection for this ride
      const socket = await locationSocket.initializeLocationSocket(user.id, token);
      
      // Listen for driver assignment
      socket.on('driver_assigned', (data) => {
        if (data.rideId === rideId) {
          console.log('Driver assigned to ride:', data);
          
          // Update ride status with driver info
          setMyRideStatus(prev => ({
            ...prev,
            status: 'assigned',
            driverId: data.driverId,
            vehicle: data.driverDetails ? {
              id: parseInt(data.driverId),
              type: data.driverDetails.vehicleType || 'unknown',
              name: data.driverDetails.name || 'Driver',
              eta: data.estimatedArrival ? '~' + Math.ceil((new Date(data.estimatedArrival).getTime() - Date.now()) / 60000) + ' min' : 'Soon',
              location: data.driverDetails.currentLocation || { latitude: 0, longitude: 0 }
            } : prev.vehicle
          }));
          
          // Show notification
          Alert.alert(
            'Driver Assigned',
            `A driver has been assigned to your ride and will arrive shortly.`,
            [{ text: 'OK' }]
          );
        }
      });
      
      // Listen for ride status updates
      socket.on('ride_status_update', (data) => {
        if (data.rideId === rideId) {
          console.log('Ride status update:', data);
          
          setMyRideStatus(prev => ({
            ...prev,
            status: data.status
          }));
          
          // Show appropriate notifications based on status
          if (data.status === 'picked_up') {
            Alert.alert(
              'Driver Arrived',
              'Your driver has arrived at the pickup location.',
              [{ text: 'OK' }]
            );
          } else if (data.status === 'completed') {
            Alert.alert(
              'Ride Completed',
              'Your ride has been completed. Thank you for using PARAda!',
              [{ text: 'OK' }]
            );
            // Reset ride status after completion
            setTimeout(() => setMyRideStatus({ status: 'none' }), 5000);
          } else if (data.status === 'cancelled') {
            Alert.alert(
              'Ride Cancelled',
              `Your ride has been cancelled. Reason: ${data.reason || 'No reason provided'}`,
              [{ text: 'OK' }]
            );
            // Reset ride status after cancellation
            setTimeout(() => setMyRideStatus({ status: 'none' }), 3000);
          }
        }
      });
      
      // Listen for driver location updates
      socket.on('driver_location', (data) => {
        if (data.rideId === rideId) {
          console.log('Driver location update:', data);
          
          // Update vehicle location in ride status
          setMyRideStatus(prev => ({
            ...prev,
            vehicle: prev.vehicle ? {
              ...prev.vehicle,
              location: data.location
            } : undefined
          }));
        }
      });
      
      return () => {
        // Clean up listeners when component unmounts
        socket.off('driver_assigned');
        socket.off('ride_status_update');
        socket.off('driver_location');
      };
    } catch (error) {
      console.error('Error setting up ride status listener:', error);
    }
  };
  
  // Update the handleRequestRide function to use real data
  const handleRequestRide = async () => {
    if (!selectedDestination || !selectedVehicleType) {
      Alert.alert('Error', 'Please select a destination and vehicle type');
      return;
    }
    
    setIsRequestingRide(true);
    
    try {
      // Show a success message
      Alert.alert(
        'Ride Requested',
        'Your ride request has been submitted. Looking for a driver...',
        [{ text: 'OK' }]
      );
      
      // Reset state
      setShowRequestRideModal(false);
      setSelectedDestination(null);
      
      // Start listening for ride status updates
      // This would normally use the ride ID returned from the API
      // For now, we'll use a placeholder ID
      const rideId = 'placeholder-ride-id';
      startRideStatusListener(rideId);
      
      // Set ride status to waiting
      setMyRideStatus({
        status: 'waiting',
        destination: selectedDestination
      });
    } catch (error) {
      console.error('Error requesting ride:', error);
      Alert.alert('Error', 'Failed to request ride. Please try again.');
    } finally {
      setIsRequestingRide(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[homeScreenStyles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4B6BFE" />
        <Text style={[homeScreenStyles.loadingText, { color: theme.text }]}>Getting your location...</Text>
      </View>
    );
  }
  
  // Modified error handling - show warning banner instead of full error screen
  const locationErrorBanner = errorMsg && (
    <View style={homeScreenStyles.errorBanner}>
      <FontAwesome5 name="exclamation-triangle" size={16} color="#FF3B30" />
      <Text style={homeScreenStyles.errorBannerText}>{errorMsg}</Text>
      <TouchableOpacity 
        style={homeScreenStyles.errorBannerButton}
        onPress={() => {
          setErrorMsg(null);
          setIsLoading(true);
          Location.getCurrentPositionAsync({})
            .then(location => {
              setLocation(location);
              setIsLoading(false);
            })
            .catch(() => {
              setErrorMsg('Location unavailable. Some features may be limited.');
              setIsLoading(false);
            });
        }}
      >
        <Text style={homeScreenStyles.errorBannerButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render main screen
  return (
    <View style={[homeScreenStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Show location error banner if there's an error */}
      {locationErrorBanner}
      
      {/* Add notification permission request banner for web */}
      {Platform.OS === 'web' && <NotificationPermissionRequest />}
      
      <MapView
        ref={mapRef}
        style={homeScreenStyles.map}
        initialRegion={{
          latitude: location?.coords?.latitude || 37.78825,
          longitude: location?.coords?.longitude || -122.4324,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        }}
        mapStyle={isDarkMode ? darkMapStyle : lightMapStyle}
        showLocationButton={true}
      >
        {/* User location marker */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
          >
            <View style={homeScreenStyles.myLocationMarker}>
              <View style={homeScreenStyles.myLocationDot} />
            </View>
          </Marker>
        )}
        
        {/* Vehicle markers */}
        {user?.role !== 'admin' && vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            coordinate={vehicle.location}
            title={vehicle.name}
            description={`ETA: ${vehicle.eta}`}
          >
            <View style={[homeScreenStyles.vehicleMarker, { 
              backgroundColor: ['latransco', 'calvo', 'corominas', 'ceres', 'gabe'].includes(vehicle.type) ? '#4B6BFE' : '#3451E1',
              width: user?.role === 'passenger' ? 45 : 35,
              height: user?.role === 'passenger' ? 45 : 35,
              borderRadius: user?.role === 'passenger' ? 22.5 : 17.5,
              borderWidth: user?.role === 'passenger' ? 3 : 2,
              shadowOpacity: user?.role === 'passenger' ? 0.4 : 0.2
            }]}>
              <FontAwesome5 
                name={['latransco', 'calvo', 'corominas', 'ceres', 'gabe'].includes(vehicle.type) ? 'bus' : 'shuttle-van'} 
                size={user?.role === 'passenger' ? 20 : 16} 
                color="white" 
              />
            </View>
          </Marker>
        ))}
        
        {/* Route paths and stops */}
        {user?.role !== 'driver' && hasSubscription && routes.filter(r => r.active).map((route) => (
          <React.Fragment key={route.id}>
            <Polyline
              coordinates={route.path}
              strokeWidth={4}
              strokeColor="#4B6BFE"
              lineDashPattern={[1]}
            />
            {route.stops.map((stop, index) => (
              <Marker
                key={`stop-${route.id}-${index}`}
                coordinate={stop.coordinates}
                title={stop.name}
              >
                <View style={homeScreenStyles.stopMarker}>
                  <FontAwesome5 name="map-pin" size={16} color="#4B6BFE" />
                </View>
              </Marker>
            ))}
          </React.Fragment>
        ))}
        
        {/* Passenger locations for drivers */}
        {user?.role === 'driver' && passengers.map((passenger) => (
          <Marker
            key={`passenger-${passenger.id}`}
            coordinate={passenger.location}
            title={passenger.name}
            description={`Status: ${passenger.status.charAt(0).toUpperCase() + passenger.status.slice(1)}`}
          >
            <View style={[homeScreenStyles.passengerMarker, {
              backgroundColor: passenger.status === 'waiting' ? '#FF3B30' : 
                              passenger.status === 'assigned' ? '#FFCC00' : '#4CD964',
              width: 45,
              height: 45,
              borderRadius: 22.5,
              borderWidth: 3,
              shadowOpacity: 0.4,
              shadowRadius: 5
            }]}>
              <FontAwesome5 name="user" size={18} color="white" />
              {passenger.destination && (
                <View style={homeScreenStyles.passengerDestPin}>
                  <FontAwesome5 name="map-marker-alt" size={12} color="white" />
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Admin dashboard */}
      {user?.role === 'admin' && (
        <AdminDashboard
          isDarkMode={isDarkMode}
          theme={{
            card: theme.card,
            text: theme.text,
            textSecondary: theme.textSecondary
          }}
          onOpenSubscriptions={() => setShowAdminPriceModal(true)}
          onNavigateToAdmin={() => router.push('/admin')}
          onToggleMapView={() => setShowAdminDashboard(!showAdminDashboard)}
          showAdminDashboard={showAdminDashboard}
        />
      )}

      {/* No subscription overlay - Only show for users who don't have a subscription or pending verification */}
      {user?.role === 'passenger' && !hasSubscription && (
        <NoSubscriptionOverlay 
          onSelectVehiclePress={() => showSubscriptionOptions()}
          isDarkMode={isDarkMode}
          isPendingApproval={isPendingApproval}
          theme={{
            card: theme.card,
            text: theme.text,
            textSecondary: theme.textSecondary,
            background: theme.background
          }}
        />
      )}

      {/* App header */}
      <View style={homeScreenStyles.headerContainer}>
        <LinearGradient
          colors={theme.gradientColors}
          style={homeScreenStyles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={homeScreenStyles.headerContent}>
            <View style={homeScreenStyles.logoContainer}>
              <Image 
                source={require('../../assets/images/PARAda-Logo.png')} 
                style={homeScreenStyles.logo} 
                resizeMode="contain"
              />
            </View>
            <View style={homeScreenStyles.headerTextContainer}>
              <Text style={homeScreenStyles.headerTitle}>PARAda</Text>
              <Text style={homeScreenStyles.headerSubtitle}>Real-Time Transportation Tracking</Text>
            </View>
          </View>
          
          {/* Subscription badge */}
          {user?.role === 'passenger' && hasSubscription && (
            <TouchableOpacity
              style={homeScreenStyles.subscriptionBadge}
              onPress={() => router.push('/profile')}
            >
              <FontAwesome5 
                name={vehicleTypes.find(v => v.id === selectedVehicleType)?.icon || 'bus'} 
                size={14} 
                color="#fff" 
                style={homeScreenStyles.subscriptionIcon}
              />
              <Text style={homeScreenStyles.subscriptionText}>
                {selectedSubscription ? 
                  selectedSubscription.charAt(0).toUpperCase() + selectedSubscription.slice(1) 
                  : ''}
              </Text>
            </TouchableOpacity>
          )}

          {/* Admin badge */}
          {user?.role === 'admin' && (
            <TouchableOpacity
              style={homeScreenStyles.adminBadge}
              onPress={() => setShowAdminPriceModal(true)}
            >
              <FontAwesome5 
                name="crown" 
                size={12} 
                color="#fff" 
                style={homeScreenStyles.adminIcon}
              />
              <Text style={homeScreenStyles.adminBadgeText}>
                Admin
              </Text>
            </TouchableOpacity>
          )}

          {/* Driver badge */}
          {user?.role === 'driver' && (
            <TouchableOpacity
              style={homeScreenStyles.driverBadge}
              onPress={() => setShowRouteManagementModal(true)}
            >
              <FontAwesome5 
                name="route" 
                size={14} 
                color="#fff" 
                style={homeScreenStyles.driverIcon}
              />
              <Text style={homeScreenStyles.driverBadgeText}>
                Driver Mode
              </Text>
            </TouchableOpacity>
          )}

          {/* Passenger badge - for passengers without subscription */}
          {user?.role === 'passenger' && !hasSubscription && (
            <TouchableOpacity
              style={homeScreenStyles.passengerBadge}
              onPress={() => showSubscriptionOptions()}
            >
              <FontAwesome5 
                name={user?.accountType === 'student' ? 'graduation-cap' : 'user-friends'} 
                size={14} 
                color="#fff" 
                style={homeScreenStyles.passengerIcon}
              />
              <Text style={homeScreenStyles.passengerBadgeText}>
                {user?.accountType === 'student' ? 'Student' : 'Passenger'}
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      {/* Bottom sheet for passengers */}
      {user?.role === 'passenger' && hasSubscription && (
        <Animated.View 
          style={[homeScreenStyles.bottomSheet, { 
            height: bottomSheetHeight,
            backgroundColor: theme.card 
          }]}
        >
          {/* Make only the handle area draggable */}
          <TouchableWithoutFeedback onPress={toggleBottomSheet}>
            <View 
              style={homeScreenStyles.bottomSheetHandle}
              {...panResponder.panHandlers}
            >
              <View style={[homeScreenStyles.handleBar, { backgroundColor: isDarkMode ? '#555' : '#DDD' }]} />
              <View style={homeScreenStyles.handleBarContainer}>
                <FontAwesome5 
                  name={isBottomSheetExpanded ? "chevron-down" : "chevron-up"} 
                  size={12} 
                  color={isDarkMode ? '#999' : '#777'}
                  style={{ marginTop: 5 }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
          
          {/* Show searching UI when waiting for driver */}
          {myRideStatus.status === 'waiting' ? (
            <>
              <LinearGradient
                colors={theme.gradientColors}
                style={homeScreenStyles.searchingHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={homeScreenStyles.searchingTitle}>Searching for Driver</Text>
                <TouchableOpacity 
                  style={homeScreenStyles.closeButton}
                  onPress={() => {
                    // Cancel ride logic
                    Alert.alert(
                      'Cancel Ride',
                      'Are you sure you want to cancel your ride?',
                      [
                        { text: 'No', style: 'cancel' },
                        { 
                          text: 'Yes', 
                          style: 'destructive', 
                          onPress: () => {
                            // Reset ride status
                            setMyRideStatus({
                              status: 'none',
                              eta: '',
                              vehicle: undefined
                            });
                          } 
                        }
                      ]
                    );
                  }}
                >
                  <FontAwesome5 name="times" size={16} color="white" />
                </TouchableOpacity>
              </LinearGradient>
              
              <View style={homeScreenStyles.searchingBody}>
                <ActivityIndicator size="large" color="#4B6BFE" />
                <Text style={[homeScreenStyles.searchingText, { color: theme.textSecondary }]}>
                  Looking for available drivers...
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[homeScreenStyles.bottomSheetTitle, { color: theme.text }]}>Nearby Vehicles</Text>
              
              {/* Request ride button */}
              <TouchableOpacity
                style={homeScreenStyles.requestRideButtonInBottomSheet}
                onPress={() => setShowRequestRideModal(true)}
              >
                <LinearGradient
                  colors={theme.gradientColors}
                  style={homeScreenStyles.requestRideGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <FontAwesome5 name="taxi" size={16} color="white" style={{ marginRight: 8 }} />
                  <Text style={homeScreenStyles.requestRideText}>Request a Ride</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Vehicles list */}
              <ScrollView 
                style={homeScreenStyles.vehiclesList} 
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[homeScreenStyles.vehicleItem, { borderBottomColor: theme.border }]}
                      onPress={() => sendNotification(vehicle)}
                      activeOpacity={0.7}
                    >
                      <View style={[homeScreenStyles.vehicleIconContainer, {
                        backgroundColor: ['latransco', 'calvo', 'corominas', 'ceres', 'gabe'].includes(vehicle.type) ? '#4B6BFE' : '#3451E1'
                      }]}>
                        <FontAwesome5 
                          name={['latransco', 'calvo', 'corominas', 'ceres', 'gabe'].includes(vehicle.type) ? 'bus' : 'shuttle-van'} 
                          size={18} 
                          color="white" 
                        />
                      </View>
                      <View style={homeScreenStyles.vehicleInfo}>
                        <Text style={[homeScreenStyles.vehicleName, { color: theme.text }]}>{vehicle.name}</Text>
                        <Text style={[homeScreenStyles.vehicleEta, { color: theme.textSecondary }]}>ETA: {vehicle.eta}</Text>
                      </View>
                      <TouchableOpacity 
                        style={homeScreenStyles.notifyButton}
                        onPress={() => sendNotification(vehicle)}
                      >
                        <FontAwesome5 name="bell" size={16} color="#4B6BFE" />
                        <Text style={homeScreenStyles.notifyText}>Notify</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={homeScreenStyles.noVehiclesContainer}>
                    <FontAwesome5 name="bus" size={40} color="#DDDDDD" />
                    <Text style={[homeScreenStyles.noVehiclesText, { color: theme.textSecondary }]}>
                      No vehicles available in your area
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </Animated.View>
      )}

      {/* Modals - Order matters for z-index (higher in the list = higher z-index) */}
      
      {/* Destination modal - Should appear on top of request ride modal */}
      <DestinationModal 
        isVisible={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        onSelectDestination={(destination) => {
          setSelectedDestination(destination);
          setShowDestinationModal(false);
        }}
        userLocation={location}
        theme={{
          card: theme.card,
          border: theme.border,
          text: theme.text,
          textSecondary: theme.textSecondary,
          gradientColors: theme.gradientColors as [string, string]
        }}
      />
      
      {/* Request ride modal */}
      <RequestRideModal
        isVisible={showRequestRideModal && !showDestinationModal} // Hide when destination modal is open
        onClose={() => setShowRequestRideModal(false)}
        onRequestRide={handleRequestRide}
        hasLocation={!!location}
        selectedDestination={selectedDestination}
        selectedVehicleType={selectedVehicleType}
        isRequestingRide={isRequestingRide}
        vehicleTypes={vehicleTypes}
        onSelectVehicleType={(typeId) => setSelectedVehicleType(typeId as VehicleTypeId)}
        theme={{
          card: theme.card,
          border: theme.border,
          text: theme.text,
          textSecondary: theme.textSecondary,
          gradientColors: theme.gradientColors as [string, string]
        }}
        openDestinationModal={() => setShowDestinationModal(true)}
      />
      
      {/* Feedback form */}
      {user?.role !== 'admin' && (
      <FeedbackForm 
        isVisible={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
      )}
      
      {/* Vehicle selection modal */}
      <VehicleTypeModal
        isVisible={showVehicleTypeModal}
        onClose={() => setShowVehicleTypeModal(false)}
        onSelect={(typeId) => selectVehicleType(typeId)}
        vehicleTypes={vehicleTypes}
        theme={{
          card: theme.card,
          border: theme.border,
          text: theme.text,
          textSecondary: theme.textSecondary,
          gradientColors: theme.gradientColors as [string, string],
        }}
      />
      
      {/* Subscription modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showSubscriptionModal}
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <SubscriptionView 
          subscriptionPlans={subscriptionPlans}
          onSubscribe={subscribeToService}
          onClose={() => setShowSubscriptionModal(false)}
          theme={{
            background: theme.background,
            card: theme.card,
            text: theme.text,
            textSecondary: theme.textSecondary,
            border: theme.border,
            primary: theme.primary,
            gradientColors: theme.gradientColors as [string, string]
          }}
          isDarkMode={isDarkMode}
        />
      </Modal>
      
      {/* GCash payment modal */}
      <GCashPaymentModal
        isVisible={showGCashPaymentModal}
        onClose={() => setShowGCashPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        selectedPlan={selectedPlanForPayment}
        theme={{
          background: theme.background,
          card: theme.card,
          text: theme.text,
          textSecondary: theme.textSecondary,
          border: theme.border,
          primary: theme.primary,
          error: theme.danger,
          gradientColors: theme.gradientColors as [string, string]
        }}
      />
    </View>
  );
} 