
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
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
  wholesalePricePerKg: number; 
  weight: number; 
}

export interface ShippingRate {
  id: string;
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface ShopifyConfig {
  shopUrl: string;
  accessToken: string;
}

/**
 * Settings interface expanded to include all properties used in the app.
 */
export interface Settings {
  commissionRate: number;
  fixedFee?: number;
  costPerPack: number;
  costPerKgDefault: number;
  monthlyTarget: number;
  monthlyKgTarget: number;
  targetMargin?: number;
  firebaseConfig?: any;
  shopifyConfig?: ShopifyConfig;
  quoteSettings: {
    businessName: string;
    showTax: boolean;
    logoUrl?: string;
    footerNote?: string;
    showTerms?: boolean;
    showTotalWeight?: boolean;
  };
}

export type LeadStatus = 'new' | 'emailed' | 'responded';

/**
 * Lead interface expanded to include metadata used in Lead Hunter.
 */
export interface Lead {
  id: string;
  companyName: string;
  category: string;
  email: string;
  website: string;
  status: LeadStatus;
  relevanceScore: number;
  contactPerson?: string;
  notes?: string;
  suggestedPackage?: { 
    packageName?: string;
    monthlyKg: number; 
    price: number; 
  };
}

/**
 * Toast interface for the notification system.
 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * LabelDesign interface for the Label Studio.
 */
export interface LabelDesign {
  id: string;
  name: string;
  imageUrl: string;
  matchKeyword: string;
}
