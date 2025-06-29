import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import AdminLayout from '../../components/layouts/AdminLayout';
import { router } from 'expo-router';
import InstallationStats from '../../components/admin/InstallationStats'; 

const AdminDashboard = () => {
  const { colors: theme } = useTheme();
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if user is admin
  if (!user || user.role !== 'admin') {
    router.replace('/(tabs)');
    return null;
  }
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  return (
    <AdminLayout title="Admin Dashboard">
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.text }]}>Admin Dashboard</Text>
        
        {/* Admin Stats Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>System Overview</Text>
          
          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="users" size={24} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>42</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Users</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="route" size={24} color="#4CAF50" />
              <Text style={[styles.statValue, { color: theme.text }]}>15</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Routes</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="bus" size={24} color="#FF9800" />
              <Text style={[styles.statValue, { color: theme.text }]}>8</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Drivers</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <FontAwesome5 name="ticket-alt" size={24} color="#E91E63" />
              <Text style={[styles.statValue, { color: theme.text }]}>23</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Support Tickets</Text>
            </View>
          </View>
        </View>
        
        {/* Installation Stats Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>App Installations</Text>
          <InstallationStats refreshTrigger={refreshTrigger} />
        </View>
        
        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/admin/users')}
            >
              <FontAwesome5 name="user-cog" size={20} color="white" />
              <Text style={styles.actionText}>Manage Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => router.push('/admin/routes')}
            >
              <FontAwesome5 name="map-marked-alt" size={20} color="white" />
              <Text style={styles.actionText}>Manage Routes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => router.push('/admin/drivers')}
            >
              <FontAwesome5 name="id-card" size={20} color="white" />
              <Text style={styles.actionText}>Manage Drivers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#E91E63' }]}
              onPress={() => router.push('/admin/support')}
            >
              <FontAwesome5 name="headset" size={20} color="white" />
              <Text style={styles.actionText}>Support Tickets</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AdminDashboard; 