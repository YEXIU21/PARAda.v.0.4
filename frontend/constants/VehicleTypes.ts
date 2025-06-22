/**
 * Vehicle type definitions
 */

export type VehicleTypeId = 'latransco' | 'calvo' | 'corominas' | 'ceres' | 'gabe' | 'jeep' | 'all';

export interface VehicleType {
  id: VehicleTypeId;
  name: string;
  icon: string;
  description: string;
  capacity: number;
  color: string;
  gradient: [string, string];
}

export const vehicleTypes: VehicleType[] = [
  { 
    id: 'latransco', 
    name: 'Latransco', 
    icon: 'bus', 
    description: 'Latransco buses are large air-conditioned buses that operate on major highways and thoroughfares.',
    capacity: 50,
    color: '#4B6BFE',
    gradient: ['#4B6BFE', '#3451E1']
  },
  { 
    id: 'calvo', 
    name: 'Calvo', 
    icon: 'bus-alt',
    description: 'Calvo buses are medium-sized buses that serve routes connecting major commercial centers.',
    capacity: 35,
    color: '#FF9500',
    gradient: ['#FF9500', '#FB8C00']
  },
  { 
    id: 'corominas', 
    name: 'Corominas', 
    icon: 'bus', 
    description: 'Corominas buses operate on routes connecting residential areas to business districts.',
    capacity: 40,
    color: '#4CD964',
    gradient: ['#4CD964', '#43C158']
  },
  { 
    id: 'ceres', 
    name: 'Ceres', 
    icon: 'bus-alt',
    description: 'Ceres buses are long-distance buses that connect cities and provinces.',
    capacity: 45,
    color: '#5856D6',
    gradient: ['#5856D6', '#4A49C9']
  },
  { 
    id: 'gabe', 
    name: 'Gabe', 
    icon: 'bus', 
    description: 'Gabe buses operate on local routes within city limits.',
    capacity: 30,
    color: '#FF3B30',
    gradient: ['#FF3B30', '#E0352B']
  },
  { 
    id: 'jeep', 
    name: 'Jeepney', 
    icon: 'shuttle-van', 
    description: 'Jeepneys are the most common public transport vehicles, serving short to medium distance routes.',
    capacity: 20,
    color: '#FFCC00',
    gradient: ['#FFCC00', '#FFB800']
  },
  {
    id: 'all',
    name: 'All Vehicles',
    icon: 'car-side',
    description: 'Access to all vehicle types',
    capacity: 0,
    color: '#8E8E93',
    gradient: ['#8E8E93', '#7D7D82']
  }
]; 