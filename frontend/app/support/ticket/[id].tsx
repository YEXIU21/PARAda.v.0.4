import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SupportLayout from '../../../components/layouts/SupportLayout';
import { getTicketById, updateTicketStatus, updateTicketPriority, addTicketReply, Ticket, TicketMessage } from '../../../services/api/support.api';
import { useAuth } from '../../../context/AuthContext';

const TicketDetailsScreen = () => {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch ticket details
  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await getTicketById(id.toString());
        if (response.success) {
          setTicket(response.data);
        } else {
          setError(response.message || 'Failed to fetch ticket details');
        }
      } catch (err) {
        console.error(`Error fetching ticket ${id}:`, err);
        setError('An error occurred while fetching ticket details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicketDetails();
  }, [id]);

  // Handle status change
  const handleStatusChange = async (newStatus: 'open' | 'in-progress' | 'resolved' | 'closed') => {
    if (!ticket) return;
    
    try {
      const response = await updateTicketStatus(ticket.id, newStatus);
      if (response.success) {
        setTicket({
          ...ticket,
          status: newStatus,
          lastUpdated: response.data.lastUpdated || new Date().toISOString()
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to update ticket status');
      }
    } catch (err) {
      console.error(`Error updating ticket ${ticket.id} status:`, err);
      Alert.alert('Error', 'An error occurred while updating ticket status');
    }
  };

  // Handle priority change
  const handlePriorityChange = async (newPriority: 'low' | 'medium' | 'high' | 'critical') => {
    if (!ticket) return;
    
    try {
      const response = await updateTicketPriority(ticket.id, newPriority);
      if (response.success) {
        setTicket({
          ...ticket,
          priority: newPriority,
          lastUpdated: response.data.lastUpdated || new Date().toISOString()
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to update ticket priority');
      }
    } catch (err) {
      console.error(`Error updating ticket ${ticket.id} priority:`, err);
      Alert.alert('Error', 'An error occurred while updating ticket priority');
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!replyText.trim() || !ticket) return;

    setSendingReply(true);
    
    try {
      const response = await addTicketReply(ticket.id, replyText.trim());
      if (response.success) {
        // Update local ticket state with the new message
        const updatedTicket = response.data;
        setTicket(updatedTicket);
        setReplyText('');
      } else {
        Alert.alert('Error', response.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error(`Error adding reply to ticket ${ticket.id}:`, err);
      Alert.alert('Error', 'An error occurred while sending your reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Render priority badge
  const renderPriorityBadge = (priority: string) => {
    let color = '';
    
    switch (priority) {
      case 'low':
        color = '#28a745';
        break;
      case 'medium':
        color = '#ffc107';
        break;
      case 'high':
        color = '#fd7e14';
        break;
      case 'critical':
        color = '#dc3545';
        break;
      default:
        color = '#6c757d';
    }
    
    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{priority}</Text>
      </View>
    );
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    let color = '';
    
    switch (status) {
      case 'open':
        color = '#17a2b8';
        break;
      case 'in-progress':
        color = '#fd7e14';
        break;
      case 'resolved':
        color = '#28a745';
        break;
      case 'closed':
        color = '#6c757d';
        break;
      default:
        color = '#6c757d';
    }
    
    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <SupportLayout title="Ticket Details" subtitle={`Ticket #${id}`}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading ticket details...
          </Text>
        </View>
      </SupportLayout>
    );
  }

  if (!ticket) {
    return (
      <SupportLayout title="Ticket Not Found" subtitle={`Ticket #${id}`}>
        <View style={styles.notFoundContainer}>
          <FontAwesome5 name="exclamation-circle" size={48} color={colors.error} />
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            Ticket not found
          </Text>
          <Text style={[styles.notFoundSubtext, { color: colors.textSecondary }]}>
            The ticket you are looking for does not exist or has been deleted.
          </Text>
        </View>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout title="Ticket Details" subtitle={`Ticket #${ticket.id}`}>
      <View style={styles.container}>
        {/* Ticket Header */}
        <View style={[styles.ticketHeader, { backgroundColor: colors.card }]}>
          <Text style={[styles.ticketSubject, { color: colors.text }]}>{ticket.subject}</Text>
          
          <View style={styles.ticketMeta}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Status:</Text>
              {renderStatusBadge(ticket.status)}
            </View>
            
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Priority:</Text>
              {renderPriorityBadge(ticket.priority)}
            </View>
            
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Category:</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{ticket.category}</Text>
            </View>
          </View>
          
          <View style={styles.ticketInfo}>
            <View style={styles.infoItem}>
              <FontAwesome5 name="user" size={14} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {ticket.username} ({ticket.userEmail})
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <FontAwesome5 name="calendar" size={14} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Created: {formatDate(ticket.createdAt)}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <FontAwesome5 name="clock" size={14} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Updated: {formatDate(ticket.lastUpdated)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionGroup}>
            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Change Status:</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  ticket.status === 'open' && { backgroundColor: colors.primary }
                ]}
                onPress={() => handleStatusChange('open')}
              >
                <Text style={[
                  styles.actionButtonText,
                  ticket.status === 'open' ? { color: '#fff' } : { color: colors.text }
                ]}>Open</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  ticket.status === 'in-progress' && { backgroundColor: colors.primary }
                ]}
                onPress={() => handleStatusChange('in-progress')}
              >
                <Text style={[
                  styles.actionButtonText,
                  ticket.status === 'in-progress' ? { color: '#fff' } : { color: colors.text }
                ]}>In Progress</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  ticket.status === 'resolved' && { backgroundColor: colors.primary }
                ]}
                onPress={() => handleStatusChange('resolved')}
              >
                <Text style={[
                  styles.actionButtonText,
                  ticket.status === 'resolved' ? { color: '#fff' } : { color: colors.text }
                ]}>Resolved</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  ticket.status === 'closed' && { backgroundColor: colors.primary }
                ]}
                onPress={() => handleStatusChange('closed')}
              >
                <Text style={[
                  styles.actionButtonText,
                  ticket.status === 'closed' ? { color: '#fff' } : { color: colors.text }
                ]}>Closed</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.actionGroup}>
            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Change Priority:</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  ticket.priority === 'low' && { backgroundColor: '#28a745' }
                ]}
                onPress={() => handlePriorityChange('low')}
              >
                <Text style={[
                  styles.actionButtonText,
                  ticket.priority === 'low' ? { color: '#fff' } : { color: colors.text }
                ]}>Low</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  ticket.priority === 'medium' && { backgroundColor: '#ffc107' }
                ]}
                onPress={() => handlePriorityChange('medium')}
              >
                <Text style={[
                  styles.actionButtonText,
                  ticket.priority === 'medium' ? { color: '#fff' } : { color: colors.text }
                ]}>Medium</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  ticket.priority === 'high' && { backgroundColor: '#fd7e14' }
                ]}
                onPress={() => handlePriorityChange('high')}
              >
                <Text style={[
                  styles.actionButtonText,
                  ticket.priority === 'high' ? { color: '#fff' } : { color: colors.text }
                ]}>High</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  ticket.priority === 'critical' && { backgroundColor: '#dc3545' }
                ]}
                onPress={() => handlePriorityChange('critical')}
              >
                <Text style={[
                  styles.actionButtonText,
                  ticket.priority === 'critical' ? { color: '#fff' } : { color: colors.text }
                ]}>Critical</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Messages */}
        <View style={styles.messagesContainer}>
          <Text style={[styles.messagesTitle, { color: colors.text }]}>Conversation</Text>
          
          <ScrollView style={styles.messagesList}>
            {ticket.messages && ticket.messages.map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.messageItem,
                  { backgroundColor: colors.card },
                  message.senderRole === 'support' && styles.supportMessage
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={[
                    styles.messageSender, 
                    { 
                      color: message.senderRole === 'support' ? colors.primary : colors.text,
                      fontWeight: message.senderRole === 'support' ? 'bold' : 'normal'
                    }
                  ]}>
                    {message.senderName}
                    {message.senderRole === 'support' && ' (Support Team)'}
                  </Text>
                  <Text style={[styles.messageDate, { color: colors.textSecondary }]}>
                    {formatDate(message.createdAt)}
                  </Text>
                </View>
                
                <Text style={[styles.messageText, { color: colors.text }]}>
                  {message.message}
                </Text>
              </View>
            ))}
          </ScrollView>
          
          {/* Reply Box */}
          <View style={[styles.replyContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.replyInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Type your reply here..."
              placeholderTextColor={colors.textSecondary}
              multiline
              value={replyText}
              onChangeText={setReplyText}
              editable={!sendingReply}
            />
            
            <TouchableOpacity
              style={[
                styles.replyButton, 
                { backgroundColor: colors.primary },
                sendingReply && { opacity: 0.7 }
              ]}
              onPress={sendReply}
              disabled={sendingReply || !replyText.trim()}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="paper-plane" size={14} color="#fff" />
                  <Text style={styles.replyButtonText}>Send Reply</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SupportLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  ticketHeader: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  ticketMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  metaValue: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  ticketInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionGroup: {
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  messagesList: {
    flex: 1,
    marginBottom: 16,
  },
  messageItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  supportMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#4B6BFE',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 14,
  },
  messageDate: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  replyContainer: {
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 4,
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  notFoundSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TicketDetailsScreen; 