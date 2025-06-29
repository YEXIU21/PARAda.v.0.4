import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome5 } from '@expo/vector-icons';
import SupportLayout from '../../components/layouts/SupportLayout';
import axios from 'axios';
import ENV from '../../constants/environment';
import { getAuthToken } from '../../services/api/auth.api';
import { Dimensions } from 'react-native';

// Chart dimensions
const screenWidth = Dimensions.get('window').width;

// Mock data for analytics
const mockData = {
  ticketStats: {
    total: 124,
    open: 23,
    inProgress: 15,
    resolved: 68,
    closed: 18,
    averageResponseTime: '3.2 hours',
    averageResolutionTime: '2.1 days',
  },
  ticketsByCategory: [
    { category: 'General', count: 28 },
    { category: 'Account', count: 42 },
    { category: 'Payment', count: 15 },
    { category: 'Bug', count: 18 },
    { category: 'Feature', count: 12 },
    { category: 'Complaint', count: 9 },
  ],
  ticketsByPriority: [
    { priority: 'Low', count: 45 },
    { priority: 'Medium', count: 52 },
    { priority: 'High', count: 18 },
    { priority: 'Critical', count: 9 },
  ],
  ticketTrend: [
    { date: '2023-05-01', count: 3 },
    { date: '2023-05-02', count: 5 },
    { date: '2023-05-03', count: 2 },
    { date: '2023-05-04', count: 7 },
    { date: '2023-05-05', count: 4 },
    { date: '2023-05-06', count: 6 },
    { date: '2023-05-07', count: 3 },
  ],
  userStats: {
    total: 1245,
    active: 987,
    inactive: 258,
    newThisMonth: 78,
  },
  usersByRole: [
    { role: 'Passenger', count: 1056 },
    { role: 'Driver', count: 178 },
    { role: 'Support', count: 8 },
    { role: 'Admin', count: 3 },
  ],
};

