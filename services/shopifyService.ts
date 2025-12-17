
import { ShopifyConfig, Transaction, TransactionType } from '../types';

export const fetchShopifyOrders = async (config: ShopifyConfig): Promise<Transaction[]> => {
  if (!config.shopUrl || !config.accessToken) {
    throw new Error('Shopify ayarları eksik.');
  }

  const cleanUrl = config.shopUrl.replace(/\/$/, '');
  const apiUrl = `${cleanUrl}/admin/api/2024-01/orders.json?status=any&limit=50`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Shopify Access Token geçersiz.');
      throw new Error('Shopify bağlantı hatası. (CORS veya Ağ Hatası)');
    }

    const data = await response.json();
    return data.orders.map((order: any) => ({
      id: `shopify-${order.id}`,
      orderId: String(order.order_number),
      type: TransactionType.INCOME,
      category: 'Shopify Satış',
      amount: parseFloat(order.total_price),
      weight: (order.total_weight || 0) / 1000,
      date: order.created_at.split('T')[0],
      customer: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Müşteri',
      description: order.line_items.map((li: any) => `${li.title} x${li.quantity}`).join(', '),
      source: 'shopify'
    }));
  } catch (error) {
    console.error('Shopify Fetch Error:', error);
    throw error;
  }
};
