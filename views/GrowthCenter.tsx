
import React, { useMemo } from 'react';
import { Transaction, Settings, TransactionType } from '../types';
import { Icon } from '../components/Icons';

interface GrowthCenterProps {
  transactions: Transaction[];
  settings: Settings;
}

export const GrowthCenter: React.FC<GrowthCenterProps> = ({ transactions, settings }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthData = transactions.filter(t => t.date.startsWith(currentMonth));
  const monthlyRevenue = currentMonthData.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
  const monthlyKg = currentMonthData.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.weight, 0);

  const predictions = useMemo(() => {
    const customerMap: Record<string, { dates: number[], weights: number[] }> = {};
    transactions.forEach(t => {
      if (t.type === TransactionType.INCOME && t.customer) {
        if (!customerMap[t.customer]) customerMap[t.customer] = { dates: [], weights: [] };
        customerMap[t.customer].dates.push(new Date(t.date).getTime());
        customerMap[t.customer].weights.push(t.weight);
      }
    });

    return Object.entries(customerMap).map(([name, data]) => {
      if (data.dates.length < 2) return null;
      const sorted = data.dates.sort();
      const diffs = [];
      for(let i=1; i<sorted.length; i++) diffs.push(sorted[i] - sorted[i-1]);
      
      const avgGapMs = diffs.reduce((a,b) => a+b, 0) / diffs.length;
      const avgDays = avgGapMs / (1000 * 60 * 60 * 24);
      const lastDate = sorted[sorted.length - 1];
      const nextOrder = new Date(lastDate + avgGapMs);
      
      const daysLeft = Math.ceil((nextOrder.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      return { name, avgDays: Math.round(avgDays), nextOrder: nextOrder.toLocaleDateString('tr-TR'), daysLeft };
    }).filter(Boolean).sort((a: any, b: any) => a.daysLeft - b.daysLeft);
  }, [transactions]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card p-8 border-l-[12px] border-l-amber-900">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aylık Ciro Hedefi</p>
           <h3 className="text-3xl font-black text-slate-800">₺{monthlyRevenue.toLocaleString()}</h3>
           <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full" style={{width: `${(monthlyRevenue / settings.monthlyTarget) * 100}%`}}></div>
           </div>
           <p className="text-[10px] text-slate-400 mt-2 text-right font-bold uppercase">Hedef: ₺{settings.monthlyTarget.toLocaleString()}</p>
        </div>
        <div className="premium-card p-8 border-l-[12px] border-l-emerald-600">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aylık KG Hedefi</p>
           <h3 className="text-3xl font-black text-slate-800">{monthlyKg.toFixed(1)} KG</h3>
           <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{width: `${(monthlyKg / settings.monthlyKgTarget) * 100}%`}}></div>
           </div>
           <p className="text-[10px] text-slate-400 mt-2 text-right font-bold uppercase">Hedef: {settings.monthlyKgTarget} KG</p>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
           <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
             <Icon name="Calendar" className="text-amber-700" size={20} /> Reorder Tahminleyici
           </h4>
           <div className="p-2 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black uppercase">Otomatik Analiz</div>
        </div>
        <div className="divide-y divide-slate-100">
           {predictions.map((p: any) => (
             <div key={p.name} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><Icon name="User" size={18} /></div>
                   <div>
                      <p className="font-black text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">Tüketim hızı: {p.avgDays} gün/sipariş</p>
                   </div>
                </div>
                <div className="text-center sm:text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Tahmini Yeni Sipariş</p>
                   <p className={`font-black ${p.daysLeft < 3 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                      {p.nextOrder} ({p.daysLeft < 0 ? 'Gecikti' : `${p.daysLeft} gün kaldı`})
                   </p>
                </div>
             </div>
           ))}
           {predictions.length === 0 && <div className="p-12 text-center text-slate-400 italic">Yeterli veri biriktiğinde tahminler burada görünecek.</div>}
        </div>
      </div>
    </div>
  );
};
