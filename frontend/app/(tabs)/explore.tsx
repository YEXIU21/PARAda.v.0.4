import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  TextInput,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  SectionList,
  RefreshControl,
  Alert,
  ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Route as RouteTypeBase, defaultRoutes, RouteStop as RouteStopBase, RoutePoint } from '../../constants/RouteData';
import { VehicleTypeId, vehicleTypes } from '../../constants/VehicleTypes';
import * as routeApi from '../../services/api/route.api';

// Import socket service for real-time updates
import * as locationSocket from '../../services/socket/location.socket';
import { useAuth } from '../../context/AuthContext';

// Import the VehicleAccess service
import { hasAccessToVehicleType, getAccessibleVehicleTypes, isRouteAccessible } from '../../services/VehicleAccess';

// Extended interfaces for the explore screen
interface RouteStop extends Partial<RouteStopBase> {
  id: string;
  name: string;
  time?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface Route extends Partial<Omit<RouteTypeBase, 'stops'>> {
  id: string;
  name: string;
  type?: VehicleTypeId;
  vehicleType?: VehicleTypeId;
  description?: string;
  path?: RoutePoint[];
  active?: boolean;
  stops: RouteStop[];
}

// Define section data type for SectionList
interface SectionData {
  title: string;
  data: Route[];
}

export default function ExploreScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState<SectionData[]>([]);
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const { user } = useAuth();
  
  // Add selectedVehicleType state
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleTypeId | 'all'>('all');
  
  // Default gradient based on theme that matches the expected tuple type
  const defaultGradient: [string, string] = isDarkMode 
    ? ['#1A1A1A', '#2A2A2A']
    : ['#F8F8F8', '#E8E8E8'];
  
  // Load routes function - extracted to be reusable for refresh
  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch routes from API first - this is the primary data source
      let apiRoutes: any[] = [];
      try {
        console.log('Fetching routes from API...');
        apiRoutes = await routeApi.getRoutes({ active: true });
        console.log(`Routes fetched from API: ${apiRoutes.length} routes found`);
        
        // If API returned routes, use them
        if (apiRoutes && apiRoutes.length > 0) {
          // Convert from API format to Route interface used in this component
          const formattedRoutes: Route[] = apiRoutes
            .filter((route: any) => route.active !== false) // Only show active routes
            .map((route: any): Route => {
              // Ensure we always have a string ID
              const routeId = String(route._id || route.id || `route-${Math.random().toString(36).substr(2, 9)}`);
              
              // Extract schedule information from the API data
              const scheduleTime = getTimeFromSchedule(route.schedule);
              console.log(`Route ${route.name}: Using ${scheduleTime ? 'real schedule data' : 'fallback time data'}`);
              
              return {
                id: routeId,
                name: route.name || 'Unnamed Route',
                type: (route.vehicleType || 'latransco') as VehicleTypeId,
                stops: (route.stops || []).map((stop: any, index: number): RouteStop => ({
                  id: String(stop._id || `s${index}`),
                  name: stop.name || `Stop ${index + 1}`,
                  // Use real schedule data if available, otherwise generate realistic times
                  time: scheduleTime || getRealisticTimeRange()
                }))
              };
            });
          
          setRoutes(formattedRoutes);
          organizeIntoSections(formattedRoutes);
          
          // Also update AsyncStorage for offline access but ONLY with real API data
          await AsyncStorage.setItem('routes', JSON.stringify(apiRoutes));
          return; // Exit early if we successfully got routes from API
        } else {
          console.log('API returned no routes');
        }
      } catch (apiError) {
        console.error('Error fetching routes from API:', apiError);
        
        // Try to load cached routes from AsyncStorage if API call fails
        try {
          const cachedRoutesJson = await AsyncStorage.getItem('routes');
          if (cachedRoutesJson) {
            const cachedRoutes = JSON.parse(cachedRoutesJson);
            console.log(`Using ${cachedRoutes.length} cached routes from AsyncStorage`);
            
            // Format cached routes
            const formattedCachedRoutes: Route[] = cachedRoutes
              .filter((route: any) => route.active !== false)
              .map((route: any): Route => {
                const routeId = String(route._id || route.id || `route-${Math.random().toString(36).substr(2, 9)}`);
                return {
                  id: routeId,
                  name: route.name || 'Unnamed Route',
                  type: (route.vehicleType || 'latransco') as VehicleTypeId,
                  stops: (route.stops || []).map((stop: any, index: number): RouteStop => ({
                    id: String(stop._id || `s${index}`),
                    name: stop.name || `Stop ${index + 1}`,
                    time: getTimeFromSchedule(route.schedule) || getRealisticTimeRange()
                  }))
                };
              });
            
            setRoutes(formattedCachedRoutes);
            organizeIntoSections(formattedCachedRoutes);
            return; // Exit if we successfully loaded cached routes
          }
        } catch (cacheError) {
          console.error('Error loading cached routes:', cacheError);
        }
      }
      
