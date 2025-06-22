import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { createSubscription, verifySubscription, getSubscriptionPlans } from '../services/api/subscription.api';
import { BASE_URL } from '../services/api/api.config';

export default function SubscriptionTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [referenceNumber, setReferenceNumber] = useState('GC' + Date.now().toString().substring(5));

  const log = (message: string) => {
    setResults((prev) => [...prev, message]);
  };

  const testGetPlans = async () => {
    setLoading(true);
    log('Testing getSubscriptionPlans...');
    log(`Using BASE_URL: ${BASE_URL}`);
    
    try {
      const plans = await getSubscriptionPlans();
      log(`Success! Found ${plans.length} plans`);
      log(JSON.stringify(plans, null, 2));
    } catch (error: any) {
      log(`Error: ${error.message}`);
      if (error.response) {
        log(`Status: ${error.response.status}`);
        log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testCreateSubscription = async () => {
    setLoading(true);
    log('Testing createSubscription...');
    log(`Using reference number: ${referenceNumber}`);
    
    try {
      const subscriptionData = {
        planId: 'basic',
        referenceNumber: referenceNumber,
        paymentMethod: 'gcash',
        autoRenew: false,
        studentDiscount: {
          applied: false,
          percentage: 0
        }
      };
      
      const subscription = await createSubscription(subscriptionData);
      log('Success! Subscription created:');
      log(JSON.stringify(subscription, null, 2));
    } catch (error: any) {
      log(`Error: ${error.message}`);
      if (error.response) {
        log(`Status: ${error.response.status}`);
        log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription API Test</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Reference Number:</Text>
        <TextInput
          style={styles.input}
          value={referenceNumber}
          onChangeText={setReferenceNumber}
          placeholder="e.g. GC123456789"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Get Plans" 
          onPress={testGetPlans} 
          disabled={loading} 
        />
        <Button 
          title="Create Subscription" 
          onPress={testCreateSubscription} 
          disabled={loading} 
        />
        <Button 
          title="Clear Logs" 
          onPress={clearLogs} 
          disabled={loading} 
        />
      </View>
      
      <ScrollView style={styles.logContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.logText}>
            {result}
          </Text>
        ))}
        {loading && <Text style={[styles.logText, styles.loading]}>Loading...</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  loading: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
}); 