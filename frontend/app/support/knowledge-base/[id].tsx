import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import SupportNavBar from '../../../components/SupportNavBar';

// Define types for knowledge article
interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: string;
  viewCount: number;
}

export default function KnowledgeArticleDetailPage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const articleId = typeof params.id === 'string' ? params.id : '';
  
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

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
    loadArticle();
  }, [articleId]);

  // Load article
  const loadArticle = async () => {
    if (!articleId) {
      router.replace('/support/knowledge-base');
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, this would fetch from an API
      // For now, we'll use sample data
      const sampleArticles: KnowledgeArticle[] = [
        {
          id: '1',
          title: 'How to reset a user password',
          content: `# Password Reset Process

## Overview
This guide explains the process for resetting user passwords in the admin panel.

## Steps
1. Log in to the admin panel
2. Navigate to the Users section
3. Search for the user by email or username
4. Click on the user to view their profile
5. Select the "Reset Password" option
6. Choose either:
   - Set a temporary password
   - Send password reset link
7. Confirm the action

## Important Notes
- Password reset links expire after 24 hours
- Temporary passwords must be changed on first login
- All password resets are logged in the system audit trail

## Troubleshooting
If the user doesn't receive the password reset email:
- Check that their email address is correct
- Check the email spam folder
- Verify that the user's account is not locked or disabled
- Try setting a temporary password instead

For further assistance, contact the system administrator.`,
          category: 'Account Management',
          tags: ['password', 'reset', 'account'],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'Admin Team',
          viewCount: 145
        },
        {
          id: '2',
          title: 'Troubleshooting app crashes on iOS devices',
          content: `# Troubleshooting App Crashes on iOS Devices

## Common Causes
- Outdated iOS version
- Insufficient device storage
- App cache corruption
- Conflicting app permissions
- Outdated app version

## Diagnostic Steps
1. Verify iOS version is up to date
2. Check available storage space (should have at least 1GB free)
3. Force close all background apps
4. Restart the device
5. Check for app updates

## Solutions
### Solution 1: Clear App Cache
1. Go to Settings > General > iPhone Storage
2. Find our app in the list
3. Tap "Offload App" (this preserves user data)
4. Reinstall the app from the App Store

### Solution 2: Reset App Permissions
1. Go to Settings > Privacy
2. Check Location, Camera, and Notification permissions
3. Toggle permissions off and on again

### Solution 3: Reinstall the App
1. Delete the app by pressing and holding the icon
2. Tap "Delete App"
3. Restart the device
4. Reinstall from the App Store

## When to Escalate
If the above solutions don't work:
- Ask the user to provide crash logs
- Request device model and iOS version
- Escalate to the development team with this information`,
          category: 'Technical Support',
          tags: ['ios', 'crash', 'troubleshooting'],
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'Technical Team',
          viewCount: 278
        },
        {
          id: '3',
          title: 'Understanding subscription billing cycles',
          content: `# Understanding Subscription Billing Cycles

## Subscription Types
Our platform offers several subscription plans with different billing cycles:
- Monthly: Billed every 30 days
- Quarterly: Billed every 3 months
- Annual: Billed once per year

## Billing Date
- The billing date is set to the day of initial subscription
- Example: If a user subscribes on March 15th, their next billing date for a monthly plan would be April 15th

## Proration Rules
When users upgrade or downgrade their subscription:
- Upgrades: Immediate access to new features, prorated charge for the remainder of the billing cycle
- Downgrades: Changes take effect at the end of the current billing cycle

## Payment Methods
- Credit/Debit Cards
- PayPal
- GCash
- Bank Transfer (for annual plans only)

## Failed Payments
1. First attempt: On the billing date
2. Second attempt: 3 days after billing date
3. Third attempt: 7 days after billing date
4. Account suspension: 14 days after billing date

## Cancellation Policy
- Users can cancel at any time
- No refunds for partial billing periods
- Access continues until the end of the paid period

## Subscription Reactivation
- Within 30 days: Reactivate with the same plan and billing cycle
- After 30 days: Must sign up as a new subscription

For special cases or exceptions, please consult with the billing department.`,
          category: 'Billing',
          tags: ['subscription', 'billing', 'payment'],
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'Billing Team',
          viewCount: 312
        }
      ];
      
      const foundArticle = sampleArticles.find(a => a.id === articleId);
      
      if (foundArticle) {
        setArticle(foundArticle);
      } else {
        // Article not found
        router.replace('/support/knowledge-base');
      }
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Convert markdown-like content to formatted sections
  const renderContent = (content: string) => {
    // Very simple markdown parsing for headings and lists
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Heading 1
      if (line.startsWith('# ')) {
        return (
          <Text key={index} style={[styles.heading1, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {line.substring(2)}
          </Text>
        );
      }
      // Heading 2
      else if (line.startsWith('## ')) {
        return (
          <Text key={index} style={[styles.heading2, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {line.substring(3)}
          </Text>
        );
      }
      // Heading 3
      else if (line.startsWith('### ')) {
        return (
          <Text key={index} style={[styles.heading3, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {line.substring(4)}
          </Text>
        );
      }
      // List item
      else if (line.startsWith('- ')) {
        return (
          <View key={index} style={styles.listItem}>
            <Text style={[styles.listBullet, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>•</Text>
            <Text style={[styles.listText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {line.substring(2)}
            </Text>
          </View>
        );
      }
      // Numbered list item
      else if (/^\d+\.\s/.test(line)) {
        const number = line.match(/^\d+/)?.[0] || '';
        return (
          <View key={index} style={styles.listItem}>
            <Text style={[styles.listNumber, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {number}.
            </Text>
            <Text style={[styles.listText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {line.substring(number.length + 2)}
            </Text>
          </View>
        );
      }
      // Empty line
      else if (line.trim() === '') {
        return <View key={index} style={styles.emptyLine} />;
      }
      // Regular text
      else {
        return (
          <Text key={index} style={[styles.paragraph, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {line}
          </Text>
        );
      }
    });
  };

  return (
    <View style={[styles.pageContainer, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
      {/* Support Navigation Bar */}
      <SupportNavBar />
      
      {/* Main Content */}
      <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Loading article...</Text>
          </View>
        ) : article ? (
          <>
            <LinearGradient
              colors={colors.gradientColors}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.push('/support/knowledge-base')}
                  >
                    <FontAwesome5 name="arrow-left" size={16} color="#FFFFFF" />
                    <Text style={styles.backButtonText}>Back to Knowledge Base</Text>
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>{article.title}</Text>
                </View>
              </View>
            </LinearGradient>
            
            <View style={styles.articleContainer}>
              {/* Article Metadata */}
              <View style={styles.metadataContainer}>
                <View style={styles.metadataRow}>
                  <View style={styles.metadataItem}>
                    <Text style={[styles.metadataLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                      Category
                    </Text>
                    <Text style={[styles.metadataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      {article.category}
                    </Text>
                  </View>
                  
                  <View style={styles.metadataItem}>
                    <Text style={[styles.metadataLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                      Author
                    </Text>
                    <Text style={[styles.metadataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      {article.author}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.metadataRow}>
                  <View style={styles.metadataItem}>
                    <Text style={[styles.metadataLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                      Last Updated
                    </Text>
                    <Text style={[styles.metadataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      {formatDate(article.updatedAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.metadataItem}>
                    <Text style={[styles.metadataLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                      Views
                    </Text>
                    <Text style={[styles.metadataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      {article.viewCount}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tagsContainer}>
                  <Text style={[styles.metadataLabel, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
                    Tags
                  </Text>
                  <View style={styles.tagsList}>
                    {article.tags.map((tag, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.tagBadge,
                          { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }
                        ]}
                      >
                        <Text style={[styles.tagText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Article Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }
                  ]}
                  onPress={() => setIsEditing(true)}
                >
                  <FontAwesome5 name="edit" size={16} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  <Text style={[styles.actionText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }
                  ]}
                  onPress={() => console.log('Print article')}
                >
                  <FontAwesome5 name="print" size={16} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  <Text style={[styles.actionText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    Print
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }
                  ]}
                  onPress={() => console.log('Share article')}
                >
                  <FontAwesome5 name="share-alt" size={16} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  <Text style={[styles.actionText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    Share
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Article Content */}
              <View style={[
                styles.contentContainer,
                { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
              ]}>
                {renderContent(article.content)}
              </View>
              
              {/* Related Articles */}
              <View style={styles.relatedContainer}>
                <Text style={[styles.relatedTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  Related Articles
                </Text>
                
                <TouchableOpacity 
                  style={[
                    styles.relatedArticle,
                    { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
                  ]}
                  onPress={() => router.push('/support/knowledge-base/2')}
                >
                  <Text style={[styles.relatedArticleTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    Troubleshooting app crashes on iOS devices
                  </Text>
                  <FontAwesome5 name="chevron-right" size={14} color={isDarkMode ? '#AAAAAA' : '#666666'} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.relatedArticle,
                    { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
                  ]}
                  onPress={() => router.push('/support/knowledge-base/3')}
                >
                  <Text style={[styles.relatedArticleTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    Understanding subscription billing cycles
                  </Text>
                  <FontAwesome5 name="chevron-right" size={14} color={isDarkMode ? '#AAAAAA' : '#666666'} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.notFoundContainer}>
            <FontAwesome5 name="exclamation-circle" size={48} color="#dc3545" />
            <Text style={[styles.notFoundTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Article Not Found
            </Text>
            <Text style={[styles.notFoundSubtitle, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
              The article you're looking for doesn't exist or has been removed
            </Text>
            <TouchableOpacity 
              style={[styles.notFoundButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/support/knowledge-base')}
            >
              <Text style={styles.notFoundButtonText}>
                Back to Knowledge Base
              </Text>
            </TouchableOpacity>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  articleContainer: {
    padding: 15,
  },
  metadataContainer: {
    marginBottom: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  metadataItem: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    marginTop: 5,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
  },
  contentContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  heading1: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 10,
  },
  listBullet: {
    fontSize: 14,
    marginRight: 8,
  },
  listNumber: {
    fontSize: 14,
    marginRight: 8,
    minWidth: 20,
  },
  listText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 22,
  },
  emptyLine: {
    height: 10,
  },
  relatedContainer: {
    marginBottom: 20,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  relatedArticle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  relatedArticleTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  notFoundContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  notFoundSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 300,
  },
  notFoundButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  notFoundButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 