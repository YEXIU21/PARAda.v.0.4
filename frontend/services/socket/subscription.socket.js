/**
 * Subscription Socket Service
 * Handles real-time subscription events
 */
import { subscribeToEvent, unsubscribeFromEvent, emitEvent } from './socket.service';

// Event names
const EVENTS = {
  SUBSCRIPTION_CREATED: 'subscription:created',
  SUBSCRIPTION_UPDATED: 'subscription:updated',
  SUBSCRIPTION_VERIFIED: 'subscription:verified',
  SUBSCRIPTION_CANCELLED: 'subscription:cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription:expired',
  ADMIN_SUBSCRIBE: 'admin:subscribe',
  ADMIN_UNSUBSCRIBE: 'admin:unsubscribe'
};

/**
 * Subscribe to all subscription events
 * @param {Function} onCreated - Callback for subscription created
 * @param {Function} onUpdated - Callback for subscription updated
 * @param {Function} onVerified - Callback for subscription verified
 * @param {Function} onCancelled - Callback for subscription cancelled
 * @param {Function} onExpired - Callback for subscription expired
 */
export const subscribeToSubscriptionEvents = (
  onCreated,
  onUpdated,
  onVerified,
  onCancelled,
  onExpired
) => {
  if (onCreated) subscribeToEvent(EVENTS.SUBSCRIPTION_CREATED, onCreated);
  if (onUpdated) subscribeToEvent(EVENTS.SUBSCRIPTION_UPDATED, onUpdated);
  if (onVerified) subscribeToEvent(EVENTS.SUBSCRIPTION_VERIFIED, onVerified);
  if (onCancelled) subscribeToEvent(EVENTS.SUBSCRIPTION_CANCELLED, onCancelled);
  if (onExpired) subscribeToEvent(EVENTS.SUBSCRIPTION_EXPIRED, onExpired);
};

/**
 * Unsubscribe from all subscription events
 * @param {Function} onCreated - Callback for subscription created
 * @param {Function} onUpdated - Callback for subscription updated
 * @param {Function} onVerified - Callback for subscription verified
 * @param {Function} onCancelled - Callback for subscription cancelled
 * @param {Function} onExpired - Callback for subscription expired
 */
export const unsubscribeFromSubscriptionEvents = (
  onCreated,
  onUpdated,
  onVerified,
  onCancelled,
  onExpired
) => {
  if (onCreated) unsubscribeFromEvent(EVENTS.SUBSCRIPTION_CREATED, onCreated);
  if (onUpdated) unsubscribeFromEvent(EVENTS.SUBSCRIPTION_UPDATED, onUpdated);
  if (onVerified) unsubscribeFromEvent(EVENTS.SUBSCRIPTION_VERIFIED, onVerified);
  if (onCancelled) unsubscribeFromEvent(EVENTS.SUBSCRIPTION_CANCELLED, onCancelled);
  if (onExpired) unsubscribeFromEvent(EVENTS.SUBSCRIPTION_EXPIRED, onExpired);
};

/**
 * Subscribe to admin subscription events
 * This will tell the server to send all subscription events to this client
 */
export const subscribeToAdminEvents = () => {
  emitEvent(EVENTS.ADMIN_SUBSCRIBE, {});
  console.log('Subscribed to admin subscription events');
};

/**
 * Unsubscribe from admin subscription events
 */
export const unsubscribeFromAdminEvents = () => {
  emitEvent(EVENTS.ADMIN_UNSUBSCRIBE, {});
  console.log('Unsubscribed from admin subscription events');
}; 