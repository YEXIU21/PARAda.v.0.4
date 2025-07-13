import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../../components/ThemedText';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import SupportNavBar from '../../components/SupportNavBar';

// Define types for knowledge base articles
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

export default function KnowledgeBasePage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);

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
    loadKnowledgeArticles();
  }, []);

  // Load knowledge articles
  const loadKnowledgeArticles = async () => {
    // In a real app, this would fetch from an API
    // For now, we'll use sample data
    const sampleArticles: KnowledgeArticle[] = [
      {
        id: '1',
        title: 'How to reset a user password',
        content: 'This guide explains the process for resetting user passwords in the admin panel...',
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
        content: 'Common causes and solutions for app crashes on iOS devices...',
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
        content: 'Explanation of how billing cycles work for different subscription plans...',
        category: 'Billing',
        tags: ['subscription', 'billing', 'payment'],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Billing Team',
        viewCount: 312
      },
      {
        id: '4',
        title: 'How to handle refund requests',
        content: 'Process and guidelines for handling customer refund requests...',
        category: 'Billing',
        tags: ['refund', 'payment', 'customer service'],
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Support Team',
        viewCount: 189
      },
      {
        id: '5',
        title: 'Common driver app issues and solutions',
        content: 'Troubleshooting guide for the most frequent issues reported by drivers...',
        category: 'Technical Support',
        tags: ['driver', 'app', 'troubleshooting'],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Driver Support Team',
        viewCount: 423
      },
      {
        id: '6',
        title: 'Setting up route notifications',
        content: 'How to configure and manage route notifications for passengers...',
        category: 'Features',
        tags: ['notifications', 'routes', 'settings'],
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Product Team',
        viewCount: 156
      }
    ];

    setArticles(sampleArticles);
    setFilteredArticles(sampleArticles);
    setIsLoading(false);
  };

  // Filter articles based on search query and category filter
  useEffect(() => {
    let result = [...articles];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(article => article.category === categoryFilter);
    }
    
    setFilteredArticles(result);
  }, [searchQuery, categoryFilter, articles]);

  // Get unique categories
  const categories = [...new Set(articles.map(article => article.category))];

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle article click
  const handleArticleClick = (articleId: string) => {
    // In a real app, navigate to article detail page
    router.push(`/support/knowledge-base/${articleId}`);
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
              <Text style={styles.headerTitle}>Knowledge Base</Text>
              <Text style={styles.headerSubtitle}>
                Internal support articles and resources
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
          {/* Search and filters */}
          <View style={styles.searchContainer}>
            <View style={[
              styles.searchInputContainer, 
              { backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5' }
            ]}>
              <FontAwesome5 
                name="search" 
                size={16} 
                color={isDarkMode ? '#BBBBBB' : '#666666'} 
                style={styles.searchIcon} 
              />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDarkMode ? '#FFFFFF' : '#333333' }
                ]}
                placeholder="Search knowledge base..."
                placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <View style={styles.filtersContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  categoryFilter === null && styles.activeFilter
                ]}
                onPress={() => setCategoryFilter(null)}
              >
                <Text style={[
                  styles.filterText,
                  categoryFilter === null && styles.activeFilterText
                ]}>
                  All Categories
                </Text>
              </TouchableOpacity>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterButton,
                    categoryFilter === category && styles.activeFilter
                  ]}
                  onPress={() => setCategoryFilter(category)}
                >
                  <Text style={[
                    styles.filterText,
                    categoryFilter === category && styles.activeFilterText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Add Article Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/support/knowledge-base/new')}
            >
              <FontAwesome5 name="plus" size={12} color="#FFFFFF" style={styles.addButtonIcon} />
              <Text style={styles.addButtonText}>Add New Article</Text>
            </TouchableOpacity>
          </View>

          {/* Articles list */}
          <View style={styles.articlesContainer}>
            <ThemedText type="title" style={styles.sectionTitle}>
              {filteredArticles.length} Articles
            </ThemedText>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={{ color: isDarkMode ? '#FFFFFF' : '#333333' }}>Loading articles...</Text>
              </View>
            ) : filteredArticles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome5 name="book" size={40} color={isDarkMode ? '#555555' : '#CCCCCC'} />
                <Text style={[styles.emptyText, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                  No articles found
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredArticles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.articleCard,
                      { backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8' }
                    ]}
                    onPress={() => handleArticleClick(item.id)}
                  >
                    <View style={styles.articleHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.articleTitle}>
                        {item.title}
                      </ThemedText>
                      <View style={[
                        styles.categoryBadge, 
                        { backgroundColor: isDarkMode ? '#333333' : '#EEEEEE' }
                      ]}>
                        <Text style={[
                          styles.categoryText, 
                          { color: isDarkMode ? '#FFFFFF' : '#333333' }
                        ]}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                    
                    <Text 
                      style={[styles.articleContent, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}
                      numberOfLines={2}
                    >
                      {item.content}
                    </Text>
                    
                    <View style={styles.tagsContainer}>
                      {item.tags.map((tag, index) => (
                        <View 
                          key={index}
                          style={[
                            styles.tagBadge,
                            { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }
                          ]}
                        >
                          <Text style={[
                            styles.tagText,
                            { color: isDarkMode ? '#BBBBBB' : '#666666' }
                          ]}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.articleFooter}>
                      <Text style={[styles.articleMeta, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                        By {item.author} • Updated {formatDate(item.updatedAt)}
                      </Text>
                      <View style={styles.viewsContainer}>
                        <FontAwesome5 
                          name="eye" 
                          size={12} 
                          color={isDarkMode ? '#BBBBBB' : '#666666'} 
                          style={styles.viewIcon} 
                        />
                        <Text style={[styles.viewCount, { color: isDarkMode ? '#BBBBBB' : '#666666' }]}>
                          {item.viewCount}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.articlesList}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  container: { 
    flex: 1 
  },
  header: { 
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  contentContainer: {
    padding: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#DDDDDD',
    marginRight: 10,
    marginBottom: 10,
  },
  activeFilter: {
    backgroundColor: '#3498db',
  },
  filterText: {
    color: '#333333',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  articlesContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
  },
  articlesList: {
    width: '100%',
  },
  articleCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  articleTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
  },
  articleContent: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tagBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleMeta: {
    fontSize: 12,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewIcon: {
    marginRight: 5,
  },
  viewCount: {
    fontSize: 12,
  }
}); 