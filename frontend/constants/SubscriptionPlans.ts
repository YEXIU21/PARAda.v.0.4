/**
 * Default subscription plans for the application
 */

export interface Subscription {
  id: SubscriptionId;
  name: string;
  price: string | number;
  priceDisplay?: string;
  duration: string;
  features: string[];
  recommended?: boolean;
  discountPercent?: number;
}

export type SubscriptionId = 'basic' | 'premium' | 'annual' | 'student';

export const defaultSubscriptionPlans: Subscription[] = [
  { 
    id: 'basic', 
    name: 'Basic', 
    price: '₱99/month', 
    duration: 'Monthly',
    features: ['Real-time tracking', 'Schedule access', 'Traffic updates']
  },
  { 
    id: 'premium', 
    name: 'Premium', 
    price: '₱199/month', 
    duration: 'Monthly',
    features: ['All Basic features', 'Priority notifications', 'Offline maps', 'No advertisements'],
    recommended: true
  },
  { 
    id: 'annual', 
    name: 'Annual', 
    price: '₱999/year', 
    duration: 'Yearly (Save 16%)',
    features: ['All Premium features', '24/7 support', 'Schedule alarms', 'Trip history']
  }
]; 