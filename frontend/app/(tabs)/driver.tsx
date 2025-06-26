import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Route, defaultRoutes } from '../../constants/RouteData';
import { vehicleTypes } from '../../constants/VehicleTypes';
import { Notification, Location, Destination } from '../../models/RideTypes';
import { acceptRide, updateRideStatus } from '../../services/api/ride.api';
import * as driverApi from '../../services/api/driver.api';
import * as routeApi from '../../services/api/route.api';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../services/api/endpoints';
import { router } from 'expo-router';

// Helper functions for vehicle icons and colors
const getVehicleIcon = (vehicleType: string) => {
  const iconName = ['latransco', 'calvo', 'corominas', 'ceres', 'gabe'].includes(vehicleType) ? 'bus' : 'shuttle-van';
  return <FontAwesome5 name={iconName} size={16} color="white" />;
};

const getVehicleColor = (vehicleType: string) => {
  const vehicleColors: {[key: string]: string} = {
    'latransco': '#4B6BFE',
    'calvo': '#5E5CE6',
    'corominas': '#3F51B5',
    'ceres': '#4285F4',
    'gabe': '#0F9D58',
    'jeep': '#FF6D00'
  };
  
  return vehicleColors[vehicleType] || '#5E5CE6';
};

// Interface for driver's routes
interface DriverRoute {
  id: string;
  routeNumber: string;
  name: string;
  status: 'active' | 'upcoming' | 'completed';
  startTime: string;
  endTime: string;
  stops: number;
  passengers: number;
  fare?: string;
  isInTrip?: boolean;
}

// Extended notification data type
interface ExtendedNotification extends Notification {
  data: {
    rideId: string;
    pickupLocation: {
      name?: string;
      latitude: number;
      longitude: number;
    };
  };
}

// Define custom PositionOptions interface to include distanceFilter
interface CustomPositionOptions extends PositionOptions {
  distanceFilter?: number;
}

// Define interface for the location socket methods to match the actual implementation
interface LocationSocketType {
  initializeLocationSocket: (clientId: string, token: string) => Promise<any>;
  disconnectLocationSocket: () => void;
  sendDriverLocation: (driverId: string, location: {latitude: number, longitude: number}, rideId?: string) => any;
  sendPassengerLocation: (location: {latitude: number, longitude: number}, passengerId: string, rideId?: string) => void;
  subscribeToNotifications: (callback: (notification: any) => void) => void;
  subscribeToRouteUpdates: (callback: (routeData: any) => void) => void;
  getDriverLocation: (driverId: string) => any;
  getPassengerLocation: (passengerId: string) => any;
  sendTripUpdate: (data: { driverId: string; routeId: string; status: string; location: { latitude: number; longitude: number; } | null; }) => void;
}

