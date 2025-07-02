import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, FlatList, Alert, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AdminStatistics from './AdminStatistics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import PaymentApprovalModal from './PaymentApprovalModal';

const { width, height } = Dimensions.get('window');

interface AdminDashboardProps {
  isDarkMode: boolean;
  theme: {
    card: string;
    text: string;
    textSecondary: string;
  };
  onOpenSubscriptions: () => void;
  onNavigateToAdmin: () => void;
  onToggleMapView: () => void;
  showAdminDashboard: boolean;
}

interface SubscribedUser {
  type: string;
  plan: string;
  expiryDate: string;
  referenceNumber: string;
  paymentDate: string;
  username: string;
  busCompany: string;
  verified: boolean;
}

export default function AdminDashboard({
  isDarkMode,
  theme,
  onOpenSubscriptions,
  onNavigateToAdmin,
  onToggleMapView,
  showAdminDashboard
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'subscribers' | 'map'>('stats');
  const [subscribedUsers, setSubscribedUsers] = useState<SubscribedUser[]>([]);
  const [showPaymentApprovalModal, setShowPaymentApprovalModal] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  
  // Load subscribed users from AsyncStorage
  useEffect(() => {
    const loadSubscribedUsers = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const userSubKeys = keys.filter(key => key === 'userSubscription' || key.startsWith('payment_'));
        
        if (userSubKeys.length > 0) {
          const userSubValues = await AsyncStorage.multiGet(userSubKeys);
          const subscribers: SubscribedUser[] = [];
          
          userSubValues.forEach(([key, value]) => {
            if (value) {
              try {
                const data = JSON.parse(value);
                if (data.referenceNumber) {
                  subscribers.push({
                    type: data.type || 'Unknown',
                    plan: data.plan || 'Unknown',
                    expiryDate: data.expiryDate || 'Unknown',
                    referenceNumber: data.referenceNumber || 'Unknown',
                    paymentDate: data.paymentDate || 'Unknown',
                    username: data.username || 'Unknown',
                    busCompany: data.busCompany || 'Unknown',
                    verified: data.verified || false
                  });
                }
              } catch (e) {
                console.error('Error parsing subscription data:', e);
              }
            }
          });
          
          setSubscribedUsers(subscribers);
        }
      } catch (error) {
        console.error('Error loading subscribed users:', error);
      }
    };
    
    if (activeTab === 'subscribers') {
      loadSubscribedUsers();
    }
  }, [activeTab]);
  
  // Handle map view toggling
  useEffect(() => {
    if (!showAdminDashboard) {
      setActiveTab('map');
    }
  }, [showAdminDashboard]);

  // Navigation functions
  const navigateToScreen = (screen: string) => {
    router.push(screen);
  };

  const handleVerifySubscription = (referenceNumber: string) => {
    const updatedUsers = subscribedUsers.map(user => 
      user.referenceNumber === referenceNumber 
        ? { ...user, verified: true } 
        : user
    );
    setSubscribedUsers(updatedUsers);
    Alert.alert('Success', 'Subscription has been verified');
  };

  // Render the toggle button component separately to avoid conditional hook calls
  const renderMapToggleButton = () => {
    return (
      <TouchableOpacity 
        style={[
          styles.mapToggleButton,
          { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)' }
        ]}
        onPress={() => {
          onToggleMapView();
          setActiveTab('stats'); // Reset to statistics tab when returning to admin dashboard
        }}
      >
        <FontAwesome5 name="chart-bar" size={20} color="#4B6BFE" />
        <Text style={[styles.mapToggleText, { color: theme.text }]}>Show Statistics</Text>
      </TouchableOpacity>
    );
  };

  // Render the admin dashboard content separately
  const renderAdminDashboard = () => {
    return (
      <SafeAreaView 
        style={[
          styles.safeAreaContainer,
          { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
        ]}
      >
        <View style={styles.overlay}>
          {activeTab === 'dashboard' ? (
            <View style={[styles.content, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="tools" size={60} color="#4B6BFE" />
              <Text style={[styles.title, { color: theme.text }]}>Admin Dashboard</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Welcome to the Administration Panel
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#4B6BFE' }]}
                  onPress={onOpenSubscriptions}
                >
                  <FontAwesome5 name="tags" size={20} color="white" style={{ marginBottom: 10 }} />
                  <Text style={styles.actionText}>Manage Subscriptions</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#34A853' }]}
                  onPress={() => navigateToScreen('manage-drivers')}
                >
                  <FontAwesome5 name="id-card" size={20} color="white" style={{ marginBottom: 10 }} />
                  <Text style={styles.actionText}>Manage Drivers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
                  onPress={() => setShowPaymentApprovalModal(true)}
                >
                  <FontAwesome5 name="money-check-alt" size={20} color="white" style={{ marginBottom: 10 }} />
                  <Text style={styles.actionText}>Payment Approvals</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                  onPress={() => navigateToScreen('user-management')}
                >
                  <FontAwesome5 name="users" size={20} color="white" style={{ marginBottom: 10 }} />
                  <Text style={styles.actionText}>User Management</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#5856D6' }]}
                  onPress={() => navigateToScreen('reports')}
                >
                  <FontAwesome5 name="chart-pie" size={20} color="white" style={{ marginBottom: 10 }} />
                  <Text style={styles.actionText}>Reports & Analytics</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
                  onPress={() => navigateToScreen('notifications')}
                >
                  <FontAwesome5 name="bell" size={20} color="white" style={{ marginBottom: 10 }} />
                  <Text style={styles.actionText}>Notifications</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#5AC8FA' }]}
                  onPress={onToggleMapView}
                >
                  <FontAwesome5 name="map-marked-alt" size={20} color="white" style={{ marginBottom: 10 }} />
                  <Text style={styles.actionText}>View Map</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#8E8E93' }]}
                  onPress={() => navigateToScreen('system-settings')}
                >
                  <FontAwesome5 name="cog" size={20} color="white" style={{ marginBottom: 10 }} />
                  <Text style={styles.actionText}>System Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : activeTab === 'map' ? (
            <View style={[styles.content, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="map-marked-alt" size={60} color="#4B6BFE" />
              <Text style={[styles.title, { color: theme.text }]}>Map View</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                View the map display
              </Text>
              
              <TouchableOpacity 
                style={[styles.showMapButton, { backgroundColor: '#FF3B30' }]}
                onPress={onToggleMapView}
              >
                <FontAwesome5 name="map" size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.showMapText}>Switch to Map View</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <AdminStatistics isDarkMode={isDarkMode} theme={theme} />
          )}
          
          <View style={[
            styles.tabBarContainer, 
            { backgroundColor: isDarkMode ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
          ]}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBar}
              snapToAlignment="center"
              decelerationRate="fast"
              pagingEnabled={false}
              alwaysBounceHorizontal={true}
              directionalLockEnabled={true}
              scrollEventThrottle={16}
              overScrollMode="never"
            >
              <TouchableOpacity
                style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
                onPress={() => setActiveTab('stats')}
              >
                <FontAwesome5
                  name="chart-line"
                  size={18}
                  color={activeTab === 'stats' ? '#4B6BFE' : isDarkMode ? '#888' : '#666'}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'stats' ? '#4B6BFE' : isDarkMode ? '#888' : '#666' }
                  ]}
                >
                  Statistics
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab]}
                onPress={() => {
                  router.push('/(tabs)/subscribers-management');
                }}
              >
                <FontAwesome5
                  name="users"
                  size={18}
                  color={isDarkMode ? '#888' : '#666'}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: isDarkMode ? '#888' : '#666' }
                  ]}
                >
                  Subscribers
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'map' && styles.mapTab]}
                onPress={() => {
                  setActiveTab('map');
                  if (activeTab === 'map') {
                    onToggleMapView();
                  }
                }}
              >
                <FontAwesome5
                  name="map"
                  size={18}
                  color={activeTab === 'map' ? '#FF3B30' : isDarkMode ? '#888' : '#666'}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'map' ? '#FF3B30' : isDarkMode ? '#888' : '#666' }
                  ]}
                >
                  Map View
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  // Main render - avoid conditional returns at the component level
  return (
    <>
      {!showAdminDashboard ? renderMapToggleButton() : renderAdminDashboard()}
      {showPaymentApprovalModal && (
        <PaymentApprovalModal
          isVisible={showPaymentApprovalModal}
          onClose={() => setShowPaymentApprovalModal(false)}
          theme={{
            background: theme.card,
            card: theme.card,
            text: theme.text,
            textSecondary: theme.textSecondary,
            border: '#ccc',
            primary: '#4B6BFE',
            gradientColors: ['#4B6BFE', '#3451E1'],
            error: '#FF3B30',
            success: '#4CAF50',
            warning: '#FF9500'
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50, // Additional padding to avoid status bar
  },
  content: {
    width: '85%',
    padding: 25,
    paddingTop: 35,
    paddingBottom: 40,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 90, // Add more space for the tab bar
    marginTop: 60, // Additional space from top
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '30%', // Adjusted to fit 3 in a row
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: height * 0.05, // Position higher from the bottom navigation
    left: width * 0.025, // 2.5% margin from sides
    right: width * 0.025,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    minWidth: width * 0.9, // Ensure there's enough width for scrolling
    paddingVertical: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    minWidth: 110,
    height: 44,
  },
  activeTab: {
    backgroundColor: 'rgba(75, 107, 254, 0.1)',
  },
  mapTab: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  tabText: {
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  mapToggleButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 5,
  },
  mapToggleText: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
  userItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  userItemText: {
    fontSize: 16,
  },
  subscribersHeader: {
    marginBottom: 20,
  },
  subscribersList: {
    padding: 10,
    paddingBottom: 60,
  },
  subscriberCard: {
    padding: 15,
    paddingBottom: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subscriberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  planBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subscriberInfoContainer: {
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 10,
    borderRadius: 8,
  },
  subscriberInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  refNumber: {
    fontSize: 14,
  },
  busCompany: {
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 10,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 10,
  },
  verifyText: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4CAF50',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  cancelText: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FF3B30',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
  },
  showMapButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMapText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 