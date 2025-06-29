import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getInstallationStats } from '../../services/api/installation.api';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface InstallationStatsProps {
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

const InstallationStats: React.FC<InstallationStatsProps> = ({ refreshTrigger = 0 }) => {
  const { colors: theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Function to load stats
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInstallationStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error loading installation stats:', err);
      setError(err.message || 'Failed to load installation statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Load stats on mount and when refreshTrigger changes
  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);
  
  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!stats || !stats.platforms) return null;
    
    const platforms = Object.keys(stats.platforms);
    const data = {
      labels: platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
      datasets: [
        {
          data: platforms.map(p => stats.platforms[p] || 0)
        }
      ]
    };
    
    return data;
  };
  
  // Prepare daily chart data (last 7 days)
  const prepareDailyChartData = () => {
    if (!stats || !stats.daily) return null;
    
    const dates = Object.keys(stats.daily).sort().slice(-7); // Get last 7 days
    
    // Get unique platforms across all dates
    const allPlatforms = new Set<string>();
    dates.forEach(date => {
      Object.keys(stats.daily[date]).forEach(platform => {
        allPlatforms.add(platform);
      });
    });
    
    // Create datasets for each platform
    const datasets = Array.from(allPlatforms).map(platform => {
      return {
        name: platform.charAt(0).toUpperCase() + platform.slice(1),
        data: dates.map(date => stats.daily[date][platform] || 0),
        color: () => getPlatformColor(platform)
      };
    });
    
    return {
      labels: dates.map(d => d.slice(5)), // Format as MM-DD
      datasets
    };
  };
  
  // Get color for platform
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'ios': return '#007AFF';
      case 'android': return '#3DDC84';
      case 'pwa': return '#5A0FC8';
      default: return '#888888';
    }
  };
  
  // Get icon for platform
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios': return 'apple';
      case 'android': return 'android';
      case 'pwa': return 'mobile-alt';
      default: return 'globe';
    }
  };
  
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading installation statistics...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <FontAwesome5 name="exclamation-circle" size={40} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={loadStats}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!stats) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>No installation data available</Text>
      </View>
    );
  }
  
  const chartData = prepareChartData();
  const dailyChartData = prepareDailyChartData();
  
  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: theme.card }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >
      {/* Total Installations */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Total Installations</Text>
        <Text style={[styles.totalCount, { color: theme.primary }]}>{stats.total || 0}</Text>
        
        {/* Platform breakdown */}
        <View style={styles.platformsContainer}>
          {Object.keys(stats.platforms || {}).map(platform => (
            <View key={platform} style={[styles.platformItem, { backgroundColor: `${getPlatformColor(platform)}20` }]}>
              <FontAwesome5 
                name={getPlatformIcon(platform)} 
                size={24} 
                color={getPlatformColor(platform)} 
                style={styles.platformIcon} 
              />
              <Text style={[styles.platformName, { color: theme.text }]}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Text>
              <Text style={[styles.platformCount, { color: getPlatformColor(platform) }]}>
                {stats.platforms[platform] || 0}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Platform Chart */}
      {chartData && chartData.datasets[0].data.some(d => d > 0) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Installations by Platform</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.primary,
              labelColor: (opacity = 1) => theme.text,
              style: {
                borderRadius: 16
              }
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>
      )}
      
      {/* Daily Installations (Last 7 days) */}
      {dailyChartData && dailyChartData.datasets.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Installations (Last 7 Days)</Text>
          
          {dailyChartData.labels.length > 0 ? (
            <BarChart
              data={dailyChartData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel=""
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(75, 107, 254, ${opacity})`,
                labelColor: (opacity = 1) => theme.text,
                style: {
                  borderRadius: 16
                }
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              No daily installation data available yet
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  scrollContainer: {
    flex: 1,
    borderRadius: 12,
  },
  contentContainer: {
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  totalCount: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  platformIcon: {
    marginBottom: 8,
  },
  platformName: {
    fontSize: 14,
    marginBottom: 4,
  },
  platformCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  }
});

export default InstallationStats; 