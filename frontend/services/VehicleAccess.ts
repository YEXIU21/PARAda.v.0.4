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
  // If no user or no subscription, no access
  if (!user || !user.subscription) {
    return false;
  }
  
  // If subscription is not verified, no access
  if (!user.subscription.verified) {
    return false;
  }
  
  // If subscription type is 'all', access to all vehicle types
  if (user.subscription.type === 'all') {
    return true;
  }
  
  // Otherwise, check if subscription type matches vehicle type
  return user.subscription.type === vehicleType;
};

/**
 * Get all vehicle types a user has access to
 * @param user - The user object
 * @returns VehicleTypeId[] - Array of vehicle types the user has access to
 */
export const getAccessibleVehicleTypes = (user: User | null): VehicleTypeId[] => {
  // If no user or no subscription, no access
  if (!user || !user.subscription) {
    return [];
  }
  
  // If subscription is not verified, no access
  if (!user.subscription.verified) {
    return [];
  }
  
  // If subscription type is 'all', access to all vehicle types
  if (user.subscription.type === 'all') {
    return ['latransco', 'calvo', 'corominas', 'ceres', 'gabe', 'jeep'];
  }
  
  // Otherwise, only access to the specific vehicle type
  return [user.subscription.type as VehicleTypeId];
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
  
  // Get the route's vehicle type
  const routeType = route.vehicleType || route.type;
  
  // If no route type, assume accessible
  if (!routeType) {
    return true;
  }
  
  // Check if user has access to this vehicle type
  return hasAccessToVehicleType(user, routeType);
}; 