const AnalyticsDashboard = () => {
  const { colors } = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [data, setData] = useState(mockData);
  
  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      // In a real app, you would fetch data from the API
      // For now, we'll use mock data and simulate loading
      setLoading(true);
      
      try {
        // Simulate API call
        setTimeout(() => {
          setData(mockData);
          setLoading(false);
        }, 1000);
        
        // Real API call would look like this:
        /*
        const token = await getAuthToken();
        const response = await axios.get(
          `${ENV.apiUrl}/api/support/analytics?timeRange=${timeRange}`,
          { headers: { 'x-access-token': token } }
        );
        setData(response.data);
        */
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);
  
  // Calculate percentages
  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };
  
  // Render time range selector
  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'week' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setTimeRange('week')}
      >
        <Text
          style={[
            styles.timeRangeText,
            timeRange === 'week' ? { color: '#fff' } : { color: colors.text }
          ]}
        >
          Week
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'month' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setTimeRange('month')}
      >
        <Text
          style={[
            styles.timeRangeText,
            timeRange === 'month' ? { color: '#fff' } : { color: colors.text }
          ]}
        >
          Month
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'year' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setTimeRange('year')}
      >
        <Text
          style={[
            styles.timeRangeText,
            timeRange === 'year' ? { color: '#fff' } : { color: colors.text }
          ]}
        >
          Year
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  if (loading) {
    return (
      <SupportLayout title="Analytics Dashboard" showBackButton={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading analytics data...
          </Text>
        </View>
      </SupportLayout>
    );
  }
  
  if (error) {
    return (
      <SupportLayout title="Analytics Dashboard" showBackButton={false}>
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={24} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => setTimeRange(timeRange)} // This will trigger a re-fetch
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SupportLayout>
    );
  }
  
  return (
    <SupportLayout title="Analytics Dashboard" showBackButton={false}>
      <ScrollView style={styles.container}>
        {/* Time range selector */}
        {renderTimeRangeSelector()}
        
        {/* Ticket Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <FontAwesome5 name="ticket-alt" size={16} color={colors.primary} /> Ticket Overview
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{data.ticketStats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Tickets</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: '#17a2b8' }]}>{data.ticketStats.open}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Open</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: '#fd7e14' }]}>{data.ticketStats.inProgress}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: '#28a745' }]}>{data.ticketStats.resolved}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resolved</Text>
            </View>
          </View>
          
          <View style={styles.metricsContainer}>
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg. Response Time</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{data.ticketStats.averageResponseTime}</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg. Resolution Time</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>{data.ticketStats.averageResolutionTime}</Text>
            </View>
          </View>
        </View>
        
        {/* Ticket Distribution */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <FontAwesome5 name="chart-pie" size={16} color={colors.primary} /> Ticket Distribution
          </Text>
          
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>By Category</Text>
            <View style={styles.barChartContainer}>
              {data.ticketsByCategory.map((item, index) => {
                const percentage = calculatePercentage(item.count, data.ticketStats.total);
                return (
                  <View key={index} style={styles.barChartItem}>
                    <Text style={[styles.barChartLabel, { color: colors.textSecondary }]}>
                      {item.category}
                    </Text>
                    <View style={styles.barChartBarContainer}>
                      <View
                        style={[
                          styles.barChartBar,
                          { width: `${percentage}%`, backgroundColor: colors.primary }
                        ]}
                      />
                    </View>
                    <Text style={[styles.barChartValue, { color: colors.text }]}>
                      {item.count} ({percentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>By Priority</Text>
            <View style={styles.barChartContainer}>
              {data.ticketsByPriority.map((item, index) => {
                const percentage = calculatePercentage(item.count, data.ticketStats.total);
                let barColor;
                
                switch (item.priority) {
                  case 'Low':
                    barColor = '#28a745';
                    break;
                  case 'Medium':
                    barColor = '#ffc107';
                    break;
                  case 'High':
                    barColor = '#fd7e14';
                    break;
                  case 'Critical':
                    barColor = '#dc3545';
                    break;
                  default:
                    barColor = colors.primary;
                }
                
                return (
                  <View key={index} style={styles.barChartItem}>
                    <Text style={[styles.barChartLabel, { color: colors.textSecondary }]}>
                      {item.priority}
                    </Text>
                    <View style={styles.barChartBarContainer}>
                      <View
                        style={[
                          styles.barChartBar,
                          { width: `${percentage}%`, backgroundColor: barColor }
                        ]}
                      />
                    </View>
                    <Text style={[styles.barChartValue, { color: colors.text }]}>
                      {item.count} ({percentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        
        {/* User Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <FontAwesome5 name="users" size={16} color={colors.primary} /> User Statistics
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{data.userStats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: '#28a745' }]}>{data.userStats.active}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: '#dc3545' }]}>{data.userStats.inactive}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inactive</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statNumber, { color: '#17a2b8' }]}>{data.userStats.newThisMonth}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>New This Month</Text>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Users by Role</Text>
            <View style={styles.barChartContainer}>
              {data.usersByRole.map((item, index) => {
                const percentage = calculatePercentage(item.count, data.userStats.total);
                let barColor;
                
                switch (item.role) {
                  case 'Passenger':
                    barColor = '#4caf50';
                    break;
                  case 'Driver':
                    barColor = '#2196f3';
                    break;
                  case 'Support':
                    barColor = '#ff9800';
                    break;
                  case 'Admin':
                    barColor = '#9c27b0';
                    break;
                  default:
                    barColor = colors.primary;
                }
                
                return (
                  <View key={index} style={styles.barChartItem}>
                    <Text style={[styles.barChartLabel, { color: colors.textSecondary }]}>
                      {item.role}
                    </Text>
                    <View style={styles.barChartBarContainer}>
                      <View
                        style={[
                          styles.barChartBar,
                          { width: `${percentage}%`, backgroundColor: barColor }
                        ]}
                      />
                    </View>
                    <Text style={[styles.barChartValue, { color: colors.text }]}>
                      {item.count} ({percentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SupportLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  barChartContainer: {
    marginTop: 8,
  },
  barChartItem: {
    marginBottom: 12,
  },
  barChartLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  barChartBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barChartBar: {
    height: '100%',
    borderRadius: 6,
  },
  barChartValue: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default AnalyticsDashboard; 