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
import { getDashboardData, getReportsData } from '../../services/api/admin.api';

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
  logo: require('../../assets/images/PARAdalogo.jpg'),
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

  // Load saved subscription plans on component mount
  useEffect(() => {
    const loadSubscriptionPlans = async () => {
      try {
        const savedPlans = await AsyncStorage.getItem('subscriptionPlans');
        if (savedPlans) {
          setSubscriptionPlans(JSON.parse(savedPlans));
        }

        const savedDiscount = await AsyncStorage.getItem('studentDiscountPercent');
        if (savedDiscount) {
          setStudentDiscountPercent(parseInt(savedDiscount, 10));
        }

        const discountEnabled = await AsyncStorage.getItem('isStudentDiscountEnabled');
        if (discountEnabled !== null) {
          setIsStudentDiscountEnabled(discountEnabled === 'true');
        }
      } catch (error) {
        console.error('Error loading subscription plans:', error);
      }
    };

    loadSubscriptionPlans();
  }, []);

  // Save subscription plans
  const saveSubscriptionPlans = async () => {
    try {
      await AsyncStorage.setItem('subscriptionPlans', JSON.stringify(subscriptionPlans));
      await AsyncStorage.setItem('studentDiscountPercent', studentDiscountPercent.toString());
      await AsyncStorage.setItem('isStudentDiscountEnabled', isStudentDiscountEnabled.toString());
      
      setShowSubscriptionModal(false);
      Alert.alert('Success', 'Subscription plans updated successfully!');
    } catch (error) {
      console.error('Error saving subscription plans:', error);
      Alert.alert('Error', 'Failed to update subscription plans. Please try again.');
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
    // Handle function press based on ID
    if (id === 'subscriptions') {
      setShowSubscriptionModal(true);
    } else if (id === 'notifications') {
      // Navigate to notifications screen
      router.push('/(tabs)/notifications');
    } else if (id === 'map') {
      // Navigate to map screen
      router.push('/(tabs)/map');
    } else if (id === 'users') {
      // Navigate to user management screen
      router.push('/(tabs)/user-management');
    } else if (id === 'drivers') {
      // Navigate to driver management screen
      router.push('/(tabs)/manage-drivers');
    } else if (id === 'routes') {
      // Navigate to route management screen
      router.push('/(tabs)/manage-routes');
    } else if (id === 'settings') {
      // Navigate to system settings screen
      router.push('/(tabs)/system-settings');
    } else if (id === 'reports') {
      // Navigate to reports screen
      router.push('/(tabs)/reports');
    }
  };

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
          maxHeight: '80%',
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

            <Text style={[styles.plansSectionTitle, { color: colors.text }]}>Available Plans</Text>
            
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
                  <TextInput
                    style={[styles.planInput, { 
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBackground
                    }]}
                    value={plan.price}
                    onChangeText={(text) => {
                      const updatedPlans = [...subscriptionPlans];
                      updatedPlans[index].price = text;
                      setSubscriptionPlans(updatedPlans);
                    }}
                  />
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
              source={require('../../assets/images/adaptive-icon.png')} 
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 13,
    color: '#666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 16,
  },
  planItem: {
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDuration: {
    fontSize: 14,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 16,
    width: '25%',
  },
  planInput: {
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    width: '70%',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recommendedSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  recommendedLabel: {
    fontSize: 16,
  },
  studentDiscountContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
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
  },
  discountLabel: {
    fontSize: 16,
  },
  discountPercentContainer: {
    marginTop: 15,
  },
  discountPercentLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  discountInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentInput: {
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    width: 70,
  },
  percentSymbol: {
    fontSize: 18,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  plansSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
}); 