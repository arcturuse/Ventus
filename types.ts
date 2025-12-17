
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export interface LabelDesign {
  id: string;
  name: string;
  imageUrl: string;
  matchKeyword: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  weight: number;
  date: string;
  customer: string;
  description: string;
  orderId?: string;
  source: 'shopier' | 'b2b' | 'manual' | 'shopify';
  isPrinted?: boolean;
}

export interface ProductCost {
  key: string; 
  wholesalePricePerKg: number; // Kafeye ödenen toptan KG fiyatı
  weight: number; // Paket ağırlığı (kg)
  stock?: number;
}

// Added ShippingRate interface to define the structure for delivery pricing based on weight (desi)
export interface ShippingRate {
  id: string;
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface Settings {
  commissionRate: number;
  fixedFee: number;
  costPerPack: number;
  costPerKgDefault: number;
  monthlyTarget: number;
  monthlyKgTarget: number;
  targetMargin: number;
  quoteSettings: {
    showTax: boolean;
    showTerms: boolean;
    businessName: string;
    logoUrl?: string;
    footerNote?: string;
    showTotalWeight: boolean;
  };
}

export type LeadStatus = 'new' | 'emailed' | 'responded';

export interface Lead {
  id: string;
  companyName: string;
  category: string;
  contactPerson: string;
  email: string;
  website: string;
  status: LeadStatus;
  relevanceScore: number;
  notes: string;
  lastContactDate?: string;
  suggestedPackage?: {
    packageName: string;
    monthlyKg: number;
    price: number;
  };
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
