/**
 * Ride-related type definitions for the application
 */

export type PassengerStatus = 'waiting' | 'assigned' | 'picked_up';
export type RideStatusType = 'none' | PassengerStatus;
export type NotificationType = 'new_ride_request' | 'driver_assigned' | 'ride_completed' | 'ride_cancelled';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Destination extends Location {
  name: string;
  routeId?: string;
}

export interface Passenger {
  id: string;
  name: string;
  location: Location;
  destination?: Destination;
  status: PassengerStatus;
  vehicleId?: number;
  requestTime: string;
}

export interface Vehicle {
  id: number;
  type: string;
  name: string;
  eta: string;
  location: Location;
}

export interface RideStatus {
  status: RideStatusType;
  vehicle?: Vehicle;
  eta?: string;
  rideId?: string;
  driverId?: string;
  passengerId?: string;
  pickupLocation?: Location;
  destination?: Destination;
  routeId?: string;
}

export interface RideRequest {
  userId: string;
  pickupLocation: Location;
  destination: Destination;
  vehicleType: string;
  status: PassengerStatus;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  data: {
    rideId: string;
    pickupLocation: Location | Destination;
    destination?: Destination;
    driverId?: string;
    passengerId?: string;
    [key: string]: any;
  };
} 