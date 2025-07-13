import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { ThemedText } from '../../../components/ThemedText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import SupportNavBar from '../../../components/SupportNavBar';

// Define types for ticket and comments
interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
}

interface TicketComment {
  id: string;
  ticketId: string;
  authorType: 'customer' | 'support' | 'system';
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export default function TicketDetailPage() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const ticketId = typeof params.id === 'string' ? params.id : '';
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    loadTicketDetails();
  }, [ticketId]);
  
  // Load ticket details from API
  const loadTicketDetails = async () => {
    if (!ticketId) {
      router.replace('/support');
      return;
    }

    setIsLoading(true);

    try {
      // In a production app, this would use the ticket API
      import('../../../services/api/ticket.api').then(async (ticketApi) => {
        try {
          // Try to fetch from API
          const result = await ticketApi.getTicketById(ticketId);
          
          if (result && result.ticket) {
            setTicket(result.ticket);
            setComments(result.comments || []);
          } else {
            // Fallback to sample data if API returns empty
            useSampleData();
          }
        } catch (error) {
          console.error('Error fetching ticket details from API:', error);
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
      console.error('Error in loadTicketDetails:', error);
      useSampleData();
      setIsLoading(false);
    }
  };
  
  // Fallback to sample data when API is not available
  const useSampleData = () => {
    console.log('Using sample ticket data');
    
    // Sample ticket data
    const sampleTicket: Ticket = {
      id: ticketId || '1',
      ticketNumber: 'TKT-23-05-0001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      subject: 'App crashes on startup',
      description: 'Every time I open the app, it crashes immediately. I\'m using an iPhone 13 with iOS 16.2.',
      status: 'open',
      priority: 'high',
      category: 'technical',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      assignedTo: null
    };
    
    // Sample comments
    const sampleComments: TicketComment[] = [
      {
        id: '1',
        ticketId: ticketId || '1',
        authorType: 'customer',
        authorName: 'John Doe',
        content: 'Every time I open the app, it crashes immediately. I\'m using an iPhone 13 with iOS 16.2.',
        isInternal: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        ticketId: ticketId || '1',
        authorType: 'system',
        authorName: 'System',
        content: 'Ticket created and assigned to support team.',
        isInternal: true,
        createdAt: new Date(Date.now() - 3500000).toISOString()
      }
    ];
    
    setTicket(sampleTicket);
    setComments(sampleComments);
  };
  
  // Handle submitting a response to the ticket
  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !ticket) return;
    
    setIsSubmitting(true);
    
    try {
      // In a production app, this would use the ticket API
      const ticketApi = await import('../../../services/api/ticket.api');
      
      try {
        // Add comment to ticket
        await ticketApi.addComment(ticket.id, responseText, isInternal);
        
        // Update ticket status if needed
        if (ticket.status === 'open') {
          await ticketApi.updateTicket(ticket.id, { status: 'in-progress' });
        }
        
        // Refresh ticket details
        loadTicketDetails();
        
        // Clear response text
        setResponseText('');
        setIsInternal(false);
      } catch (error) {
        console.error('Error submitting response via API:', error);
        
        // Fallback to local state update if API fails
        fallbackSubmitResponse();
      }
    } catch (error) {
      console.error('Error importing ticket API:', error);
      
      // Fallback to local state update
      fallbackSubmitResponse();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fallback method when API is not available
  const fallbackSubmitResponse = () => {
    if (!ticket) return;
    
    // Create a new comment
    const newComment: TicketComment = {
      id: `local-${Date.now()}`,
      ticketId: ticket.id,
      authorType: 'support',
      authorName: user?.username || 'Support Agent',
      content: responseText,
      isInternal,
      createdAt: new Date().toISOString()
    };
    
    // Update comments
    setComments([...comments, newComment]);
    
    // Update ticket status if needed
    if (ticket.status === 'open') {
      setTicket({
        ...ticket,
        status: 'in-progress',
        updatedAt: new Date().toISOString()
      });
    }
    
    // Clear response text
    setResponseText('');
    setIsInternal(false);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#d32f2f';
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#feca57';
      case 'low':
        return '#1dd1a1';
      default:
        return '#c8d6e5';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#ff6b6b';
      case 'in-progress':
        return '#feca57';
      case 'pending':
        return '#54a0ff';
      case 'resolved':
        return '#1dd1a1';
      case 'closed':
        return '#c8d6e5';
      default:
        return '#c8d6e5';
    }
  };
  
  return (
    <View style={{ 
      flex: 1, 
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' 
    }}>
      {/* Support Navigation Bar */}
      <SupportNavBar />
      
      {/* Main Content */}
      <ScrollView style={{ flex: 1 }}>
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#333333' }}>Loading ticket details...</Text>
          </View>
        ) : ticket ? (
          <>
            <LinearGradient
              colors={colors.gradientColors}
              style={{
                paddingTop: 40,
                paddingBottom: 20,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 5,
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                width: '100%',
              }}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ marginRight: 15 }}
                >
                  <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: 4,
                  }}>
                    Ticket {ticket.ticketNumber}
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: '#fff',
                    opacity: 0.8,
                  }}>
                    {ticket.subject}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
            <View style={{
              padding: 20,
              maxWidth: 1200,
              alignSelf: 'center',
              width: '100%',
            }}>
              {/* Ticket details */}
              <View style={{
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
                borderRadius: 8,
                padding: 20,
                marginBottom: 20,
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 15,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#BBBBBB' : '#666666',
                      marginBottom: 4,
                    }}>
                      Customer
                    </Text>
                    <Text style={{
                      fontSize: 16,
                      color: isDarkMode ? '#FFFFFF' : '#333333',
                    }}>
                      {ticket.customerName}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: isDarkMode ? '#BBBBBB' : '#666666',
                    }}>
                      {ticket.customerEmail}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#BBBBBB' : '#666666',
                      marginBottom: 4,
                    }}>
                      Category
                    </Text>
                    <Text style={{
                      fontSize: 16,
                      color: isDarkMode ? '#FFFFFF' : '#333333',
                    }}>
                      {ticket.category}
                    </Text>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#BBBBBB' : '#666666',
                      marginBottom: 4,
                    }}>
                      Created
                    </Text>
                    <Text style={{
                      fontSize: 16,
                      color: isDarkMode ? '#FFFFFF' : '#333333',
                    }}>
                      {formatDate(ticket.createdAt)}
                    </Text>
                  </View>
                </View>
                
                <View style={{
                  flexDirection: 'row',
                  marginBottom: 15,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#BBBBBB' : '#666666',
                      marginBottom: 4,
                    }}>
                      Status
                    </Text>
                    <View style={{
                      backgroundColor: getStatusColor(ticket.status),
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 4,
                      alignSelf: 'flex-start',
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#BBBBBB' : '#666666',
                      marginBottom: 4,
                    }}>
                      Priority
                    </Text>
                    <View style={{
                      backgroundColor: getPriorityColor(ticket.priority),
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 4,
                      alignSelf: 'flex-start',
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 12,
                      color: isDarkMode ? '#BBBBBB' : '#666666',
                      marginBottom: 4,
                    }}>
                      Assigned To
                    </Text>
                    <Text style={{
                      fontSize: 16,
                      color: isDarkMode ? '#FFFFFF' : '#333333',
                    }}>
                      {ticket.assignedTo || 'Unassigned'}
                    </Text>
                  </View>
                </View>
                
                <View>
                  <Text style={{
                    fontSize: 12,
                    color: isDarkMode ? '#BBBBBB' : '#666666',
                    marginBottom: 4,
                  }}>
                    Description
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: isDarkMode ? '#FFFFFF' : '#333333',
                    lineHeight: 22,
                  }}>
                    {ticket.description}
                  </Text>
                </View>
              </View>
              
              {/* Comments section */}
              <View style={{ marginBottom: 20 }}>
                <ThemedText type="title" style={{ fontSize: 20, marginBottom: 15 }}>
                  Conversation
                </ThemedText>
                
                {comments.map((comment) => (
                  <View
                    key={comment.id}
                    style={{
                      backgroundColor: comment.isInternal 
                        ? (isDarkMode ? '#2A2A2A' : '#F0F0F0') 
                        : (isDarkMode ? '#1E1E1E' : '#F8F8F8'),
                      borderRadius: 8,
                      padding: 15,
                      marginBottom: 10,
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FontAwesome5
                          name={
                            comment.authorType === 'customer' 
                              ? 'user' 
                              : comment.authorType === 'support' 
                                ? 'headset' 
                                : 'cog'
                          }
                          size={14}
                          color={isDarkMode ? '#BBBBBB' : '#666666'}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: isDarkMode ? '#FFFFFF' : '#333333',
                        }}>
                          {comment.authorName}
                        </Text>
                        {comment.isInternal && (
                          <View style={{
                            backgroundColor: '#3498db',
                            paddingVertical: 2,
                            paddingHorizontal: 6,
                            borderRadius: 4,
                            marginLeft: 8,
                          }}>
                            <Text style={{
                              color: '#FFFFFF',
                              fontSize: 10,
                              fontWeight: 'bold',
                            }}>
                              Internal
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{
                        fontSize: 12,
                        color: isDarkMode ? '#BBBBBB' : '#666666',
                      }}>
                        {formatDate(comment.createdAt)}
                      </Text>
                    </View>
                    
                    <Text style={{
                      fontSize: 14,
                      color: isDarkMode ? '#FFFFFF' : '#333333',
                      lineHeight: 20,
                    }}>
                      {comment.content}
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* Response form */}
              <View style={{
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8',
                borderRadius: 8,
                padding: 20,
                marginBottom: 20,
              }}>
                <ThemedText type="defaultSemiBold" style={{ marginBottom: 10 }}>
                  Add Response
                </ThemedText>
                
                <TextInput
                  style={{
                    backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF',
                    borderRadius: 8,
                    padding: 15,
                    marginBottom: 10,
                    color: isDarkMode ? '#FFFFFF' : '#333333',
                    height: 120,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Type your response here..."
                  placeholderTextColor={isDarkMode ? '#BBBBBB' : '#666666'}
                  value={responseText}
                  onChangeText={setResponseText}
                  multiline
                />
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => setIsInternal(!isInternal)}
                    >
                      <FontAwesome5
                        name={isInternal ? 'check-square' : 'square'}
                        size={16}
                        color={isInternal ? '#3498db' : (isDarkMode ? '#BBBBBB' : '#666666')}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{
                        color: isDarkMode ? '#FFFFFF' : '#333333',
                      }}>
                        Internal Note
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={handleSubmitResponse}
                    disabled={isSubmitting || !responseText.trim()}
                  >
                    {isSubmitting ? (
                      <Text style={{ color: '#FFFFFF' }}>Sending...</Text>
                    ) : (
                      <>
                        <Text style={{ color: '#FFFFFF', marginRight: 8 }}>
                          Send Response
                        </Text>
                        <FontAwesome5 name="paper-plane" size={14} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Action buttons */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginBottom: 20,
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3498db',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 4,
                    marginRight: 10,
                  }}
                  onPress={() => {
                    // Assign ticket functionality would go here
                    alert('Assign ticket functionality not implemented yet');
                  }}
                >
                  <Text style={{ color: '#FFFFFF' }}>Assign Ticket</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: ticket.status === 'resolved' ? '#ff6b6b' : '#1dd1a1',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 4,
                  }}
                  onPress={() => {
                    // Mark as resolved functionality would go here
                    alert(ticket.status === 'resolved' 
                      ? 'Reopen ticket functionality not implemented yet' 
                      : 'Mark as resolved functionality not implemented yet');
                  }}
                >
                  <Text style={{ color: '#FFFFFF' }}>
                    {ticket.status === 'resolved' ? 'Reopen Ticket' : 'Mark as Resolved'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#333333' }}>Ticket not found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
} 