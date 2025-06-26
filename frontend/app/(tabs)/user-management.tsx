import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  Image,
  Switch,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { getUsers, sendMessageToPassenger } from '../../services/api/admin.api';
import { sendDirectMessage } from '../../services/api/chat.api';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASE_URL } from '../../services/api/endpoints';
import { getAuthToken } from '../../services/api/auth.api';

// Define UserRole type
type UserRole = 'admin' | 'driver' | 'passenger';

// Define User interface
interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  accountType: 'regular' | 'student';
  isEmailVerified: boolean;
  profilePicture?: string;
  studentId?: string;
}

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  
  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      
      const options: any = {
        limit: 50 // Get a reasonable number of users
      };
      
      if (userRoleFilter !== 'all') {
        options.role = userRoleFilter;
      }
      
      const result = await getUsers(options);
      
      if (result && result.users) {
        setUsers(result.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [userRoleFilter]);
  
  // Fetch users when component mounts or when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Refresh users when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );
  
  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    fetchUsers();
  };
  
  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesVerified = showVerifiedOnly ? user.isEmailVerified : true;
    
    return matchesSearch && matchesVerified;
  });
  
  const handleDeleteUser = (userId: string) => {
    // Find the user to delete
    const userToDelete = users.find(user => user._id === userId);
    if (userToDelete) {
      setSelectedUser(userToDelete);
      setShowDeleteModal(true);
    }
  };
  
  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = await getAuthToken();
      const response = await axios.delete(`${BASE_URL}/api/users/${selectedUser._id}`, {
        headers: {
          'x-access-token': token
        }
      });
      
      if (response.status === 200) {
        setUsers(users.filter(user => user._id !== selectedUser._id));
        setShowDeleteModal(false);
        setSelectedUser(null);
        Alert.alert('Success', 'User has been deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      Alert.alert('Error', 'Failed to delete user. Please try again.');
    }
  };
  
  const handleVerifyUser = (userId: string) => {
    // TODO: Implement API call to verify user
    // For now, just update the local state
    setUsers(users.map(user => 
      user._id === userId ? { ...user, isEmailVerified: true } : user
    ));
    Alert.alert('Success', 'User has been verified');
  };
  
  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      const token = await getAuthToken();
      const response = await axios.put(`${BASE_URL}/api/users/${userId}/role`, { role: newRole }, {
        headers: {
          'x-access-token': token
        }
      });
      
      if (response.status === 200) {
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ));
        setShowRoleModal(false);
        setSelectedUser(null);
        Alert.alert('Success', `User role has been changed to ${newRole}`);
      }
    } catch (err) {
      console.error('Error changing user role:', err);
      Alert.alert('Error', 'Failed to change user role. Please try again.');
    }
  };
  
  const handleSendMessage = async () => {
    if (!selectedUser || !messageText.trim()) return;
    
    setIsSendingMessage(true);
    setSendingState('sending');
    
    // Store message text in case we need to restore it on error
    const messageToSend = messageText;
    
    // Clear the input field immediately for better UX
    setMessageText('');
    
    try {
      // First try the direct message API
      try {
        // Send message using the chat API
        await sendDirectMessage(
          selectedUser._id,
          messageToSend,
          {
            fromAdmin: true,
            type: 'info',
            category: 'message'
          }
        );
        
        console.log('Message sent successfully via direct message API');
      } catch (directMessageError) {
        console.error('Error with direct message API, falling back to admin API:', directMessageError);
        
        // Fall back to the admin API
      await sendMessageToPassenger(
        selectedUser._id,
        "Message from Admin",
          messageToSend
      );
      
        console.log('Message sent successfully via admin API fallback');
      }
      
      // Show success state briefly before alert
      setSendingState('success');
      
      // Short delay to show success state
      setTimeout(() => {
      // Show success message
      Alert.alert(
        'Message Sent',
        `Your message has been sent to ${selectedUser.username}.`,
        [{ text: 'OK', onPress: () => {
          setShowMessageModal(false);
            setSendingState('idle');
        }}]
      );
      }, 1000);
    } catch (error) {
      console.error('All message sending methods failed:', error);
      
      // Show error state
      setSendingState('error');
      
      // Restore message text so user doesn't lose their input
      setMessageText(messageToSend);
      
      // Get more specific error message if available
      let errorMessage = 'There was an error sending your message. Please try again.';
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 
          'data' in error.response && error.response.data && 
          typeof error.response.data === 'object' && 'message' in error.response.data) {
        errorMessage = error.response.data.message as string;
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
  
  const getRoleBadgeColor = (role: UserRole) => {
    switch(role) {
      case 'admin':
        return '#FF3B30';
      case 'driver':
        return '#34A853';
      case 'passenger':
        return '#4B6BFE';
      default:
        return '#999';
    }
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Loading users...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="exclamation-circle" size={40} color={theme.error} />
          <Text style={[styles.emptyText, { color: theme.text }]}>Something went wrong</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchUsers}
          >
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="users-slash" size={40} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.text }]}>No users found</Text>
        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          {userRoleFilter !== 'all' 
            ? `No ${userRoleFilter}s match your search criteria` 
            : "No users match your search criteria"}
        </Text>
      </View>
    );
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
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Message to {selectedUser?.username}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowMessageModal(false)}
              style={styles.closeButton}
              disabled={isSendingMessage}
            >
              <FontAwesome5 name="times" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={[
            styles.userIconContainer, 
            sendingState === 'success' && styles.successIconContainer,
            sendingState === 'error' && styles.errorIconContainer
          ]}>
            {sendingState === 'success' ? (
              <FontAwesome5 name="check-circle" size={24} color="#4CAF50" />
            ) : sendingState === 'error' ? (
              <FontAwesome5 name="exclamation-circle" size={24} color="#F44336" />
            ) : (
            <FontAwesome5 name="user" size={24} color="#4B6BFE" />
            )}
          </View>
          
          <TextInput
            style={[styles.messageInput, { color: theme.text, borderColor: theme.border }]}
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
  
  const renderUserItem = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatarContainer}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatarPlaceholder, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
              <Text style={[styles.avatarInitial, { color: isDarkMode ? '#ddd' : '#555' }]}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.isEmailVerified && (
            <View style={styles.verifiedBadge}>
              <FontAwesome5 name="check-circle" size={12} color="#4CAF50" />
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{item.username}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{item.email}</Text>
          
          <View style={styles.userMetaContainer}>
            <View style={[styles.roleBadge, { backgroundColor: `${getRoleBadgeColor(item.role)}15`, flexDirection: 'row', alignItems: 'center' }]}>
              <FontAwesome5 
                name={
                  item.role === 'admin' ? 'crown' : 
                  item.role === 'driver' ? 'car' : 'user'
                } 
                size={12} 
                color={getRoleBadgeColor(item.role)} 
              />
              <Text style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
                {item.role?.charAt(0).toUpperCase() + item.role?.slice(1)}
              </Text>
            </View>
            
            {item.accountType === 'student' && (
              <View style={styles.accountTypeBadge}>
                <FontAwesome5 name="graduation-cap" size={12} color="#9C27B0" />
                <Text style={styles.accountTypeText}>Student</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={[styles.actionBar, { borderTopColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>
            {!item.isEmailVerified ? (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleVerifyUser(item._id)}
              >
                <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                <Text style={[styles.actionText, { color: '#4CAF50' }]}>Verify</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionButton} />
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedUser(item);
                setShowRoleModal(true);
              }}
            >
              <FontAwesome5 name="user-tag" size={16} color="#FF9500" />
              <Text style={[styles.actionText, { color: '#FF9500' }]}>Change Role</Text>
            </TouchableOpacity>
            
            {item.role === 'passenger' && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setSelectedUser(item);
                  setShowMessageModal(true);
                }}
              >
                <FontAwesome5 name="envelope" size={16} color="#4B6BFE" />
                <Text style={[styles.actionText, { color: '#4B6BFE' }]}>Message</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteUser(item._id)}
            >
              <FontAwesome5 name="trash" size={16} color="#FF3B30" />
              <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
  
  // Render delete confirmation modal
  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent={true}
      animationType="fade"
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
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: 20 }]}>Delete User</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowDeleteModal(false)}
              style={{padding: 5}}
            >
              <FontAwesome5 name="times" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {selectedUser && (
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
                Delete "{selectedUser.username}"?
              </Text>
              
              <View style={styles.userInfoContainer}>
                <Text style={[styles.userEmail, { color: theme.textSecondary, textAlign: 'center' }]}>{selectedUser.email}</Text>
                <View style={[styles.roleBadge, { 
                  backgroundColor: getRoleBadgeColor(selectedUser.role), 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  alignSelf: 'center',
                  marginTop: 8
                }]}>
                  <FontAwesome5 
                    name={
                      selectedUser.role === 'admin' ? 'crown' : 
                      selectedUser.role === 'driver' ? 'car' : 'user'
                    } 
                    size={12} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.roleBadgeText}>{selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}</Text>
                </View>
              </View>
              
              <Text style={[{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 16 }]}>
                This action cannot be undone. All user data will be permanently deleted.
              </Text>
            </View>
          )}
          
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
              onPress={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
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
              onPress={confirmDeleteUser}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors || [theme.primary, theme.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>User Management</Text>
      </LinearGradient>
      
      <View style={styles.filtersContainer}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <FontAwesome5 name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users..."
            placeholderTextColor={theme.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
      </View>
      
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              userRoleFilter === 'all' && { backgroundColor: '#4B6BFE' }
            ]}
            onPress={() => setUserRoleFilter('all')}
          >
            <Text style={[
              styles.filterText, 
              userRoleFilter === 'all' && { color: 'white' }
            ]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              userRoleFilter === 'admin' && { backgroundColor: '#FF3B30' }
            ]}
            onPress={() => setUserRoleFilter('admin')}
          >
            <FontAwesome5 
              name="crown" 
              size={12} 
              color={userRoleFilter === 'admin' ? 'white' : '#FF3B30'} 
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText, 
              userRoleFilter === 'admin' && { color: 'white' }
            ]}>Admins</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              userRoleFilter === 'driver' && { backgroundColor: '#34A853' }
            ]}
            onPress={() => setUserRoleFilter('driver')}
          >
            <FontAwesome5 
              name="car" 
              size={12} 
              color={userRoleFilter === 'driver' ? 'white' : '#34A853'} 
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText, 
              userRoleFilter === 'driver' && { color: 'white' }
            ]}>Drivers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              userRoleFilter === 'passenger' && { backgroundColor: '#4B6BFE' }
            ]}
            onPress={() => setUserRoleFilter('passenger')}
          >
            <FontAwesome5 
              name="user" 
              size={12} 
              color={userRoleFilter === 'passenger' ? 'white' : '#4B6BFE'} 
              style={styles.filterIcon}
            />
            <Text style={[
              styles.filterText, 
              userRoleFilter === 'passenger' && { color: 'white' }
            ]}>Passengers</Text>
          </TouchableOpacity>
          
          <View style={styles.verifiedFilterContainer}>
            <Text style={[styles.verifiedFilterText, { color: theme.text }]}>Verified Only</Text>
            <Switch
              value={showVerifiedOnly}
              onValueChange={setShowVerifiedOnly}
              trackColor={{ false: "#767577", true: "#4CAF50" }}
              thumbColor={showVerifiedOnly ? "#fff" : "#f4f3f4"}
            />
          </View>
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      />
      
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change User Role</Text>
            
            <View style={styles.roleOptions}>
            <TouchableOpacity 
                style={[styles.roleOption, { backgroundColor: '#FF3B3015' }]}
                onPress={() => handleChangeRole(selectedUser?._id || '', 'admin')}
            >
                <FontAwesome5 name="crown" size={24} color="#FF3B30" />
                <Text style={[styles.roleOptionText, { color: theme.text }]}>Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.roleOption, { backgroundColor: '#34A85315' }]}
                onPress={() => handleChangeRole(selectedUser?._id || '', 'driver')}
            >
                <FontAwesome5 name="car" size={24} color="#34A853" />
              <Text style={[styles.roleOptionText, { color: theme.text }]}>Driver</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.roleOption, { backgroundColor: '#4B6BFE15' }]}
                onPress={() => handleChangeRole(selectedUser?._id || '', 'passenger')}
            >
                <FontAwesome5 name="user" size={24} color="#4B6BFE" />
                <Text style={[styles.roleOptionText, { color: theme.text }]}>Passenger</Text>
            </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {renderMessageModal()}
      {renderDeleteModal()}
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
  filtersContainer: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  filterIcon: {
    marginRight: 4,
    fontSize: 10,
  },
  filterText: {
    fontWeight: '500',
    fontSize: 11,
  },
  verifiedFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  verifiedFilterText: {
    marginRight: 8,
  },
  usersList: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  userMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  accountTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B015',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginLeft: 4,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    padding: 16,
    borderRadius: 8,
  },
  roleOptionText: {
    marginTop: 8,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '500',
  },
  // Message Modal styles
  userIconContainer: {
    alignSelf: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4B6BFE15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    backgroundColor: '#4CAF5015',
  },
  errorIconContainer: {
    backgroundColor: '#F4433615',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  messageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sendButton: {
    backgroundColor: '#4B6BFE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.6,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  errorButton: {
    backgroundColor: '#F44336',
  },
  sendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  sendingText: {
    marginLeft: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  sendIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  deleteConfirmContent: {
    marginBottom: 20,
  },
  deleteConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userInfoContainer: {
    marginBottom: 8,
  },
  deleteWarning: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  buttonText: {
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
}); 