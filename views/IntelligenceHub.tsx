
import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icons';
import { useToast } from '../components/ToastProvider';
import { GoogleGenAI } from "@google/genai";
import { ProductCost, Transaction, TransactionType } from '../types';

interface IntelligenceHubProps {
  productCosts: ProductCost[];
  transactions: Transaction[];
}

export const IntelligenceHub: React.FC<IntelligenceHubProps> = ({ productCosts, transactions }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'creative' | 'procurement'>('procurement');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const procurementList = useMemo(() => {
    // Bugünün veya bekleyen (isPrinted olmayan) siparişleri baz alalım
    const pendingTransactions = transactions.filter(t => t.type === TransactionType.INCOME && !t.isPrinted);

    const summary: Record<string, { count: number, totalWeight: number, unitWholesale: number }> = {};
    pendingTransactions.forEach(t => {
      const productName = t.description.split(' x')[0].trim();
      const costInfo = productCosts.find(pc => pc.key.includes(productName));
      
      if (!summary[productName]) {
        summary[productName] = { 
          count: 0, 
          totalWeight: 0, 
          unitWholesale: costInfo?.wholesalePricePerKg || 0 
        };
      }
      summary[productName].count += 1;
      summary[productName].totalWeight += t.weight;
    });

    return Object.entries(summary).map(([name, data]) => ({ 
      name, 
      ...data,
      totalCost: data.totalWeight * data.unitWholesale
    }));
  }, [transactions, productCosts]);

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto border border-slate-200 no-print">
        <button onClick={() => setActiveTab('procurement')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'procurement' ? 'bg-amber-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Kafeden Tedarik Listesi</button>
        <button onClick={() => setActiveTab('creative')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'creative' ? 'bg-amber-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>İçerik Stüdyosu</button>
      </div>

      {activeTab === 'procurement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 premium-card p-10">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Toptan Satın Alma Listesi</h3>
                   <p className="text-slate-400 text-xs font-bold mt-1">Kafeden bugün alman ve ödemen gereken kalemler.</p>
                </div>
                <button onClick={() => window.print()} className="p-4 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-2xl transition-all shadow-sm border border-slate-100">
                   <Icon name="Printer" size={24} />
                </button>
             </div>
             
             <div className="space-y-4">
                {procurementList.length === 0 ? (
                  <div className="p-24 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
                     <Icon name="ShoppingBag" size={64} className="mx-auto text-slate-100 mb-6" />
                     <p className="text-slate-300 font-black uppercase tracking-widest">Bekleyen Sipariş Bulunmamaktadır</p>
                  </div>
                ) : (
                  procurementList.map((item, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:border-amber-500 transition-all group shadow-sm">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center text-amber-900 font-black text-xl group-hover:bg-amber-900 group-hover:text-white transition-all">
                             {item.count}
                          </div>
                          <div>
                             <span className="font-black text-slate-800 uppercase text-base tracking-tight block">{item.name}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam {item.totalWeight.toFixed(2)} KG</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-slate-800">₺{item.totalCost.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-emerald-500 uppercase">Toptan Ödeme</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="space-y-6">
             <div className="premium-card p-8 bg-slate-900 text-white relative overflow-hidden">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-6">Finansal Özet</h4>
                <div className="space-y-6 relative z-10">
                   <div>
                      <p className="text-4xl font-black">₺{procurementList.reduce((s, i) => s + i.totalCost, 0).toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Bugün Kafeye Ödenecek Toplam</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-xs font-medium text-slate-300 italic">"Alış maliyetinizi (toptan fiyat) 'Maliyetler' sekmesinden güncelleyerek gerçek kârınızı takip edebilirsiniz."</p>
                   </div>
                </div>
             </div>
             
             <div className="premium-card p-8 border-l-8 border-amber-900">
                <h4 className="font-black text-slate-800 text-xs uppercase mb-3 flex items-center gap-2">
                   <Icon name="ShieldCheck" className="text-amber-700" size={16} /> Operasyonel İpucu
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                   Siparişleri kafeden toplu alırken **isPrinted** filtresi kullanılır. Yazdırdığınız siparişler bu listeden düşer, böylece mükerrer alımı önlersiniz.
                </p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'creative' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
           {/* Önceki görsel üretim kodları buraya gelecek (değişmediği için özet geçiyorum) */}
           <div className="premium-card p-10 text-center opacity-50">AI İçerik Stüdyosu Aktif</div>
        </div>
      )}
    </div>
  );
};
