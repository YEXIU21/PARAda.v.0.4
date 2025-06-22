import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Subscription, SubscriptionId } from '@/constants/SubscriptionPlans';

interface SubscriptionViewProps {
  subscriptionPlans: Subscription[];
  onSubscribe: (planId: SubscriptionId) => void;
  onClose: () => void;
  theme: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    gradientColors: [string, string];
  };
  isDarkMode: boolean;
}

export default function SubscriptionView({
  subscriptionPlans,
  onSubscribe,
  onClose,
  theme,
  isDarkMode
}: SubscriptionViewProps) {
  const [expandedFeature, setExpandedFeature] = useState<{planId: string, featureIdx: number} | null>(null);

  return (
    <View style={[styles.fullScreenContainer, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradientColors as [string, string]}
        style={styles.fullScreenHeader}
      >
        <View style={styles.headerTitleContainer}>
          <Text style={styles.fullScreenTitle}>Choose a Subscription</Text>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButtonContainer}
          >
            <View style={[styles.closeButtonCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <FontAwesome5 name="times" size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.fullScreenBody}>
        {subscriptionPlans.map((plan) => (
          <View 
            key={plan.id}
            style={[
              styles.subscriptionCard,
              { 
                backgroundColor: theme.card, 
                borderColor: plan.recommended ? theme.primary : theme.border 
              },
              plan.recommended && styles.recommendedSubscription
            ]}
          >
            {plan.recommended && (
              <View style={[styles.recommendedBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.recommendedText}>BEST VALUE</Text>
              </View>
            )}
            <Text style={[styles.subscriptionName, { color: theme.text }]}>{plan.name}</Text>
            <Text style={[styles.subscriptionPrice, { color: theme.primary }]}>
              {typeof plan.price === 'string' 
                ? plan.price 
                : `₱${plan.price}/${typeof plan.duration === 'string' && plan.duration.toLowerCase().includes('yearly') ? 'year' : 'month'}`
              }
            </Text>
            <Text style={[styles.subscriptionDuration, { color: theme.textSecondary }]}>{plan.duration}</Text>
            
            <View style={styles.paymentMethodIndicator}>
              <FontAwesome5 name="money-bill-wave" size={14} color={theme.textSecondary} />
              <Text style={[styles.paymentMethodText, { color: theme.textSecondary }]}>
                Payment via GCash
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <View style={styles.featuresListContainer}>
              <Text style={[styles.featuresListTitle, { color: theme.text }]}>Features:</Text>
              {plan.features.map((feature, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.featureListItem, {
                    backgroundColor: 
                      expandedFeature?.planId === plan.id && expandedFeature?.featureIdx === index 
                        ? `${theme.primary}15` 
                        : 'transparent'
                  }]}
                  onPress={() => {
                    if (expandedFeature && 
                        expandedFeature.planId === plan.id && 
                        expandedFeature.featureIdx === index) {
                      setExpandedFeature(null);
                    } else {
                      setExpandedFeature({ planId: plan.id, featureIdx: index });
                    }
                  }}
                >
                  <View style={styles.featureListItemHeader}>
                    <FontAwesome5 
                      name="check-circle" 
                      size={16} 
                      color={theme.primary} 
                      style={styles.featureIcon}
                    />
                    <Text style={[styles.featureListText, { color: theme.text }]}>{feature}</Text>
                    <FontAwesome5 
                      name={expandedFeature && 
                            expandedFeature.planId === plan.id && 
                            expandedFeature.featureIdx === index ? "chevron-up" : "chevron-down"} 
                      size={14} 
                      color={theme.textSecondary} 
                    />
                  </View>
                  
                  {expandedFeature && 
                    expandedFeature.planId === plan.id && 
                    expandedFeature.featureIdx === index && (
                    <View style={[styles.featureListDetail, { borderTopColor: theme.border }]}>
                      <Text style={[styles.featureDetailText, { color: theme.textSecondary }]}>
                        Detailed information about this feature would appear here. This helps users understand the benefits and how to use this feature.
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.subscribeButton, { backgroundColor: theme.primary }]}
              onPress={() => onSubscribe(plan.id as SubscriptionId)}
            >
              <Text style={styles.subscribeButtonText}>Subscribe with GCash</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullScreenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButtonContainer: {
    padding: 5,
  },
  closeButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenBody: {
    padding: 20,
  },
  subscriptionCard: {
    borderRadius: 10,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendedSubscription: {
    borderWidth: 2,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  recommendedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subscriptionName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subscriptionPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subscriptionDuration: {
    fontSize: 14,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  featuresListContainer: {
    marginTop: 5,
    marginBottom: 15,
  },
  featuresListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  featureListItem: {
    borderRadius: 5,
    marginBottom: 5,
    overflow: 'hidden',
  },
  featureListItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureListText: {
    fontSize: 16,
    flex: 1,
  },
  featureListDetail: {
    padding: 10,
    borderTopWidth: 1,
  },
  featureDetailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  subscribeButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentMethodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentMethodText: {
    marginLeft: 5,
  },
}); 