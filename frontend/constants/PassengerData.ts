/**
 * Default passenger data for the application
 */

import { Passenger, PassengerStatus } from '../models/RideTypes';

export const defaultPassengers: Passenger[] = [
  {
    id: '1',
    name: 'Alex Smith',
    location: { latitude: 37.78925, longitude: -122.4344 },
    destination: { 
      latitude: 37.78625, 
      longitude: -122.4314,
      name: 'Harbor View'
    },
    status: 'waiting',
    requestTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    vehicleId: 1,
  },
  {
    id: '2',
    name: 'Maria Garcia',
    location: { latitude: 37.78825, longitude: -122.4334 },
    destination: { 
      latitude: 37.78925, 
      longitude: -122.4344,
      name: 'Market Square'
    },
    status: 'assigned',
    requestTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    vehicleId: 1,
  },
  {
    id: '3',
    name: 'James Wilson',
    location: { latitude: 37.78725, longitude: -122.4324 },
    destination: { 
      latitude: 37.79025, 
      longitude: -122.4344,
      name: 'Tech Plaza'
    },
    status: 'picked_up',
    requestTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    vehicleId: 2,
  },
  {
    id: '4',
    name: 'Sofia Chen',
    location: { latitude: 37.78625, longitude: -122.4314 },
    destination: { 
      latitude: 37.78525, 
      longitude: -122.4294,
      name: 'Central Station'
    },
    status: 'waiting',
    requestTime: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
  }
]; 