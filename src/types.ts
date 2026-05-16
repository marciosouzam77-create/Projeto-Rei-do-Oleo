
export type PersonType = 'PF' | 'PJ';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  personType?: PersonType;
  address?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  plate: string;
  model: string;
  brand: string;
  year?: number;
  color?: string;
  fuel?: string;
  chassis?: string;
  currentKm: number;
  lastOilChangeKm?: number;
  lastOilChangeDate?: string;
  nextChangeKm?: number;
  nextChangeDate?: string;
}

export interface OilPreset {
  label: string;
  kmInterval: number;
  monthInterval: number;
}

export const OIL_PRESETS: Record<string, OilPreset> = {
  'Óleo Motor - Convencional':    { label: 'Convencional',       kmInterval: 5000,  monthInterval: 6 },
  'Óleo Motor - Semissintético':  { label: 'Semissintético',     kmInterval: 7500,  monthInterval: 6 },
  'Óleo Motor - Sintético':       { label: 'Sintético',          kmInterval: 10000, monthInterval: 6 },
  'Câmbio Automático':            { label: 'Câmbio Automático',  kmInterval: 30000, monthInterval: 24 },
  'Câmbio Manual':                { label: 'Câmbio Manual',      kmInterval: 50000, monthInterval: 24 },
  'Fluido de Freio':              { label: 'Fluido de Freio',    kmInterval: 20000, monthInterval: 12 },
  'Fluido de Arrefecimento':      { label: 'Arrefecimento',      kmInterval: 50000, monthInterval: 24 },
  'Filtro de Ar / Combustível':   { label: 'Filtro de Ar/Comb.', kmInterval: 10000, monthInterval: 12 },
  'Filtro de Cabine':             { label: 'Filtro de Cabine',   kmInterval: 10000, monthInterval: 12 },
};

export const FUEL_TYPES = ['Gasolina', 'Álcool', 'Flex', 'Diesel', 'GNV', 'Elétrico', 'Híbrido'];

export const COLORS = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Marrom', 'Bege', 'Outro'];

export const SERVICE_CATEGORIES = ['Lubrificação', 'Freios', 'Suspensão', 'Filtros', 'Elétrico', 'Funilaria', 'Geral'] as const;
export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: ServiceCategory;
  basePrice: number;
  estimatedMinutes?: number;
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

export const CHECKLIST_ITEMS = [
  'Fluido de freio',
  'Óleo de direção',
  'Óleo do motor',
  'Fluido da transmissão automática',
  'Fluido de câmbio manual',
  'Fluido de arrefecimento',
  'Pastilha de freio',
  'Filtro de ar',
  'Filtro de combustível',
  'Filtro de cabine',
  'Filtro de óleo',
] as const;

export type ChecklistItem = typeof CHECKLIST_ITEMS[number];
export type ChecklistCondition = 'Bom' | 'Ruim' | 'Não verificado';
export type OSStatus = 'Aguardando' | 'Em serviço' | 'Pronto' | 'Entregue';
export type PaymentMethod = 'Dinheiro' | 'Cartão Débito' | 'Cartão Crédito' | 'Pix';

export const OS_STATUS_FLOW: OSStatus[] = ['Aguardando', 'Em serviço', 'Pronto', 'Entregue'];
export const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Pix'];

export type ServiceExecutionStatus = 'Realizado' | 'Não realizado' | 'Adiado';

export interface CheckoutData {
  finalKm: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  servicesExecuted: Record<string, ServiceExecutionStatus>;
  observations: string;
  completedAt: string;
}

export interface CheckIn {
  id: string;
  vehicleId: string;
  createdAt: string;
  currentKm: number;
  clientNotes: string;
  mechanic?: string;
  status: OSStatus;
  checklist: Record<ChecklistItem, ChecklistCondition>;
  observations?: string;
  checkout?: CheckoutData;
}
