/**
 * Default vehicle data for the application
 */

import { VehicleTypeId } from './VehicleTypes';

export interface Vehicle {
  id: number;
  type: VehicleTypeId;
  name: string;
  eta: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export const defaultVehicles: Vehicle[] = [
  { 
    id: 1, 
    type: 'latransco', 
    name: 'Latransco 101', 
    eta: '5 min', 
    location: { 
      latitude: 37.78825, 
      longitude: -122.4324 
    } 
  },
  { 
    id: 2, 
    type: 'ceres', 
    name: 'Ceres 202', 
    eta: '8 min', 
    location: { 
      latitude: 37.78925, 
      longitude: -122.4344 
    } 
  },
  { 
    id: 3, 
    type: 'jeep', 
    name: 'Jeep A', 
    eta: '3 min', 
    location: { 
      latitude: 37.78625, 
      longitude: -122.4314 
    } 
  },
  { 
    id: 4, 
    type: 'calvo', 
    name: 'Calvo 303', 
    eta: '7 min', 
    location: { 
      latitude: 37.78525, 
      longitude: -122.4294 
    } 
  },
  { 
    id: 6, 
    type: 'corominas', 
    name: 'Corominas 404', 
    eta: '12 min', 
    location: { 
      latitude: 37.78725, 
      longitude: -122.4354 
    } 
  },
  { 
    id: 7, 
    type: 'gabe', 
    name: 'Gabe 505', 
    eta: '15 min', 
    location: { 
      latitude: 37.78425, 
      longitude: -122.4334 
    } 
  }
]; 