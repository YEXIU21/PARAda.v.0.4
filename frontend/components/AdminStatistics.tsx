import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, SafeAreaView, ActivityIndicator, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDashboardData, getReportsData } from '../services/api/admin.api';

const { width, height } = Dimensions.get('window');

interface StatCardProps {
  icon: string;
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  secondaryColor: string;
}

interface AdminStatisticsProps {
  isDarkMode: boolean;
  theme: {
    card: string;
    text: string;
    textSecondary: string;
  };
}

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

interface DailyStatItem {
  date: string;
  completedRides: number;
  cancelledRides: number;
  revenue: number;
}

interface ReportsData {
  period: string;
  statistics: {
    completedRides: number;
    cancelledRides: number;
    newSubscriptions: number;
    activeSubscriptions: number;
    revenue: number;
    monthlyRevenue?: number;
    averageRideTime?: string;
  };
  topRoutes: any[];
  dailyStats?: DailyStatItem[];
  revenueComparison?: {
    dailyChange: number;
    monthlyChange: number;
  };
}

// Statistic Card Component
const StatCard = ({ icon, title, value, subtitle, color, secondaryColor }: StatCardProps) => {
  return (
    <View style={styles.statCardContainer}>
      <LinearGradient
        colors={[color, secondaryColor]}
        style={styles.statCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statIconContainer}>
          <FontAwesome5 name={icon} size={24} color="white" />
        </View>
        <View style={styles.statInfoContainer}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </LinearGradient>
    </View>
  );
};

