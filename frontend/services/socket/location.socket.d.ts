/**
 * TypeScript declarations for location.socket.js
 */

/**
 * Initialize location tracking socket
 * @param clientId - Client ID for tracking
 * @param token - Authentication token
 * @returns Socket instance
 */
export function initializeLocationSocket(clientId: string, token: string): Promise<any>;

/**
 * Get the location socket instance
 * @returns Socket instance or null if not initialized
 */
export function getLocationSocket(): any | null;

/**
 * Disconnect location socket
 */
export function disconnectLocationSocket(): void;

/**
 * Send driver location update
 * @param driverId - Driver ID
 * @param location - Location coordinates {latitude, longitude}
 * @param rideId - Ride ID (optional)
 */
export function sendDriverLocation(
  driverId: string, 
  location: {latitude: number, longitude: number}, 
  rideId?: string
): Promise<{latitude: number, longitude: number}>;

/**
 * Send passenger location update
 * @param location - Location data { latitude, longitude }
 * @param passengerId - Passenger ID
 * @param rideId - Optional ride ID
 */
export function sendPassengerLocation(
  location: {latitude: number, longitude: number}, 
  passengerId: string, 
  rideId?: string
): Promise<boolean>;

/**
 * Get driver location by ID
 * @param driverId - Driver ID
 * @returns Driver location or null if not found
 */
export function getDriverLocation(driverId: string): {latitude: number, longitude: number} | null;

/**
 * Get passenger location by ID
 * @param passengerId - Passenger ID
 * @returns Passenger location or null if not found
 */
export function getPassengerLocation(passengerId: string): {latitude: number, longitude: number} | null;

/**
 * Subscribe to notifications
 * @param callback - Callback function to handle notifications
 * @returns Unsubscribe function
 */
export function subscribeToNotifications(callback: (notification: any) => void): () => void;

/**
 * Subscribe to chat messages
 * @param callback - Callback function to handle chat messages
 * @returns Unsubscribe function
 */
export function subscribeToChat(callback: (message: any) => void): () => void;

/**
 * Subscribe to broadcast messages
 * @param callback - Callback function to handle broadcast messages
 * @returns Unsubscribe function
 */
export function subscribeToBroadcast(callback: (message: any) => void): () => void;

/**
 * Subscribe to route updates
 * @param callback - Callback function to handle route updates
 * @returns Unsubscribe function
 */
export function subscribeToRouteUpdates(callback: (routeData: any) => void): () => void;

/**
 * Send trip update
 * @param data - Trip update data
 */
export function sendTripUpdate(data: { 
  driverId: string; 
  routeId: string; 
  status: string; 
  location: { latitude: number; longitude: number; } | null; 
}): void; 