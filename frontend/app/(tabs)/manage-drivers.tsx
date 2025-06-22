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
  Image,
  Switch,
  Modal,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '@/context/ThemeContext';
import { getDrivers, sendMessageToDriver, verifyDriver, removeDriver } from '@/services/api/admin.api';
import { formatDistanceToNow } from 'date-fns';

// Define driver interface
interface Driver {
  _id: string;
  status: 'active' | 'offline' | 'inactive';
  lastActive: string;
  rating: number;
  verified: boolean;
  vehicleType: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
  };
  routeId?: {
    _id: string;
    name: string;
    routeNumber?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  vehicleDetails?: {
  licensePlate: string;
    model: string;
    color: string;
  };
  contact?: string;
}

export default function ManageDriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [driverToRemove, setDriverToRemove] = useState<string | null>(null);
  const [deleteUserAccount, setDeleteUserAccount] = useState(false);
  const [disableReason, setDisableReason] = useState<string>('Account disabled by administrator');

  // Fetch drivers data on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getDrivers();
      if (response && response.drivers) {
        // Filter out incomplete driver records
        const validDrivers = response.drivers.filter(driver => 
          driver.userId && 
          driver.userId.username && 
          driver.vehicleDetails && 
          driver.vehicleDetails.licensePlate
        );
        setDrivers(validDrivers);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format the last active time
  const formatLastActive = (lastActiveDate: string): string => {
    if (!lastActiveDate) return 'Not active yet';
    try {
      const date = new Date(lastActiveDate);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Not active yet';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      return 'Not active yet';
    }
  };

  // Filter drivers based on search text and verified filter
  const filteredDrivers = drivers.filter(driver => {
    const driverName = driver.userId?.username || '';
    const routeNumber = driver.routeId?.routeNumber || '';
    
    const matchesSearch = 
      driverName.toLowerCase().includes(searchText.toLowerCase()) ||
      routeNumber.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesVerified = showVerifiedOnly ? driver.verified : true;
    return matchesSearch && matchesVerified;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'offline':
        return '#9E9E9E';
      case 'inactive':
        return '#FF3B30';
      default:
        return '#9E9E9E';
    }
  };

  const handleRemoveDriver = async (driverId: string): Promise<void> => {
    try {
      console.log('Removing driver:', driverId);
      console.log('Delete user account:', deleteUserAccount);
      console.log('Disable reason:', disableReason);
      
      setIsLoading(true);
      
      // Call the API to remove the driver with the selected options
      await removeDriver(driverId, deleteUserAccount, disableReason);
      
      // Update local state after successful removal
      setDrivers(drivers.filter(driver => driver._id !== driverId));
      
      Alert.alert('Success', deleteUserAccount ? 
        'Driver and user account have been completely removed' : 
        'Driver has been removed and user account has been disabled');
    } catch (error) {
      console.error('Error removing driver:', error);
      Alert.alert('Error', 'Failed to remove driver. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDriver = async (driverId: string): Promise<void> => {
    try {
      // Show loading indicator or disable button here if needed
      
      // Call the API to verify the driver
      await verifyDriver(driverId);
      
      // Update local state after successful verification
    setDrivers(drivers.map(driver => 
        driver._id === driverId ? { ...driver, verified: true } : driver
    ));
      
      Alert.alert('Success', 'Driver has been verified successfully');
    } catch (error) {
      console.error('Error verifying driver:', error);
      Alert.alert('Error', 'Failed to verify driver. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDriver || !messageText.trim()) return;
    
    setIsSendingMessage(true);
    setSendingState('sending');
    
    // Store message text in case we need to restore it on error
    const messageToSend = messageText;
    
    // Clear the input field immediately for better UX
    setMessageText('');
    
    try {
      // Send message using the admin API
      await sendMessageToDriver(
        selectedDriver._id,
        "Message from Admin",
        messageToSend
      );
      
      // Show success state briefly before alert
      setSendingState('success');
      
      // Short delay to show success state
      setTimeout(() => {
      // Show success message
    Alert.alert(
      'Message Sent',
        `Your message has been sent to ${selectedDriver.userId?.username}.`,
      [{ text: 'OK', onPress: () => {
        setShowMessageModal(false);
            setSendingState('idle');
      }}]
    );
      }, 1000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Show error state
      setSendingState('error');
      
      // Restore message text so user doesn't lose their input
      setMessageText(messageToSend);
      
      // Get more specific error message if available
      let errorMessage = 'There was an error sending your message. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      // Show error message
      Alert.alert(
        'Message Failed',
        errorMessage,
        [{ text: 'OK', onPress: () => setSendingState('idle') }]
      );
    } finally {
      setIsSendingMessage(false);
    }
  };

  const renderMessageModal = () => (
    <Modal
      visible={showMessageModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (!isSendingMessage) setShowMessageModal(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.simpleModalContainer, { backgroundColor: theme.card }]}>
          <View style={styles.simpleModalHeader}>
            <Text style={[styles.simpleModalTitle, { color: theme.text }]}>
              Message to {selectedDriver?.userId?.username}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowMessageModal(false)}
              style={styles.simpleCloseButton}
              disabled={isSendingMessage}
            >
              <Text style={{fontSize: 18, fontWeight: 'bold', color: theme.text}}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[
            styles.busIconContainer, 
            sendingState === 'success' && styles.successIconContainer,
            sendingState === 'error' && styles.errorIconContainer
          ]}>
            {sendingState === 'success' ? (
              <FontAwesome5 name="check-circle" size={24} color="#4CAF50" />
            ) : sendingState === 'error' ? (
              <FontAwesome5 name="exclamation-circle" size={24} color="#F44336" />
            ) : (
            <FontAwesome5 name="bus" size={24} color="#4CAF50" />
            )}
          </View>
          
          <TextInput
            style={[styles.simpleMessageInput, { 
              borderColor: theme.border,
              backgroundColor: theme.inputBackground,
              color: theme.text
            }]}
            placeholder="Type your message here..."
            placeholderTextColor={theme.textSecondary}
            multiline={true}
            numberOfLines={5}
            value={messageText}
            onChangeText={setMessageText}
            editable={!isSendingMessage}
          />
          
          <View style={styles.messageButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.sendButton,
                isSendingMessage && styles.disabledButton,
                sendingState === 'success' && styles.successButton,
                sendingState === 'error' && styles.errorButton
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || isSendingMessage}
            >
              {sendingState === 'sending' ? (
                <View style={styles.sendingContainer}>
                <ActivityIndicator size="small" color="white" />
                  <Text style={styles.sendingText}>Sending...</Text>
                </View>
              ) : sendingState === 'success' ? (
                <View style={styles.sendingContainer}>
                  <FontAwesome5 name="check" size={16} color="white" style={styles.sendIcon} />
                  <Text style={styles.sendButtonText}>Sent!</Text>
                </View>
              ) : sendingState === 'error' ? (
                <View style={styles.sendingContainer}>
                  <FontAwesome5 name="exclamation-triangle" size={16} color="white" style={styles.sendIcon} />
                  <Text style={styles.sendButtonText}>Try Again</Text>
                </View>
              ) : (
                <View style={styles.sendingContainer}>
                  <FontAwesome5 name="paper-plane" size={16} color="white" style={styles.sendIcon} />
              <Text style={styles.sendButtonText}>Send</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Driver Details
            </Text>
            <TouchableOpacity 
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButton}
            >
              <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalBody}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalBodyContent}
          >
            {selectedDriver && (
              <>
                <View style={styles.detailsHeader}>
                  <View style={[styles.largeAvatarContainer, { backgroundColor: `${getStatusColor(selectedDriver.status)}30` }]}>
                    {selectedDriver.userId?.profilePicture ? (
                      <Image source={{ uri: selectedDriver.userId.profilePicture }} style={styles.largeAvatar} />
                    ) : (
                      <FontAwesome5 
                        name={selectedDriver.vehicleType === 'bus' ? 'bus' : 'shuttle-van'} 
                        size={40} 
                        color={getStatusColor(selectedDriver.status)} 
                      />
                    )}
                  </View>
                  
                  <Text style={[styles.detailsName, { color: theme.text }]}>
                    {selectedDriver.userId?.username || 'Unknown Driver'}
                  </Text>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedDriver.status) }]}>
                    <Text style={styles.statusText}>
                      {selectedDriver.status.charAt(0).toUpperCase() + selectedDriver.status.slice(1)}
                    </Text>
                  </View>
                  
                  {selectedDriver.verified && (
                    <View style={styles.verifiedContainer}>
                      <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                      <Text style={[styles.verifiedText, { color: '#4CAF50' }]}>Verified Driver</Text>
                    </View>
                  )}
                </View>
                
                <View style={[styles.detailsSection, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="phone" size={16} color={theme.textSecondary} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      {selectedDriver.contact || 'No contact info available'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="envelope" size={16} color={theme.textSecondary} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      {selectedDriver.userId?.email || 'No email available'}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.detailsSection, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Route Information</Text>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="route" size={16} color={theme.textSecondary} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      {selectedDriver.routeId?.name ? 
                        `Route ${selectedDriver.routeId?.routeNumber || ''} - ${selectedDriver.routeId?.name}` : 
                        'No route assigned'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name={selectedDriver.vehicleType === 'bus' ? 'bus' : 'shuttle-van'} size={16} color={theme.textSecondary} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      {selectedDriver.vehicleType ? 
                        selectedDriver.vehicleType.charAt(0).toUpperCase() + selectedDriver.vehicleType.slice(1) : 
                        'Unknown vehicle type'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="id-card" size={16} color={theme.textSecondary} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      License Plate: {selectedDriver.vehicleDetails?.licensePlate || 'Not provided'}
                    </Text>
                  </View>
                  {selectedDriver.vehicleDetails?.model && (
                    <View style={styles.detailRow}>
                      <FontAwesome5 name="car" size={16} color={theme.textSecondary} style={styles.detailIcon} />
                      <Text style={[styles.detailText, { color: theme.text }]}>
                        {selectedDriver.vehicleDetails.model} 
                        {selectedDriver.vehicleDetails.color ? ` (${selectedDriver.vehicleDetails.color})` : ''}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={[styles.detailsSection, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance</Text>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="star" size={16} color="#FFD700" style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      {selectedDriver.rating ? `${selectedDriver.rating} / 5.0 Rating` : 'Not yet rated'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="clock" size={16} color={theme.textSecondary} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.text }]}>
                      Last active: {selectedDriver.lastActive ? formatLastActive(selectedDriver.lastActive) : 'Unknown'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#4B6BFE20' }]}
                  onPress={() => {
                    setShowDetailsModal(false);
                    setSelectedDriver(selectedDriver);
                    setShowMessageModal(true);
                  }}
                >
                  <FontAwesome5 name="comment" size={16} color="#4B6BFE" />
                  <Text style={[styles.actionText, { color: '#4B6BFE' }]}>Send Message</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientColors}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Manage Drivers</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B6BFE" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading drivers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={theme.gradientColors}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Manage Drivers</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={50} color="#FF3B30" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchDrivers}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderDriverItem = ({ item }: { item: Driver }) => (
    <TouchableOpacity 
      style={[styles.driverCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => {
        setSelectedDriver(item);
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.driverHeader}>
        <View style={styles.driverAvatarContainer}>
          {item.userId?.profilePicture ? (
            <Image source={{ uri: item.userId.profilePicture }} style={styles.driverAvatar} />
          ) : (
            <View style={[styles.driverAvatarPlaceholder, { backgroundColor: `${getStatusColor(item.status)}30` }]}>
              <FontAwesome5 
                name={item.vehicleType === 'bus' ? 'bus' : 'shuttle-van'} 
                size={20} 
                color={getStatusColor(item.status)} 
              />
            </View>
          )}
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
        </View>
        
        <View style={styles.driverInfo}>
          <Text style={[styles.driverName, { color: theme.text }]}>{item.userId?.username || 'Unknown'}</Text>
          <View style={styles.driverMeta}>
            {item.routeId && (
            <View style={styles.routeTag}>
                <Text style={styles.routeText}>{item.routeId.routeNumber || item.routeId.name}</Text>
            </View>
            )}
            <View style={styles.ratingContainer}>
              <FontAwesome5 name="star" size={12} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.textSecondary }]}>{item.rating || 'N/A'}</Text>
            </View>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <FontAwesome5 name="check-circle" size={12} color="#4CAF50" />
                <Text style={[styles.verifiedText, { color: theme.textSecondary }]}>Verified</Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={[styles.lastActive, { color: theme.textSecondary }]}>{formatLastActive(item.lastActive)}</Text>
      </View>
      
      <View style={styles.driverContact}>
        <FontAwesome5 name="id-card" size={14} color={theme.textSecondary} />
        <Text style={[styles.contactText, { color: theme.text }]}>
          Plate: {item.vehicleDetails?.licensePlate || 'Unknown'}
        </Text>
      </View>
      
      <View style={styles.driverActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => {
            setSelectedDriver(item);
            setShowMessageModal(true);
          }}
        >
          <FontAwesome5 name="envelope" size={16} color="#4B6BFE" />
          <Text style={[styles.actionText, { color: '#4B6BFE' }]}>Message</Text>
        </TouchableOpacity>
        
        {!item.verified && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.verifyButton]}
            onPress={() => handleVerifyDriver(item._id)}
          >
            <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
            <Text style={[styles.actionText, { color: '#4CAF50' }]}>Verify</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => {
            console.log('Remove button pressed for driver:', item._id);
            setDriverToRemove(item._id);
            setShowConfirmModal(true);
          }}
        >
          <FontAwesome5 name="trash" size={16} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Manage Drivers</Text>
      </LinearGradient>
      
      <View style={styles.filtersContainer}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <FontAwesome5 name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search drivers or routes..."
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
        
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                "Driver Verification",
                "Verified drivers have had their identity and vehicle details confirmed. " +
                "To verify a driver, check their license plate number, vehicle details, and contact information. " +
                "Only verified drivers should be assigned to routes.",
                [{ text: "OK" }]
              );
            }}
          >
            <FontAwesome5 name="info-circle" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
      </View>
      
      <View style={styles.filterOptionsContainer}>
        <View style={styles.filterOption}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Verified Only</Text>
          <Switch
            value={showVerifiedOnly}
            onValueChange={setShowVerifiedOnly}
            trackColor={{ false: "#767577", true: "#4B6BFE" }}
            thumbColor={showVerifiedOnly ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>
      
      <FlatList
        data={filteredDrivers}
        renderItem={renderDriverItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="user-slash" size={50} color={isDarkMode ? '#444' : '#DDD'} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No drivers found</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {searchText ? 'Try a different search term' : 'Add new drivers to get started'}
            </Text>
          </View>
        )}
      />

      {/* Render the message modal */}
      {renderMessageModal()}

      {/* Render the details modal */}
      {renderDetailsModal()}

      {/* Render the confirmation modal */}
      {showConfirmModal && (
        <Modal
          visible={showConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmModalContainer, { 
              backgroundColor: theme.card, 
              borderColor: theme.border,
            }]}>
              <View style={styles.modalHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <FontAwesome5 name="exclamation-triangle" size={20} color="#FF9800" style={{marginRight: 10}} />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Remove Driver
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowConfirmModal(false)}
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
                  Remove this driver?
                </Text>
                <Text style={[{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }]}>
                  This action cannot be undone. Please select how you want to handle the user account:
                </Text>
              </View>
              
              <View style={{ marginVertical: 10, padding: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                  <Switch
                    value={deleteUserAccount}
                    onValueChange={setDeleteUserAccount}
                    trackColor={{ false: "#767577", true: "#F44336" }}
                    thumbColor={deleteUserAccount ? "#fff" : "#f4f3f4"}
                  />
                  <Text style={[{ marginLeft: 10, color: theme.text, fontWeight: deleteUserAccount ? 'bold' : 'normal' }]}>
                    {deleteUserAccount ? 'Delete user account completely' : 'Disable user account (can be re-enabled later)'}
                  </Text>
                </View>
                
                {!deleteUserAccount && (
                  <View style={{ marginBottom: 15 }}>
                    <Text style={[{ color: theme.text, marginBottom: 5 }]}>Reason for disabling:</Text>
                    <TextInput
                      style={[{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 5,
                        padding: 10,
                        color: theme.text,
                        backgroundColor: theme.inputBackground
                      }]}
                      value={disableReason}
                      onChangeText={setDisableReason}
                      placeholder="Enter reason for disabling account"
                      placeholderTextColor={theme.textSecondary}
                      multiline
                    />
                  </View>
                )}
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
                  onPress={() => setShowConfirmModal(false)}
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
                  onPress={() => {
                    if (driverToRemove) {
                      handleRemoveDriver(driverToRemove);
                    }
                    setShowConfirmModal(false);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>
                      {deleteUserAccount ? 'Delete Completely' : 'Disable Account'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filtersContainer: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  filterOptionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  infoButton: {
    padding: 8,
    marginLeft: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  driverCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  driverAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  statusIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  routeText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  lastActive: {
    fontSize: 12,
  },
  driverContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginHorizontal: 20,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4B6BFE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 15,
    paddingBottom: 25,
  },
  driverPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  driverPreviewInfo: {
    flex: 1,
  },
  messageInput: {
    minHeight: 120,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailsHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  largeAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    width: 24,
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
  },
  simpleModalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  simpleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  simpleModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  simpleCloseButton: {
    padding: 5,
  },
  busIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 15,
    borderRadius: 50,
    marginBottom: 20,
  },
  errorIconContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 15,
    borderRadius: 50,
    marginBottom: 20,
  },
  simpleMessageInput: {
    minHeight: 120,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  messageButtonsContainer: {
    alignItems: 'center',
  },
  sendButton: {
    padding: 12,
    backgroundColor: '#4B6BFE',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageButton: {
    backgroundColor: '#E6EFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: '#FFE6E6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#4B6BFE',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: '#E6EFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  driverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    paddingTop: 12,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  sendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendIcon: {
    marginRight: 8,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  errorButton: {
    backgroundColor: '#F44336',
  },
  confirmModalContainer: {
    width: '80%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  confirmButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 