export default function AdminStatistics({ isDarkMode, theme }: AdminStatisticsProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const loadingAnimation = useRef(new Animated.Value(0)).current;

  // Calculate revenue from previous day/month for comparison
  const [dailyRevenueChange, setDailyRevenueChange] = useState<number>(0);
  const [monthlyRevenueChange, setMonthlyRevenueChange] = useState<number>(0);

  // Start loading animation
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false
          }),
          Animated.timing(loadingAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false
          })
        ])
      ).start();
    } else {
      loadingAnimation.setValue(0);
    }
  }, [loading]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard data
        const dashboard = await getDashboardData();
        setDashboardData(dashboard as DashboardData);
        
        // Fetch reports data for weekly activity and revenue
        const reports = await getReportsData('week');
        const typedReports = reports as ReportsData;
        setReportsData(typedReports);
        
        // Set weekly activity data from the API response
        if (typedReports && typedReports.dailyStats && typedReports.dailyStats.length === 7) {
          // Map the daily stats to the weekly activity array
          // Make sure the data is in the correct order (Monday to Sunday)
          const sortedDailyStats = [...typedReports.dailyStats].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });
          
          setWeeklyActivity(sortedDailyStats.map((day: DailyStatItem) => day.completedRides));
        }
        
        // Set revenue changes from the API response
        if (typedReports && typedReports.revenueComparison) {
          setDailyRevenueChange(typedReports.revenueComparison.dailyChange || 0);
          setMonthlyRevenueChange(typedReports.revenueComparison.monthlyChange || 0);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
        console.error('Error loading dashboard data:', err);
      }
    };
    
    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString()}`;
  };
  
  // Calculate subscription distribution percentages
  const getSubscriptionDistribution = () => {
    if (!dashboardData || !dashboardData.subscriptionStats) {
      return { basic: 100, premium: 0, annual: 0 }; // Default to 100% basic if no stats
    }
    
    const stats = dashboardData.subscriptionStats;
    const total = stats.basic + stats.premium + stats.annual;
    
    // If there are active subscriptions but the distribution adds up to zero,
    // assign all to basic subscription type
    if (total === 0 && dashboardData.counts && dashboardData.counts.activeSubscriptions > 0) {
      return { basic: 100, premium: 0, annual: 0 };
    } else if (total === 0) {
      return { basic: 0, premium: 0, annual: 0 };
    }
    
    return {
      basic: Math.round((stats.basic / total) * 100),
      premium: Math.round((stats.premium / total) * 100),
      annual: Math.round((stats.annual / total) * 100)
    };
  };
  
  // Get total subscriptions count
  const getTotalSubscriptions = (): number => {
    if (!dashboardData || !dashboardData.counts) {
      return 0; // Return 0 instead of a hardcoded value
    }
    
    return dashboardData.counts.activeSubscriptions || 0;
  };
  
  // Get statistics values from API data or use defaults
  const getStats = () => {
    if (!dashboardData || !dashboardData.counts) {
      // Return zeros instead of hardcoded values when no data is available
      return {
        activeRides: 0,
        totalPassengers: 0,
        availableDrivers: 0,
        dailyRevenue: formatCurrency(0),
        monthlyRevenue: formatCurrency(0),
        averageRideTime: "0 min",
        totalSubscriptions: 0,
        activeRoutes: 0,
      };
    }
    
    const counts = dashboardData.counts;
    const revenue = reportsData?.statistics?.revenue || 0;
    const monthlyRevenue = reportsData?.statistics?.monthlyRevenue || 0;
    
    return {
      activeRides: counts.activeRides || 0,
      totalPassengers: counts.users || 0,
      availableDrivers: counts.activeDrivers || 0,
      dailyRevenue: formatCurrency(revenue),
      monthlyRevenue: formatCurrency(monthlyRevenue),
      averageRideTime: reportsData?.statistics?.averageRideTime || "0 min",
      totalSubscriptions: counts.activeSubscriptions || 0,
      activeRoutes: counts.activeRoutes || 0,
    };
  };
  
  const stats = getStats();
  const subscriptionDistribution = getSubscriptionDistribution();
  const maxActivity = Math.max(...weeklyActivity);

  if (loading) {
    const width = loadingAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });

    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBranding}>
            <Text style={styles.brandingText}>PARAda</Text>
            <Text style={styles.brandingSubtext}>ADMIN DASHBOARD</Text>
          </View>
          
          <View style={styles.loadingHeader}>
            <FontAwesome5 name="chart-bar" size={24} color="#4B6BFE" />
            <Text style={styles.loadingTitle}>Loading Statistics</Text>
          </View>
          
          <ActivityIndicator size="large" color="#4B6BFE" style={styles.loadingIndicator} />
          <Text style={styles.loadingText}>Fetching dashboard data...</Text>
          
          <View style={styles.loadingBarContainer}>
            <Animated.View style={[styles.loadingProgress, { width }]} />
          </View>
          
          <Text style={styles.loadingSubtext}>Please wait while we prepare your insights</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
        <FontAwesome5 name="exclamation-circle" size={40} color="#FF3B30" />
        <Text style={[styles.errorText, { color: theme.text }]}>Error loading data</Text>
        <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: height * 0.15 } // Add extra padding at the bottom to avoid tab bar overlap
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>System Dashboard</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Real-time statistics and analytics
          </Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Activity</Text>
          
          <View style={styles.statsGrid}>
            <StatCard 
              icon="taxi" 
              title="Active Rides" 
              value={stats.activeRides.toString()} 
              color="#4B6BFE" 
              secondaryColor="#3451E1" 
            />
            <StatCard 
              icon="users" 
              title="Total Passengers" 
              value={stats.totalPassengers.toString()} 
              color="#FF3B30" 
              secondaryColor="#E62B20" 
            />
            <StatCard 
              icon="car" 
              title="Available Drivers" 
              value={stats.availableDrivers.toString()} 
              color="#34A853" 
              secondaryColor="#2D9047" 
            />
            <StatCard 
              icon="route" 
              title="Active Routes" 
              value={stats.activeRoutes.toString()} 
              color="#FFCC00" 
              secondaryColor="#E6B800" 
            />
          </View>
        </View>

        <View style={styles.revenueSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Revenue</Text>
          
          <View style={styles.statsRow}>
            <StatCard 
              icon="money-bill-wave" 
              title="Daily Revenue" 
              value={stats.dailyRevenue} 
              subtitle={`${dailyRevenueChange >= 0 ? '+' : ''}${dailyRevenueChange}% from yesterday`} 
              color="#34A853" 
              secondaryColor="#2D9047" 
            />
            <StatCard 
              icon="chart-line" 
              title="Monthly Revenue" 
              value={stats.monthlyRevenue} 
              subtitle={`${monthlyRevenueChange >= 0 ? '+' : ''}${monthlyRevenueChange}% from last month`} 
              color="#4B6BFE" 
              secondaryColor="#3451E1" 
            />
          </View>
        </View>

        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Activity</Text>
          
          <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
            <View style={styles.chart}>
              {weeklyActivity.map((value, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBar, 
                      { 
                        height: `${Math.min((value / maxActivity) * 90, 90)}%`, // Limit to 90% height
                        backgroundColor: value >= maxActivity * 0.8 ? '#34A853' : 
                                        value >= maxActivity * 0.5 ? '#4B6BFE' : '#FF3B30'
                      }
                    ]} 
                  />
                  <Text style={[styles.chartLabel, { color: theme.textSecondary }]}>
                    {daysOfWeek[index]}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.chartLegend}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#34A853' }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>High</Text>
                  <Text style={[styles.legendSubtext, { color: theme.textSecondary }]}>
                    {Math.round(maxActivity * 0.8)}+
                  </Text>
                </View>
                
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#4B6BFE' }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>Medium</Text>
                  <Text style={[styles.legendSubtext, { color: theme.textSecondary }]}>
                    {Math.round(maxActivity * 0.5)}-{Math.round(maxActivity * 0.8)}
                  </Text>
                </View>
                
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FF3B30' }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>Low</Text>
                  <Text style={[styles.legendSubtext, { color: theme.textSecondary }]}>
                    {"< "}{Math.round(maxActivity * 0.5)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.subscriptionSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Subscription Status</Text>
          
          <View style={[styles.subscriptionCard, { backgroundColor: theme.card }]}>
            <View style={styles.subscriptionHeader}>
              <Text style={[styles.subscriptionTitle, { color: theme.text }]}>
                Total Subscriptions: {getTotalSubscriptions()}
              </Text>
            </View>
            
            <View style={styles.subscriptionDistribution}>
              <View style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View 
                    style={[styles.distributionFill, { 
                      backgroundColor: '#4B6BFE',
                      width: subscriptionDistribution.basic > 0 ? `${Math.max(subscriptionDistribution.basic, 5)}%` : '0%'
                    }]} 
                  />
                </View>
                <Text style={[styles.distributionLabel, { color: theme.textSecondary }]}>
                  Basic ({subscriptionDistribution.basic}%)
                </Text>
              </View>
              
              <View style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View 
                    style={[styles.distributionFill, { 
                      backgroundColor: '#34A853',
                      width: subscriptionDistribution.premium > 0 ? `${Math.max(subscriptionDistribution.premium, 5)}%` : '0%'
                    }]} 
                  />
                </View>
                <Text style={[styles.distributionLabel, { color: theme.textSecondary }]}>
                  Premium ({subscriptionDistribution.premium}%)
                </Text>
              </View>
              
              <View style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View 
                    style={[styles.distributionFill, { 
                      backgroundColor: '#FFCC00',
                      width: subscriptionDistribution.annual > 0 ? `${Math.max(subscriptionDistribution.annual, 5)}%` : '0%'
                    }]} 
                  />
                </View>
                <Text style={[styles.distributionLabel, { color: theme.textSecondary }]}>
                  Annual ({subscriptionDistribution.annual}%)
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.performanceSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>System Performance</Text>
          
          <View style={styles.statsRow}>
            <StatCard 
              icon="clock" 
              title="Avg. Ride Time" 
              value={stats.averageRideTime} 
              color="#FFCC00" 
              secondaryColor="#E6B800" 
            />
            <StatCard 
              icon="tachometer-alt" 
              title="System Uptime" 
              value="99.8%" 
              color="#4B6BFE" 
              secondaryColor="#3451E1" 
            />
          </View>
        </View>
        
        {/* Extra space at the bottom to ensure content doesn't get cut off */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    paddingTop: 50, // Added extra padding on top to avoid status bar overlap
  },
  container: {
    flex: 1,
    width: '100%',
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 15,
  },
  headerSection: {
    marginBottom: 25,
    paddingTop: 15, // Increased top padding for header
    marginTop: 10, // Added margin to push content down
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summarySection: {
    marginBottom: 30,
  },
  revenueSection: {
    marginBottom: 30,
  },
  activitySection: {
    marginBottom: 30,
  },
  subscriptionSection: {
    marginBottom: 30,
  },
  performanceSection: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCardContainer: {
    width: '48%',
    marginBottom: 15,
  },
  statCard: {
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfoContainer: {
    flex: 1,
  },
  statTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statSubtitle: {
    color: 'white',
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 15,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    minHeight: 220,
  },
  chart: {
    height: 150,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  chartBarContainer: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  chartBar: {
    width: 16,
    maxWidth: '80%',
    minWidth: 10,
    borderRadius: 3,
  },
  chartLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  chartLegend: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', 
    flexWrap: 'wrap',
    paddingHorizontal: 5,
  },
  legendItem: {
    alignItems: 'center',
    marginHorizontal: 5,
    marginBottom: 5,
    flexDirection: 'row',
  },
  legendColor: {
    width: 12,
    height: 8,
    borderRadius: 2,
    marginRight: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 3,
  },
  legendSubtext: {
    fontSize: 9,
  },
  subscriptionCard: {
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  subscriptionHeader: {
    marginBottom: 15,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriptionDistribution: {
    marginTop: 10,
  },
  distributionItem: {
    marginBottom: 15,
  },
  distributionBar: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  distributionFill: {
    height: '100%',
    borderRadius: 5,
  },
  distributionLabel: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 50, // Additional space at the bottom
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  loadingBranding: {
    marginBottom: 20,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B6BFE',
    letterSpacing: 1,
  },
  brandingSubtext: {
    fontSize: 14,
    marginTop: 5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#8A8A8A',
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#FFFFFF',
  },
  loadingIndicator: {
    marginVertical: 20,
    transform: [{ scale: 1.2 }],
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingBarContainer: {
    marginTop: 15,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '80%',
    maxWidth: 300,
  },
  loadingProgress: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#4B6BFE',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#8A8A8A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  }
}); 