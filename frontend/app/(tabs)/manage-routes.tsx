import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { RouteStop, Route as BaseRoute } from '../../constants/RouteData';
import { VehicleTypeId, vehicleTypes } from '../../constants/VehicleTypes';
import { useAuth } from '../../context/AuthContext';
import * as routeApi from '../../services/api/route.api';

// Extended Route interface to include schedule
interface Route extends BaseRoute {
  schedule?: {
    weekdays?: {
      start?: string;
      end?: string;
      frequency?: number;
    };
    weekends?: {
      start?: string;
      end?: string;
      frequency?: number;
    };
  };
}

export default function ManageRoutesScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showEditRouteModal, setShowEditRouteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<{id: string, name: string} | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteDescription, setNewRouteDescription] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleTypeId>('latransco');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [fare, setFare] = useState('');
  const [stops, setStops] = useState<string[]>(['Terminal', 'City Center']);
  const [newStop, setNewStop] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const theme = getThemeColors(isDarkMode);

  // Add a function to reset form fields
  const resetFormFields = () => {
    setNewRouteName('');
    setNewRouteDescription('');
    setSelectedVehicleType('latransco');
    setStartTime('08:00 AM');
    setEndTime('06:00 PM');
    setFare('');
    setStops(['Terminal', 'City Center']);
    setNewStop('');
  };

  // Load routes from API on component mount and when showActiveOnly changes
  useEffect(() => {
    fetchRoutes();
  }, [showActiveOnly]);

  const fetchRoutes = async () => {
      try {
      setIsLoading(true);
      setError(null);
      const options = { active: showActiveOnly || undefined };
      const fetchedRoutes = await routeApi.getRoutes(options);
      setRoutes(fetchedRoutes);
    } catch (error: any) {
      console.error('Error fetching routes:', error);
      
      let errorMessage = 'Failed to load routes. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter routes based on search text
  const filteredRoutes = routes.filter(route => {
    return route.name.toLowerCase().includes(searchText.toLowerCase()) ||
           (route.description && route.description.toLowerCase().includes(searchText.toLowerCase()));
  });

  const handleToggleRouteStatus = async (routeId: string, currentStatus: boolean) => {
    try {
      await routeApi.toggleRouteStatus(routeId, !currentStatus);
      // Update local state
    setRoutes(routes.map(route => 
        route._id === routeId ? { ...route, active: !currentStatus } : route
      ));
      Alert.alert('Success', `Route ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling route status:', error);
      
      let errorMessage = 'Failed to update route status. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // First, let's update the handleDeleteButtonPress function to ensure it properly sets up the modal
  const handleDeleteButtonPress = (routeId: string, routeName: string) => {
    console.log(`Delete button pressed for route: ${routeName}, ID: ${routeId}`);
    // Make sure we set the route to delete with the correct information
    setRouteToDelete({ id: routeId, name: routeName });
    // Show the delete confirmation modal
    setShowDeleteModal(true);
  };

  const handleDeleteRoute = async () => {
    if (!routeToDelete) {
      console.error('No route selected for deletion');
      return;
    }
    
    const routeId = routeToDelete.id;
    
            try {
              setIsLoading(true);
      console.log(`Attempting to delete route with ID: ${routeId}`);
              
              // Call the API to delete the route
      const response = await routeApi.deleteRoute(routeId);
      console.log('Delete route API response:', response);
              
              // Update local state to remove the deleted route
              setRoutes(routes.filter(route => route._id !== routeId));
      
      // Close the delete modal
      setShowDeleteModal(false);
      setRouteToDelete(null);
      
              Alert.alert('Success', 'Route has been deleted successfully');
            } catch (error: any) {
              console.error('Error deleting route:', error);
              
              let errorMessage = 'Failed to delete route. Please try again.';
              if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
              }
              
              Alert.alert('Error', errorMessage);
            } finally {
              setIsLoading(false);
            }
  };

  const addStop = () => {
    if (newStop.trim() === '') {
      return;
    }
    setStops([...stops, newStop.trim()]);
    setNewStop('');
  };

  const removeStop = (index: number) => {
    const updatedStops = [...stops];
    updatedStops.splice(index, 1);
    setStops(updatedStops);
  };

  const handleAddRoute = async () => {
    if (!newRouteName.trim()) {
      Alert.alert('Error', 'Please enter a route name');
      return;
    }

    if (stops.length < 2) {
      Alert.alert('Error', 'Please add at least two stops');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert stops to the format expected by the API
      const routeStops = stops.map((stopName, index) => {
        // Generate realistic coordinates for each stop
        // In a real app, these would come from a map selection or geocoding service
        const latitude = 10.3156 + (index * 0.01); // Philippines latitude range
        const longitude = 123.8854 + (index * 0.01); // Philippines longitude range
        
        return {
          name: stopName,
          coordinates: { latitude, longitude }
        };
      });

      // Create schedule object from start and end times
      const schedule = {
        weekdays: {
          start: startTime,
          end: endTime,
          frequency: 30 // Default frequency in minutes
        },
        weekends: {
          start: startTime,
          end: endTime,
          frequency: 45 // Default frequency in minutes
        }
      };

      // Use the selectedVehicleType directly as it already matches the backend expected values
      // The backend expects: 'latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'

      const routeData = {
        name: newRouteName,
        description: newRouteDescription || `Route from ${stops[0]} to ${stops[stops.length-1]}`,
        vehicleType: selectedVehicleType, // Use the selected vehicle type directly
        companyId: selectedVehicleType, // Keep the original company ID for frontend display
        stops: routeStops,
        schedule: schedule,
        fare: fare ? parseFloat(fare) : 0,
        active: true
      };

      console.log('Submitting route data:', JSON.stringify(routeData, null, 2));
      const newRoute = await routeApi.createRoute(routeData);
      
      // Update local state with the new route
      setRoutes([...routes, newRoute]);
      
      // Reset form
      resetFormFields();
      setShowAddRouteModal(false);
      
      Alert.alert('Success', 'New route has been added successfully');
    } catch (error: any) {
      console.error('Error creating route:', error);
      
      let errorMessage = 'Failed to create route. Please try again.';
      
      // Extract more specific error message if available
      if (error.message && !error.message.includes('status code')) {
        // Use the direct error message if it's not a generic HTTP error
        errorMessage = error.message;
      } else if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        // Handle validation errors
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          const validationError = error.response.data.errors[0];
          errorMessage = `Validation error: ${validationError.msg || validationError.message || JSON.stringify(validationError)}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoute = (route: Route) => {
    // Set the editing route
    setEditingRoute(route);
    
    // Initialize form fields with the route data
    setNewRouteName(route.name);
    setNewRouteDescription(route.description || '');
    setSelectedVehicleType(route.vehicleType as VehicleTypeId);
    
    // Set schedule if available
    if (route.schedule) {
      setStartTime(route.schedule.weekdays?.start || '08:00 AM');
      setEndTime(route.schedule.weekdays?.end || '06:00 PM');
    } else {
      setStartTime('08:00 AM');
      setEndTime('06:00 PM');
    }
    
    // Set fare
    setFare(route.fare ? route.fare.toString() : '0');
    
    // Set stops
    if (route.stops && route.stops.length > 0) {
      setStops(route.stops.map(stop => stop.name));
    } else {
      setStops(['Terminal', 'City Center']);
    }
    
    // Show the edit modal
    setShowEditRouteModal(true);
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute || !editingRoute._id) {
      Alert.alert('Error', 'No route selected for editing');
      return;
    }

    if (!newRouteName.trim()) {
      Alert.alert('Error', 'Please enter a route name');
      return;
    }

    if (stops.length < 2) {
      Alert.alert('Error', 'Please add at least two stops');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert stops to the format expected by the API
      const routeStops = stops.map((stopName, index) => {
        // Generate realistic coordinates for each stop
        // In a real app, these would come from a map selection or geocoding service
        const latitude = 10.3156 + (index * 0.01); // Philippines latitude range
        const longitude = 123.8854 + (index * 0.01); // Philippines longitude range
        
        return {
          name: stopName,
          coordinates: { latitude, longitude }
        };
      });

      // Create schedule object from start and end times
      const schedule = {
        weekdays: {
          start: startTime,
          end: endTime,
          frequency: 30 // Default frequency in minutes
        },
        weekends: {
          start: startTime,
          end: endTime,
          frequency: 45 // Default frequency in minutes
        }
      };

      // Use the selectedVehicleType directly as it already matches the backend expected values
      // The backend expects: 'latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'

      const routeData = {
        name: newRouteName,
        description: newRouteDescription || `Route from ${stops[0]} to ${stops[stops.length-1]}`,
        vehicleType: selectedVehicleType, // Use the selected vehicle type directly
        companyId: selectedVehicleType, // Keep the original company ID for frontend display
        stops: routeStops,
        schedule: schedule,
        fare: fare ? parseFloat(fare) : 0,
        active: editingRoute.active
      };

      console.log(`Updating route ${editingRoute._id} with data:`, JSON.stringify(routeData, null, 2));
      const updatedRoute = await routeApi.updateRoute(editingRoute._id, routeData);
      
      // Update local state with the updated route
      setRoutes(routes.map(route => 
        route._id === editingRoute._id ? updatedRoute : route
      ));
      
      // Close the modal and reset form
      setShowEditRouteModal(false);
      setEditingRoute(null);
      
      Alert.alert('Success', 'Route updated successfully');
    } catch (error: any) {
      console.error('Error updating route:', error);
      
      let errorMessage = 'Failed to update route. Please try again.';
      
      // Extract more specific error message if available
      if (error.message && !error.message.includes('status code')) {
        // Use the direct error message if it's not a generic HTTP error
        errorMessage = error.message;
      } else if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        // Handle validation errors
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          const validationError = error.response.data.errors[0];
          errorMessage = `Validation error: ${validationError.msg || validationError.message || JSON.stringify(validationError)}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRouteItem = ({ item }: { item: Route }) => {
    // Get the appropriate vehicle name based on type
    const vehicleTypeName = vehicleTypes.find(v => v.id === item.vehicleType)?.name || item.vehicleType;
    
    // Make sure we get a valid route ID
    const routeId = item._id || '';
    
    return (
    <View style={[styles.routeCard, { 
      backgroundColor: theme.card, 
      borderColor: theme.border,
      borderLeftWidth: 5,
      borderLeftColor: item.active ? '#4CAF50' : '#9E9E9E'
    }]}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
            <View style={[styles.companyContainer, {
              backgroundColor: ['latransco', 'calvo', 'corominas', 'ceres', 'gabe'].includes(item.vehicleType) ? '#4B6BFE' : '#5E5CE6',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 8,
              marginBottom: 8,
              alignSelf: 'flex-start'
            }]}>
              <FontAwesome5 
                name={['latransco', 'calvo', 'corominas', 'ceres', 'gabe'].includes(item.vehicleType) ? 'bus' : 'shuttle-van'} 
                size={14} 
                color="#fff" 
              />
              <Text style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14,
                marginLeft: 6
              }}>
                {vehicleTypeName}
              </Text>
            </View>
            <Text style={[styles.routeName, { color: theme.text }]}>{item.name}</Text>
            <View style={[styles.routeTypeContainer, {
              backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
              marginTop: 4
            }]}>
              <Text style={[styles.routeType, { color: theme.text }]}>
                Route #{routeId.substring(0, 5) || 'N/A'}
              </Text>
            </View>
        </View>
        <Switch
          value={item.active}
          onValueChange={() => handleToggleRouteStatus(routeId, item.active)}
          trackColor={{ false: "#767577", true: "#4B6BFE" }}
          thumbColor={item.active ? "#fff" : "#f4f3f4"}
        />
      </View>
      
      <Text style={[styles.routeDescription, { color: theme.textSecondary }]}>
        {item.description || 'No description provided'}
      </Text>

      {item.fare !== undefined && item.fare > 0 && (
        <Text style={[styles.routeFare, { color: theme.text }]}>
          Fare: ₱{Number(item.fare).toFixed(2)}
        </Text>
      )}
      
      <View style={styles.routeStops}>
        <Text style={[styles.stopsTitle, { color: theme.text }]}>Stops ({item.stops?.length || 0})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {item.stops?.map((stop, index) => (
            <View key={index} style={[styles.stopBadge, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
              <Text style={[styles.stopText, { color: theme.text }]}>{stop.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.routeActions}>
        <TouchableOpacity 
          style={[styles.editButton, { 
            backgroundColor: '#4B6BFE',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            marginRight: 10
          }]}
          onPress={() => handleEditRoute(item)}
        >
          <FontAwesome5 name="edit" size={14} color="white" style={{ marginRight: 6 }} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.deleteButton, { 
          backgroundColor: '#ff4444',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          paddingHorizontal: 16,
            borderRadius: 8
        }]}
          onPress={() => handleDeleteButtonPress(routeId, item.name)}
      >
        <FontAwesome5 name="trash" size={14} color="white" style={{ marginRight: 6 }} />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
      </View>
    </View>
    );
  };

  // Add Route Modal
  const renderAddRouteModal = () => (
    <Modal
      visible={showAddRouteModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowAddRouteModal(false);
        resetFormFields();
      }}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Route</Text>
            <TouchableOpacity onPress={() => {
              setShowAddRouteModal(false);
              resetFormFields();
            }}>
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Route Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={newRouteName}
              onChangeText={setNewRouteName}
              placeholder="Enter route name"
              placeholderTextColor={theme.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Description</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={newRouteDescription}
              onChangeText={setNewRouteDescription}
              placeholder="Enter route description"
              placeholderTextColor={theme.textSecondary}
              multiline
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Driver Start Time</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:00 AM"
              placeholderTextColor={theme.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Driver End Time</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="06:00 PM"
              placeholderTextColor={theme.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Fare</Text>
            <Text style={[styles.inputSubLabel, { color: theme.textSecondary }]}>Enter fare amount in Pesos (₱)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={fare}
              onChangeText={setFare}
              placeholder="Enter fare amount"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Stops</Text>
            <Text style={[styles.inputSubLabel, { color: theme.textSecondary }]}>Add at least two stops for this route</Text>
            
              {stops.map((stop, index) => (
              <View key={index} style={styles.stopItem}>
                <Text style={[styles.stopNumber, { color: theme.text }]}>{index + 1}. {stop}</Text>
                  <TouchableOpacity onPress={() => removeStop(index)}>
                  <FontAwesome5 name="times-circle" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            
            <View style={styles.addStopContainer}>
              <TextInput
                style={[styles.addStopInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={newStop}
                onChangeText={setNewStop}
                placeholder="Enter stop name"
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity 
                style={[styles.addStopButton, { backgroundColor: '#4B6BFE' }]}
                onPress={addStop}
              >
                <FontAwesome5 name="plus" size={16} color="white" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Vehicle Type</Text>
            <Text style={[styles.inputSubLabel, { color: theme.textSecondary }]}>Select the bus company for this route</Text>
            
            <View style={styles.vehicleTypeContainer}>
              {vehicleTypes.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleTypeOption,
                    { 
                      backgroundColor: selectedVehicleType === vehicle.id ? '#4B6BFE' : theme.background,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => setSelectedVehicleType(vehicle.id)}
                >
                  <FontAwesome5
                    name={vehicle.icon} 
                    size={18} 
                    color={selectedVehicleType === vehicle.id ? 'white' : theme.text} 
                  />
                  <Text
                    style={[
                      styles.vehicleTypeText,
                      { color: selectedVehicleType === vehicle.id ? 'white' : theme.text }
                    ]}
                  >
                    {vehicle.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            </ScrollView>
            
            <TouchableOpacity
            style={[styles.addRouteButton, { backgroundColor: '#4B6BFE', opacity: isSubmitting ? 0.7 : 1 }]}
              onPress={handleAddRoute}
            disabled={isSubmitting}
            >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.addRouteButtonText}>Add Route</Text>
            )}
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Edit Route Modal
  const renderEditRouteModal = () => (
    <Modal
      visible={showEditRouteModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowEditRouteModal(false);
        setEditingRoute(null);
      }}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Route</Text>
            <TouchableOpacity onPress={() => {
              setShowEditRouteModal(false);
              setEditingRoute(null);
            }}>
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Route Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={newRouteName}
              onChangeText={setNewRouteName}
              placeholder="Enter route name"
              placeholderTextColor={theme.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Description</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={newRouteDescription}
              onChangeText={setNewRouteDescription}
              placeholder="Enter route description"
              placeholderTextColor={theme.textSecondary}
              multiline
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Driver Start Time</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="e.g. 08:00 AM"
              placeholderTextColor={theme.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Driver End Time</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="e.g. 06:00 PM"
              placeholderTextColor={theme.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Fare (₱)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={fare}
              onChangeText={setFare}
              placeholder="Enter fare amount"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Stops</Text>
            <View style={styles.stopsContainer}>
              {stops.map((stop, index) => (
                <View key={index} style={styles.stopItem}>
                  <Text style={[styles.stopNumber, { color: theme.text }]}>{index + 1}. {stop}</Text>
                  <TouchableOpacity onPress={() => removeStop(index)}>
                    <FontAwesome5 name="times-circle" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.addStopContainer}>
                <TextInput
                  style={[styles.addStopInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={newStop}
                  onChangeText={setNewStop}
                  placeholder="Add stop"
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity 
                  style={[styles.addStopButton, { backgroundColor: '#4B6BFE' }]}
                  onPress={addStop}
                >
                  <FontAwesome5 name="plus" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={[styles.inputLabel, { color: theme.text }]}>Vehicle Type</Text>
            <View style={styles.vehicleTypeContainer}>
              {vehicleTypes.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleTypeOption,
                    { 
                      backgroundColor: selectedVehicleType === vehicle.id ? '#4B6BFE' : theme.background,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => setSelectedVehicleType(vehicle.id)}
                >
                  <FontAwesome5
                    name={vehicle.icon} 
                    size={18} 
                    color={selectedVehicleType === vehicle.id ? 'white' : theme.text} 
                  />
                  <Text
                    style={[
                      styles.vehicleTypeText,
                      { color: selectedVehicleType === vehicle.id ? 'white' : theme.text }
                    ]}
                  >
                    {vehicle.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity
            style={[styles.addRouteButton, { backgroundColor: '#4B6BFE', opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleUpdateRoute}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.addRouteButtonText}>Update Route</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Now let's improve the delete confirmation modal for better visibility
  const renderDeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.modalContent, { 
          backgroundColor: theme.card, 
          borderColor: theme.border,
          padding: 20,
          width: '90%',
          maxWidth: 400,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5
        }]}>
          <View style={styles.modalHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <FontAwesome5 name="exclamation-triangle" size={20} color="#FF9800" style={{marginRight: 10}} />
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: 20 }]}>Delete Route</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowDeleteModal(false)}
              style={{padding: 5}}
            >
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={{ marginVertical: 20, alignItems: 'center' }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <FontAwesome5 name="trash" size={24} color="#F44336" />
            </View>
            <Text style={[{ color: theme.text, fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 }]}>
              Delete "{routeToDelete?.name}"?
            </Text>
            <Text style={[{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }]}>
              This action cannot be undone and will permanently remove this route.
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <TouchableOpacity 
              style={[{ 
                backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                flex: 1,
                marginRight: 10,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: isDarkMode ? '#444' : '#ddd'
              }]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[{ 
                backgroundColor: '#ff4444',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                flex: 1,
                alignItems: 'center'
              }]}
              onPress={handleDeleteRoute}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Manage Routes</Text>
      </LinearGradient>
      
      <View style={styles.searchContainer}>
          <TextInput
          style={[styles.searchInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            value={searchText}
            onChangeText={setSearchText}
          placeholder="Search routes..."
          placeholderTextColor={theme.textSecondary}
        />
        <View style={styles.filterContainer}>
          <Text style={[styles.filterText, { color: theme.text }]}>Active Only</Text>
          <Switch
            value={showActiveOnly}
            onValueChange={setShowActiveOnly}
            trackColor={{ false: "#767577", true: "#4B6BFE" }}
            thumbColor={showActiveOnly ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>
      
      <View style={styles.content}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B6BFE" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading routes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={50} color="#F44336" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
              style={styles.retryButton}
            onPress={fetchRoutes}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        ) : filteredRoutes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="route" size={50} color={isDarkMode ? '#444' : '#DDD'} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No routes found</Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              {searchText ? 'Try a different search term' : 'Add a new route to get started'}
            </Text>
          </View>
      ) : (
      <FlatList
        data={filteredRoutes}
        renderItem={renderRouteItem}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: '#4B6BFE' }]}
        onPress={() => {
          resetFormFields();
          setShowAddRouteModal(true);
        }}
      >
        <FontAwesome5 name="plus" size={24} color="white" />
      </TouchableOpacity>
      
      {renderAddRouteModal()}
      {renderEditRouteModal()}
      {renderDeleteConfirmationModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  routeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  routeFare: {
    fontSize: 14,
    marginBottom: 12,
  },
  routeStops: {
    marginTop: 8,
    marginBottom: 16,
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  stopBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  stopText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
    maxHeight: 500,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputSubLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  stopItemText: {
    flex: 1,
    fontSize: 16,
  },
  stopNumber: {
    flex: 1,
    fontSize: 16,
  },
  stopsContainer: {
    marginBottom: 16,
  },
  addStopContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addStopInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addStopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  vehicleTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 100,
  },
  vehicleTypeText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  addRouteButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRouteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  routeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  routeType: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  
  editButton: {
    backgroundColor: '#4B6BFE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
}); 