import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import SupportLayout from '../../../components/layouts/SupportLayout';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import ENV from '../../../constants/environment';
import { getAuthHeader } from '../../../services/api/auth.api.js';

// API URL
const API_URL = ENV.apiUrl;

interface UserDetails {
  id: string;
  username: string;
  email: string;
  role: string;
  accountType: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function UserDetailsScreen() {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const authHeader = await getAuthHeader();
        const response = await axios.get(`${API_URL}/api/users/${id}`, { 
          headers: authHeader 
        });
        
        if (response.data && response.data.success) {
          setUser(response.data.user);
        } else {
          setError('Failed to fetch user details');
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('An error occurred while fetching user details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <SupportLayout title="User Details">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading user details...
          </Text>
        </View>
      </SupportLayout>
    );
  }

  if (error || !user) {
    return (
      <SupportLayout title="User Details">
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={24} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'User not found'}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout title="User Details">
      <ScrollView style={styles.container}>
        {/* User Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={styles.profileImageContainer}>
            <FontAwesome5 name="user-circle" size={80} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.username, { color: colors.text }]}>{user.username}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{user.role}</Text>
              </View>
              {user.isEmailVerified && (
                <View style={[styles.badge, { backgroundColor: '#28a745' }]}>
                  <Text style={styles.badgeText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* User Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>User ID:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{user.id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Account Type:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {user.accountType || 'Regular'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Joined:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          {user.lastLogin && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Last Login:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(user.lastLogin).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/support/message/${user.id}`)}
          >
            <FontAwesome5 name="envelope" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Message User</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
            onPress={() => {
              // Show confirmation dialog before suspending user
              alert('This feature is not yet implemented');
            }}
          >
            <FontAwesome5 name="ban" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Suspend Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SupportLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 120,
    fontSize: 16,
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 