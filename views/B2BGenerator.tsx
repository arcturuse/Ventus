
import React, { useState, useMemo } from 'react';
import { Settings, ShippingRate } from '../types';
import { Icon } from '../components/Icons';

interface B2BGeneratorProps {
  settings: Settings;
  onSetSettings: (s: Settings) => void;
  shippingRates: ShippingRate[];
}

export const B2BGenerator: React.FC<B2BGeneratorProps> = ({ settings, onSetSettings, shippingRates }) => {
  const [data, setData] = useState({
    customer: '',
    product: '',
    weight: 50,
    unitWholesaleCost: 450,
    offerPrice: 0,
    targetMargin: 25
  });

  const [showCustomizer, setShowCustomizer] = useState(false);

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
    // 1. Maliyetlerin Hesaplanması
    const rawCost = data.weight * data.unitWholesaleCost;
    const desi = Math.max(1, Math.ceil(data.weight * 2));
    const shipping = shippingRates.find(r => desi >= r.minWeight && desi <= r.maxWeight)?.price || 0;
    const packaging = settings.costPerPack;
    
    // 2. Başa baş noktası (Sıfır kâr fiyatı)
    const breakEven = rawCost + shipping + packaging;
    
    // 3. Hedeflenen marj için gereken fiyat
    const targetPrice = breakEven / (1 - (data.targetMargin / 100));

    // 4. Psikolojik "İkna Edici" Fiyat Önerisi
    const base = Math.floor(targetPrice / 100) * 100;
    const charmPrice = base + 99; // Örn: 12.500 yerine 12.499
    const convincingPrice = targetPrice > charmPrice ? base + 190 : charmPrice;

    const currentProfit = data.offerPrice - breakEven;
    const currentMargin = data.offerPrice > 0 ? (currentProfit / data.offerPrice) * 100 : 0;

    return { breakEven, targetPrice, convincingPrice, currentProfit, currentMargin, shipping };
  }, [data, settings, shippingRates]);

  const quote = settings.quoteSettings;

  return (
    <div className="space-y-8 no-print">
      <div className="slate-gradient p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black mb-1">Toptan Teklif Simülatörü</h2>
          <p className="text-slate-300 text-sm font-medium">B2B müşteriler için kâr marjınızı koruyarak en iyi teklifi verin.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <Icon name="Settings" size={18} /> PDF Özelleştir
          </button>
          <button onClick={() => window.print()} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-lg">
            <Icon name="Printer" size={18} /> Teklif Formu Oluştur (PDF)
          </button>
        </div>
      </div>

      {showCustomizer && (
        <div className="premium-card p-8 animate-fade-in border-2 border-amber-200 bg-amber-50/20">
          <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <Icon name="Palette" className="text-amber-600" /> Teklif Görünüm Ayarları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo URL</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={quote.logoUrl} 
                onChange={e => updateQuoteSetting('logoUrl', e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-medium text-sm" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İşletme Adı (Başlık)</label>
              <input 
                type="text" 
                value={quote.businessName} 
                onChange={e => updateQuoteSetting('businessName', e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alt Not / Şartlar</label>
              <input 
                type="text" 
                value={quote.footerNote} 
                onChange={e => updateQuoteSetting('footerNote', e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-medium text-sm" 
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-amber-200">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={quote.showTax} 
                onChange={e => updateQuoteSetting('showTax', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500" 
              />
              <span className="text-sm font-bold text-slate-700 group-hover:text-amber-700">Vergi Detaylarını Göster</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={quote.showTerms} 
                onChange={e => updateQuoteSetting('showTerms', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500" 
              />
              <span className="text-sm font-bold text-slate-700 group-hover:text-amber-700">Şartları Göster</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={quote.showTotalWeight} 
                onChange={e => updateQuoteSetting('showTotalWeight', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500" 
              />
              <span className="text-sm font-bold text-slate-700 group-hover:text-amber-700">Toplam Miktarı Göster</span>
            </label>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri / Şirket Adı</label>
                  <input type="text" placeholder="Örn: Starbucks Türkiye" value={data.customer} onChange={e => setData({...data, customer: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün Açıklaması</label>
                  <input type="text" placeholder="Örn: Blend Coffee (250g x 200 Adet)" value={data.product} onChange={e => setData({...data, product: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toptan Alış Fiyatınız (₺/KG)</label>
                  <input type="number" value={data.unitWholesaleCost} onChange={e => setData({...data, unitWholesaleCost: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl text-amber-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Miktar (KG)</label>
                  <input type="number" value={data.weight} onChange={e => setData({...data, weight: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xl" />
                </div>
             </div>
             
             <div className="pt-4 border-t space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hedeflenen Kâr Marjı: %{data.targetMargin}</label>
                <input type="range" min="5" max="60" value={data.targetMargin} onChange={e => setData({...data, targetMargin: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                
                <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-3xl space-y-2">
                   <label className="text-xs font-black text-emerald-800 uppercase tracking-widest">DÜŞÜNÜLEN TEKLİF TUTARI (₺)</label>
                   <input type="number" value={data.offerPrice} onChange={e => setData({...data, offerPrice: parseFloat(e.target.value)})} className="w-full bg-transparent border-none font-black text-5xl text-emerald-900 outline-none" placeholder="0.00" />
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className={`premium-card p-8 border-t-8 transition-all ${analysis.currentProfit > 0 ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
              <h3 className="font-black text-slate-800 mb-6">Karlılık Analizi</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Başa-Baş (Maliyet):</span>
                    <span className="text-sm font-bold text-slate-700">₺{analysis.breakEven.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Net Kâr:</span>
                    <span className={`text-xl font-black ${analysis.currentProfit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₺{analysis.currentProfit.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Anlık Marj:</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${analysis.currentMargin >= data.targetMargin ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                       %{analysis.currentMargin.toFixed(1)}
                    </span>
                 </div>
              </div>
           </div>

           <div className="premium-card p-6 bg-amber-50 border-amber-200">
              <h4 className="text-amber-900 font-black text-xs uppercase mb-3 flex items-center gap-2">
                 <Icon name="Lightbulb" size={16} /> Öneri Algoritması
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed mb-4">
                 Hedeflediğiniz <b>%{data.targetMargin}</b> marj için en ikna edici psikolojik fiyat önerimiz:
              </p>
              <div className="bg-white p-4 rounded-2xl border border-amber-200 text-center">
                 <p className="text-2xl font-black text-amber-900">₺{analysis.convincingPrice.toLocaleString()}</p>
                 <p className="text-[10px] text-amber-500 font-bold mt-1">SATIŞI KAPATACAK FİYAT</p>
              </div>
           </div>
        </div>
      </div>

      {/* Profesyonel Teklif Görünümü (Yalnızca Yazdırırken Görünür) */}
      <div className="hidden print-only fixed inset-0 bg-white p-12 text-slate-900 z-[9999]">
         <div className="flex justify-between items-start border-b-4 border-amber-900 pb-8 mb-12">
            <div className="flex items-center gap-4">
               {quote.logoUrl && (
                 <img src={quote.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
               )}
               <div>
                  <h1 className="text-4xl font-black text-amber-950 uppercase">{quote.businessName}</h1>
                  <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase mt-1">Premium Coffee Roastery & Solutions</p>
               </div>
            </div>
            <div className="text-right">
               <h2 className="text-xl font-black text-slate-800">SATIŞ TEKLİF FORMU</h2>
               <p className="text-slate-500 text-xs">No: VR-{Date.now().toString().slice(-6)}</p>
               <p className="text-slate-500 text-xs">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Gönderen</p>
               <p className="font-black text-slate-800">{quote.businessName}</p>
               <p className="text-slate-500 text-xs mt-1">Kavurma & Paketleme Merkezi</p>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Sayın</p>
               <p className="font-black text-slate-800">{data.customer || 'İş Ortağımız'}</p>
               <p className="text-slate-500 text-xs mt-1">Satın Alma Birimi Dikkatine</p>
            </div>
         </div>

         <table className="w-full mb-12 border-collapse">
            <thead className="bg-slate-50 border-y-2 border-slate-200">
               <tr>
                  <th className="py-4 px-4 text-left font-black text-slate-600 text-sm">AÇIKLAMA</th>
                  {quote.showTotalWeight && <th className="py-4 px-4 text-center font-black text-slate-600 text-sm">MİKTAR</th>}
                  <th className="py-4 px-4 text-right font-black text-slate-600 text-sm">TOPLAM</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               <tr>
                  <td className="py-8 px-4 font-bold text-slate-800 text-lg">{data.product || 'Özel Kavrum Kahve Sevkiyatı'}</td>
                  {quote.showTotalWeight && <td className="py-8 px-4 text-center font-bold text-slate-700 text-lg">{data.weight} KG</td>}
                  <td className="py-8 px-4 text-right font-black text-slate-900 text-2xl">₺{data.offerPrice.toLocaleString()}</td>
               </tr>
            </tbody>
         </table>

         <div className="flex justify-end mb-12">
            <div className="w-72 bg-slate-50 p-6 rounded-2xl space-y-3">
               {quote.showTax ? (
                 <>
                   <div className="flex justify-between text-xs text-slate-500 font-bold">
                      <span>Ara Toplam:</span>
                      <span>₺{(data.offerPrice / 1.1).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                   </div>
                   <div className="flex justify-between text-xs text-slate-500 font-bold">
                      <span>KDV (%10):</span>
                      <span>₺{(data.offerPrice - (data.offerPrice / 1.1)).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                   </div>
                 </>
               ) : (
                 <div className="flex justify-between text-xs text-slate-500 font-bold italic">
                   <span>KDV:</span>
                   <span>Fiyata Dahildir</span>
                 </div>
               )}
               <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                  <span className="font-black text-slate-900">GENEL TOPLAM:</span>
                  <span className="font-black text-amber-900 text-2xl">₺{data.offerPrice.toLocaleString()}</span>
               </div>
            </div>
         </div>

         <div className="border-t pt-8 grid grid-cols-2 gap-8 text-[10px] text-slate-400 font-medium">
            <div>
               {quote.showTerms && (
                 <>
                   <p className="font-black text-slate-800 text-xs mb-2">Şartlar & Koşullar:</p>
                   <ul className="list-disc pl-4 space-y-1">
                      <li>Teklif 7 takvim günü geçerlidir.</li>
                      <li>Lojistik maliyetleri teklife dahildir.</li>
                      {quote.footerNote && <li>{quote.footerNote}</li>}
                   </ul>
                 </>
               )}
            </div>
            <div className="text-right flex flex-col items-end justify-center">
               <div className="w-40 h-0.5 bg-slate-200 mb-2"></div>
               <p className="font-black text-slate-800 uppercase text-xs">Onay / Kaşe</p>
               <p className="text-[9px] mt-1 text-slate-400">İşbu teklif formu elektronik olarak hazırlanmıştır.</p>
            </div>
         </div>
      </div>
    </div>
  );
};
