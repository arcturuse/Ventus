
import { Transaction, TransactionType } from '../types';

/**
 * Shopier Excel sütun isimleri ve mikro-dropship modeline göre veriyi işler.
 */
export const mapShopierRowToTransactions = (row: any, i: number): Transaction[] => {
  const transactions: Transaction[] = [];
  const timestamp = Date.now();
  
  const orderId = row["Sipariş No"] || row["Order ID"] || `#${i}`;
  const date = row["Sipariş Tarihi"] || row["Sipariş Oluşma Tarihi"] || new Date().toISOString().split('T')[0];
  const grossAmount = parseFloat(row["TL Karşılık"]) || parseFloat(row["Amount"]) || 0;
  const customer = row["Müşteri Adı"] || row["Customer"] || "Müşteri";
  const productInfo = `${row["Ürün Adı"] || ""} ${row["Seçenekler"] || ""}`.trim() || "Shopier Ürünü";
  const weight = extractWeight(row["Seçenekler"] || row["Ürün Adı"] || "");
  
  if (grossAmount <= 0) return [];

  const formattedDate = formatDate(date);

  // 1. GELİR: Müşteriden gelen brüt para
  transactions.push({
    id: `shopier-inc-${orderId}-${timestamp}`,
    orderId: String(orderId),
    type: TransactionType.INCOME,
    category: 'Shopier Satış',
    amount: grossAmount,
    weight: weight,
    date: formattedDate,
    customer: customer,
    description: productInfo,
    source: 'shopier'
  });

  // 2. GİDER: Shopier Komisyonu & KDV
  const serviceFee = parseFloat(row["Hizmet Bedeli"]) || 0;
  const kdv = parseFloat(row["KDV"]) || 0;
  const totalDeduction = serviceFee + kdv;

  if (totalDeduction > 0) {
    transactions.push({
      id: `shopier-exp-fee-${orderId}-${timestamp}`,
      orderId: String(orderId),
      type: TransactionType.EXPENSE,
      category: 'Shopier Kesinti',
      amount: totalDeduction,
      weight: 0,
      date: formattedDate,
      customer: 'Shopier',
      description: `${orderId} İşlem Ücreti`,
      source: 'shopier'
    });
  }

  // 3. GİDER: Kargo Bedeli
  const shippingFee = parseFloat(row["Anlaşmalı Kargo Ücreti"]) || 0;
  if (shippingFee > 0) {
    transactions.push({
      id: `shopier-exp-ship-${orderId}-${timestamp}`,
      orderId: String(orderId),
      type: TransactionType.EXPENSE,
      category: 'Kargo Maliyeti',
      amount: shippingFee,
      weight: 0,
      date: formattedDate,
      customer: 'Kargo',
      description: `${orderId} Gönderim Bedeli`,
      source: 'shopier'
    });
  }

  // NOT: "Kafeye Ödenen Toptan Tutar" ve "Paketleme" 
  // Dinamik olarak Dashboard/Reports kısmında hesaplanacak şekilde ayarlanmıştır.
  // Ancak isterseniz buraya da statik bir gider ekleyebiliriz.

  return transactions;
};

const extractWeight = (text: string): number => {
  const clean = text.toLowerCase();
  if (clean.includes('1kg') || clean.includes('1 kg')) return 1;
  if (clean.includes('500gr') || clean.includes('500 gr')) return 0.5;
  if (clean.includes('250gr') || clean.includes('250 gr')) return 0.25;
  
  const match = clean.match(/(\d+)\s*(gr|g|kg)/);
  if (match) {
    let val = parseFloat(match[1]);
    return match[2].startsWith('k') ? val : val / 1000;
  }
  return 0.25;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};
