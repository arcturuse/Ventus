
import { Transaction, TransactionType } from '../types';

/**
 * Shopify Order JSON structure (partial)
 */
export interface ShopifyOrder {
  id: number;
  order_number: number;
  total_price: string;
  total_weight: number; // in grams
  created_at: string;
  financial_status: string;
  customer?: {
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    title: string;
    quantity: number;
    grams: number;
    variant_title?: string;
  }>;
}

/**
 * Transforms a raw Shopify order into the internal Transaction format.
 * Includes "intelligence" for weight fallback and detailed product descriptions.
 */
export const mapShopifyOrderToTransaction = (order: ShopifyOrder): Transaction => {
  // 1. Calculate Weight (Shopify provides total_weight in grams, we use KG)
  // Fallback: Calculate from line items if total_weight is missing or zero
  let totalWeightKg = (order.total_weight || 0) / 1000;
  
  if (totalWeightKg === 0 && order.line_items) {
    const calculatedGrams = order.line_items.reduce((acc, item) => acc + (item.grams * item.quantity), 0);
    totalWeightKg = calculatedGrams / 1000;
  }
  
  // Default fallback for coffee shops (usually 250g minimum if everything else fails)
  if (totalWeightKg === 0) totalWeightKg = 0.25;

  // 2. Format Customer Name
  const customerName = order.customer 
    ? `${order.customer.first_name} ${order.customer.last_name}`.trim() 
    : 'Shopify Müşterisi';

  // 3. Create Detailed Description (Product Name x Quantity)
  const description = order.line_items
    ?.map(item => `${item.title}${item.variant_title ? ` (${item.variant_title})` : ''} x${item.quantity}`)
    .join(', ') || `Sipariş #${order.order_number}`;

  // 4. Map to Internal Transaction
  return {
    id: `shopify-${order.id}`,
    orderId: String(order.order_number),
    type: TransactionType.INCOME,
    category: 'Shopify Satış',
    amount: parseFloat(order.total_price) || 0,
    weight: totalWeightKg,
    date: order.created_at.split('T')[0],
    customer: customerName,
    description: description,
    source: 'shopify'
  };
};

/**
 * Maps a list of Shopify orders, filtering for valid transactions.
 */
export const mapShopifyOrders = (orders: ShopifyOrder[]): Transaction[] => {
  if (!Array.isArray(orders)) return [];
  
  return orders
    .filter(order => order.financial_status === 'paid' || order.financial_status === 'authorized' || order.financial_status === 'partially_paid')
    .map(mapShopifyOrderToTransaction);
};
