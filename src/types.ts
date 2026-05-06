
export type OilType = 'Sintético' | 'Semissintético' | 'Mineral';

export const VISCOSITIES = ['5W30', '10W40', '15W40', '5W40', '20W50', 'Outra'];

export const GEAR_OIL_TYPES = ['ATF Dexron III', 'ATF Dexron VI', 'ATF Multiveículo', 'CVT', 'Dual Clutch', 'Outro'];

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  plate: string;
  model: string;
  brand: string;
  currentKm: number;
  lastOilChangeKm?: number;
  lastOilChangeDate?: string;
  nextChangeKm?: number;
  nextChangeDate?: string;
}

export interface Service {
  id: string;
  vehicleId: string;
  date: string;
  oilType: string;
  viscosity: string;
  gearOilType?: string;
  oilItems?: string[];
  serviceItems?: string[];
  currentKm: number;
  nextChangeKm: number;
  nextChangeDate: string;
  notes?: string;
  totalPrice: number;
}
