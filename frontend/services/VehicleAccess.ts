/**
 * Vehicle Access Service
 * Provides utilities for managing vehicle type access based on subscription
 */
import { VehicleTypeId } from '../constants/VehicleTypes';
import { User } from '../context/AuthContext';

/**
 * Check if a user has access to a specific vehicle type
 * @param user - The user object
 * @param vehicleType - The vehicle type to check access for
 * @returns boolean - Whether the user has access to the vehicle type
 */
export const hasAccessToVehicleType = (
  user: User | null, 
  vehicleType: VehicleTypeId
): boolean => {
  // Admin and driver users have access to all routes
  if (user?.role === 'admin' || user?.role === 'driver') {
    return true;
  }
  
  // If no user or no subscription, no access
  if (!user || !user.subscription) {
    return false;
  }
  
  // Check if subscription is valid - either verified flag is true or isActive is true
  // This ensures that if either field is properly set, the user gets access
  const isSubscriptionValid = user.subscription.verified === true || 
                             (user.subscription as any).isActive === true;
  
  if (!isSubscriptionValid) {
    return false;
  }
  
  // If user has a valid subscription, give access to all vehicle types
  // This ensures subscribed users (passengers/students) have access to any vehicle
  return true;
};

/**
 * Get all vehicle types a user has access to
 * @param user - The user object
 * @returns VehicleTypeId[] - Array of vehicle types the user has access to
 */
export const getAccessibleVehicleTypes = (user: User | null): VehicleTypeId[] => {
  // Admin and driver users have access to all routes
  if (user?.role === 'admin' || user?.role === 'driver') {
    return ['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'];
  }
  
  // If no user or no subscription, no access
  if (!user || !user.subscription) {
    return [];
  }
  
  // Check if subscription is valid - either verified flag is true or isActive is true
  const isSubscriptionValid = user.subscription.verified === true || 
                             (user.subscription as any).isActive === true;
  
  if (!isSubscriptionValid) {
    return [];
  }
  
  // If user has a valid subscription, give access to all vehicle types
  // This ensures subscribed users (passengers/students) have access to any vehicle
  return ['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'];
};

/**
 * Check if a route is accessible to a user
 * @param user - The user object
 * @param route - The route object
 * @returns boolean - Whether the user has access to the route
 */
export const isRouteAccessible = (
  user: User | null,
  route: { vehicleType?: VehicleTypeId; type?: VehicleTypeId }
): boolean => {
  // Admin and driver users have access to all routes
  if (user?.role === 'admin' || user?.role === 'driver') {
    return true;
  }
  
  // If no user or no subscription, no access
  if (!user || !user.subscription) {
    return false;
  }
  
  // Check if subscription is valid - either verified flag is true or isActive is true
  const isSubscriptionValid = user.subscription.verified === true || 
                             (user.subscription as any).isActive === true;
  
  if (!isSubscriptionValid) {
    return false;
  }
  
  // Get the route's vehicle type
  const routeType = route.vehicleType || route.type;
  
  // If no route type, assume accessible for verified subscriptions
  if (!routeType) {
    return true;
  }
  
  // For verified subscriptions, all vehicle types are accessible
  return true;
}; 