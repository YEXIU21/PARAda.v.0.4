/**
 * Default route data for the application
 */

import { VehicleTypeId } from './VehicleTypes';

export interface RouteStop {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  vehicleType: VehicleTypeId;
  stops: RouteStop[];
  path: RoutePoint[];
  driverId?: string;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
  fare?: number;
}

export const defaultRoutes: Route[] = [
  {
    id: '1',
    name: 'Downtown Express Route',
    description: 'Main Latransco route through downtown area',
    vehicleType: 'latransco',
    stops: [
      { name: 'Central Station', coordinates: { latitude: 37.78825, longitude: -122.4324 } },
      { name: 'Market Square', coordinates: { latitude: 37.78925, longitude: -122.4344 } },
      { name: 'Harbor View', coordinates: { latitude: 37.78625, longitude: -122.4314 } }
    ],
    path: [
      { latitude: 37.78825, longitude: -122.4324 },
      { latitude: 37.78865, longitude: -122.4334 },
      { latitude: 37.78925, longitude: -122.4344 },
      { latitude: 37.78775, longitude: -122.4329 },
      { latitude: 37.78625, longitude: -122.4314 }
    ],
    active: true,
    createdBy: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Coastal Line Route',
    description: 'Scenic Jeepney route along the coastline',
    vehicleType: 'jeep',
    stops: [
      { name: 'Beach Terminal', coordinates: { latitude: 37.78525, longitude: -122.5114 } },
      { name: 'Oceanview Point', coordinates: { latitude: 37.78625, longitude: -122.5004 } },
      { name: 'Sunset District', coordinates: { latitude: 37.78725, longitude: -122.4914 } }
    ],
    path: [
      { latitude: 37.78525, longitude: -122.5114 },
      { latitude: 37.78575, longitude: -122.5064 },
      { latitude: 37.78625, longitude: -122.5004 },
      { latitude: 37.78675, longitude: -122.4954 },
      { latitude: 37.78725, longitude: -122.4914 }
    ],
    active: true,
    createdBy: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'City Circuit Route',
    description: 'Ceres bus circular route through the city center',
    vehicleType: 'ceres',
    stops: [
      { name: 'North Terminal', coordinates: { latitude: 37.79025, longitude: -122.4344 } },
      { name: 'City Hall', coordinates: { latitude: 37.79125, longitude: -122.4354 } },
      { name: 'Business District', coordinates: { latitude: 37.79225, longitude: -122.4364 } }
    ],
    path: [
      { latitude: 37.79025, longitude: -122.4344 },
      { latitude: 37.79075, longitude: -122.4349 },
      { latitude: 37.79125, longitude: -122.4354 },
      { latitude: 37.79175, longitude: -122.4359 },
      { latitude: 37.79225, longitude: -122.4364 }
    ],
    active: true,
    createdBy: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'University Express Route',
    description: 'Calvo bus route connecting university campuses',
    vehicleType: 'calvo',
    stops: [
      { name: 'Main Campus', coordinates: { latitude: 37.78525, longitude: -122.4294 } },
      { name: 'Library', coordinates: { latitude: 37.78625, longitude: -122.4304 } },
      { name: 'Student Housing', coordinates: { latitude: 37.78725, longitude: -122.4314 } }
    ],
    path: [
      { latitude: 37.78525, longitude: -122.4294 },
      { latitude: 37.78575, longitude: -122.4299 },
      { latitude: 37.78625, longitude: -122.4304 },
      { latitude: 37.78675, longitude: -122.4309 },
      { latitude: 37.78725, longitude: -122.4314 }
    ],
    active: true,
    createdBy: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Shopping District Route',
    description: 'Gabe bus route connecting major shopping centers',
    vehicleType: 'gabe',
    stops: [
      { name: 'Main Mall', coordinates: { latitude: 37.78425, longitude: -122.4334 } },
      { name: 'Outlet Center', coordinates: { latitude: 37.78525, longitude: -122.4344 } },
      { name: 'Department Store', coordinates: { latitude: 37.78625, longitude: -122.4354 } }
    ],
    path: [
      { latitude: 37.78425, longitude: -122.4334 },
      { latitude: 37.78475, longitude: -122.4339 },
      { latitude: 37.78525, longitude: -122.4344 },
      { latitude: 37.78575, longitude: -122.4349 },
      { latitude: 37.78625, longitude: -122.4354 }
    ],
    active: true,
    createdBy: 'admin',
    createdAt: new Date().toISOString()
  }
]; 