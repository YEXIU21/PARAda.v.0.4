import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { router } from 'expo-router';
import { getDashboardData, getReportsData, getStudentDiscountSettings, updateStudentDiscountSettings } from '../../services/api/admin.api';
import { getSubscriptionPlans } from '../../services/api/subscription.api';
import { updateSubscriptionPlan, createSubscriptionPlan, deleteSubscriptionPlan } from '../../services/api/admin.api';

// Define interfaces for API data
interface DashboardData {
  counts: {
    users: number;
    drivers: number;
    activeDrivers: number;
    routes: number;
    activeRoutes: number;
    pendingRides: number;
    activeRides: number;
    completedRides: number;
    activeSubscriptions: number;
    pendingSubscriptions: number;
  };
  recentActivity: {
    rides: any[];
    subscriptions: any[];
  };
  subscriptionStats?: {
    basic: number;
    premium: number;
    annual: number;
  };
}

interface RecentActivityItem {
  id: string;
  action: string;
  details: string;
  time: string;
  icon: string;
}

// Mock data for admin dashboard
const systemStats = [
  { id: '1', title: 'Active Drivers', value: 24, icon: 'bus', color: '#4CAF50' },
  { id: '2', title: 'Active Routes', value: 18, icon: 'route', color: '#2196F3' },
  { id: '3', title: 'Total Passengers', value: 1250, icon: 'users', color: '#FF9500' },
  { id: '4', title: 'Issues Reported', value: 3, icon: 'exclamation-circle', color: '#FF3B30' },
];

// Mock data for recent activity
const recentActivity = [
  { id: '1', action: 'Driver Login', details: 'John Doe (B12)', time: '10 min ago', icon: 'sign-in-alt' },
  { id: '2', action: 'Route Started', details: 'Route R45 - University to Mall', time: '25 min ago', icon: 'play-circle' },
  { id: '3', action: 'New Passenger', details: 'Sarah registered as new user', time: '1 hour ago', icon: 'user-plus' },
  { id: '4', action: 'Issue Reported', details: 'Delay on Route G23', time: '2 hours ago', icon: 'exclamation-triangle' },
  { id: '5', action: 'Route Completed', details: 'Route B12 completed trip', time: '3 hours ago', icon: 'check-circle' },
];

type AdminFunction = {
  id: string;
  title: string;
  icon: string;
  color: string;
  screen?: string;
};

interface Subscription {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
  recommended?: boolean;
  discountPercent?: number;
}

// Default subscription plans - can be overridden by admin
const defaultSubscriptionPlans: Subscription[] = [
  { 
    id: 'basic', 
    name: 'Basic', 
    price: '₱99/month', 
    duration: 'Monthly',
    features: ['Real-time tracking', 'Schedule access', 'Traffic updates']
  },
  { 
    id: 'premium', 
    name: 'Premium', 
    price: '₱199/month', 
    duration: 'Monthly',
    features: ['All Basic features', 'Priority notifications', 'Offline maps', 'No advertisements'],
    recommended: true
  },
  { 
    id: 'annual', 
    name: 'Annual', 
    price: '₱999/year', 
    duration: 'Yearly (Save 16%)',
    features: ['All Premium features', '24/7 support', 'Schedule alarms', 'Trip history']
  }
];

const adminFunctions: AdminFunction[] = [
  { id: 'drivers', title: 'Manage Drivers', icon: 'id-card', color: '#4B6BFE', screen: 'manage-drivers' },
  { id: 'routes', title: 'Manage Routes', icon: 'route', color: '#34A853', screen: 'manage-routes' },
  { id: 'users', title: 'User Management', icon: 'users', color: '#FF9500', screen: 'user-management' },
  { id: 'subscriptions', title: 'Subscription Plans', icon: 'tags', color: '#8E44AD', screen: 'admin-subscribers' },
  { id: 'settings', title: 'System Settings', icon: 'cogs', color: '#FF3B30', screen: 'system-settings' },
  { id: 'reports', title: 'Reports', icon: 'chart-bar', color: '#5856D6', screen: 'reports' },
  { id: 'notifications', title: 'Notifications', icon: 'bell', color: '#FF9500', screen: 'notifications' },
  { id: 'map', title: 'View Map', icon: 'map-marked-alt', color: '#5AC8FA', screen: 'index' },
];