export default function DriverScreen() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoute[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [showAvailableRoutesModal, setShowAvailableRoutesModal] = useState(false);
  const [showRouteDetailsModal, setShowRouteDetailsModal] = useState(false);
  const [selectedRouteDetails, setSelectedRouteDetails] = useState<DriverRoute | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [pendingRideRequests, setPendingRideRequests] = useState<Notification[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dutyStatusChanging, setDutyStatusChanging] = useState(false);
  const { user } = useAuth();
  const [showRouteRequestModal, setShowRouteRequestModal] = useState(false);
  const [routeRequestText, setRouteRequestText] = useState("From [start location] to [end location] via [major landmarks]");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRemoveRouteModal, setShowRemoveRouteModal] = useState(false);
  const [routeToRemove, setRouteToRemove] = useState<{id: string, name: string, isCompleted: boolean} | null>(null);
  const isMounted = useRef(true);

  // Save driver routes to AsyncStorage whenever they change
  useEffect(() => {
    const saveDriverRoutes = async () => {
      try {
        if (driverRoutes.length > 0) {
          await AsyncStorage.setItem('driverRoutes', JSON.stringify(driverRoutes));
          console.log('Driver routes saved to AsyncStorage:', driverRoutes.length);
        }
      } catch (error) {
        console.error('Error saving driver routes to AsyncStorage:', error);
      }
    };
    
    saveDriverRoutes();
  }, [driverRoutes]);

  // Load driver ID and other details
  useEffect(() => {
    const loadDriverDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First try to load cached duty status for faster UI response
        try {
          const storedDutyStatus = await AsyncStorage.getItem('driverDutyStatus');
          if (storedDutyStatus === 'active') {
            setIsOnDuty(true);
          } else if (storedDutyStatus === 'offline' || storedDutyStatus === 'inactive') {
            setIsOnDuty(false);
          }
          // If no stored status, default is already false
        } catch (storageError) {
          console.warn('Could not load driver status from storage:', storageError);
        }
        
        // Get driver profile from API
        const driverProfile = await driverApi.getDriverProfile();
        if (driverProfile) {
          setDriverId(driverProfile._id);
          await AsyncStorage.setItem('driverId', driverProfile._id);
          
          // Set duty status based on driver profile (server is source of truth)
          const isActive = driverProfile.status === 'active';
          setIsOnDuty(isActive);
          
          // Update local storage to match server status
          await AsyncStorage.setItem('driverDutyStatus', driverProfile.status || 'offline');
        }
        
        const storedActiveRideId = await AsyncStorage.getItem('activeRideId');
        if (storedActiveRideId) {
          setActiveRideId(storedActiveRideId);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading driver details:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message
          : 'Failed to load driver profile. Please try again.';
        
        // Show error message but don't block the UI completely
        setError(errorMessage);
        setIsLoading(false);
        
        // Show alert for critical errors that prevent functionality
        if (errorMessage.includes('not found') || errorMessage.includes('Authentication')) {
          Alert.alert(
            "Driver Profile Error",
            errorMessage,
            [
              { 
                text: "OK",
                onPress: () => {}
              }
            ]
          );
        }
      }
    };

    loadDriverDetails();
  }, []);

  // Initialize location tracking
  useEffect(() => {
    if (isOnDuty && driverId) {
      // Start location tracking
      const watchId = navigator.geolocation.watchPosition(
        position => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          
          // Send location update if we're on duty
          if (isOnDuty && driverId) {
            import('../../services/socket/location.socket').then(socket => {
              socket.sendDriverLocation(driverId, location, activeRideId || undefined);
            });
            
            // Also update location via API
            driverApi.updateDriverLocation(location)
              .catch(err => console.error('Error updating driver location via API:', err));
          }
        },
        error => console.log('Error getting location:', error),
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Minimum distance (meters) between location updates
          maximumAge: 10000 // Accept cached positions up to 10 seconds old
        } as CustomPositionOptions
      );
      
      setIsLocationTracking(true);
      
      // Cleanup function to stop watching location
      return () => {
        navigator.geolocation.clearWatch(watchId);
        setIsLocationTracking(false);
      };
    }
  }, [isOnDuty, driverId, activeRideId]);

  // Initialize socket connection when driver comes on duty
  useEffect(() => {
    if (isOnDuty && driverId) {
      const initializeSocket = async () => {
        try {
          // Try both token keys
          let token = await AsyncStorage.getItem('token');
          if (!token) {
            token = await AsyncStorage.getItem('authToken');
          }
          
          if (!token) {
            console.error('No auth token found');
            setError('Authentication required. Please log out and log in again.');
            return;
          }
          
          // Store token to ensure it's available for future API calls
          await AsyncStorage.setItem('token', token);
          
          const locationSocket = await import('../../services/socket/location.socket');
          
          // Initialize socket with current driver ID and token
          await locationSocket.initializeLocationSocket(driverId, token);
          console.log('Socket initialized successfully for driver:', driverId);
          
          // Subscribe to ride updates
          locationSocket.subscribeToNotifications((notification: any) => {
            if (notification.type === 'new_ride_request') {
              console.log('New ride request received:', notification);
              
              // Add to pending requests
              setPendingRideRequests(prev => [...prev, notification]);
              
              // Show alert for new ride request
              Alert.alert(
                "New Ride Request",
                `Passenger pickup at ${notification.data?.pickupLocation?.name || 'Current Location'}`,
                [
                  { text: "Ignore", style: "cancel" },
                  { 
                    text: "Accept", 
                    onPress: () => handleAcceptRide(notification.data.rideId)
                  }
                ]
              );
            }
          });
          
          // Subscribe to route updates
          locationSocket.subscribeToRouteUpdates((routeData: any) => {
            console.log('Route update received via socket:', routeData);
            
            if (routeData && routeData.routes) {
              // Check if this is a deletion update (routes with deleted flag)
              const deletedRoutes = routeData.routes.filter((route: any) => route.deleted === true);
              
              if (deletedRoutes.length > 0) {
                // Handle route deletions by removing them from driver routes
                setDriverRoutes(prevRoutes => {
                  const deletedIds = deletedRoutes.map((route: any) => route._id || route.id);
                  console.log('Removing deleted routes with IDs:', deletedIds);
                  
                  // Filter out the deleted routes
                  const updatedRoutes = prevRoutes.filter(route => !deletedIds.includes(route.id));
                  
                  // Update AsyncStorage with the new routes list
                  AsyncStorage.setItem('driverRoutes', JSON.stringify(updatedRoutes))
                    .then(() => console.log('Updated routes in AsyncStorage after deletion'))
                    .catch(err => console.error('Error updating routes in AsyncStorage:', err));
                  
                  return updatedRoutes;
                });
                
                // Show notification about route deletion if needed
                if (deletedRoutes.length === 1) {
                  Alert.alert(
                    "Route Removed",
                    `The route "${deletedRoutes[0].name || 'Unknown'}" has been removed by the administrator.`,
                    [{ text: "OK" }]
                  );
                } else if (deletedRoutes.length > 1) {
                  Alert.alert(
                    "Routes Removed",
                    `${deletedRoutes.length} routes have been removed by the administrator.`,
                    [{ text: "OK" }]
                  );
                }
              } else {
                // Handle regular route updates
              // Transform API routes to DriverRoute format
                const updatedFormattedRoutes = routeData.routes.map((route: any) => ({
                id: route._id || route.id || String(Math.random()),
                routeNumber: route.routeNumber || route.id || '',
                name: route.name || 'Unnamed Route',
                status: route.status || 'upcoming',
                startTime: route.startTime || route.schedule?.weekdays?.start || '08:00 AM',
                endTime: route.endTime || route.schedule?.weekdays?.end || '06:00 PM',
                stops: route.stops?.length || 0,
                passengers: route.passengers || 0,
                fare: route.fare ? `₱${route.fare}` : `₱${(25 + (route.stops?.length || 0) * 5).toFixed(2)}`
              }));
              
                // Update routes state by merging with existing routes
                setDriverRoutes(prevRoutes => {
                  // Get the IDs of the updated routes
                  const updatedIds = updatedFormattedRoutes.map(route => route.id);
                  
                  // Filter out routes that are being updated
                  const filteredRoutes = prevRoutes.filter(route => !updatedIds.includes(route.id));
                  
                  // Combine filtered routes with updated routes
                  const newRoutes = [...filteredRoutes, ...updatedFormattedRoutes];
                  
                  // Update AsyncStorage
                  AsyncStorage.setItem('driverRoutes', JSON.stringify(newRoutes))
                    .then(() => console.log('Updated routes in AsyncStorage after update'))
                    .catch(err => console.error('Error updating routes in AsyncStorage:', err));
                  
                  return newRoutes;
                });
              }
              
              // Also update available routes if they were included
              if (routeData.availableRoutes) {
                setAvailableRoutes(routeData.availableRoutes);
              }
            }
          });
          
          // Start sending location updates
          const locationInterval = setInterval(() => {
            if (userLocation) {
              locationSocket.sendDriverLocation(driverId, userLocation, activeRideId || undefined)
                .catch(err => console.error('Error sending driver location:', err));
            }
          }, 10000);
          
          return () => {
            clearInterval(locationInterval);
          };
      } catch (error) {
          console.error('Error initializing socket:', error);
          setError('Failed to initialize location tracking. Please try again.');
        }
      };
      
      initializeSocket();
      
      // Cleanup function
      return () => {
        import('../../services/socket/location.socket').then(socket => {
          socket.disconnectLocationSocket();
        });
      };
    }
  }, [isOnDuty, driverId, activeRideId]);

  // Load driver routes from API
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First try to load cached routes from AsyncStorage for faster UI response
        try {
          const storedRoutes = await AsyncStorage.getItem('driverRoutes');
          if (storedRoutes) {
            const parsedRoutes = JSON.parse(storedRoutes);
            if (Array.isArray(parsedRoutes) && parsedRoutes.length > 0) {
              console.log('Loaded cached routes from AsyncStorage:', parsedRoutes.length);
              setDriverRoutes(parsedRoutes);
            }
          }
        } catch (storageError) {
          console.warn('Could not load driver routes from storage:', storageError);
        }
        
        // Get driver's assigned routes from API for initial load
        try {
          const apiRoutes = await driverApi.getDriverRoutes();
          
          if (apiRoutes && apiRoutes.length > 0) {
            // Transform API routes to DriverRoute format
            const formattedRoutes = apiRoutes.map(route => ({
              id: route._id || route.id || String(Math.random()),
              routeNumber: route.routeNumber || route.id || '',
              name: route.name || 'Unnamed Route',
              status: route.status || 'upcoming',
              startTime: route.startTime || route.schedule?.weekdays?.start || '08:00 AM',
              endTime: route.endTime || route.schedule?.weekdays?.end || '06:00 PM',
              stops: route.stops?.length || 0,
              passengers: route.passengers || 0,
              fare: route.fare ? `₱${parseFloat(route.fare).toFixed(2)}` : `₱${(25 + (route.stops?.length || 0) * 5).toFixed(2)}`
            }));
            
            // Merge with any locally stored routes that aren't in the API response
            const storedRoutes = await AsyncStorage.getItem('driverRoutes');
            if (storedRoutes) {
              const parsedStoredRoutes = JSON.parse(storedRoutes);
              if (Array.isArray(parsedStoredRoutes)) {
                // Filter out any stored routes that are already in the API response
                const apiRouteIds = formattedRoutes.map(r => r.id);
                const uniqueStoredRoutes = parsedStoredRoutes.filter(
                  r => !apiRouteIds.includes(r.id)
                );
                
                // Combine API routes with unique stored routes
                if (uniqueStoredRoutes.length > 0) {
                  setDriverRoutes([...formattedRoutes, ...uniqueStoredRoutes]);
                } else {
            setDriverRoutes(formattedRoutes);
                }
          } else {
                setDriverRoutes(formattedRoutes);
              }
            } else {
              setDriverRoutes(formattedRoutes);
            }
          } else if (apiRoutes && apiRoutes.length === 0) {
            // API returned empty routes, keep any locally stored routes
            const storedRoutes = await AsyncStorage.getItem('driverRoutes');
            if (storedRoutes) {
              const parsedStoredRoutes = JSON.parse(storedRoutes);
              if (Array.isArray(parsedStoredRoutes) && parsedStoredRoutes.length > 0) {
                setDriverRoutes(parsedStoredRoutes);
              } else {
            setDriverRoutes([]);
              }
            } else {
              setDriverRoutes([]);
            }
          }
        } catch (routeError) {
          console.error('Error fetching routes from API:', routeError);
          
          const errorMessage = routeError instanceof Error 
            ? routeError.message
            : 'Failed to load routes. Please check your connection and try again.';
          
          // Show error but continue with any locally stored routes
          setError(`Routes error: ${errorMessage}`);
          
          // Keep any locally stored routes
          const storedRoutes = await AsyncStorage.getItem('driverRoutes');
          if (storedRoutes) {
            const parsedStoredRoutes = JSON.parse(storedRoutes);
            if (Array.isArray(parsedStoredRoutes) && parsedStoredRoutes.length > 0) {
              setDriverRoutes(parsedStoredRoutes);
            }
          }
        }

        // Load available routes
        try {
          const availableRoutesData = await routeApi.getRoutes({ active: true });
          if (availableRoutesData && availableRoutesData.length > 0) {
            setAvailableRoutes(availableRoutesData);
          } else {
            // API returned empty available routes
            setAvailableRoutes([]);
          }
          
          // Initialize socket for route updates if driver ID is available
          if (driverId) {
            const locationSocket = await import('../../services/socket/location.socket');
            
            // Check if socket is already initialized
            if (locationSocket.getLocationSocket()) {
              // Subscribe to route updates for real-time updates
              locationSocket.subscribeToRouteUpdates((routeData) => {
                console.log('Route update received via socket in loadRoutes:', routeData);
              });
            }
          }
        } catch (availableRoutesError) {
          console.error('Error fetching available routes:', availableRoutesError);
          
          // Only update error if we don't already have one from routes
          if (!error) {
            const errorMessage = availableRoutesError instanceof Error 
              ? availableRoutesError.message
              : 'Failed to load available routes. Please check your connection.';
            
            setError(`Available routes error: ${errorMessage}`);
          }
          
          setAvailableRoutes([]);
        }
      } catch (error) {
        console.error('Error loading routes:', error);
        
        const errorMessage = error instanceof Error 
          ? error.message
          : 'Failed to load routes. Please try again.';
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoutes();
  }, []);

  const toggleDutyStatus = async () => {
    // If already changing status, don't do anything
    if (dutyStatusChanging) {
      console.log('[DUTY STATUS] Already changing status, ignoring request');
      return;
    }
    
    console.log('[DUTY STATUS] Current status:', isOnDuty ? 'ACTIVE' : 'OFFLINE');
    
    if (isOnDuty) {
      // Going off duty - show custom confirmation modal
      console.log('[DUTY STATUS] Showing End Duty confirmation dialog');
      setShowConfirmModal(true);
    } else {
      // Going on duty - simpler flow without confirmation
    // Set UI to loading state
      console.log('[DUTY STATUS] Going on duty, setting loading state');
    setDutyStatusChanging(true);
    
                try {
                  // Update local UI immediately
        console.log('[DUTY STATUS] Setting local UI to ACTIVE');
        if (isMounted.current) setIsOnDuty(true);
                  
                  // Store in AsyncStorage
        console.log('[DUTY STATUS] Storing active status in AsyncStorage');
        await AsyncStorage.setItem('driverDutyStatus', 'active');
                  
                  // Call API
        console.log('[DUTY STATUS] Calling API to update status to active');
        const result = await driverApi.updateDriverStatus('active');
        console.log('[DUTY STATUS] Status update API call successful:', result);
                } catch (error) {
                  // If API call fails, revert to previous state
        console.error('[DUTY STATUS] Failed to update status:', error);
        if (isMounted.current) {
          setIsOnDuty(false);
          await AsyncStorage.setItem('driverDutyStatus', 'offline');
                  
                  Alert.alert(
                    "Error",
                    "Failed to update duty status. Please try again."
                  );
        }
                } finally {
        console.log('[DUTY STATUS] Resetting loading state');
        if (isMounted.current) setDutyStatusChanging(false);
                }
              } 
  };

  // Handle confirm end duty
  const handleConfirmEndDuty = async () => {
    // Check if component is still mounted before updating state
    if (!isMounted.current) {
      console.log('[DUTY STATUS] Component unmounted, ignoring state updates');
      return;
    }
    
    // Set UI to loading state after confirmation
    console.log('[DUTY STATUS] User confirmed End Duty, setting loading state');
    setDutyStatusChanging(true);
    
        try {
          // Update local UI immediately
      console.log('[DUTY STATUS] Setting local UI to OFFLINE');
      if (isMounted.current) setIsOnDuty(false);
          
          // Store in AsyncStorage
      console.log('[DUTY STATUS] Storing offline status in AsyncStorage');
      await AsyncStorage.setItem('driverDutyStatus', 'offline');
          
          // Call API
      console.log('[DUTY STATUS] Calling API to update status to offline');
      const result = await driverApi.updateDriverStatus('offline');
      console.log('[DUTY STATUS] Status update API call successful:', result);
      
      // Clear active ride if any
      if (activeRideId) {
        console.log('[DUTY STATUS] Clearing active ride:', activeRideId);
        await AsyncStorage.removeItem('activeRideId');
        if (isMounted.current) setActiveRideId(null);
      }
        } catch (error) {
          // If API call fails, revert to previous state
      console.error('[DUTY STATUS] Failed to update status:', error);
      if (isMounted.current) {
        setIsOnDuty(true);
        await AsyncStorage.setItem('driverDutyStatus', 'active');
          
          Alert.alert(
            "Error",
            "Failed to update duty status. Please try again."
          );
      }
        } finally {
      console.log('[DUTY STATUS] Resetting loading state');
      if (isMounted.current) {
          setDutyStatusChanging(false);
        setShowConfirmModal(false);
      }
    }
  };

  const getStatusColor = (status: string, isInTrip?: boolean): string => {
    if (isInTrip) {
      return '#FF5722'; // Orange-red for in-trip status
    }
    
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'upcoming':
        return '#2196F3';
      case 'completed':
        return isDarkMode ? '#BBBBBB' : '#9E9E9E';
      default:
        return '#999';
    }
  };

  const getRouteIcon = (status: string, isInTrip?: boolean): string => {
    if (isInTrip) {
      return 'route'; // Use route icon for in-trip status
    }
    
    switch (status) {
      case 'active':
        return 'bus-alt';
      case 'upcoming':
        return 'clock';
      case 'completed':
        return 'check-circle';
      default:
        return 'question-circle';
    }
  };

  const handleAssignRoute = (route: Route) => {
    // Check if route is already assigned
    const isAlreadyAssigned = driverRoutes.some(r => r.routeNumber === route.id);
    
    if (isAlreadyAssigned) {
      Alert.alert(
        "Route Already Assigned",
        "This route is already in your assigned routes.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Create a new driver route from the selected route
    const newDriverRoute: DriverRoute = {
      id: route._id || route.id || Math.random().toString(),
      routeNumber: route.id || '',
      name: route.name,
      status: 'upcoming',
      startTime: route.startTime || '08:00 AM', // Use route's startTime if available
      endTime: route.endTime || '06:00 PM', // Use route's endTime if available
      stops: route.stops?.length || 0,
      passengers: 0,
      fare: route.fare ? `₱${Number(route.fare).toFixed(2)}` : `₱${(25 + (route.stops?.length || 0) * 5).toFixed(2)}`, // Calculate fare based on stops with Philippine Peso
    };
    
    // Assign driver to route via API
    const routeId = route._id || route.id || '';
    const currentDriverId = driverId || '';
    
    if (!routeId || !currentDriverId) {
      Alert.alert(
        "Error",
        "Missing route or driver information. Please try again.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setIsLoading(true);
    console.log(`Assigning driver ${currentDriverId} to route ${routeId}`);
    
    // For all drivers, add the route locally and save to AsyncStorage
    const updatedRoutes = [...driverRoutes, newDriverRoute];
    setDriverRoutes(updatedRoutes);
    
    // Save to AsyncStorage immediately for persistence
    AsyncStorage.setItem('driverRoutes', JSON.stringify(updatedRoutes))
      .then(() => {
        console.log('Route added and saved to AsyncStorage');
      })
      .catch(error => {
        console.error('Error saving routes to AsyncStorage:', error);
      });
    
    // Make the API call to assign the route for all users, not just admins
    routeApi.assignDriverToRoute(routeId, currentDriverId)
      .then(() => {
        console.log('Route assigned via API successfully');
        setShowAvailableRoutesModal(false);
        
        Alert.alert(
          "Route Added",
          `${route.name} has been added to your routes.`,
          [{ text: "OK" }]
        );
      })
      .catch(error => {
        console.error('Error assigning route via API:', error);
        
        // Show error but keep the route in local storage
        Alert.alert(
          "Warning",
          `${route.name} has been added locally, but could not be saved to the server. It may not be available on other devices.`,
          [{ text: "OK" }]
        );
        setShowAvailableRoutesModal(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const renderAvailableRouteItem = ({ item }: { item: Route }) => {
    // Get vehicle icon based on vehicle type
    const vehicleIcon = getVehicleIcon(item.vehicleType);
    const vehicleColor = getVehicleColor(item.vehicleType);
    
    return (
      <TouchableOpacity
        style={[styles.availableRouteCard, { 
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderLeftWidth: 4,
          borderLeftColor: vehicleColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }]}
        onPress={() => handleAssignRoute(item)}
      >
        <View style={styles.availableRouteHeader}>
          <View style={styles.availableRouteHeaderLeft}>
            <View style={[styles.vehicleIconContainer, { backgroundColor: vehicleColor }]}>
              {vehicleIcon}
          </View>
            <View>
              <Text style={[styles.availableRouteName, { color: theme.text }]}>
                {item.name?.toUpperCase()}
              </Text>
              <Text style={[styles.availableRouteDescription, { color: theme.textSecondary }]}>
                {item.description || 'No description'}
              </Text>
            </View>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Text style={[styles.availableRouteId, { color: theme.textSecondary, marginBottom: 4 }]}>
              Route #{item.id || ''}
            </Text>
            <View style={{
              backgroundColor: `${vehicleColor}30`,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12
            }}>
              <Text style={{color: vehicleColor, fontWeight: '500', fontSize: 12}}>
                {item.vehicleType?.toUpperCase() || 'VHIRE'}
          </Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.availableRouteDetails, {marginTop: 8}]}>
          <View style={{flexDirection: 'row', marginBottom: 5}}>
            <View style={[styles.detailItem, {flex: 1}]}>
              <FontAwesome5 name="map-marker-alt" size={14} color={vehicleColor} />
              <Text style={[styles.detailText, { color: theme.text }]}>
              {item.stops?.length || 0} stops
            </Text>
          </View>
          
          {item.startTime && (
              <View style={[styles.detailItem, {flex: 1}]}>
                <FontAwesome5 name="clock" size={14} color={vehicleColor} />
                <Text style={[styles.detailText, { color: theme.text }]}>
                  {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
              </Text>
            </View>
          )}
          </View>
          
          <View style={{flexDirection: 'row', marginBottom: 5}}>
            <View style={[styles.detailItem, {flex: 1}]}>
              <FontAwesome5 name="money-bill-wave" size={14} color={vehicleColor} />
              <Text style={[styles.detailText, { color: theme.text }]}>
                ₱{item.fare && item.fare > 0 ? Number(item.fare).toFixed(2) : (25 + (item.stops?.length || 0) * 5).toFixed(2)}
            </Text>
            </View>
            
            <TouchableOpacity 
              style={{
                backgroundColor: vehicleColor,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => handleAssignRoute(item)}
            >
              <FontAwesome5 name="plus" size={12} color="#FFFFFF" style={{marginRight: 4}} />
              <Text style={{color: '#FFFFFF', fontWeight: '600', fontSize: 12}}>Add Route</Text>
            </TouchableOpacity>
          </View>
        </View>
          </TouchableOpacity>
    );
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      setIsLoading(true);
      
      // Accept ride via API
      const ride = await acceptRide(rideId);
      
      // Update active ride ID
      setActiveRideId(rideId);
      await AsyncStorage.setItem('activeRideId', rideId);
      
      // Set active ride
      setActiveRide(ride);
      
      // Remove from pending requests
      setPendingRideRequests(prev => prev.filter(req => 
        req.type !== 'new_ride_request' || req.data.rideId !== rideId
      ));
      
      // Start ride status listener
      startRideStatusListener(rideId);
      
      Alert.alert(
        "Ride Accepted",
        "You have accepted the ride request. Navigate to pickup location.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert(
        "Error",
        "Failed to accept ride. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRideStatus = async (status: string) => {
    if (!activeRideId) {
      Alert.alert("Error", "No active ride to update");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update ride status via API
      const updatedRide = await updateRideStatus(activeRideId, status);
      
      // Update active ride
      setActiveRide(updatedRide);
      
      // If ride is completed or cancelled, clear active ride ID
      if (status === 'completed' || status === 'cancelled') {
        setActiveRideId(null);
        await AsyncStorage.removeItem('activeRideId');
      }
      
      Alert.alert(
        "Status Updated",
        `Ride status updated to ${status}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error updating ride status:', error);
      Alert.alert(
        "Error",
        "Failed to update ride status. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add UI for active ride
  const renderActiveRide = () => {
    if (!activeRide) return null;
    
    return (
      <View style={[styles.activeRideContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.activeRideTitle, { color: theme.text }]}>Active Ride</Text>
        
        <View style={styles.activeRideDetails}>
          <View style={styles.activeRideRow}>
            <FontAwesome5 name="map-marker-alt" size={16} color={theme.primary} />
            <Text style={[styles.activeRideText, { color: theme.text }]}>
              Pickup: {activeRide.pickupLocation?.name || 'Current Location'}
            </Text>
        </View>
          
          <View style={styles.activeRideRow}>
            <FontAwesome5 name="flag-checkered" size={16} color={theme.primary} />
            <Text style={[styles.activeRideText, { color: theme.text }]}>
              Destination: {activeRide.destination?.name || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.activeRideRow}>
            <FontAwesome5 name="clock" size={16} color={theme.primary} />
            <Text style={[styles.activeRideText, { color: theme.text }]}>
              Status: {activeRide.status.charAt(0).toUpperCase() + activeRide.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.activeRideActions}>
          {activeRide.status === 'accepted' && (
            <TouchableOpacity
              style={[styles.rideActionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleUpdateRideStatus('in_progress')}
            >
              <FontAwesome5 name="play" size={14} color="white" />
              <Text style={styles.actionButtonText}>Start Ride</Text>
      </TouchableOpacity>
          )}
          
          {activeRide.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.rideActionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => handleUpdateRideStatus('completed')}
            >
              <FontAwesome5 name="check" size={14} color="white" />
              <Text style={styles.actionButtonText}>Complete Ride</Text>
            </TouchableOpacity>
          )}
          
          {(activeRide.status === 'accepted' || activeRide.status === 'in_progress') && (
            <TouchableOpacity
              style={[styles.rideActionButton, { backgroundColor: '#F44336' }]}
              onPress={() => handleUpdateRideStatus('cancelled')}
            >
              <FontAwesome5 name="times" size={14} color="white" />
              <Text style={styles.actionButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Start listening for ride status updates
  const startRideStatusListener = async (rideId: string) => {
    try {
      const socket = await import('../../services/socket/location.socket');
      
      // Use a simplified approach for now
      console.log(`Setting up ride status listener for ride ${rideId}`);
      
      // We'll implement real socket listeners when they're available
      // For now, just set up a mock update after a delay
      const mockUpdateTimeout = setTimeout(() => {
        setActiveRide(prev => ({
          ...prev,
          status: 'in_progress'
        }));
      }, 10000);
      
      return () => {
        clearTimeout(mockUpdateTimeout);
        // Clean up real listeners when implemented
      };
    } catch (error) {
      console.error('Error setting up ride status listener:', error);
    }
  };

  // Add a function to handle route request submission
  const handleRouteRequestSubmit = () => {
    if (!routeRequestText.trim()) {
      Alert.alert(
        "Error",
        "Please provide a description for your route request.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setIsLoading(true);
    
    // Create route request object
    const routeRequest = {
      description: routeRequestText,
      requestedBy: user?.id || driverId || '',
      status: 'pending'
    };
    
    // Send request to API
    routeApi.requestCustomRoute(routeRequest)
      .then(response => {
        setShowRouteRequestModal(false);
        
        Alert.alert(
          "Request Submitted",
          "Your route request has been submitted to the admin for review.",
          [{ text: "OK" }]
        );
        
        // Reset the input field for next time
        setRouteRequestText("From [start location] to [end location] via [major landmarks]");
      })
      .catch(error => {
        console.error('Error submitting route request:', error);
        Alert.alert(
          "Error",
          "Failed to submit route request. Please try again.",
          [{ text: "OK" }]
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Add a function to handle route removal
  const handleRemoveRoute = (routeId: string) => {
    console.log('Remove route button pressed');
    
    // Find the route to get its status
    const routeToRemove = driverRoutes.find(route => route.id === routeId);
    if (!routeToRemove) {
      console.error('Route not found for removal:', routeId);
      return;
    }
    
    const isCompleted = routeToRemove.status === 'completed';
    
    // Set the route to remove and show the confirmation modal
    setRouteToRemove({
      id: routeId,
      name: routeToRemove.name,
      isCompleted
    });
    setShowRemoveRouteModal(true);
  };
  
  const confirmRouteRemoval = async () => {
    if (!routeToRemove) return;
    
    const { id: routeId, isCompleted } = routeToRemove;
    
            try {
              console.log(`Removing ${isCompleted ? 'completed ' : ''}route:`, routeId);
            
              // First, update the UI immediately for better user experience
              const updatedRoutes = driverRoutes.filter(route => route.id !== routeId);
              setDriverRoutes(updatedRoutes);
            
              // Update AsyncStorage to persist the change
              await AsyncStorage.setItem('driverRoutes', JSON.stringify(updatedRoutes));
              console.log('Routes updated in AsyncStorage after removal, new count:', updatedRoutes.length);
              
              // If there's a modal open, close it
              setShowRouteDetailsModal(false);
              setSelectedRouteDetails(null);
              
      // Close the confirmation modal
      setShowRemoveRouteModal(false);
      setRouteToRemove(null);
      
      // Show success message
              Alert.alert(
                "Route Removed",
        `The ${isCompleted ? 'completed ' : ''}route has been removed from your routes.`,
                [{ text: "OK" }]
              );
              
      // For non-completed routes and if user is admin, try the API call
              if (!isCompleted) {
                const currentDriverId = driverId;
        const isAdmin = user?.role === 'admin';
        
        if (currentDriverId && isAdmin) {
                  try {
                    // We don't need to await this since we've already updated the UI
                    routeApi.unassignDriverFromRoute(routeId, currentDriverId)
                      .then(() => console.log('Driver unassigned from route in backend'))
                      .catch(apiError => console.error('Error unassigning driver from route:', apiError));
                  } catch (apiError) {
                    console.error('Error initiating unassign API call:', apiError);
                  }
                }
              } else {
                console.log('Skipping API call for completed route removal');
              }
            } catch (error) {
                console.error('Error removing route:', error);
      setShowRemoveRouteModal(false);
      setRouteToRemove(null);
      
                Alert.alert(
                  "Error",
                  "Failed to remove route. Please try again.",
                  [{ text: "OK" }]
                );
            }
  };

  // Handle showing route details
  const handleShowRouteDetails = (route: DriverRoute) => {
    setSelectedRouteDetails(route);
    setShowRouteDetailsModal(true);
  };

  // Handle showing route map
  const handleShowRouteMap = (route: DriverRoute) => {
    // For now, we'll just show an alert that this feature is coming soon
    // In a future update, this would open a map view with the route displayed
    Alert.alert(
      "View Route Map",
      "The route map view is coming soon. This will show your current location and the route on a map.",
      [{ text: "OK" }]
    );
  };

  // Render route details modal
  const renderRouteDetailsModal = () => (
    <Modal
      visible={showRouteDetailsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        console.log('Close button pressed');
        setShowRouteDetailsModal(false);
        setSelectedRouteDetails(null);
      }}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Route Details</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                console.log('Close button pressed');
                setShowRouteDetailsModal(false);
                setSelectedRouteDetails(null);
              }}
            >
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {selectedRouteDetails && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.routeDetailSection}>
                <Text style={[styles.routeDetailTitle, { color: theme.text }]}>Route Information</Text>
                <View style={styles.routeDetailRow}>
                  <FontAwesome5 name="bus" size={16} color={theme.textSecondary} style={styles.routeDetailIcon} />
                  <Text style={[styles.routeDetailText, { color: theme.text }]}>
                    Route #{selectedRouteDetails.routeNumber} - {selectedRouteDetails.name}
                  </Text>
                </View>
                <View style={styles.routeDetailRow}>
                  <FontAwesome5 name="clock" size={16} color={theme.textSecondary} style={styles.routeDetailIcon} />
                  <Text style={[styles.routeDetailText, { color: theme.text }]}>
                    Operating Hours: {selectedRouteDetails.startTime} - {selectedRouteDetails.endTime}
                  </Text>
                </View>
                <View style={styles.routeDetailRow}>
                  <FontAwesome5 name="map-marker-alt" size={16} color={theme.textSecondary} style={styles.routeDetailIcon} />
                  <Text style={[styles.routeDetailText, { color: theme.text }]}>
                    Total Stops: {selectedRouteDetails.stops}
                  </Text>
                </View>
                <View style={styles.routeDetailRow}>
                  <FontAwesome5 name="money-bill-wave" size={16} color={theme.textSecondary} style={styles.routeDetailIcon} />
                  <Text style={[styles.routeDetailText, { color: theme.text }]}>
                    Fare: {selectedRouteDetails.fare}
                  </Text>
                </View>
                {selectedRouteDetails.passengers > 0 && (
                  <View style={styles.routeDetailRow}>
                    <FontAwesome5 name="users" size={16} color={theme.textSecondary} style={styles.routeDetailIcon} />
                    <Text style={[styles.routeDetailText, { color: theme.text }]}>
                      Current Passengers: {selectedRouteDetails.passengers}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.routeDetailSection}>
                <Text style={[styles.routeDetailTitle, { color: theme.text }]}>Status</Text>
                <View style={[
                  styles.statusBadgeLarge,
                  { backgroundColor: getStatusColor(selectedRouteDetails.status, selectedRouteDetails.isInTrip) }
                ]}>
                  <FontAwesome5 
                    name={getRouteIcon(selectedRouteDetails.status, selectedRouteDetails.isInTrip)} 
                    size={16} 
                    color="white" 
                    style={styles.statusIconLarge} 
                  />
                  <Text style={styles.statusTextLarge}>
                    {selectedRouteDetails.isInTrip 
                      ? 'In Trip' 
                      : selectedRouteDetails.status.charAt(0).toUpperCase() + selectedRouteDetails.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.routeDetailActions}>
                {selectedRouteDetails.status === 'upcoming' && (
                  <TouchableOpacity 
                    style={[styles.routeDetailActionButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => {
                      console.log('Start route button pressed');
                      try {
                        // Update the route status to active
                        const updatedRoutes = driverRoutes.map(r => 
                          r.id === selectedRouteDetails.id 
                            ? { ...r, status: 'active' as const, isInTrip: true } 
                            : r
                        );
                        setDriverRoutes(updatedRoutes);
                        
                        // Update AsyncStorage
                        AsyncStorage.setItem('driverRoutes', JSON.stringify(updatedRoutes))
                          .then(() => {
                            console.log('Route status updated in AsyncStorage');
                            
                            // If we have a socket connection, notify about trip start
                            import('../../services/socket/location.socket')
                              .then(locationSocketModule => {
                                if (driverId) {
                                  locationSocketModule.sendTripUpdate({
                                    driverId,
                                    routeId: selectedRouteDetails.routeNumber,
                                    status: 'in_progress',
                                    location: userLocation
                                  });
                                }
                              })
                              .catch(err => console.error('Error importing location socket module:', err));
                            
                            // Close the modal
                            setShowRouteDetailsModal(false);
                            setSelectedRouteDetails(null);
                            
                            Alert.alert('Success', 'Route is now active');
                          })
                          .catch(err => {
                            console.error('Error saving updated route status:', err);
                            Alert.alert('Error', 'Failed to update route status. Please try again.');
                          });
                      } catch (error) {
                        console.error('Error in start route function:', error);
                        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                      }
                    }}
                  >
                    <FontAwesome5 name="play" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.routeDetailActionButtonText}>Start Route</Text>
                  </TouchableOpacity>
                )}
                
                {selectedRouteDetails.status === 'active' && !selectedRouteDetails.isInTrip && (
                  <TouchableOpacity 
                    style={[styles.routeDetailActionButton, { backgroundColor: '#FF9800' }]}
                    onPress={() => {
                      console.log('Complete route button pressed');
                      try {
                        // Update the route status to completed
                        const updatedRoutes = driverRoutes.map(r => 
                          r.id === selectedRouteDetails.id 
                            ? { ...r, status: 'completed' as 'active' | 'upcoming' | 'completed' } 
                            : r
                        );
                        setDriverRoutes(updatedRoutes);
                        
                        // Update AsyncStorage
                        AsyncStorage.setItem('driverRoutes', JSON.stringify(updatedRoutes))
                          .then(() => {
                            console.log('Route status updated in AsyncStorage');
                            
                            // If we have a socket connection, notify about route completion
                            import('../../services/socket/location.socket')
                              .then(locationSocketModule => {
                                if (driverId) {
                                  locationSocketModule.sendTripUpdate({
                                    driverId,
                                    routeId: selectedRouteDetails.routeNumber,
                                    status: 'completed',
                                    location: userLocation
                                  });
                                }
                              })
                              .catch(err => console.error('Error importing location socket module:', err));
                            
                            // Close the modal
                            setShowRouteDetailsModal(false);
                            setSelectedRouteDetails(null);
                            
                            Alert.alert('Success', 'Route marked as completed');
                          })
                          .catch(err => {
                            console.error('Error saving updated route status:', err);
                            Alert.alert('Error', 'Failed to update route status. Please try again.');
                          });
                      } catch (error) {
                        console.error('Error in complete route function:', error);
                        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                      }
                    }}
                  >
                    <FontAwesome5 name="check" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.routeDetailActionButtonText}>Complete Route</Text>
                  </TouchableOpacity>
                )}
                
                {selectedRouteDetails.status === 'active' && selectedRouteDetails.isInTrip && (
                  <TouchableOpacity 
                    style={[styles.routeDetailActionButton, { backgroundColor: '#FF5722' }]}
                    onPress={() => {
                      console.log('End trip button pressed');
                      try {
                        // Update the route to end the trip
                        const updatedRoutes = driverRoutes.map(r => 
                          r.id === selectedRouteDetails.id 
                            ? { ...r, status: 'active' as const, isInTrip: false } 
                            : r
                        );
                        setDriverRoutes(updatedRoutes);
                        
                        // Update AsyncStorage
                        AsyncStorage.setItem('driverRoutes', JSON.stringify(updatedRoutes))
                          .then(() => {
                            console.log('Trip ended and saved to AsyncStorage');
                            
                            // If we have a socket connection, notify about trip end
                            import('../../services/socket/location.socket')
                              .then(locationSocketModule => {
                                if (driverId) {
                                  locationSocketModule.sendTripUpdate({
                                    driverId,
                                    routeId: selectedRouteDetails.routeNumber,
                                    status: 'completed',
                                    location: userLocation
                                  });
                                }
                              })
                              .catch(err => console.error('Error importing location socket module:', err));
                            
                            // Close the modal
                            setShowRouteDetailsModal(false);
                            setSelectedRouteDetails(null);
                            
                            Alert.alert('Success', 'Trip ended successfully');
                          })
                          .catch(err => {
                            console.error('Error saving trip end status:', err);
                            Alert.alert('Error', 'Failed to end trip. Please try again.');
                          });
                      } catch (error) {
                        console.error('Error in end trip function:', error);
                        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                      }
                    }}
                  >
                    <FontAwesome5 name="stop-circle" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.routeDetailActionButtonText}>End Trip</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.routeDetailActionButton, { backgroundColor: '#F44336', marginTop: 10 }]}
                  onPress={() => {
                    console.log('Remove route button pressed');
                    // Use the custom confirmation modal
                    if (selectedRouteDetails) {
                      setRouteToRemove({
                        id: selectedRouteDetails.id,
                        name: selectedRouteDetails.name,
                        isCompleted: selectedRouteDetails.status === 'completed'
                      });
                      setShowRemoveRouteModal(true);
          } 
                  }}
                >
                  <FontAwesome5 name="trash" size={16} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.routeDetailActionButtonText}>Remove Route</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render loading state
  if (isLoading && driverRoutes.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4B6BFE" />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading routes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card with improved layout */}
        <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusTitleContainer}>
            <Text style={[styles.statusTitle, { color: theme.text }]}>Duty Status</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isOnDuty ? '#4CAF50' : '#FF3B30' }
            ]}>
              <Text style={styles.statusText}>
                {isOnDuty ? 'ACTIVE' : 'OFFLINE'}
          </Text>
        </View>
          </View>
          
          <View style={styles.statusToggleContainer}>
            {dutyStatusChanging ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
          <TouchableOpacity 
                style={[
                  styles.toggleButton,
                  { backgroundColor: isOnDuty ? '#FF3B30' : '#4CAF50' }
                ]}
            onPress={toggleDutyStatus}
              >
                  <FontAwesome5 
                    name={isOnDuty ? "power-off" : "play"} 
                    size={14} 
                    color="#FFF" 
                    style={styles.buttonIcon} 
                  />
                <Text style={styles.toggleButtonText}>
                  {isOnDuty ? 'End Duty' : 'Start Duty'}
                </Text>
          </TouchableOpacity>
            )}
            </View>
        </View>
      </View>
        
        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
        <TouchableOpacity
            style={[styles.actionCardButton, { backgroundColor: '#4B6BFE' }]}
          onPress={() => router.push('/messages')}
        >
            <FontAwesome5 name="envelope" size={20} color="#fff" />
            <Text style={styles.actionCardButtonText}>Messages</Text>
        </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCardButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setShowRouteRequestModal(true)}
          >
            <FontAwesome5 name="route" size={20} color="#fff" />
            <Text style={styles.actionCardButtonText}>Request Route</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCardButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => setShowAvailableRoutesModal(true)}
          >
            <FontAwesome5 name="plus-circle" size={20} color="#fff" />
            <Text style={styles.actionCardButtonText}>Add Route</Text>
          </TouchableOpacity>
        </View>

        {/* Active ride card */}
        {activeRide && renderActiveRide()}
      
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Routes</Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16
            }}
            onPress={() => setShowAvailableRoutesModal(true)}
          >
            <FontAwesome5 name="plus" size={12} color="#FFFFFF" style={{marginRight: 6}} />
            <Text style={{color: '#FFFFFF', fontWeight: '600', fontSize: 12}}>Add Route</Text>
          </TouchableOpacity>
        </View>
        
      {error ? (
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={40} color="#F44336" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              setError(null);
              driverApi.getDriverRoutes()
                .then(routes => {
                  if (routes && routes.length > 0) {
                    const formattedRoutes = routes.map(route => ({
                      id: route._id || Math.random().toString(),
                      routeNumber: route.routeNumber || route.id || '',
                      name: route.name,
                      status: route.status || 'upcoming',
                      startTime: route.startTime || '08:00 AM',
                      endTime: route.endTime || '06:00 PM',
                      stops: route.stops?.length || 0,
                      passengers: route.passengers || 0,
                      fare: route.fare ? `₱${route.fare}` : `₱${(25 + (route.stops?.length || 0) * 5).toFixed(2)}`
                    }));
                    setDriverRoutes(formattedRoutes);
                  }
                })
                .catch(err => {
                  console.error('Error retrying route fetch:', err);
                  setError('Failed to load routes. Please try again.');
                })
                .finally(() => setIsLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : driverRoutes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="route" size={50} color={isDarkMode ? '#444' : '#DDD'} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No routes added</Text>
          <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
            Tap "Add Route" to select from available routes
          </Text>
        </View>
      ) : (
          driverRoutes.map((route) => (
            <View key={route.id} style={[styles.routeCard, { backgroundColor: theme.card }]}>
            {route.isInTrip && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: '#FF5722',
                paddingVertical: 4,
                zIndex: 1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <FontAwesome5 name="route" size={12} color="#FFF" style={{marginRight: 6}} />
                <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 12}}>TRIP IN PROGRESS</Text>
              </View>
            )}
            <View style={[styles.routeHeader, route.isInTrip && {marginTop: 20}]}>
                <View style={styles.routeHeaderLeft}>
                  <View style={styles.routeNumberContainer}>
                    <FontAwesome5 
                      name={route.status === 'completed' ? 'check-circle' : 'bus-alt'} 
                      size={16} 
                      color={theme.text} 
                      style={{ marginRight: 5 }}
                    />
                <Text style={[styles.routeNumber, { color: theme.text }]}>{route.routeNumber}</Text>
              </View>
                  <Text style={[styles.routeName, { color: theme.text }]}>{route.name}</Text>
                </View>
                
                <View style={styles.routeHeaderRight}>
              <View style={[
                styles.statusBadge,
                    { backgroundColor: getStatusColor(route.status, route.isInTrip) }
              ]}>
                <FontAwesome5 
                      name={getRouteIcon(route.status, route.isInTrip)} 
                  size={12} 
                  color="white" 
                  style={styles.statusIcon} 
                />
                    <Text style={styles.statusText}>
                      {route.isInTrip ? 'In Trip' : route.status}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.removeRouteButton, {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                      padding: 6,
                      width: 28,
                      height: 28,
                    }]}
                    onPress={() => {
                      console.log('Remove route button pressed');
                      handleRemoveRoute(route.id);
                    }}
                    testID={`remove-route-${route.id}`}
                  >
                    <FontAwesome5 name="times" size={14} color={isDarkMode ? '#ffffff' : '#333333'} />
                  </TouchableOpacity>
              </View>
            </View>
            
              <View style={styles.routeDetailsGrid}>
                <View style={styles.detailItem}>
                  <FontAwesome5 name="clock" size={14} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {route.startTime} - {route.endTime}
                </Text>
              </View>
              
                <View style={styles.detailItem}>
                  <FontAwesome5 name="map-marker-alt" size={14} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {route.stops} stops
                </Text>
              </View>
              
                <View style={styles.detailItem}>
                  <FontAwesome5 name="money-bill-wave" size={14} color={theme.textSecondary} />
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    Fare: {route.fare}
                </Text>
              </View>
            </View>
            
            <View style={styles.routeActions}>
              {route.status === 'active' && isOnDuty && route.isInTrip && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#FF5722' }]}
                    onPress={() => {
                      Alert.alert(
                        "End Trip",
                        "Are you sure you want to end this trip?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { 
                            text: "End Trip", 
                            onPress: async () => {
                              try {
                                console.log("Ending trip for route:", route.id);
                                
                                // Update route status to active (not in trip)
                                const updatedRoutes = driverRoutes.map(r => 
                                  r.id === route.id 
                                    ? { ...r, status: 'active' as const, isInTrip: false } 
                                    : r
                                );
                                
                                // Update state
                                setDriverRoutes(updatedRoutes);
                                
                                // Save to AsyncStorage to persist after refresh
                                await AsyncStorage.setItem('driverRoutes', JSON.stringify(updatedRoutes));
                                
                                // If we have a socket connection, notify about trip end
                                const locationSocketModule = await import('../../services/socket/location.socket');
                                if (driverId) {
                                  locationSocketModule.sendTripUpdate({
                                    driverId,
                                    routeId: route.routeNumber,
                                    status: 'completed',
                                    location: userLocation
                                  });
                                  
                                  // Also update via API
                                  try {
                                    const token = await AsyncStorage.getItem('token') || '';
                                    const response = await fetch(`${BASE_URL}/api/drivers/${driverId}/trip`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'x-access-token': token
                                      },
                                      body: JSON.stringify({
                                        routeId: route.routeNumber,
                                        status: 'completed',
                                        location: userLocation
                                      })
                                    });
                                    console.log('Trip end update API response:', await response.json());
                                  } catch (apiError) {
                                    console.error('Failed to update trip end status via API:', apiError);
                                  }
                                }
                                
                                // Show confirmation to user
                                Alert.alert(
                                  "Trip Ended",
                                  "Your trip has been completed and your location will no longer be shared.",
                                  [{ text: "OK" }]
                                );
                              } catch (error) {
                                console.error('Error ending trip:', error);
                                Alert.alert(
                                  "Error",
                                  "Failed to end trip. Please try again.",
                                  [{ text: "OK" }]
                                );
                              }
                            } 
                          }
                        ]
                      );
                    }}
                  >
                    <FontAwesome5 name="stop-circle" size={16} color="#FFF" />
                    <Text style={styles.primaryActionButtonText}>End Trip</Text>
                  </TouchableOpacity>
                  
                  <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity 
                      style={[styles.actionButton, {flex: 1, marginRight: 5}]}
                      onPress={() => handleShowRouteMap(route)}
                    >
                      <FontAwesome5 name="map-marked-alt" size={16} color="#2196F3" />
                      <Text style={[styles.actionText, { color: '#2196F3' }]}>Map</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, {flex: 1, marginLeft: 5}]}
                      onPress={() => handleShowRouteDetails(route)}
                    >
                      <FontAwesome5 name="info-circle" size={16} color="#2196F3" />
                      <Text style={[styles.actionText, { color: '#2196F3' }]}>Info</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              
              {route.status === 'active' && isOnDuty && !route.isInTrip && (
                <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.primaryActionButton]}
                      onPress={() => {
                        // Start trip logic would go here
                        Alert.alert(
                          "Start Trip",
                          "Are you sure you want to start this trip?",
                          [
                            { text: "Cancel", style: "cancel" },
                            { 
                              text: "Start", 
                              onPress: async () => {
                                try {
                                console.log("Starting trip for route:", route.id);
                                  
                                  // Update route status to in_progress
                                  const updatedRoutes = driverRoutes.map(r => 
                                    r.id === route.id 
                                      ? { ...r, status: 'active' as const, isInTrip: true } 
                                      : r
                                  );
                                  
                                  // Update state
                                  setDriverRoutes(updatedRoutes);
                                  
                                  // Save to AsyncStorage to persist after refresh
                                  await AsyncStorage.setItem('driverRoutes', JSON.stringify(updatedRoutes));
                                  console.log('Driver routes saved to AsyncStorage:', updatedRoutes.length);
                                  
                                  // If we have a socket connection, notify about trip start
                                  const locationSocketModule = await import('../../services/socket/location.socket');
                                  if (driverId) {
                                    locationSocketModule.sendTripUpdate({
                                      driverId,
                                      routeId: route.routeNumber,
                                      status: 'in_progress',
                                      location: userLocation
                                    });
                                    
                                    // Also update via API to ensure trip status is recorded
                                    try {
                                      const token = await AsyncStorage.getItem('token') || '';
                                      const response = await fetch(`${BASE_URL}/api/drivers/${driverId}/trip`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-access-token': token
                                        },
                                        body: JSON.stringify({
                                          routeId: route.routeNumber,
                                          status: 'in_progress',
                                          location: userLocation
                                        })
                                      });
                                      console.log('Trip status update API response:', await response.json());
                                    } catch (apiError) {
                                      console.error('Failed to update trip status via API:', apiError);
                                    }
                                  }
                                  
                                  // Increase location tracking frequency during trip
                                  setIsLocationTracking(true);
                                  
                                  // Show confirmation to user
                                  Alert.alert(
                                    "Trip Started",
                                    "You have started your trip. Your location will be shared with passengers.",
                                    [{ 
                                      text: "OK"
                                    }]
                                  );
                                } catch (error) {
                                  console.error('Error starting trip:', error);
                                  Alert.alert(
                                    "Error",
                                    "Failed to start trip. Please try again.",
                                    [{ text: "OK" }]
                                  );
                                }
                              } 
                            }
                          ]
                        );
                      }}
                    >
                      <FontAwesome5 name="play-circle" size={16} color="#FFF" />
                      <Text style={styles.primaryActionButtonText}>Start Trip</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleShowRouteDetails(route)}
                  >
                    <FontAwesome5 name="info-circle" size={16} color="#2196F3" />
                    <Text style={[styles.actionText, { color: '#2196F3' }]}>Details</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {route.status === 'upcoming' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryActionButton]}
                    onPress={() => handleShowRouteDetails(route)}
                  >
                    <FontAwesome5 name="info-circle" size={16} color="#FFF" />
                    <Text style={styles.secondaryActionButtonText}>Details</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {route.status === 'completed' && (
                <>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleShowRouteDetails(route)}
                  >
                    <FontAwesome5 name="file-alt" size={16} color={isDarkMode ? '#BBBBBB' : '#9E9E9E'} />
                    <Text style={[styles.actionText, { color: isDarkMode ? '#BBBBBB' : '#9E9E9E' }]}>View Report</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Available Routes Modal */}
      <Modal
        visible={showAvailableRoutesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAvailableRoutesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { 
            backgroundColor: theme.card,
            borderRadius: 16,
            maxWidth: 500,
            width: '95%',
            maxHeight: '80%'
          }]}>
            <View style={[styles.modalHeader, { 
              borderBottomColor: theme.border,
              paddingVertical: 16,
              paddingHorizontal: 20
            }]}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <FontAwesome5 name="route" size={20} color={theme.primary} style={{marginRight: 10}} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Available Routes</Text>
              </View>
              <TouchableOpacity 
                style={[styles.closeButton, { padding: 8 }]}
                onPress={() => setShowAvailableRoutesModal(false)}
              >
                <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
              backgroundColor: `${theme.primary}15`
            }}>
              <FontAwesome5 name="info-circle" size={14} color={theme.primary} style={{marginRight: 8}} />
              <Text style={{color: theme.text, fontSize: 14, flex: 1}}>
                Select routes to add to your dashboard. You can remove them later from your "My Routes" section.
              </Text>
            </View>
            
            <FlatList
              data={availableRoutes}
              renderItem={renderAvailableRouteItem}
              keyExtractor={(item) => item.id || item._id || String(Math.random())}
              contentContainerStyle={[styles.availableRoutesList, {paddingHorizontal: 20, paddingVertical: 10}]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <FontAwesome5 name="route" size={40} color={isDarkMode ? '#444' : '#DDD'} />
                  <Text style={[styles.emptyText, { color: theme.text }]}>No available routes</Text>
                  <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
                    Check back later or request a custom route
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Route Request Modal */}
      <Modal
        visible={showRouteRequestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRouteRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { 
            backgroundColor: theme.card,
            borderRadius: 16,
            maxWidth: 500,
            width: '95%',
          }]}>
            <View style={[styles.modalHeader, { 
              borderBottomColor: theme.border,
              paddingVertical: 16,
              paddingHorizontal: 20
            }]}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <FontAwesome5 name="map-marked-alt" size={20} color={theme.primary} style={{marginRight: 10}} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Request Custom Route</Text>
              </View>
              <TouchableOpacity 
                style={[styles.closeButton, { padding: 8 }]}
                onPress={() => setShowRouteRequestModal(false)}
              >
                  <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={{marginBottom: 16}}>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Describe the route you'd like to drive and we'll review your request
              </Text>
              </View>
              
              <View style={{marginBottom: 20}}>
              <Text style={[styles.modalLabel, { color: theme.text }]}>Route Description:</Text>
              <TextInput
                style={[
                  styles.routeRequestInput, 
                  { 
                    borderColor: isDarkMode ? '#444' : '#ddd',
                    backgroundColor: isDarkMode ? '#333' : '#f9f9f9',
                      color: theme.text,
                      padding: 16,
                      fontSize: 16
                  }
                ]}
                multiline={true}
                value={routeRequestText}
                onChangeText={setRouteRequestText}
                placeholder="Describe your route (e.g. From Downtown to Airport via Main St.)"
                placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              />
                <Text style={[{fontSize: 12, marginTop: 4, fontStyle: 'italic'}, {color: theme.textSecondary}]}>
                  Please include start and end locations, major landmarks, and any specific roads
                </Text>
              </View>
              
              <View style={[styles.modalActions, {marginTop: 16, justifyContent: 'space-between'}]}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    { 
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#777' : '#CCCCCC',
                      flex: 1,
                      marginRight: 8
                    }
                  ]}
                  onPress={() => setShowRouteRequestModal(false)}
                >
                  <Text style={{ 
                    color: isDarkMode ? '#FFFFFF' : '#333333',
                    fontWeight: '600'
                  }}>Cancel</Text>
                </TouchableOpacity>
                
              <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    { 
                      backgroundColor: '#4B6BFE',
                      flex: 1,
                      marginLeft: 8
                    }
                  ]}
                  onPress={handleRouteRequestSubmit}
              >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Submit</Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Custom Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { 
            backgroundColor: theme.card, 
            borderRadius: 16,
            maxWidth: 400,
            width: '90%',
            maxHeight: 'auto'
          }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>End Duty</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={{alignItems: 'center', marginBottom: 20}}>
                <View style={{
                  width: 60, 
                  height: 60, 
                  borderRadius: 30, 
                  backgroundColor: 'rgba(255, 59, 48, 0.1)', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <FontAwesome5 name="power-off" size={24} color="#FF3B30" />
                </View>
                
                <Text style={[{fontSize: 18, fontWeight: '600', marginBottom: 8}, {color: theme.text}]}>
                  End Your Duty?
              </Text>
               
                <Text style={[{fontSize: 14, textAlign: 'center', paddingHorizontal: 20}, {color: theme.textSecondary}]}>
                  You will no longer receive ride requests and your status will be set to offline.
                </Text>
              </View>
               
              <View style={[styles.modalActions, {justifyContent: 'space-between', marginTop: 16}]}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    { 
                    backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
                    borderWidth: 1,
                      borderColor: isDarkMode ? '#555' : '#CCCCCC',
                      flex: 1,
                      marginRight: 8
                    }
                  ]}
                  onPress={() => setShowConfirmModal(false)}
                >
                  <Text style={{ 
                    color: isDarkMode ? '#FFFFFF' : '#333333',
                    fontWeight: '600'
                  }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    { 
                      backgroundColor: '#FF3B30',
                      flex: 1,
                      marginLeft: 8
                    }
                  ]}
                  onPress={handleConfirmEndDuty}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>End Duty</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Route Details Modal */}
      {renderRouteDetailsModal()}
      
      {/* Route Removal Confirmation Modal */}
      <Modal
        visible={showRemoveRouteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowRemoveRouteModal(false);
          setRouteToRemove(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { 
            backgroundColor: theme.card, 
            borderRadius: 16,
            maxWidth: 400,
            width: '90%',
            maxHeight: 'auto'
          }]}>
            <View style={[styles.modalHeader, { 
              borderBottomColor: theme.border,
              paddingVertical: 16,
              paddingHorizontal: 20
            }]}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <FontAwesome5 name="trash" size={20} color="#F44336" style={{marginRight: 10}} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Remove Route</Text>
              </View>
              <TouchableOpacity 
                style={[styles.closeButton, { padding: 8 }]}
                onPress={() => {
                  setShowRemoveRouteModal(false);
                  setRouteToRemove(null);
                }}
              >
                <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={{padding: 20}}>
              <View style={{alignItems: 'center', marginBottom: 20}}>
                <View style={{
                  width: 60, 
                  height: 60, 
                  borderRadius: 30, 
                  backgroundColor: 'rgba(244, 67, 54, 0.1)', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <FontAwesome5 name="trash-alt" size={24} color="#F44336" />
                </View>
                
                <Text style={[{fontSize: 18, fontWeight: '600', marginBottom: 8}, {color: theme.text}]}>
                  Remove Route?
                </Text>
                
                {routeToRemove && (
                  <Text style={[{fontSize: 14, textAlign: 'center', paddingHorizontal: 20}, {color: theme.textSecondary}]}>
                    Are you sure you want to remove {routeToRemove.name} from your routes?
                  </Text>
                )}
              </View>
               
              <View style={[styles.modalActions, {justifyContent: 'space-between', marginTop: 16}]}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    { 
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#777' : '#CCCCCC',
                      flex: 1,
                      marginRight: 8
                    }
                  ]}
                  onPress={() => {
                    setShowRemoveRouteModal(false);
                    setRouteToRemove(null);
                  }}
                >
                  <Text style={{ 
                    color: isDarkMode ? '#FFFFFF' : '#333333',
                    fontWeight: '600'
                  }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    { 
                      backgroundColor: '#F44336',
                      flex: 1,
                      marginLeft: 8
                    }
                  ]}
                  onPress={confirmRouteRemoval}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionCardButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionCardButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  routeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeRouteCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumberContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  routeNumber: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  routeDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  primaryActionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  primaryActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  secondaryActionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  secondaryActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  actionText: {
    marginLeft: 5,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  availableRoutesList: {
    padding: 15,
  },
  availableRouteCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  availableRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  availableRouteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  availableRouteName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  availableRouteDescription: {
    fontSize: 14,
    marginBottom: 10,
  },
  availableRouteDetails: {
    marginBottom: 10,
  },
  availableRouteId: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  activeRideContainer: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  activeRideDetails: {
    marginBottom: 10,
  },
  activeRideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeRideText: {
    marginLeft: 8,
  },
  activeRideActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  rideActionButton: {
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    fontStyle: 'italic',
    marginBottom: 0,
  },
  modalBody: {
    maxHeight: '90%',
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  routeRequestInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  removeRouteButton: {
    padding: 6,
    marginLeft: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 4,
  },
  
  // Route detail modal styles
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeDetailSection: {
    marginBottom: 20,
  },
  routeDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  routeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeDetailIcon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  routeDetailText: {
    fontSize: 16,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusIconLarge: {
    marginRight: 8,
  },
  statusTextLarge: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  routeDetailActions: {
    marginTop: 20,
  },
  routeDetailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  routeDetailActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 20,
  }
}); 