
import React, { useState, useMemo, useRef } from 'react';
import { Settings, ShippingRate } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/ToastProvider';

interface B2BGeneratorProps {
  settings: Settings;
  onSetSettings: (s: Settings) => void;
  shippingRates: ShippingRate[];
  onSetShippingRates?: (rates: ShippingRate[]) => void; // Opsiyonel yapıldı, App.tsx'den gelmeli
}

export const B2BGenerator: React.FC<B2BGeneratorProps> = ({ settings, onSetSettings, shippingRates, onSetShippingRates }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [data, setData] = useState({
    customer: '',
    product: '',
    weight: 50,
    unitWholesaleCost: 450,
    offerPrice: 0,
    targetMargin: 25,
    salesChannel: 'direct' as 'direct' | 'shopier' // Satış kanalı seçimi
  });

  const [showCustomizer, setShowCustomizer] = useState(false);

  // Kargo Excel Yükleme İşlemi
  const handleShippingRateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = (window as any).XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData: any[] = (window as any).XLSX.utils.sheet_to_json(ws);

        // Beklenen format: MinDesi, MaxDesi, Fiyat
        const rates: ShippingRate[] = jsonData.map((row: any, index) => ({
          id: `ship-${index}`,
          minWeight: parseFloat(row['Min'] || row['MinDesi'] || row['Baslangic'] || 0),
          maxWeight: parseFloat(row['Max'] || row['MaxDesi'] || row['Bitis'] || 999),
          price: parseFloat(row['Fiyat'] || row['Price'] || row['Tutar'] || 0)
        }));

        if (rates.length > 0 && onSetShippingRates) {
          onSetShippingRates(rates);
          addToast(`${rates.length} adet kargo baremi güncellendi!`, 'success');
        } else {
          addToast('Excel formatı algılanamadı. (Sütunlar: Min, Max, Fiyat)', 'error');
        }
      } catch (err) {
        addToast('Dosya okuma hatası.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateQuoteSetting = (field: string, value: any) => {
    onSetSettings({
      ...settings,
      quoteSettings: {
        ...settings.quoteSettings,
        [field]: value
      }
    });
  };

  const analysis = useMemo(() => {
    // 1. Temel Maliyetler
    const coffeeCost = data.weight * data.unitWholesaleCost;
    const packagingCost = settings.costPerPack; // Sabit paket/sarf maliyeti (genel)
    
    // Kargo Hesaplama
    // Ağırlık x 2 formülü ile desi tahmini yapıyoruz (Kavrulmuş kahve hacimlidir)
    const estimatedDesi = Math.max(1, Math.ceil(data.weight * 1.5)); 
    const shippingCost = shippingRates.find(r => estimatedDesi >= r.minWeight && estimatedDesi <= r.maxWeight)?.price || 0;

    const baseCost = coffeeCost + packagingCost + shippingCost;
    
    // 2. Komisyon Oranları
    // Shopier ise ayarlardaki oran, değilse 0
    const commissionRate = data.salesChannel === 'shopier' ? (settings.commissionRate / 100) : 0;
    const fixedFee = data.salesChannel === 'shopier' ? settings.fixedFee : 0;

    // 3. Hedef Fiyat Hesaplama (Tersine Mühendislik)
    // Formül: Fiyat = (Maliyet + SabitKesinti) / (1 - KomisyonOranı - HedefMarj)
    // Hedef marj, ciro üzerinden net kâr oranıdır.
    
    const targetMarginRate = data.targetMargin / 100;
    const divisor = 1 - commissionRate - targetMarginRate;
    
    let targetPrice = 0;
    if (divisor > 0) {
      targetPrice = (baseCost + fixedFee) / divisor;
    } else {
      targetPrice = baseCost * 2; // Matematiksel imkansızlık durumunda güvenli bir kat sayı
    }

    // 4. Girilen Fiyat ("Düşünülen Teklif Tutarı") Analizi
    const grossIncome = data.offerPrice;
    const commissionAmount = (grossIncome * commissionRate) + fixedFee;
    const totalCost = baseCost + commissionAmount;
    const netProfit = grossIncome - totalCost;
    const currentMargin = grossIncome > 0 ? (netProfit / grossIncome) * 100 : 0;

    // 5. Başa Baş Noktası (Sıfır Kar)
    // Fiyat = (Maliyet + Sabit) / (1 - Komisyon)
    const breakEvenPrice = (baseCost + fixedFee) / (1 - commissionRate);

    // 6. Psikolojik Fiyat
    const base = Math.floor(targetPrice / 100) * 100;
    const charmPrice = base + 99; 
    const convincingPrice = targetPrice > charmPrice ? base + 190 : charmPrice;

    return { 
      baseCost, 
      shippingCost, 
      coffeeCost,
      packagingCost,
      commissionAmount,
      totalCost,
      netProfit, 
      currentMargin, 
      targetPrice, 
      convincingPrice,
      breakEvenPrice,
      estimatedDesi
    };
  }, [data, settings, shippingRates]);

  const quote = settings.quoteSettings;

  return (
    <>
    <div className="space-y-8 no-print animate-fade-in">
      {/* Header Section */}
      <div className="slate-gradient p-8 rounded-3xl text-white shadow-xl flex flex-col xl:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
            <Icon name="Briefcase" className="text-amber-400" /> Toptan Satış Simülatörü
          </h2>
          <p className="text-slate-300 text-sm font-medium">B2B müşteriler için Shopier komisyonu ve kargo dahil net kâr analizi yapın.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-3 bg-emerald-600/20 border border-emerald-400/30 text-emerald-100 rounded-2xl font-bold hover:bg-emerald-600/40 transition-all flex items-center gap-2"
          >
            <Icon name="Upload" size={18} /> Kargo Excel Yükle
          </button>
          <input type="file" ref={fileInputRef} onChange={handleShippingRateUpload} className="hidden" accept=".xlsx,.xls,.csv" />
          
          <button 
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <Icon name="Palette" size={18} /> Tasarım
          </button>
          <button onClick={() => window.print()} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-lg">
            <Icon name="Printer" size={18} /> Yazdır (PDF)
          </button>
        </div>
      </div>

      {showCustomizer && (
        <div className="premium-card p-8 border-2 border-amber-200 bg-amber-50/20">
          <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
             Teklif Şablon Ayarları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input type="text" placeholder="Logo URL" value={quote.logoUrl} onChange={e => updateQuoteSetting('logoUrl', e.target.value)} className="p-3 border rounded-xl" />
            <input type="text" placeholder="İşletme Adı" value={quote.businessName} onChange={e => updateQuoteSetting('businessName', e.target.value)} className="p-3 border rounded-xl" />
            <input type="text" placeholder="Alt Not" value={quote.footerNote} onChange={e => updateQuoteSetting('footerNote', e.target.value)} className="p-3 border rounded-xl" />
          </div>
          <div className="flex gap-6 mt-4">
             <label className="flex items-center gap-2"><input type="checkbox" checked={quote.showTax} onChange={e => updateQuoteSetting('showTax', e.target.checked)} /> KDV Göster</label>
             <label className="flex items-center gap-2"><input type="checkbox" checked={quote.showTerms} onChange={e => updateQuoteSetting('showTerms', e.target.checked)} /> Şartlar</label>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* INPUT FORM */}
        <div className="xl:col-span-2 space-y-6">
          <div className="premium-card p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri</label>
                  <input type="text" placeholder="Örn: Espresso Lab" value={data.customer} onChange={e => setData({...data, customer: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün</label>
                  <input type="text" placeholder="Örn: Brazil Santos (20kg)" value={data.product} onChange={e => setData({...data, product: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toptan Alış (₺/KG)</label>
                  <input type="number" value={data.unitWholesaleCost} onChange={e => setData({...data, unitWholesaleCost: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-amber-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Miktar (KG)</label>
                  <input type="number" value={data.weight} onChange={e => setData({...data, weight: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl" />
                </div>
             </div>
             
             {/* Satış Kanalı Seçimi */}
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Satış Kanalı & Ödeme Yöntemi</label>
                <div className="flex gap-4">
                   <button 
                     onClick={() => setData({...data, salesChannel: 'direct'})}
                     className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${data.salesChannel === 'direct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400 hover:border-emerald-200'}`}
                   >
                     <Icon name="Banknote" size={24} />
                     <span>Havale / EFT (Komisyonsuz)</span>
                   </button>
                   <button 
                     onClick={() => setData({...data, salesChannel: 'shopier'})}
                     className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${data.salesChannel === 'shopier' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-400 hover:border-rose-200'}`}
                   >
                     <Icon name="CreditCard" size={24} />
                     <span>Shopier / Kredi Kartı (%{settings.commissionRate})</span>
                   </button>
                </div>
             </div>

             <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hedef Net Marj: %{data.targetMargin}</label>
                     <span className="text-[10px] font-bold text-amber-600">Önerilen: ₺{analysis.convincingPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="5" max="60" value={data.targetMargin} onChange={e => setData({...data, targetMargin: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                </div>
                
                <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-3xl space-y-2 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Icon name="Tags" size={100} className="text-emerald-800" />
                   </div>
                   <label className="text-xs font-black text-emerald-800 uppercase tracking-widest relative z-10">TEKLİF EDİLECEK TOPLAM TUTAR (₺)</label>
                   <input type="number" value={data.offerPrice} onChange={e => setData({...data, offerPrice: parseFloat(e.target.value)})} className="w-full bg-transparent border-none font-black text-6xl text-emerald-900 outline-none relative z-10" placeholder="0" />
                   <p className="text-emerald-600/60 font-medium text-sm relative z-10">Birim KG Fiyatı: ₺{(data.offerPrice / data.weight).toFixed(2)}</p>
                </div>
             </div>
          </div>
        </div>

        {/* ANALİZ KARTI */}
        <div className="space-y-6">
           <div className={`premium-card p-8 border-t-[12px] transition-all ${analysis.currentMargin >= data.targetMargin ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <Icon name="PieChart" /> Kârlılık Özeti
              </h3>

              {/* Detaylı Maliyet Dökümü */}
              <div className="space-y-3 pb-6 border-b border-slate-100 mb-6">
                 <div className="flex justify-between text-xs text-slate-500">
                    <span>Kahve Maliyeti ({data.weight}kg):</span>
                    <span className="font-bold">₺{analysis.coffeeCost.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-xs text-slate-500">
                    <span>Paketleme & Sarf:</span>
                    <span className="font-bold">₺{analysis.packagingCost.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-xs text-slate-500">
                    <span>Kargo ({analysis.estimatedDesi} Desi):</span>
                    <span className="font-bold">₺{analysis.shippingCost.toLocaleString()}</span>
                 </div>
                 {data.salesChannel === 'shopier' && (
                   <div className="flex justify-between text-xs text-rose-500 bg-rose-50 p-2 rounded-lg">
                      <span>Shopier Komisyonu:</span>
                      <span className="font-bold">₺{analysis.commissionAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                   </div>
                 )}
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Toplam Maliyet:</span>
                    <span className="text-sm font-bold text-slate-700">₺{analysis.totalCost.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-black text-slate-800">NET KÂR:</span>
                    <span className={`text-xl font-black ${analysis.netProfit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₺{analysis.netProfit.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Net Marj:</span>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-black ${analysis.currentMargin >= data.targetMargin ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                       %{analysis.currentMargin.toFixed(2)}
                    </span>
                 </div>
              </div>
           </div>

           <div className="premium-card p-6 bg-amber-50 border-amber-200">
              <h4 className="text-amber-900 font-black text-xs uppercase mb-3 flex items-center gap-2">
                 <Icon name="Zap" size={16} /> Fiyat Önerisi
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed mb-4">
                 Hedeflediğiniz <b>%{data.targetMargin}</b> marjı yakalamak için, tüm komisyon ve giderler dahil minimum satış fiyatınız:
              </p>
              <div className="bg-white p-4 rounded-2xl border border-amber-200 text-center shadow-sm">
                 <p className="text-3xl font-black text-amber-900">₺{analysis.convincingPrice.toLocaleString()}</p>
                 <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase">Tavsiye Edilen Fiyat</p>
              </div>
           </div>
        </div>
      </div>
    </div>

    {/* PRINT TEMPLATE - Tamamen ayrı bir kapsayıcıda */}
    <div className="print-area hidden">
         <div className="p-12 max-w-[210mm] mx-auto bg-white min-h-screen text-slate-900">
             {/* Print Header */}
             <div className="flex justify-between items-start border-b-4 border-amber-900 pb-8 mb-12">
                <div className="flex items-center gap-4">
                   {quote.logoUrl && (
                     <img src={quote.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
                   )}
                   <div>
                      <h1 className="text-3xl font-black text-amber-950 uppercase tracking-tight">{quote.businessName}</h1>
                      <p className="text-slate-400 font-bold tracking-[0.2em] text-[10px] uppercase mt-1">Professional Coffee Roasters</p>
                   </div>
                </div>
                <div className="text-right">
                   <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">SATIŞ TEKLİFİ</h2>
                   <p className="text-slate-500 text-sm font-medium mt-1">Ref: VR-{Date.now().toString().slice(-6)}</p>
                   <p className="text-slate-500 text-sm font-medium">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                </div>
             </div>

             {/* Customer Info */}
             <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Gönderen</p>
                   <p className="font-black text-slate-800 text-lg">{quote.businessName}</p>
                   <p className="text-slate-500 text-sm mt-1">Kavurma & Paketleme Merkezi</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Sayın / Firma</p>
                   <p className="font-black text-slate-800 text-lg">{data.customer || 'Değerli İş Ortağımız'}</p>
                   <p className="text-slate-500 text-sm mt-1">Satın Alma Birimi Dikkatine</p>
                </div>
             </div>

             {/* Product Table */}
             <table className="w-full mb-12 border-collapse">
                <thead>
                   <tr className="border-b-2 border-slate-800">
                      <th className="py-4 px-4 text-left font-black text-slate-800 text-sm uppercase tracking-wider">Ürün / Hizmet</th>
                      {quote.showTotalWeight && <th className="py-4 px-4 text-center font-black text-slate-800 text-sm uppercase tracking-wider">Miktar</th>}
                      <th className="py-4 px-4 text-right font-black text-slate-800 text-sm uppercase tracking-wider">Toplam Tutar</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                   <tr>
                      <td className="py-6 px-4">
                          <p className="font-bold text-slate-900 text-lg">{data.product || 'Özel Kavrum Kahve'}</p>
                          <p className="text-sm text-slate-500 mt-1">Taze Kavrum • %100 Arabica • Premium Selection</p>
                      </td>
                      {quote.showTotalWeight && <td className="py-6 px-4 text-center font-bold text-slate-700 text-lg">{data.weight} KG</td>}
                      <td className="py-6 px-4 text-right font-black text-slate-900 text-2xl">₺{data.offerPrice.toLocaleString()}</td>
                   </tr>
                </tbody>
             </table>

             {/* Totals */}
             <div className="flex justify-end mb-16">
                <div className="w-80 space-y-4">
                   {quote.showTax ? (
                     <>
                       <div className="flex justify-between text-sm text-slate-600 font-medium border-b border-slate-100 pb-2">
                          <span>Ara Toplam</span>
                          <span>₺{(data.offerPrice / 1.1).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                       </div>
                       <div className="flex justify-between text-sm text-slate-600 font-medium border-b border-slate-100 pb-2">
                          <span>KDV (%10)</span>
                          <span>₺{(data.offerPrice - (data.offerPrice / 1.1)).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                       </div>
                     </>
                   ) : (
                     <div className="flex justify-between text-sm text-slate-500 font-medium italic border-b border-slate-100 pb-2">
                       <span>KDV</span>
                       <span>Fiyata Dahildir</span>
                     </div>
                   )}
                   
                   <div className="flex justify-between items-center pt-2">
                      <span className="font-black text-slate-900 text-lg">GENEL TOPLAM</span>
                      <span className="font-black text-amber-900 text-3xl">₺{data.offerPrice.toLocaleString()}</span>
                   </div>
                </div>
             </div>

             {/* Footer */}
             <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-200">
                <div className="text-xs text-slate-500 leading-relaxed">
                   {quote.showTerms && (
                     <>
                       <p className="font-black text-slate-800 uppercase mb-2">Teklif Şartları:</p>
                       <ul className="list-disc pl-4 space-y-1">
                          <li>Teklifimiz 7 takvim günü geçerlidir.</li>
                          <li>Ödeme: {data.salesChannel === 'shopier' ? 'Kredi Kartı (Shopier)' : 'Havale / EFT'}.</li>
                          <li>Kargo ve lojistik maliyetleri dahildir.</li>
                          {quote.footerNote && <li>{quote.footerNote}</li>}
                       </ul>
                     </>
                   )}
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="h-24 w-48 border-b border-slate-300 mb-2"></div>
                   <p className="font-bold text-slate-800 text-sm">Onay / İmza</p>
                </div>
             </div>
         </div>
    </div>
    </>
  );
};