// Ensure images are available
const paymentImages = {
  gcash: require('../../assets/images/gcash.jpg'),
  logo: require('../../assets/images/PARAda-Logo.png'),
  instapay: require('../../assets/images/gcash.jpg') // Using gcash.jpg as a placeholder for the InstaPay QR code
};

export default function AdminScreen() {
  const { isDarkMode, colors } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Subscription[]>(defaultSubscriptionPlans);
  const [studentDiscountPercent, setStudentDiscountPercent] = useState(20);
  const [isStudentDiscountEnabled, setIsStudentDiscountEnabled] = useState(true);
  const [showSystemOverview, setShowSystemOverview] = useState(true);
  const [isSubscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemStats, setSystemStats] = useState<Array<{id: string, title: string, value: number, icon: string, color: string}>>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  
  // New state variables for subscription plan management
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    id: '',
    name: '',
    price: '',
    duration: '',
    features: [] as string[],
    recommended: false
  });
  const [newFeature, setNewFeature] = useState('');
  const [isPlanLoading, setIsPlanLoading] = useState(false);

  // Load saved subscription plans and student discount settings on component mount
  useEffect(() => {
    const loadSubscriptionData = async () => {
      try {
        // Try to fetch plans from API first
        try {
          const apiPlans = await getSubscriptionPlans();
          if (apiPlans && apiPlans.length > 0) {
            setSubscriptionPlans(apiPlans);
            console.log('Loaded subscription plans from API:', apiPlans);
          }
        } catch (apiError) {
          console.warn('Failed to load plans from API, falling back to local storage:', apiError);
          
          // Fall back to local storage if API fails
          const savedPlans = await AsyncStorage.getItem('subscriptionPlans');
          if (savedPlans) {
            setSubscriptionPlans(JSON.parse(savedPlans));
          }
        }

        // Try to fetch student discount settings from API
        try {
          const discountSettings = await getStudentDiscountSettings();
          if (discountSettings) {
            setIsStudentDiscountEnabled(discountSettings.isEnabled);
            setStudentDiscountPercent(discountSettings.discountPercent);
            console.log('Loaded student discount settings from API:', discountSettings);
          }
        } catch (apiError) {
          console.warn('Failed to load student discount settings from API, falling back to local storage:', apiError);
          
          // Fall back to local storage if API fails
          const savedDiscount = await AsyncStorage.getItem('studentDiscountPercent');
          if (savedDiscount) {
            setStudentDiscountPercent(parseInt(savedDiscount, 10));
          }

          const discountEnabled = await AsyncStorage.getItem('isStudentDiscountEnabled');
          if (discountEnabled !== null) {
            setIsStudentDiscountEnabled(discountEnabled === 'true');
          }
        }
      } catch (error) {
        console.error('Error loading subscription data:', error);
      }
    };

    loadSubscriptionData();
  }, []);

  // Save subscription plans and student discount settings
  const saveSubscriptionPlans = async () => {
    try {
      // Save plans to local storage as backup
      await AsyncStorage.setItem('subscriptionPlans', JSON.stringify(subscriptionPlans));
      
      // Save student discount settings to API
      try {
        await updateStudentDiscountSettings({
          isEnabled: isStudentDiscountEnabled,
          discountPercent: studentDiscountPercent
        });
        console.log('Saved student discount settings to API');
      } catch (apiError) {
        console.warn('Failed to save student discount settings to API:', apiError);
        
        // Fall back to local storage if API fails
        await AsyncStorage.setItem('studentDiscountPercent', studentDiscountPercent.toString());
        await AsyncStorage.setItem('isStudentDiscountEnabled', isStudentDiscountEnabled.toString());
      }
      
      setShowSubscriptionModal(false);
      Alert.alert('Success', 'Subscription settings updated successfully!');
    } catch (error) {
      console.error('Error saving subscription settings:', error);
      Alert.alert('Error', 'Failed to update subscription settings. Please try again.');
    }
  };
  
  // New functions for subscription plan management
  const handleCreatePlan = () => {
    setIsCreatingPlan(true);
    setPlanFormData({
      id: '',
      name: '',
      price: '',
      duration: '',
      features: [],
      recommended: false
    });
    setPlanModalVisible(true);
  };

  const handleEditPlan = (plan: Subscription) => {
    setIsCreatingPlan(false);
    setPlanFormData({
      id: plan.id,
      name: plan.name,
      price: typeof plan.price === 'string' ? plan.price : `${plan.price}`,
      duration: plan.duration,
      features: [...plan.features],
      recommended: !!plan.recommended
    });
    setPlanModalVisible(true);
  };

  const handleDeletePlan = (planId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this subscription plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsPlanLoading(true);
              
              // Try to delete from API first
              try {
                await deleteSubscriptionPlan(planId);
              } catch (apiError) {
                console.warn('Failed to delete plan from API:', apiError);
              }
              
              // Update local state
              const updatedPlans = subscriptionPlans.filter(plan => plan.id !== planId);
              setSubscriptionPlans(updatedPlans);
              
              // Save to local storage
              await AsyncStorage.setItem('subscriptionPlans', JSON.stringify(updatedPlans));
              
              Alert.alert('Success', 'Subscription plan deleted successfully');
            } catch (error) {
              console.error('Error deleting subscription plan:', error);
              Alert.alert('Error', 'Failed to delete subscription plan');
            } finally {
              setIsPlanLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddFeature = () => {
    if (newFeature.trim() === '') return;
    setPlanFormData({
      ...planFormData,
      features: [...planFormData.features, newFeature.trim()]
    });
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...planFormData.features];
    updatedFeatures.splice(index, 1);
    setPlanFormData({
      ...planFormData,
      features: updatedFeatures
    });
  };

  const handleSavePlan = async () => {
    try {
      // Validate form data
      if (!planFormData.id || !planFormData.name || !planFormData.price || !planFormData.duration) {
        Alert.alert('Validation Error', 'Please fill in all required fields');
        return;
      }

      setIsPlanLoading(true);
      
      // Format the plan data
      const planData = {
        id: planFormData.id,
        name: planFormData.name,
        price: planFormData.price,
        duration: planFormData.duration,
        features: planFormData.features,
        recommended: planFormData.recommended
      };
      
      // Try to save to API first
      try {
        if (isCreatingPlan) {
          await createSubscriptionPlan(planData);
        } else {
          await updateSubscriptionPlan(planFormData.id, planData);
        }
      } catch (apiError) {
        console.warn('Failed to save plan to API:', apiError);
      }
      
      // Update local state
      if (isCreatingPlan) {
        setSubscriptionPlans([...subscriptionPlans, planData]);
      } else {
        const updatedPlans = subscriptionPlans.map(plan => 
          plan.id === planData.id ? planData : plan
        );
        setSubscriptionPlans(updatedPlans);
      }
      
      // Save to local storage
      await AsyncStorage.setItem('subscriptionPlans', JSON.stringify(
        isCreatingPlan ? [...subscriptionPlans, planData] : subscriptionPlans.map(plan => 
          plan.id === planData.id ? planData : plan
        )
      ));
      
      Alert.alert('Success', `Subscription plan ${isCreatingPlan ? 'created' : 'updated'} successfully`);
      setPlanModalVisible(false);
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      Alert.alert('Error', 'Failed to save subscription plan');
    } finally {
      setIsPlanLoading(false);
    }
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch dashboard data from API
        const data = await getDashboardData();
        
        // Debug log to check what's coming from the API
        console.log('Dashboard data from API:', data);
        console.log('Recent rides:', data.recentActivity?.rides);
        console.log('Recent subscriptions:', data.recentActivity?.subscriptions);
        
        setDashboardData(data);
        
        // Transform counts into system stats format
        if (data && data.counts) {
          setSystemStats([
            { id: '1', title: 'Active Drivers', value: data.counts.activeDrivers, icon: 'bus', color: '#4CAF50' },
            { id: '2', title: 'Active Routes', value: data.counts.activeRoutes, icon: 'route', color: '#2196F3' },
            { id: '3', title: 'Total Passengers', value: data.counts.users, icon: 'users', color: '#FF9500' },
            { id: '4', title: 'Issues Reported', value: data.counts.pendingRides, icon: 'exclamation-circle', color: '#FF3B30' },
          ]);
          
          // Transform recent activity data
          const transformedActivity: RecentActivityItem[] = [];
          
          // Add recent rides to activity
          if (data.recentActivity && data.recentActivity.rides) {
            data.recentActivity.rides.forEach((ride, index) => {
              let actionText = 'Ride Request';
              let iconName = 'taxi';
              
              switch (ride.status) {
                case 'completed':
                  actionText = 'Ride Completed';
                  iconName = 'check-circle';
                  break;
                case 'assigned':
                  actionText = 'Ride Assigned';
                  iconName = 'user-check';
                  break;
                case 'cancelled':
                  actionText = 'Ride Cancelled';
                  iconName = 'times-circle';
                  break;
                case 'waiting':
                  actionText = 'Ride Request';
                  iconName = 'clock';
                  break;
                default:
                  actionText = 'Ride Activity';
                  iconName = 'taxi';
              }
              
              // Debug log for each ride
              console.log(`Ride ${index} user data:`, ride.userId);
              
              // Extract username safely with fallbacks
              let username = 'User';
              if (ride.userId) {
                if (typeof ride.userId === 'object') {
                  username = ride.userId.username || 'User';
                } else {
                  username = `User #${ride.userId}`;
                }
              }
              
              // Extract route name safely with fallbacks
              let routeName = 'Unknown Route';
              if (ride.routeId) {
                if (typeof ride.routeId === 'object') {
                  routeName = ride.routeId.name || ride.routeId.routeNumber || 'Unknown Route';
                } else {
                  routeName = `Route #${ride.routeId}`;
                }
              }
              
              const timeAgo = getTimeAgo(new Date(ride.requestTime || ride.createdAt));
              
              transformedActivity.push({
                id: `ride-${ride._id || index}`,
                action: actionText,
                details: `${username} - ${routeName}`,
                time: timeAgo,
                icon: iconName
              });
            });
          }
          
          // Add recent subscriptions to activity
          if (data.recentActivity && data.recentActivity.subscriptions) {
            data.recentActivity.subscriptions.forEach((sub, index) => {
              // Debug log for each subscription
              console.log(`Subscription ${index} user data:`, sub.userId);
              
              // Extract username safely with fallbacks
              let username = 'User';
              if (sub.userId) {
                if (typeof sub.userId === 'object') {
                  username = sub.userId.username || 'User';
                } else {
                  username = `User #${sub.userId}`;
                }
              }
              
              // Extract plan ID safely with fallbacks
              const planId = sub.planId || 'Basic';
              
              const timeAgo = getTimeAgo(new Date(sub.createdAt));
              
              transformedActivity.push({
                id: `sub-${sub._id || index}`,
                action: 'New Subscription',
                details: `${username} - ${planId} Plan`,
                time: timeAgo,
                icon: 'tag'
              });
            });
          }
          
          // Log the transformed activity
          console.log('Transformed activity:', transformedActivity);
          
          // Sort by time (assuming most recent first)
          transformedActivity.sort((a, b) => {
            const timeA = parseTimeAgo(a.time);
            const timeB = parseTimeAgo(b.time);
            return timeA - timeB;
          });
          
          setRecentActivity(transformedActivity.slice(0, 5)); // Take only the 5 most recent
        }
        
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        setIsLoading(false);
        console.error('Error loading dashboard data:', err);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Helper function to convert timestamp to "time ago" format
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };
  
  // Helper function to parse time ago string back to minutes for sorting
  const parseTimeAgo = (timeAgo: string): number => {
    if (timeAgo === 'Just now') return 0;
    
    const match = timeAgo.match(/(\d+)\s+(min|hour|day)/);
    if (!match) return 999999; // Default to a large number if format doesn't match
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'min': return value;
      case 'hour': return value * 60;
      case 'day': return value * 60 * 24;
      default: return 999999;
    }
  };

  const handleFunctionPress = (id) => {
    console.log(`Function pressed: ${id}`);
    
    // Handle specific function actions
    if (id === 'subscriptions') {
      // Navigate to the admin-subscribers page instead of showing a modal
      router.push('/admin-subscribers');
      return;
    }
    
    // Navigate to the appropriate screen if defined
    const selectedFunction = adminFunctions.find(f => f.id === id);
    if (selectedFunction && selectedFunction.screen) {
      router.push(`/${selectedFunction.screen}`);
    }
  };

  // Updated subscription modal with enhanced plan management
  const renderSubscriptionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSubscriptionModal}
      onRequestClose={() => setShowSubscriptionModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.modalContent, { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          maxHeight: '90%',
        }]}>
          <LinearGradient
            colors={colors.gradientColors}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Manage Subscription Plans</Text>
            <TouchableOpacity 
              onPress={() => setShowSubscriptionModal(false)}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView 
            style={[styles.modalBody, { backgroundColor: colors.background }]}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View style={[styles.studentDiscountContainer, { 
              backgroundColor: isDarkMode ? colors.card : '#f8f8f8',
              borderColor: colors.border,
            }]}>
              <Text style={[styles.discountTitle, { color: colors.text }]}>Student Discount</Text>
              <View style={styles.discountRow}>
                <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Enable Student Discount</Text>
                <Switch
                  value={isStudentDiscountEnabled}
                  onValueChange={setIsStudentDiscountEnabled}
                  trackColor={{ false: "#767577", true: "#4B6BFE" }}
                  thumbColor={isStudentDiscountEnabled ? "#fff" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
              
              {isStudentDiscountEnabled && (
                <View style={styles.discountPercentContainer}>
                  <Text style={[styles.discountPercentLabel, { color: colors.textSecondary }]}>
                    Discount Percentage: {studentDiscountPercent}%
                  </Text>
                  <View style={styles.discountInput}>
                    <TextInput
                      style={[styles.percentInput, { 
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.inputBackground || (isDarkMode ? '#272727' : '#FFFFFF')
                      }]}
                      keyboardType="number-pad"
                      value={studentDiscountPercent.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text);
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          setStudentDiscountPercent(value);
                        }
                      }}
                      maxLength={3}
                    />
                    <Text style={[styles.percentSymbol, { color: colors.text }]}>%</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.plansSectionHeader}>
              <Text style={[styles.plansSectionTitle, { color: colors.text }]}>Available Plans</Text>
              <TouchableOpacity
                style={[styles.createPlanButton, { backgroundColor: colors.primary }]}
                onPress={handleCreatePlan}
              >
                <FontAwesome5 name="plus" size={14} color="#FFF" style={styles.createPlanIcon} />
                <Text style={styles.createPlanText}>Create Plan</Text>
              </TouchableOpacity>
            </View>
            
            {subscriptionPlans.map((plan, index) => (
              <View key={plan.id} style={[styles.planItem, { 
                borderBottomColor: colors.border,
                backgroundColor: colors.card,
                shadowColor: colors.cardShadow,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 15,
                marginBottom: 15,
              }]}>
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  <Text style={[styles.planDuration, { color: colors.textSecondary }]}>{plan.duration}</Text>
                </View>
                
                <View style={styles.planRow}>
                  <Text style={[styles.planLabel, { color: colors.textSecondary }]}>Price:</Text>
                  <Text style={[styles.planPrice, { color: colors.primary }]}>
                    {typeof plan.price === 'string' ? plan.price : `₱${plan.price}`}
                  </Text>
                </View>
                
                <Text style={[styles.featuresTitle, { color: colors.text, marginTop: 10 }]}>Features:</Text>
                {plan.features.map((feature, fIndex) => (
                  <View key={fIndex} style={styles.featureRow}>
                    <FontAwesome5 name="check-circle" size={14} color="#4CAF50" style={styles.featureIcon} />
                    <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                  </View>
                ))}
                
                <View style={styles.recommendedSection}>
                  <Text style={[styles.recommendedLabel, { color: colors.textSecondary }]}>Recommended Plan</Text>
                  <Switch
                    value={!!plan.recommended}
                    onValueChange={(value) => {
                      const updatedPlans = subscriptionPlans.map(p => ({ 
                        ...p, 
                        recommended: p.id === plan.id ? value : false 
                      }));
                      setSubscriptionPlans(updatedPlans);
                    }}
                    trackColor={{ false: "#767577", true: "#4B6BFE" }}
                    thumbColor={!!plan.recommended ? "#fff" : "#f4f3f4"}
                  />
                </View>
                
                <View style={styles.planActions}>
                  <TouchableOpacity
                    style={[styles.editPlanButton, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleEditPlan(plan)}
                  >
                    <FontAwesome5 name="edit" size={14} color={colors.primary} />
                    <Text style={[styles.editPlanText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deletePlanButton, { backgroundColor: colors.error + '20' }]}
                    onPress={() => handleDeletePlan(plan.id)}
                  >
                    <FontAwesome5 name="trash-alt" size={14} color={colors.error} />
                    <Text style={[styles.deletePlanText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: '#4B6BFE' }]}
              onPress={saveSubscriptionPlans}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  
  // Plan edit/create modal
  const renderPlanModal = () => (
    <Modal
      visible={planModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setPlanModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.planModalContent, { backgroundColor: colors.card }]}>
          <View style={styles.planModalHeader}>
            <Text style={[styles.planModalTitle, { color: colors.text }]}>
              {isCreatingPlan ? 'Create Subscription Plan' : 'Edit Subscription Plan'}
            </Text>
            <TouchableOpacity onPress={() => setPlanModalVisible(false)}>
              <FontAwesome5 name="times" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.planFormContainer}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Plan ID</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground || colors.background }]}
                value={planFormData.id}
                onChangeText={(text) => setPlanFormData({ ...planFormData, id: text.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g. basic, premium, annual"
                placeholderTextColor={colors.textSecondary}
                editable={isCreatingPlan} // Only editable when creating a new plan
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Plan Name</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground || colors.background }]}
                value={planFormData.name}
                onChangeText={(text) => setPlanFormData({ ...planFormData, name: text })}
                placeholder="e.g. Basic, Premium, Annual"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Price</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground || colors.background }]}
                value={planFormData.price.toString()}
                onChangeText={(text) => setPlanFormData({ ...planFormData, price: text })}
                placeholder="e.g. ₱99/month, ₱999/year"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Duration</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground || colors.background }]}
                value={planFormData.duration.toString()}
                onChangeText={(text) => setPlanFormData({ ...planFormData, duration: text })}
                placeholder="e.g. Monthly, Yearly"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Recommended</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { backgroundColor: planFormData.recommended ? colors.primary : colors.background, borderColor: colors.border }
                ]}
                onPress={() => setPlanFormData({ ...planFormData, recommended: !planFormData.recommended })}
              >
                <Text style={[styles.toggleButtonText, { color: planFormData.recommended ? '#FFF' : colors.textSecondary }]}>
                  {planFormData.recommended ? 'YES' : 'NO'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Features</Text>
              <View style={styles.featuresEditor}>
                {planFormData.features.map((feature, index) => (
                  <View key={index} style={[styles.featureItemEditor, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.featureTextEditor, { color: colors.text }]}>{feature}</Text>
                    <TouchableOpacity onPress={() => handleRemoveFeature(index)}>
                      <FontAwesome5 name="times" size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.addFeatureContainer}>
                <TextInput
                  style={[
                    styles.featureInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground || colors.background }
                  ]}
                  value={newFeature}
                  onChangeText={setNewFeature}
                  placeholder="Add a feature"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={[styles.addFeatureButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddFeature}
                >
                  <FontAwesome5 name="plus" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setPlanModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSavePlan}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          {isPlanLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading dashboard data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={50} color="#FF3B30" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.replace('/admin')}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.gradientColors}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/PARAda-Logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Real-Time Transportation Tracking</Text>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
        {showSystemOverview && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>System Overview</Text>
            <View style={styles.statsContainer}>
              {systemStats.map((stat) => (
                <View key={stat.id} style={[styles.statCard, { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow
                }]}>
                  <View style={[styles.iconCircle, { backgroundColor: `${stat.color}20` }]}>
                    <FontAwesome5 name={stat.icon} size={24} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                  <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{stat.title}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.functionsContainer}>
          {adminFunctions.map((func) => (
            <TouchableOpacity
              key={func.id}
              style={[styles.functionCard, { 
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.cardShadow,
                width: '48%',
                marginBottom: 15,
              }]}
              onPress={() => handleFunctionPress(func.id)}
            >
              <View style={[styles.functionIconCircle, { backgroundColor: `${func.color}20` }]}>
                <FontAwesome5 name={func.icon} size={24} color={func.color} />
              </View>
              <Text style={[styles.functionTitle, { color: colors.text }]}>{func.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
          <View key={activity.id} style={[styles.activityItem, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.cardShadow
          }]}>
            <View style={[styles.activityIconContainer, { backgroundColor: '#FF950015' }]}>
              <FontAwesome5 name={activity.icon} size={16} color="#FF9500" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityAction, { color: colors.text }]}>{activity.action}</Text>
              <Text style={[styles.activityDetails, { color: colors.textSecondary }]}>{activity.details}</Text>
            </View>
            <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.time}</Text>
          </View>
          ))
        ) : (
          <View style={[styles.emptyActivity, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent activity</Text>
          </View>
        )}
      </ScrollView>

      {renderSubscriptionModal()}
      {renderPlanModal()}
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
    color: '#fff',
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  functionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  functionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  functionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  functionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 12,
    opacity: 0.7,
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.5,
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  planItem: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDuration: {
    fontSize: 14,
    opacity: 0.7,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 14,
    width: '25%',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 5,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
  },
  recommendedSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  recommendedLabel: {
    fontSize: 14,
  },
  studentDiscountContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  discountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  discountLabel: {
    fontSize: 16,
  },
  discountPercentContainer: {
    marginTop: 15,
  },
  discountPercentLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  discountInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentInput: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    width: 80,
    fontSize: 16,
    textAlign: 'center',
  },
  percentSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4B6BFE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyActivity: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
  },
  plansSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 20,
    paddingHorizontal: 5,
  },
  plansSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  createPlanIcon: {
    marginRight: 8,
  },
  createPlanText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  planModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  planModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planFormContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formInput: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  toggleButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuresEditor: {
    marginBottom: 15,
    gap: 8,
  },
  featureItemEditor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  featureTextEditor: {
    flex: 1,
    fontSize: 14,
  },
  addFeatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  featureInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
  },
  addFeatureButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  editPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  editPlanText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deletePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  deletePlanText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
}); 