      // If we get here, it means the API call failed and there were no cached routes
      // Show empty state
      console.log('No routes available - showing empty state');
      setRoutes([]);
      setSections([]);
      
    } catch (error) {
      console.error('Error loading routes:', error);
      // Set empty routes on error
      setRoutes([]);
      setSections([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadRoutes();
  }, []);
  
  // Initialize socket for real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined = undefined;
    
    const initializeSocket = async () => {
      try {
        // Initialize socket if user is logged in
        if (user && user.id) {
          // Get client ID (user ID) and token from storage
          const clientId = user.id;
          const token = await AsyncStorage.getItem('token') || await AsyncStorage.getItem('authToken');
          
          if (clientId && token) {
            // Initialize socket connection
            await locationSocket.initializeLocationSocket(clientId, token);
            
            // Subscribe to route updates with explicit return type
            unsubscribe = locationSocket.subscribeToRouteUpdates((routeData: any) => {
              console.log('Route update received via socket in passenger app:', routeData);
              
              if (routeData && routeData.routes) {
                // Handle route updates
                const updatedRoutes = routeData.routes;
                
                // Check for deleted routes
                const deletedRoutes = updatedRoutes.filter((route: any) => route.deleted === true);
                
                if (deletedRoutes.length > 0) {
                  // Handle route deletions by removing them from routes
                  setRoutes(prevRoutes => {
                    const deletedIds = deletedRoutes.map((route: any) => route._id || route.id);
                    console.log('Removing deleted routes with IDs:', deletedIds);
                    
                    // Filter out deleted routes
                    const filteredRoutes = prevRoutes.filter(route => !deletedIds.includes(route.id));
                    
                    // Update sections with filtered routes
                    organizeIntoSections(filteredRoutes);
                    
                    // Update AsyncStorage
                    AsyncStorage.setItem('routes', JSON.stringify(filteredRoutes))
                      .catch(err => console.error('Error updating routes in AsyncStorage:', err));
                    
                    return filteredRoutes;
                  });
                  
                  // Show notification about route deletion if needed
                  if (deletedRoutes.length === 1) {
                    Alert.alert(
                      "Route Removed",
                      `The route "${deletedRoutes[0].name || 'Unknown'}" has been removed.`,
                      [{ text: "OK" }]
                    );
                  }
                } else {
                  // Handle route updates (new or modified routes)
                  setRoutes(prevRoutes => {
                    // Create a map of existing routes by ID for quick lookup
                    const routeMap = new Map(prevRoutes.map(route => [route.id, route]));
                    
                    // Process each updated route
                    updatedRoutes.forEach((updatedRoute: any) => {
                      const routeId = String(updatedRoute._id || updatedRoute.id);
                      
                      // Skip inactive routes
                      if (updatedRoute.active === false) {
                        routeMap.delete(routeId);
                        return;
                      }
                      
                      // Format the updated route
                      const formattedRoute: Route = {
                        id: routeId,
                        name: updatedRoute.name || 'Unnamed Route',
                        type: (updatedRoute.vehicleType || 'latransco') as VehicleTypeId,
                        stops: (updatedRoute.stops || []).map((stop: any, index: number): RouteStop => ({
                          id: String(stop._id || `s${index}`),
                          name: stop.name || `Stop ${index + 1}`,
                          time: getTimeFromSchedule(updatedRoute.schedule) || getRealisticTimeRange()
                        }))
                      };
                      
                      // Update or add the route
                      routeMap.set(routeId, formattedRoute);
                    });
                    
                    // Convert map back to array
                    const updatedRoutesList = Array.from(routeMap.values());
                    
                    // Update sections
                    organizeIntoSections(updatedRoutesList);
                    
                    // Update AsyncStorage
                    AsyncStorage.setItem('routes', JSON.stringify(updatedRoutesList))
                      .catch(err => console.error('Error updating routes in AsyncStorage:', err));
                    
                    return updatedRoutesList;
                  });
                  
                  // Update last update time
                  // setLastUpdateTime(new Date()); // This line was removed as per the new code block
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Error initializing socket for passenger routes:', error);
      }
    };
    
    initializeSocket();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);
  
  // Set up polling for real-time updates as fallback
  useEffect(() => {
    // Poll for updates every 60 seconds
    const pollingInterval = setInterval(async () => {
      try {
        console.log('Checking for route updates...');
        
        // Only fetch route updates, don't show loading indicator
        const apiRoutes = await routeApi.getRoutes({ active: true });
        
        if (apiRoutes && apiRoutes.length > 0) {
          // Check if routes have changed by comparing with current routes
          const currentRouteIds = routes.map(r => r.id);
          const apiRouteIds = apiRoutes.map((r: any) => r._id || r.id);
          
          // Check if any routes were added or removed
          const hasChanges = apiRouteIds.some((id: string) => !currentRouteIds.includes(id)) || 
                            currentRouteIds.some(id => !apiRouteIds.includes(id));
          
          if (hasChanges) {
            console.log('Routes have changed, updating...');
            // If routes have changed, update the UI
            loadRoutes();
          }
        }
      } catch (error) {
        console.error('Error polling for route updates:', error);
      }
    }, 60000); // Check every 60 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(pollingInterval);
  }, [routes]);
  
  // Development function to create test routes - DISABLED by default
  const createTestRoutes = async () => {
    // This function is for development purposes only
    // It creates test routes in the API if none exist
    
    // IMPORTANT: This is disabled by default to prevent creating test data in production
    const ENABLE_TEST_ROUTES = false;
    
    if (!ENABLE_TEST_ROUTES) {
      console.log('Test routes creation is disabled');
      return;
    }
    
    try {
      // Check if we already have routes
      const existingRoutes = await routeApi.getRoutes({ active: true });
      if (existingRoutes && existingRoutes.length > 0) {
        console.log('Routes already exist, not creating test routes');
        return;
      }
      
      // Create test routes for each vehicle type
      const vehicleTypesToCreate = ['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'];
      
      for (const vehicleType of vehicleTypesToCreate) {
        const routeData = {
          name: `${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} Route`,
          description: `Test route for ${vehicleType}`,
          vehicleType: vehicleType,
          active: true,
          stops: [
            { 
              name: 'Stop 1', 
              coordinates: { latitude: 37.78825, longitude: -122.4324 } 
            },
            { 
              name: 'Stop 2', 
              coordinates: { latitude: 37.78925, longitude: -122.4344 } 
            },
            { 
              name: 'Stop 3', 
              coordinates: { latitude: 37.78625, longitude: -122.4314 } 
            }
          ],
          path: [
            { latitude: 37.78825, longitude: -122.4324 },
            { latitude: 37.78865, longitude: -122.4334 },
            { latitude: 37.78925, longitude: -122.4344 },
            { latitude: 37.78775, longitude: -122.4329 },
            { latitude: 37.78625, longitude: -122.4314 }
          ],
          schedule: {
            weekdays: {
              start: '06:00 AM',
              end: '10:00 PM',
              frequency: 30
            },
            weekends: {
              start: '08:00 AM',
              end: '08:00 PM',
              frequency: 45
            }
          }
        };
        
        try {
          await routeApi.createRoute(routeData);
          console.log(`Created test route for ${vehicleType}`);
        } catch (error) {
          console.error(`Error creating test route for ${vehicleType}:`, error);
        }
      }
      
      // Reload routes after creating test data
      loadRoutes();
      
    } catch (error) {
      console.error('Error in createTestRoutes:', error);
    }
  };
  
  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
  };
  
  // Helper function to extract time from schedule
  const getTimeFromSchedule = (schedule: any) => {
    if (!schedule) return null;
    
    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date().getDay();
    const isWeekend = today === 0 || today === 6; // Sunday or Saturday
    
    // Use weekend schedule if it's a weekend, otherwise use weekday schedule
    const scheduleType = isWeekend && schedule.weekends ? 'weekends' : 'weekdays';
    
    if (schedule[scheduleType]) {
      const { start, end } = schedule[scheduleType];
      if (start && end) {
        return `${start} - ${end}`;
      }
    }
    
    return null;
  };
  
  // Fallback function to generate time ranges when real schedule data is missing
  // This ensures we always display something meaningful to users even if the API
  // returns incomplete schedule data
  const getRealisticTimeRange = () => {
    console.log('Using fallback time range - real schedule data missing');
    const now = new Date();
    const hour = now.getHours();
    
    // Morning routes (6 AM - 10 AM)
    if (hour < 10) {
      return '6:00 AM - 10:00 AM';
    }
    // Midday routes (10 AM - 3 PM)
    else if (hour < 15) {
      return '10:00 AM - 3:00 PM';
    }
    // Afternoon routes (3 PM - 7 PM)
    else if (hour < 19) {
      return '3:00 PM - 7:00 PM';
    }
    // Evening routes (7 PM - 10 PM)
    else {
      return '7:00 PM - 10:00 PM';
    }
  };
  
  // Organize routes into sections by vehicle type
  const organizeIntoSections = (routes: Route[]) => {
    const sectionMap: Record<string, Route[]> = {};
    
    // Group routes by vehicle type
    routes.forEach(route => {
      // Use a non-null assertion with default value to avoid TypeScript errors
      const routeType = (route.type || route.vehicleType || 'other') as string;
      
      if (!sectionMap[routeType]) {
        sectionMap[routeType] = [];
      }
      sectionMap[routeType].push(route);
    });
    
    // Create sections array
    const newSections: SectionData[] = [];
    
    // Add sections for each vehicle type in the order defined in vehicleTypes
    vehicleTypes.forEach(vehicleType => {
      const routesForType = sectionMap[vehicleType.id] || [];
      if (routesForType.length > 0) {
        newSections.push({
          title: vehicleType.name,
          data: routesForType
        });
      }
    });
    
    setSections(newSections);
  };
  
  // Function to filter routes based on user's subscription and search query
  const getFilteredRoutes = useCallback(() => {
    if (!routes) return [];
    
    // Filter routes based on search query first
    let filteredRoutes = routes;
    if (searchText) {
      const query = searchText.toLowerCase();
      filteredRoutes = routes.filter(route => 
        route.name.toLowerCase().includes(query) || 
        route.stops.some(stop => stop.name.toLowerCase().includes(query))
      );
    }
    
    // Filter by selected vehicle type if any
    if (selectedVehicleType !== 'all') {
      filteredRoutes = filteredRoutes.filter(route => 
        (route.vehicleType === selectedVehicleType) || (route.type === selectedVehicleType)
      );
    }
    
    // Filter by active status (assuming all routes are active if not specified)
    filteredRoutes = filteredRoutes.filter(route => route.active !== false);
    
    // For admin and driver users, show all routes
    if (user?.role === 'admin' || user?.role === 'driver') {
      return filteredRoutes;
    }
    
    // For users with verified subscriptions, show all routes regardless of vehicle type
    // Check if either verified is true or isActive is true
    if (user?.subscription && 
        (user.subscription.verified || (user.subscription as any).isActive)) {
      return filteredRoutes;
    }
    
    // For users without a verified subscription, show all routes but mark them as locked
    return filteredRoutes;
  }, [routes, searchText, selectedVehicleType, user]);

  // Convert filtered routes to sections for SectionList
  const filteredSections = useMemo(() => {
    const filteredRoutes = getFilteredRoutes();
    
    // Group routes by vehicle type
    const routesByVehicleType = filteredRoutes.reduce<Record<string, Route[]>>((acc, route) => {
      // Use a non-null assertion to avoid TypeScript errors
      const vehicleTypeKey = (route.vehicleType || route.type || 'other') as string;
      
      if (!acc[vehicleTypeKey]) {
        acc[vehicleTypeKey] = [];
      }
      
      acc[vehicleTypeKey].push(route);
      return acc;
    }, {});
    
    // Convert to sections format
    return Object.entries(routesByVehicleType).map(([vehicleType, routes]) => ({
      title: vehicleType,
      data: routes
    }));
  }, [getFilteredRoutes]);

  // Helper function to safely get gradient colors for a vehicle type
  const getGradientColorsForVehicleType = (typeStr: string): [string, string] => {
    // Use a safe fallback for undefined
    const safeType = typeStr || 'latransco';
    
    // Find the vehicle type or use a default
    const vehicleType = vehicleTypes.find(v => v.id === safeType as VehicleTypeId);
    
    // Return the gradient or a default
    return vehicleType?.gradient || defaultGradient;
  };

  const toggleRouteExpansion = (routeId: string) => {
    const isExpanding = expandedRoutes.includes(routeId);
    
    if (expandedRoutes.length > 0 && !expandedRoutes.includes(routeId)) {
      // Collapse the currently expanded route
      // Animated.timing(animatedValues[expanded], { // This line was removed as per the new code block
      //   toValue: 0,
      //   duration: 300,
      //   useNativeDriver: false,
      // }).start();
    }

    // Toggle the target route
    if (expandedRoutes.includes(routeId)) {
      // Animated.timing(animatedValues[routeId], { // This line was removed as per the new code block
      //   toValue: isExpanding ? 1 : 0,
      //   duration: 300,
      //   useNativeDriver: false,
      // }).start();
    }
    
    setExpandedRoutes(prev => 
      prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]
    );
  };

  // Check if a route is accessible to the current user
  const checkRouteAccessibility = useCallback((route: Route) => {
    // Use the isRouteAccessible function from VehicleAccess service
    // This ensures we use the centralized logic for route access
    return isRouteAccessible(user, route);
  }, [user]);

  const renderSectionHeader = ({ section }: { section: SectionData }) => {
    return (
      <LinearGradient
        colors={getGradientColorsForVehicleType(section.title)}
        style={styles.sectionHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.sectionHeaderContent}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconContainer}>
              <FontAwesome5 
                name={section.title} // Changed from section.icon to section.title
                size={18} 
                color="white" 
              />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Text style={styles.sectionCount}>{section.data.length} routes</Text>
        </View>
      </LinearGradient>
    );
  };

  const renderRouteItem = ({ item }: { item: Route }) => {
    // Check if the route is accessible to the current user
    const isAccessible = checkRouteAccessibility(item);
    
    // Get the vehicle type info
    const vehicleTypeInfo = vehicleTypes.find(vt => vt.id === (item.vehicleType || item.type)) || 
      { gradient: defaultGradient, icon: 'bus', name: 'Bus' };

    return (
      <TouchableOpacity 
        style={[
          styles.routeItem,
          { backgroundColor: theme.card }
        ]}
        onPress={() => toggleRouteExpansion(item.id)}
        disabled={!isAccessible} // Disable touch for inaccessible routes
      >
        <View style={styles.routeHeader}>
          <View style={styles.routeInfo}>
            <View style={styles.routeTypeIndicator}>
              <LinearGradient
                colors={vehicleTypeInfo.gradient}
                style={styles.routeTypeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <FontAwesome5 
                  name={vehicleTypeInfo.icon} 
                  size={14} 
                  color="white" 
                />
              </LinearGradient>
              <Text style={[styles.routeTypeName, { color: theme.textSecondary }]}>
                {vehicleTypeInfo.name}
              </Text>
            </View>
            <Text style={[styles.routeName, { color: theme.text }]}>{item.name}</Text>
            <View style={styles.routeMetaInfo}>
              <FontAwesome5 name="map-marker-alt" size={12} color={theme.textSecondary} style={styles.routeMetaIcon} />
              <Text style={[styles.routeStops, { color: theme.textSecondary }]}>
                {item.stops.length} stops
              </Text>
              {item.stops.length > 1 && (
                <>
                  <View style={styles.routeMetaDivider} />
                  <Text style={[styles.routeEndpoints, { color: theme.textSecondary }]}>
                    {item.stops[0].name} → {item.stops[item.stops.length - 1].name}
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.routeActions}>
            {!isAccessible && (
              <View style={styles.lockIconContainer}>
                <FontAwesome5 name="lock" size={16} color={theme.textSecondary} />
              </View>
            )}
            <FontAwesome5 
              name={expandedRoutes.includes(item.id) ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={theme.textSecondary} 
            />
          </View>
        </View>
        
        {/* Show stops if route is expanded */}
        {expandedRoutes.includes(item.id) && (
          <View style={styles.stopsContainer}>
            {item.stops.map((stop, index) => (
              <View key={stop.id || `stop-${index}`} style={styles.stopItem}>
                <View style={styles.timelineContainer}>
                  <View 
                    style={[
                      styles.stopDot,
                      index === 0 ? styles.startStopDot : 
                      index === item.stops.length - 1 ? styles.endStopDot : styles.middleStopDot,
                      { borderColor: vehicleTypeInfo.gradient[0] }
                    ]} 
                  />
                  {index < item.stops.length - 1 && (
                    <View 
                      style={[
                        styles.connector,
                        { backgroundColor: vehicleTypeInfo.gradient[0] }
                      ]} 
                    />
                  )}
                </View>
                <View style={styles.stopInfo}>
                  <Text style={[styles.stopName, { color: theme.text }]}>{stop.name}</Text>
                  {stop.time && (
                    <Text style={[styles.stopTime, { color: theme.textSecondary }]}>
                      {stop.time}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Helper function to get filter chip background style
  const getFilterChipStyle = (isSelected: boolean) => {
    return isSelected 
      ? { backgroundColor: '#fff', opacity: 0.95 } 
      : { backgroundColor: 'rgba(255, 255, 255, 0.25)' };
  };

  // Render the main screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <LinearGradient
        colors={theme.gradientColors}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <FontAwesome5 name="map-marked-alt" size={24} color="#fff" />
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: '#fff' }]}>Routes & Schedules</Text>
            <Text style={[styles.lastUpdated, { color: '#fff' }]}>
              Find and track available transportation
            </Text>
          </View>
        </View>
      
        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 0.8)' : 'rgba(240, 240, 240, 0.8)' }]}>
          <FontAwesome5 name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search routes or stops"
            placeholderTextColor={theme.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <FontAwesome5 name="times-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Vehicle Type Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              getFilterChipStyle(selectedVehicleType === 'all'),
              selectedVehicleType === 'all' && styles.activeFilterChip
            ]}
            onPress={() => setSelectedVehicleType('all')}
          >
            <Text style={[
              styles.filterChipText, 
              selectedVehicleType === 'all' && styles.activeFilterChipText,
              { color: selectedVehicleType === 'all' ? theme.primary : '#fff' }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {vehicleTypes.map(vehicleType => (
            <TouchableOpacity 
              key={vehicleType.id}
              style={[
                styles.filterChip, 
                getFilterChipStyle(selectedVehicleType === vehicleType.id),
                selectedVehicleType === vehicleType.id && styles.activeFilterChip
              ]}
              onPress={() => setSelectedVehicleType(vehicleType.id)}
            >
              <FontAwesome5 
                name={vehicleType.icon || 'bus'} 
                size={12} 
                color={selectedVehicleType === vehicleType.id ? vehicleType.gradient[0] : '#fff'}
                style={styles.filterChipIcon} 
              />
              <Text style={[
                styles.filterChipText, 
                selectedVehicleType === vehicleType.id && styles.activeFilterChipText,
                { color: selectedVehicleType === vehicleType.id ? vehicleType.gradient[0] : '#fff' }
              ]}>
                {vehicleType.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading routes...</Text>
        </View>
      ) : filteredSections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="route" size={50} color={isDarkMode ? '#444' : '#DDD'} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {searchText ? 'No routes match your search' : 'No routes available'}
          </Text>
          {selectedVehicleType !== 'all' && (
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: theme.primary }]} 
              onPress={() => setSelectedVehicleType('all')}
            >
              <Text style={styles.emptyButtonText}>Show All Routes</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          renderItem={renderRouteItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id || Math.random().toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          stickySectionHeadersEnabled={true}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
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
  headerTextContainer: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  lastUpdated: {
    fontSize: 12,
    marginBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  filterContainer: {
    marginTop: 5,
    marginBottom: 5,
  },
  filterContent: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipIcon: {
    marginRight: 5,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterChipText: {
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
  },
  routeContainer: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    overflow: 'hidden',
    borderRadius: 12,
  },
  routeGradient: {
    padding: 15,
  },
  routeHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  stopsList: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  timelineContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
    height: '100%',
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 1,
  },
  startStopDot: {
    backgroundColor: '#fff',
  },
  middleStopDot: {
    backgroundColor: '#fff',
  },
  endStopDot: {
    backgroundColor: '#fff',
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  stopInfo: {
    flex: 1,
    paddingVertical: 2,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  stopTime: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 16,
    marginBottom: 20,
  },
  emptyDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  routeExpandContainer: {
    padding: 15,
  },
  routeItemGradient: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  sectionHeader: {
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  sectionCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  routeItem: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  routeInfo: {
    flex: 1,
  },
  routeTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeTypeGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  routeTypeName: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeMetaIcon: {
    marginRight: 4,
  },
  routeMetaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 6,
  },
  routeStops: {
    fontSize: 12,
  },
  routeEndpoints: {
    fontSize: 12,
    fontWeight: '500',
  },
  routeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIconContainer: {
    marginRight: 10,
  },
  stopsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 5,
  },
});
