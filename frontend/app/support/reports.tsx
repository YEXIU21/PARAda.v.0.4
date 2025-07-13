import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import SupportNavBar from '../../components/SupportNavBar';

// Define types for report data
interface ReportData {
  ticketsByStatus: {
    label: string;
    value: number;
    color: string;
  }[];
  ticketsByPriority: {
    label: string;
    value: number;
    color: string;
  }[];
  ticketsByCategory: {
    label: string;
    value: number;
  }[];
  ticketTrend: {
    date: string;
    opened: number;
    resolved: number;
  }[];
  responseTimeAvg: number;
  resolutionTimeAvg: number;
}

export default function ReportsPage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has support role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.role !== 'support') {
            // Redirect to home if not a support user
            if (Platform.OS === 'web') {
              window.location.href = '/';
            } else {
              router.replace('/');
            }
          }
        } else {
          // No user data, redirect to login
          if (Platform.OS === 'web') {
            window.location.href = '/auth/login';
          } else {
            router.replace('/auth/login');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
    loadReportData();
  }, [dateRange]);

  // Load report data
  const loadReportData = async () => {
    setIsLoading(true);
    
    try {
      // In a production app, this would use the ticket API
      import('../../services/api/ticket.api').then(async (ticketApi) => {
        try {
          // Try to fetch report data from API
          // This would be a real API call in production
          // const data = await ticketApi.getReportData(dateRange);
          
          // For now, use sample data
          useSampleData();
        } catch (error) {
          console.error('Error fetching report data:', error);
          // Fallback to sample data
          useSampleData();
        } finally {
          setIsLoading(false);
        }
      }).catch((error) => {
        console.error('Error importing ticket API:', error);
        // Fallback to sample data
        useSampleData();
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error in loadReportData:', error);
      useSampleData();
      setIsLoading(false);
    }
  };
  
  // Fallback to sample data
  const useSampleData = () => {
    console.log('Using sample report data');
    
    // Sample report data
    const sampleData: ReportData = {
      ticketsByStatus: [
        { label: 'Open', value: 12, color: '#dc3545' },
        { label: 'In Progress', value: 8, color: '#007bff' },
        { label: 'Pending', value: 5, color: '#ffc107' },
        { label: 'Resolved', value: 24, color: '#28a745' },
        { label: 'Closed', value: 18, color: '#6c757d' }
      ],
      ticketsByPriority: [
        { label: 'Low', value: 15, color: '#28a745' },
        { label: 'Medium', value: 22, color: '#ffc107' },
        { label: 'High', value: 18, color: '#fd7e14' },
        { label: 'Urgent', value: 12, color: '#dc3545' }
      ],
      ticketsByCategory: [
        { label: 'Account', value: 14 },
        { label: 'Billing', value: 22 },
        { label: 'Technical', value: 18 },
        { label: 'Ride', value: 8 },
        { label: 'Driver', value: 5 }
      ],
      ticketTrend: dateRange === 'week' ? [
        { date: 'Mon', opened: 5, resolved: 3 },
        { date: 'Tue', opened: 7, resolved: 5 },
        { date: 'Wed', opened: 4, resolved: 6 },
        { date: 'Thu', opened: 8, resolved: 4 },
        { date: 'Fri', opened: 6, resolved: 7 },
        { date: 'Sat', opened: 3, resolved: 5 },
        { date: 'Sun', opened: 2, resolved: 3 }
      ] : dateRange === 'month' ? [
        { date: 'Week 1', opened: 18, resolved: 15 },
        { date: 'Week 2', opened: 22, resolved: 19 },
        { date: 'Week 3', opened: 16, resolved: 20 },
        { date: 'Week 4', opened: 14, resolved: 17 }
      ] : [
        { date: 'Jan', opened: 45, resolved: 40 },
        { date: 'Feb', opened: 52, resolved: 48 },
        { date: 'Mar', opened: 38, resolved: 42 }
      ],
      responseTimeAvg: 3.5, // hours
      resolutionTimeAvg: 28.2 // hours
    };
    
    setReportData(sampleData);
  };

  // Format time in hours
  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours} hours`;
    }
    
    return `${wholeHours} hours, ${minutes} minutes`;
  };

  // Calculate total tickets
  const calculateTotal = (data: { value: number }[]) => {
    return data.reduce((sum, item) => sum + item.value, 0);
  };

  // Calculate percentage
  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <View style={[styles.pageContainer, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      {/* Support Navigation Bar */}
      <SupportNavBar />
      
      {/* Main Content */}
      <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
        <LinearGradient
          colors={colors.gradientColors}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Support Reports</Text>
              <Text style={styles.headerSubtitle}>
                Analytics and statistics for support tickets
              </Text>
            </View>
            <FontAwesome5 name="chart-bar" size={24} color="#FFFFFF" />
          </View>
        </LinearGradient>
        
        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            Date Range:
          </Text>
          <View style={styles.dateRangeOptions}>
            <TouchableOpacity
              style={[
                styles.dateRangeOption,
                dateRange === 'week' && styles.dateRangeOptionActive
              ]}
              onPress={() => setDateRange('week')}
            >
              <Text style={[
                styles.dateRangeText,
                dateRange === 'week' && styles.dateRangeTextActive
              ]}>Last Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateRangeOption,
                dateRange === 'month' && styles.dateRangeOptionActive
              ]}
              onPress={() => setDateRange('month')}
            >
              <Text style={[
                styles.dateRangeText,
                dateRange === 'month' && styles.dateRangeTextActive
              ]}>Last Month</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dateRangeOption,
                dateRange === 'quarter' && styles.dateRangeOptionActive
              ]}
              onPress={() => setDateRange('quarter')}
            >
              <Text style={[
                styles.dateRangeText,
                dateRange === 'quarter' && styles.dateRangeTextActive
              ]}>Last Quarter</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Loading report data...</Text>
          </View>
        ) : reportData ? (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsContainer}>
              <View style={[
                styles.metricCard,
                { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
              ]}>
                <Text style={[styles.metricLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Avg. First Response Time
                </Text>
                <Text style={[styles.metricValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {formatHours(reportData.responseTimeAvg)}
                </Text>
              </View>
              
              <View style={[
                styles.metricCard,
                { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
              ]}>
                <Text style={[styles.metricLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                  Avg. Resolution Time
                </Text>
                <Text style={[styles.metricValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {formatHours(reportData.resolutionTimeAvg)}
                </Text>
              </View>
            </View>
            
            {/* Tickets by Status */}
            <View style={[
              styles.chartContainer,
              { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
            ]}>
              <Text style={[styles.chartTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Tickets by Status
              </Text>
              
              <View style={styles.barChartContainer}>
                {reportData.ticketsByStatus.map((item, index) => {
                  const total = calculateTotal(reportData.ticketsByStatus);
                  const percentage = calculatePercentage(item.value, total);
                  
                  return (
                    <View key={index} style={styles.barChartItem}>
                      <View style={styles.barLabelContainer}>
                        <View style={[styles.barColorIndicator, { backgroundColor: item.color }]} />
                        <Text style={[styles.barLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                          {item.label}
                        </Text>
                      </View>
                      
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar, 
                            { 
                              width: `${percentage}%`,
                              backgroundColor: item.color
                            }
                          ]} 
                        />
                        <Text style={[styles.barValue, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                          {item.value} ({percentage}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            
            {/* Tickets by Priority */}
            <View style={[
              styles.chartContainer,
              { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
            ]}>
              <Text style={[styles.chartTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Tickets by Priority
              </Text>
              
              <View style={styles.barChartContainer}>
                {reportData.ticketsByPriority.map((item, index) => {
                  const total = calculateTotal(reportData.ticketsByPriority);
                  const percentage = calculatePercentage(item.value, total);
                  
                  return (
                    <View key={index} style={styles.barChartItem}>
                      <View style={styles.barLabelContainer}>
                        <View style={[styles.barColorIndicator, { backgroundColor: item.color }]} />
                        <Text style={[styles.barLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                          {item.label}
                        </Text>
                      </View>
                      
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar, 
                            { 
                              width: `${percentage}%`,
                              backgroundColor: item.color
                            }
                          ]} 
                        />
                        <Text style={[styles.barValue, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                          {item.value} ({percentage}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            
            {/* Tickets by Category */}
            <View style={[
              styles.chartContainer,
              { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
            ]}>
              <Text style={[styles.chartTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Tickets by Category
              </Text>
              
              <View style={styles.barChartContainer}>
                {reportData.ticketsByCategory.map((item, index) => {
                  const total = calculateTotal(reportData.ticketsByCategory);
                  const percentage = calculatePercentage(item.value, total);
                  const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'];
                  
                  return (
                    <View key={index} style={styles.barChartItem}>
                      <View style={styles.barLabelContainer}>
                        <View 
                          style={[
                            styles.barColorIndicator, 
                            { backgroundColor: colors[index % colors.length] }
                          ]} 
                        />
                        <Text style={[styles.barLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                          {item.label}
                        </Text>
                      </View>
                      
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar, 
                            { 
                              width: `${percentage}%`,
                              backgroundColor: colors[index % colors.length]
                            }
                          ]} 
                        />
                        <Text style={[styles.barValue, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                          {item.value} ({percentage}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            
            {/* Ticket Trend */}
            <View style={[
              styles.chartContainer,
              { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
            ]}>
              <Text style={[styles.chartTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Ticket Trend ({dateRange === 'week' ? 'Last Week' : dateRange === 'month' ? 'Last Month' : 'Last Quarter'})
              </Text>
              
              <View style={styles.lineChartContainer}>
                <View style={styles.lineChartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#007bff' }]} />
                    <Text style={[styles.legendText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      Opened
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#28a745' }]} />
                    <Text style={[styles.legendText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      Resolved
                    </Text>
                  </View>
                </View>
                
                <View style={styles.lineChart}>
                  {/* Simple representation of a line chart */}
                  <View style={styles.lineChartBars}>
                    {reportData.ticketTrend.map((item, index) => {
                      const maxValue = Math.max(
                        ...reportData.ticketTrend.map(i => Math.max(i.opened, i.resolved))
                      );
                      const openedHeight = (item.opened / maxValue) * 100;
                      const resolvedHeight = (item.resolved / maxValue) * 100;
                      
                      return (
                        <View key={index} style={styles.lineChartBarGroup}>
                          <View style={styles.lineChartBarContainer}>
                            <View 
                              style={[
                                styles.lineChartBar, 
                                { 
                                  height: `${openedHeight}%`,
                                  backgroundColor: '#007bff'
                                }
                              ]} 
                            />
                            <View 
                              style={[
                                styles.lineChartBar, 
                                { 
                                  height: `${resolvedHeight}%`,
                                  backgroundColor: '#28a745',
                                  marginLeft: 5
                                }
                              ]} 
                            />
                          </View>
                          <Text style={[styles.lineChartLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                            {item.date}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
            
            {/* Export Options */}
            <View style={styles.exportContainer}>
              <TouchableOpacity 
                style={[
                  styles.exportButton,
                  { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }
                ]}
                onPress={() => console.log('Export CSV')}
              >
                <FontAwesome5 name="file-csv" size={16} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.exportText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Export CSV
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.exportButton,
                  { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }
                ]}
                onPress={() => console.log('Export PDF')}
              >
                <FontAwesome5 name="file-pdf" size={16} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.exportText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Export PDF
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>
              No report data available
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  container: {
    flex: 1,
    padding: 0,
  },
  header: {
    padding: 20,
    borderRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  dateRangeContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  dateRangeOptions: {
    flexDirection: 'row',
  },
  dateRangeOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  dateRangeOptionActive: {
    backgroundColor: '#007bff',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#333333',
  },
  dateRangeTextActive: {
    color: '#FFFFFF',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  metricCard: {
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  barChartContainer: {
    marginTop: 10,
  },
  barChartItem: {
    marginBottom: 15,
  },
  barLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  barColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  barLabel: {
    fontSize: 14,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    marginLeft: 10,
    fontSize: 12,
  },
  lineChartContainer: {
    marginTop: 15,
  },
  lineChartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
  lineChart: {
    height: 200,
    marginTop: 10,
  },
  lineChartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  lineChartBarGroup: {
    alignItems: 'center',
    flex: 1,
  },
  lineChartBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '85%',
  },
  lineChartBar: {
    width: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  lineChartLabel: {
    marginTop: 5,
    fontSize: 12,
  },
  exportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 15,
    marginBottom: 20,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  exportText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 