import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { getReportsData } from '../../services/api/admin.api';

const { width } = Dimensions.get('window');

// Define report data interface
interface ReportData {
  period: string;
  statistics: {
    completedRides: number;
    cancelledRides: number;
    newSubscriptions: number;
    activeSubscriptions: number;
    revenue: number;
    monthlyRevenue: number;
    averageRideTime: string;
    activeDrivers?: number;
  };
  topRoutes: {
    routeId: string;
    name: string;
    count: number;
  }[];
  dailyStats: {
    date: string;
    completedRides: number;
    cancelledRides: number;
    revenue: number;
  }[];
  revenueComparison: {
    dailyChange: number;
    monthlyChange: number;
  };
}

// Define time periods for reports
const timePeriods = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' }
];

// Report categories
const reportCategories = [
  { id: 'overview', label: 'Overview', icon: 'chart-pie' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'rides', label: 'Rides', icon: 'route' },
  { id: 'revenue', label: 'Revenue', icon: 'money-bill-wave' },
  { id: 'drivers', label: 'Drivers', icon: 'id-card' }
];

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  
  const fetchReport = async (period: string, category: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getReportsData(period);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchReport(selectedPeriod, selectedCategory);
  }, []);
  
  // Handle period change
  const handlePeriodChange = (period: string): void => {
    setSelectedPeriod(period);
    fetchReport(period, selectedCategory);
  };
  
  // Handle category change
  const handleCategoryChange = (category: string): void => {
    setSelectedCategory(category);
    // No need to fetch new data as all data is already loaded
  };
  
  // Get color based on trend (positive/negative)
  const getTrendColor = (value: number): string => {
    return value >= 0 ? '#4CAF50' : '#FF3B30';
  };
  
  // Render stat card
  const renderStatCard = (title: string, value: string | number, icon: string, trend?: number): JSX.Element => {
    return (
      <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.statIconContainer}>
          <FontAwesome5 name={icon} size={18} color="#4B6BFE" />
        </View>
        
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
        
        {trend !== undefined && (
          <View style={[styles.trendBadge, { backgroundColor: `${getTrendColor(trend)}15` }]}>
            <FontAwesome5 
              name={trend >= 0 ? 'arrow-up' : 'arrow-down'} 
              size={10} 
              color={getTrendColor(trend)} 
            />
            <Text style={[styles.trendText, { color: getTrendColor(trend) }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render list item
  const renderListItem = (title: string, subtitle: string, rightText: string, rank: number): JSX.Element => {
    return (
      <View key={subtitle} style={[styles.listItem, { borderBottomColor: theme.border }]}>
        <View style={[styles.rankBadge, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
          <Text style={[styles.rankText, { color: theme.text }]}>{rank}</Text>
        </View>
        
        <View style={styles.listItemContent}>
          <Text style={[styles.listItemTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
        
        <Text style={[styles.listItemRight, { color: theme.text }]}>{rightText}</Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
      </LinearGradient>
      
      {/* Time period selection */}
      <View style={styles.periodContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodScrollContent}
        >
          {timePeriods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && { 
                  backgroundColor: '#4B6BFE',
                  borderColor: '#4B6BFE'
                }
              ]}
              onPress={() => handlePeriodChange(period.id)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.id && { color: 'white' }
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Category selection */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {reportCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => handleCategoryChange(category.id)}
            >
              <FontAwesome5 
                name={category.icon} 
                size={16} 
                color={selectedCategory === category.id ? '#4B6BFE' : isDarkMode ? '#888' : '#666'} 
                style={styles.categoryIcon}
              />
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === category.id ? '#4B6BFE' : isDarkMode ? '#888' : '#666' }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Report content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B6BFE" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading report data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={32} color="#FF3B30" />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchReport(selectedPeriod, selectedCategory)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.reportContent}
          contentContainerStyle={styles.reportScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedCategory === 'overview' && reportData && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Metrics</Text>
              
              <View style={styles.statsGrid}>
                {renderStatCard('Total Users', reportData.statistics?.activeSubscriptions || 0, 'users', reportData.revenueComparison?.monthlyChange)}
                {renderStatCard('Total Rides', reportData.statistics?.completedRides || 0, 'route', reportData.revenueComparison?.dailyChange)}
                {renderStatCard('Revenue', `₱${reportData.statistics?.revenue || 0}`, 'money-bill-wave', reportData.revenueComparison?.monthlyChange)}
                {renderStatCard('Avg. Wait Time', reportData.statistics?.averageRideTime || '0 min', 'clock')}
              </View>
              
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance Insights</Text>
              
              <View style={[styles.insightsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.insightItem}>
                  <FontAwesome5 name="clock" size={16} color="#4B6BFE" style={styles.insightIcon} />
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Avg. Response Time</Text>
                    <Text style={[styles.insightValue, { color: theme.text }]}>{reportData.statistics?.averageRideTime || '0 min'}</Text>
                  </View>
                </View>
                
                <View style={styles.insightItem}>
                  <FontAwesome5 name="calendar-day" size={16} color="#FF9500" style={styles.insightIcon} />
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Peak Hours</Text>
                    <Text style={[styles.insightValue, { color: theme.text }]}>7-9 AM, 5-7 PM</Text>
                  </View>
                </View>
                
                <View style={styles.insightItem}>
                  <FontAwesome5 name="calendar-week" size={16} color="#34A853" style={styles.insightIcon} />
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Busiest Days</Text>
                    <Text style={[styles.insightValue, { color: theme.text }]}>Mon, Fri</Text>
                  </View>
                </View>
                
                <View style={styles.insightItem}>
                  <FontAwesome5 name="tachometer-alt" size={16} color="#FF3B30" style={styles.insightIcon} />
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>Route Efficiency</Text>
                    <Text style={[styles.insightValue, { color: theme.text }]}>85%</Text>
                  </View>
                </View>
              </View>
              
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Performing Routes</Text>
              
              <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {reportData.topRoutes && reportData.topRoutes.map((route, index) => (
                  renderListItem(
                    route.name, 
                    `Route ID: ${route.routeId}`, 
                    `${route.count} rides`, 
                    index + 1
                  )
                ))}
                {(!reportData.topRoutes || reportData.topRoutes.length === 0) && (
                  <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No route data available</Text>
                )}
              </View>
            </>
          )}
          
          {selectedCategory === 'users' && reportData && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>User Statistics</Text>
              
              <View style={styles.statsGrid}>
                {renderStatCard('Total Users', reportData.statistics?.activeSubscriptions || 0, 'users', reportData.revenueComparison?.monthlyChange)}
                {renderStatCard('New Users', reportData.statistics?.newSubscriptions || 0, 'user-plus')}
                {renderStatCard('Active Users', reportData.statistics?.activeSubscriptions || 0, 'user-check')}
                {renderStatCard('Inactive', 0, 'user-slash')}
              </View>
            </>
          )}
          
          {selectedCategory === 'rides' && reportData && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Ride Statistics</Text>
              
              <View style={styles.statsGrid}>
                {renderStatCard('Total Rides', reportData.statistics?.completedRides + reportData.statistics?.cancelledRides || 0, 'route')}
                {renderStatCard('Completed', reportData.statistics?.completedRides || 0, 'check-circle', reportData.revenueComparison?.dailyChange)}
                {renderStatCard('Cancelled', reportData.statistics?.cancelledRides || 0, 'times-circle')}
                {renderStatCard('Avg. Time', reportData.statistics?.averageRideTime || '0 min', 'clock')}
              </View>
              
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Performing Routes</Text>
              
              <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {reportData.topRoutes && reportData.topRoutes.map((route, index) => (
                  renderListItem(
                    route.name, 
                    `Route ID: ${route.routeId}`, 
                    `${route.count} rides`, 
                    index + 1
                  )
                ))}
                {(!reportData.topRoutes || reportData.topRoutes.length === 0) && (
                  <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No route data available</Text>
                )}
              </View>
            </>
          )}
          
          {selectedCategory === 'revenue' && reportData && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Revenue Statistics</Text>
              
              <View style={styles.statsGrid}>
                {renderStatCard('Total Revenue', `₱${reportData.statistics?.revenue || 0}`, 'money-bill-wave', reportData.revenueComparison?.monthlyChange)}
                {renderStatCard('Monthly', `₱${reportData.statistics?.monthlyRevenue || 0}`, 'calendar-alt')}
                {renderStatCard('Growth', `${reportData.revenueComparison?.monthlyChange || 0}%`, 'chart-line')}
                {renderStatCard('Subscriptions', reportData.statistics?.activeSubscriptions || 0, 'id-card')}
              </View>
            </>
          )}
          
          {selectedCategory === 'drivers' && reportData && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Driver Statistics</Text>
              
              <View style={styles.statsGrid}>
                {renderStatCard('Active Drivers', reportData.statistics?.activeDrivers || 0, 'id-card')}
                {renderStatCard('Completed Rides', reportData.statistics?.completedRides || 0, 'check-circle')}
                {renderStatCard('Avg. Rating', '4.7', 'star')}
                {renderStatCard('Avg. Response', reportData.statistics?.averageRideTime || '0 min', 'clock')}
              </View>
            </>
          )}
        </ScrollView>
      )}
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
  periodContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodScrollContent: {
    paddingHorizontal: 16,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  categoryContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(75, 107, 254, 0.1)',
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
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
    padding: 20,
  },
  errorText: {
    marginTop: 16,
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
    fontWeight: '600',
  },
  reportContent: {
    flex: 1,
  },
  reportScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 40) / 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(75, 107, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
  },
  trendBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  insightsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
  },
  listItemRight: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataText: {
    padding: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  }
}); 