
import { Transaction, TransactionType } from '../types';

/**
 * Türkçe para formatını (1.250,50) standart sayıya (1250.50) çevirir.
 */
const parseTurkishNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  
  // String'e çevir
  let str = String(val);
  
  // 1. Sadece sayı, nokta, virgül ve eksi işaretini bırak
  str = str.replace(/[^0-9.,-]/g, '');

  // 2. Binlik ayracı olan noktaları temizle (Örn: 5.884 -> 5884)
  // Not: Eğer dosyada binlik ayracı yoksa bu işlem zarar vermez.
  str = str.replace(/\./g, '');

  // 3. Ondalık ayracı olan virgülü noktaya çevir (Örn: 12,50 -> 12.50)
  str = str.replace(/,/g, '.');

  return parseFloat(str) || 0;
};

/**
 * Shopier Excel sütun isimleri ve mikro-dropship modeline göre veriyi işler.
 */
export const mapShopierRowToTransactions = (row: any, i: number): Transaction[] => {
  const transactions: Transaction[] = [];
  const timestamp = Date.now();
  
  const orderId = row["Sipariş No"] || row["Order ID"] || `#${i}`;
  const date = row["Sipariş Tarihi"] || row["Sipariş Oluşma Tarihi"] || new Date().toISOString().split('T')[0];
  
  // parseTurkishNumber kullanarak tutarları düzeltiyoruz
  const grossAmount = parseTurkishNumber(row["TL Karşılık"]) || parseTurkishNumber(row["Amount"]) || 0;
  
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
  const serviceFee = parseTurkishNumber(row["Hizmet Bedeli"]) || 0;
  const kdv = parseTurkishNumber(row["KDV"]) || 0;
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
  const shippingFee = parseTurkishNumber(row["Anlaşmalı Kargo Ücreti"]) || 0;
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

  return transactions;
};

const extractWeight = (text: string): number => {
  // Türkçe karakterleri ve boşlukları normalize et
  const clean = text.toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');

  // 1 KG varyasyonları
  if (clean.includes('1 kg') || clean.includes('1kg') || clean.includes('1000 gr') || clean.includes('1000gr')) return 1;
  
  // 500 Gram varyasyonları
  if (clean.includes('500 gr') || clean.includes('500gr') || clean.includes('500 g') || clean.includes('0.5 kg')) return 0.5;
  
  // 250 Gram varyasyonları
  if (clean.includes('250 gr') || clean.includes('250gr') || clean.includes('250 g') || clean.includes('0.25 kg')) return 0.25;
  
  // Regex ile diğer ihtimaller
  const match = clean.match(/(\d+)\s*(gr|g|gram|kg)/);
  if (match) {
    let val = parseFloat(match[1]);
    return match[2].includes('k') ? val : val / 1000;
  }
  return 0.25; // Varsayılan en küçük paket
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};
