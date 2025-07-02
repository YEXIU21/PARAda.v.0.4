import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth, User } from '../../context/AuthContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { ThemeColors } from '../../types/ThemeTypes';
import FeedbackForm from '../../components/FeedbackForm';
import NotificationBadge from '../../components/ui/NotificationBadge';
import { NotificationList } from '../(tabs)/notifications';

// Define types for modal props
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  theme: ThemeColors;
}

interface EditProfileModalProps extends ModalProps {
  user: User | null;
}

// Modal components for each setting
const EditProfileModal = ({ visible, onClose, user, theme }: EditProfileModalProps) => {
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const { updateProfile } = useAuth();

  const handleSave = async () => {
    try {
      const success = await updateProfile({
        username,
        email
      });
      
      if (success) {
        Alert.alert('Success', 'Profile updated successfully');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating profile');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground || '#333333', 
                color: theme.text, 
                borderColor: theme.border 
              }]}
              value={username}
              onChangeText={setUsername}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground || '#333333', 
                color: theme.text, 
                borderColor: theme.border 
              }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const NotificationsModal = ({ visible, onClose, theme }: ModalProps) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [rideUpdates, setRideUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'list'
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Notifications</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'list' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setActiveTab('list')}
            >
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'list' ? theme.primary : theme.textSecondary }
              ]}>
                Notifications
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'settings' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
              ]}
              onPress={() => setActiveTab('settings')}
            >
              <Text style={[
                styles.tabText, 
                { color: activeTab === 'settings' ? theme.primary : theme.textSecondary }
              ]}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>
          
          {activeTab === 'settings' ? (
            <>
              <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Push Notifications</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Receive notifications on your device</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: "#767577", true: `${theme.primary}33` }}
                  thumbColor={pushEnabled ? theme.primary : "#f4f3f4"}
                />
              </View>
              
              <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Email Notifications</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Receive notifications via email</Text>
                </View>
                <Switch
                  value={emailEnabled}
                  onValueChange={setEmailEnabled}
                  trackColor={{ false: "#767577", true: `${theme.primary}33` }}
                  thumbColor={emailEnabled ? theme.primary : "#f4f3f4"}
                />
              </View>
              
              <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Ride Updates</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Get notified about ride status changes</Text>
                </View>
                <Switch
                  value={rideUpdates}
                  onValueChange={setRideUpdates}
                  trackColor={{ false: "#767577", true: `${theme.primary}33` }}
                  thumbColor={rideUpdates ? theme.primary : "#f4f3f4"}
                />
              </View>
              
              <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Promotions</Text>
                  <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Receive offers and promotional updates</Text>
                </View>
                <Switch
                  value={promotions}
                  onValueChange={setPromotions}
                  trackColor={{ false: "#767577", true: `${theme.primary}33` }}
                  thumbColor={promotions ? theme.primary : "#f4f3f4"}
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={onClose}
              >
                <Text style={styles.saveButtonText}>Save Preferences</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.notificationListContainer}>
              <NotificationList theme={theme} standalone={false} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const ChangePasswordModal = ({ visible, onClose, theme }: ModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { changePassword } = useAuth();
  
  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };
  
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Calling changePassword function...');
      
      // Call the changePassword function from AuthContext
      await changePassword(currentPassword, newPassword);
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Ensure the alert is visible by setting a higher z-index
      // Close modal first to avoid alert being hidden behind modal
      onClose();
      
      // Show success alert with a slight delay to ensure modal is closed
      setTimeout(() => {
        Alert.alert(
          'Success',
          'Password changed successfully',
          [{ text: 'OK' }],
          { 
            cancelable: false,
          }
        );
      }, 300);
    } catch (error: any) {
      console.error('Password change error in component:', error);
      
      // Display error message from API or a generic message
      let errorMessage = 'Failed to change password. Please try again.';
      
      // Check for specific error messages
      if (error.message === 'Current password is incorrect') {
        errorMessage = 'The current password you entered is incorrect. Please try again.';
      } else if (error.message === 'You are not authorized to change this user\'s password') {
        errorMessage = 'You are not authorized to change this password.';
      } else if (error.message?.includes('Validation error')) {
        errorMessage = 'Password validation failed. New password must be at least 6 characters.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Current Password</Text>
            <View style={[styles.passwordInputWrapper, { 
              backgroundColor: theme.inputBackground || '#333333',
              borderColor: theme.border
            }]}>
              <TextInput
                style={[styles.passwordInput, { 
                  color: theme.text
                }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity onPress={toggleCurrentPasswordVisibility} style={styles.eyeIconContainer}>
                <FontAwesome5 
                  name={showCurrentPassword ? "eye" : "eye-slash"} 
                  size={18} 
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>New Password</Text>
            <View style={[styles.passwordInputWrapper, { 
              backgroundColor: theme.inputBackground || '#333333',
              borderColor: theme.border
            }]}>
              <TextInput
                style={[styles.passwordInput, { 
                  color: theme.text
                }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity onPress={toggleNewPasswordVisibility} style={styles.eyeIconContainer}>
                <FontAwesome5 
                  name={showNewPassword ? "eye" : "eye-slash"} 
                  size={18} 
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.passwordHint, { color: theme.textSecondary }]}>
              Password must be at least 6 characters long
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm New Password</Text>
            <View style={[styles.passwordInputWrapper, { 
              backgroundColor: theme.inputBackground || '#333333',
              borderColor: theme.border
            }]}>
              <TextInput
                style={[styles.passwordInput, { 
                  color: theme.text
                }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeIconContainer}>
                <FontAwesome5 
                  name={showConfirmPassword ? "eye" : "eye-slash"} 
                  size={18} 
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.primary, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleChangePassword}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const LanguageModal = ({ visible, onClose, theme }: ModalProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  
  const languages = [
    { id: 'english', name: 'English' },
    { id: 'filipino', name: 'Filipino' },
    { id: 'spanish', name: 'Spanish' },
    { id: 'chinese', name: 'Chinese' }
  ];
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Language</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {languages.map(language => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageOption,
                selectedLanguage === language.id && { backgroundColor: `${theme.primary}15` }
              ]}
              onPress={() => setSelectedLanguage(language.id)}
            >
              <Text style={[
                styles.languageName,
                { color: selectedLanguage === language.id ? theme.primary : theme.text }
              ]}>
                {language.name}
              </Text>
              {selectedLanguage === language.id && (
                <FontAwesome5 name="check" size={16} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.saveButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const FeedbackModal = ({ visible, onClose, theme }: ModalProps) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Feedback</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <FeedbackForm isVisible={visible} onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen() {
  const { user, logout, refreshUserSubscription } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode) as ThemeColors;
  
  // Modal visibility states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isRefreshingSubscription, setIsRefreshingSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasSubscription: boolean;
    isPendingApproval: boolean;
    plan?: string;
    expiryDate?: string;
  }>({
    hasSubscription: false,
    isPendingApproval: false
  });

  // Add a ref to track the last refresh time
  const lastRefreshTime = React.useRef<number>(0);
  // Minimum time between refreshes (5 seconds)
  const MIN_REFRESH_INTERVAL = 5000;

  // Refresh user subscription status when profile page loads
  useEffect(() => {
    // Check if cached subscription data exists first
    const checkCachedSubscription = async () => {
      try {
        const cachedSubscription = await AsyncStorage.getItem('userSubscription');
        if (cachedSubscription) {
          try {
            const parsedSubscription = JSON.parse(cachedSubscription);
            console.log('Using cached subscription data:', parsedSubscription);
            
            // Update UI with cached data first
            if (parsedSubscription.verified || parsedSubscription.isActive) {
              setSubscriptionStatus({
                hasSubscription: true,
                isPendingApproval: false,
                plan: parsedSubscription.plan,
                expiryDate: parsedSubscription.expiryDate
              });
            } else {
              setSubscriptionStatus({
                hasSubscription: false,
                isPendingApproval: true,
                plan: parsedSubscription.plan
              });
            }
            
            // Then refresh in the background only if data is older than 1 hour
            const lastUpdated = await AsyncStorage.getItem('subscriptionLastUpdated');
            if (!lastUpdated || (Date.now() - parseInt(lastUpdated)) > 60 * 60 * 1000) {
              console.log('Cached subscription data is old, refreshing in background');
              refreshSubscriptionData();
            }
          } catch (parseError) {
            console.error('Error parsing cached subscription:', parseError);
            refreshSubscriptionData();
          }
        } else {
          // No cached data, need to fetch
          refreshSubscriptionData();
        }
      } catch (error) {
        console.error('Error checking cached subscription:', error);
        refreshSubscriptionData();
      }
    };
    
    checkCachedSubscription();
  }, []);

  const refreshSubscriptionData = async () => {
    // Implement debouncing - prevent refreshing too frequently
    const now = Date.now();
    if (now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) {
      console.log('Refresh called too soon, debouncing...');
      return;
    }
    
    // Update the last refresh time
    lastRefreshTime.current = now;
    
    try {
      setIsRefreshingSubscription(true);
      console.log('Refreshing user subscription status...');
      
      // Import API functions dynamically to avoid circular dependencies
      const { getUserSubscription } = require('../../services/api/subscription.api');
      
      // Fetch subscription directly from the API
      const subscription = await getUserSubscription();
      console.log('Subscription data from API:', subscription);
      
      // Update the last updated timestamp
      await AsyncStorage.setItem('subscriptionLastUpdated', Date.now().toString());
      
      if (subscription && 
          subscription.paymentDetails && 
          subscription.paymentDetails.referenceNumber) {
        
        // We have a valid subscription with payment details
        if ((subscription.verification && subscription.verification.verified) || 
            subscription.isActive === true) {
          // Subscription is verified or active
          setSubscriptionStatus({
            hasSubscription: true,
            isPendingApproval: false,
            plan: subscription.planId,
            expiryDate: subscription.expiryDate
          });
          
          // Update user context with verified subscription
          await refreshUserSubscription();
        } else {
          // Subscription is pending verification
          setSubscriptionStatus({
            hasSubscription: false,
            isPendingApproval: true,
            plan: subscription.planId
          });
          
          // Update user context with pending subscription
          await refreshUserSubscription();
        }
      } else {
        // No valid subscription found
        setSubscriptionStatus({
          hasSubscription: false,
          isPendingApproval: false
        });
        
        // Update user context to remove any subscription data
        await refreshUserSubscription();
      }
      
      // Check if this is a new user
      const newUserFlag = await AsyncStorage.getItem('isNewUser');
      setIsNewUser(newUserFlag === 'true');
      
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      
      // If API call fails, try to use cached data
      try {
        const cachedSubscription = await AsyncStorage.getItem('userSubscription');
        if (cachedSubscription) {
          const parsedSubscription = JSON.parse(cachedSubscription);
          console.log('API call failed, using cached subscription data:', parsedSubscription);
          
          if (parsedSubscription.verified || parsedSubscription.isActive) {
            setSubscriptionStatus({
              hasSubscription: true,
              isPendingApproval: false,
              plan: parsedSubscription.plan,
              expiryDate: parsedSubscription.expiryDate
            });
          } else {
            setSubscriptionStatus({
              hasSubscription: false,
              isPendingApproval: true,
              plan: parsedSubscription.plan
            });
          }
        } else {
          // No cached data, clear subscription status
          setSubscriptionStatus({
            hasSubscription: false,
            isPendingApproval: false
          });
        }
      } catch (cacheError) {
        console.error('Error using cached subscription data:', cacheError);
        // If all else fails, clear subscription data for safety
        setSubscriptionStatus({
          hasSubscription: false,
          isPendingApproval: false
        });
      }
    } finally {
      setIsRefreshingSubscription(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin':
        return '#4CAF50';
      case 'driver':
        return '#2196F3';
      case 'passenger':
        return '#FF9500';
      default:
        return '#999';
    }
  };

  // Get proper plan name based on plan ID
  const getPlanName = (planId: string) => {
    // First check if it's a MongoDB ID format (like 685db8517f982c2bfaa1d1bd)
    if (planId && planId.length === 24 && /^[0-9a-f]{24}$/i.test(planId)) {
      // Try to get the subscription data from context
      try {
        const subscriptionData = user?.subscription;
        if (subscriptionData) {
          // Check for planName field first (from backend)
          if (subscriptionData.planName) {
            return subscriptionData.planName;
          }
          // Check for displayName field as fallback
          if (subscriptionData.displayName) {
            return subscriptionData.displayName;
          }
        }
      } catch (error) {
        console.error('Error getting subscription data:', error);
      }
    }
    
    // If not found or not a MongoDB ID, use standard plan names
    switch (planId.toLowerCase()) {
      case 'basic':
        return 'Basic Plan';
      case 'premium':
        return 'Premium Plan';
      case 'annual':
        return 'Annual Plan';
      default:
        return planId.charAt(0).toUpperCase() + planId.slice(1);
    }
  };

  // Handle menu item click
  const handleMenuItemClick = (item: string) => {
    switch (item) {
      case 'edit_profile':
        setShowEditProfile(true);
        break;
      case 'notifications':
        setShowNotifications(true);
        break;
      case 'change_password':
        setShowChangePassword(true);
        break;
      case 'language':
        setShowLanguage(true);
        break;
      case 'feedback':
        setShowFeedback(true);
        break;
      case 'messages':
        router.push('/messages');
        break;
      default:
        break;
    }
  };
  
  // Render subscription status component
  const renderSubscriptionStatus = () => {
    // If user is not a passenger, don't render anything
    if (user?.role !== 'passenger') {
      return null;
    }
    
    return (
      <View style={[styles.subscriptionContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.subscriptionHeader}>
          <Text style={[styles.subscriptionTitle, { color: theme.text }]}>Subscription Status</Text>
          {subscriptionStatus.hasSubscription && (
            <View style={styles.verifiedBadge}>
              <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshSubscriptionData}
            disabled={isRefreshingSubscription}
          >
            <FontAwesome5 
              name="sync" 
              size={14} 
              color={theme.primary} 
              style={[
                styles.refreshIcon,
                isRefreshingSubscription && styles.refreshingIcon
              ]} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.subscriptionDetails}>
          {(subscriptionStatus.hasSubscription || subscriptionStatus.isPendingApproval) ? (
            <>
              <View style={styles.subscriptionItem}>
                <Text style={[styles.subscriptionLabel, { color: theme.textSecondary }]}>Plan:</Text>
                <Text style={[styles.subscriptionValue, { color: theme.text }]}>
                  {subscriptionStatus.plan ? 
                    getPlanName(subscriptionStatus.plan)
                    : 'Unknown'
                  }
                </Text>
              </View>
              
              {subscriptionStatus.expiryDate && (
                <View style={styles.subscriptionItem}>
                  <Text style={[styles.subscriptionLabel, { color: theme.textSecondary }]}>Expires:</Text>
                  <Text style={[styles.subscriptionValue, { color: theme.text }]}>
                    {new Date(subscriptionStatus.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              {/* Only show pending verification if we have a pending approval */}
              {subscriptionStatus.isPendingApproval && (
                <View style={styles.pendingContainer}>
                  <FontAwesome5 name="clock" size={14} color="#FF9500" />
                  <Text style={styles.pendingText}>Awaiting Verification</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.noSubscriptionText, { color: theme.textSecondary }]}>
                {isNewUser ? 'Welcome! Select a subscription plan to get started.' : 'No active subscription'}
              </Text>
              
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => router.push('/(tabs)/subscription-plans')}
              >
                <Text style={styles.subscribeButtonText}>View Plans</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors}
        style={styles.header}
      >
        <View style={{ width: '100%', paddingTop: 10 }}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <NotificationBadge theme={theme} size={22} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        <View style={[styles.profileSection, { backgroundColor: theme.card }]}>
          <View style={[styles.avatarContainer, { backgroundColor: isDarkMode ? '#2A2E3A' : '#E8EDFF' }]}>
            <FontAwesome5 name="user" size={40} color="#FF9500" />
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.username || 'passenger'}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user?.email || 'passenger@example.com'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() }]}>
            <Text style={styles.roleText}>{user?.role || 'passenger'}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Settings</Text>
          
          {/* Display subscription status if user has one, is not an admin, and is not a driver */}
          {renderSubscriptionStatus()}
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => handleMenuItemClick('edit_profile')}
          >
            <FontAwesome5 name="user-edit" size={18} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Edit Profile</Text>
            <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => handleMenuItemClick('messages')}
          >
            <FontAwesome5 name="envelope" size={18} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Messages</Text>
            <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => handleMenuItemClick('notifications')}
          >
            <FontAwesome5 name="bell" size={18} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Notifications</Text>
            <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => handleMenuItemClick('change_password')}
          >
            <FontAwesome5 name="lock" size={18} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Change Password</Text>
            <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => handleMenuItemClick('language')}
          >
            <FontAwesome5 name="language" size={18} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Language</Text>
            <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => handleMenuItemClick('feedback')}
          >
            <FontAwesome5 name="comment-alt" size={18} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text }]}>Feedback</Text>
            <FontAwesome5 name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <FontAwesome5 
              name={isDarkMode ? "moon" : "sun"} 
              size={18} 
              color={theme.textSecondary} 
              style={styles.menuIcon} 
            />
            <Text style={[styles.menuText, { color: theme.text }]}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#767577", true: `${theme.primary}33` }}
              thumbColor={isDarkMode ? theme.primary : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <FontAwesome5 name="sign-out-alt" size={18} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Modals */}
      <EditProfileModal 
        visible={showEditProfile} 
        onClose={() => setShowEditProfile(false)} 
        user={user}
        theme={theme}
      />
      
      <NotificationsModal 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)}
        theme={theme}
      />
      
      <ChangePasswordModal 
        visible={showChangePassword} 
        onClose={() => setShowChangePassword(false)}
        theme={theme}
      />
      
      <LanguageModal 
        visible={showLanguage} 
        onClose={() => setShowLanguage(false)}
        theme={theme}
      />
      
      <FeedbackModal 
        visible={showFeedback} 
        onClose={() => setShowFeedback(false)}
        theme={theme}
      />
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
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 0,
    paddingHorizontal: 24,
  },
  notificationButton: {
    position: 'absolute',
    right: 20,
    top: 5,
    padding: 8,
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: 15,
    width: 20,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 25,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutIcon: {
    marginRight: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  languageName: {
    fontSize: 16,
  },
  subscriptionContainer: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
    width: '100%',
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 5,
    marginLeft: 'auto',
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  subscriptionDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  subscriptionValue: {
    fontSize: 14,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  pendingText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  noSubscriptionText: {
    fontSize: 14,
    marginBottom: 15,
  },
  subscribeButton: {
    backgroundColor: '#4B6BFE',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  refreshButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  refreshIcon: {
    opacity: 0.7,
  },
  refreshingIcon: {
    opacity: 1,
    transform: [{ rotate: '45deg' }],
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  notificationListContainer: {
    flex: 1,
    minHeight: 300,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIconContainer: {
    padding: 10,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  eyeIcon: {
    padding: 10,
  },
  passwordHint: {
    marginTop: 5,
    fontSize: 12,
    marginLeft: 5,
  },
}); 