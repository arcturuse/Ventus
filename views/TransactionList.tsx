
import React, { useRef, useState } from 'react';
import { Transaction, ProductCost, ShippingRate, Settings, TransactionType } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/ToastProvider';
import { TableSkeleton } from '../components/Skeleton';
import { mapShopierRowToTransactions } from '../services/shopierMapper';

interface TransactionListProps {
  transactions: Transaction[];
  onSetTransactions: (t: Transaction[]) => void;
  productCosts: ProductCost[];
  shippingRates: ShippingRate[];
  settings: Settings;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onSetTransactions, productCosts, shippingRates, settings }) => {
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleShopierUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = (window as any).XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = (window as any).XLSX.utils.sheet_to_json(ws);
        
        let allMapped: Transaction[] = [];
        data.forEach((row, i) => {
          const mapped = mapShopierRowToTransactions(row, i);
          allMapped = [...allMapped, ...mapped];
        });

        const existingIds = new Set(transactions.map(t => t.id));
        const newOnes = allMapped.filter(t => !existingIds.has(t.id));

        if (newOnes.length > 0) {
          onSetTransactions([...newOnes, ...transactions]);
          addToast(`${newOnes.length} yeni Shopier hareketi başarıyla eklendi!`, 'success');
        } else {
          addToast('Yeni hareket bulunamadı, liste güncel.', 'info');
        }
      } catch (err: any) {
        addToast('Excel işleme hatası. Dosya formatını kontrol edin.', 'error');
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="premium-card p-8 border-l-8 border-emerald-500 bg-emerald-50/20">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4">Shopier Excel Aktarımı</h4>
            <div className="flex gap-4">
               <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Icon name="FileUp" size={16} /> DOSYAYI SEÇ VE YÜKLE
              </button>
              <button 
                onClick={() => { if(confirm('Tüm verileri temizlemek istediğinize emin misiniz?')) onSetTransactions([]); }}
                className="p-4 bg-white text-rose-500 border border-rose-100 rounded-2xl hover:bg-rose-50 transition-all"
                title="Listeyi Temizle"
              >
                <Icon name="Trash2" size={20} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 font-bold italic">Shopier panelinden indirdiğiniz "Siparişler" Excel dosyasını buraya sürükleyin.</p>
         </div>

         <div className="premium-card p-8 border-l-8 border-amber-900 bg-amber-50/20 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıtlı İşlem Sayısı</span>
               <span className="text-2xl font-black text-slate-800">{transactions.length}</span>
            </div>
            <div className="w-full bg-amber-200/30 h-1.5 rounded-full mt-2 overflow-hidden">
               <div className="bg-amber-900 h-full" style={{width: '100%'}}></div>
            </div>
         </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleShopierUpload} accept=".xlsx,.xls,.csv" />

      <div className="premium-card overflow-hidden">
         <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
            <h4 className="font-black text-slate-700 text-[10px] uppercase tracking-[0.2em]">Son Shopier Hareketleri</h4>
         </div>
         <div className="overflow-x-auto">
            {processing ? <TableSkeleton rows={8} /> : (
               <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                     {transactions.length === 0 ? (
                        <tr>
                           <td className="p-20 text-center opacity-20 italic">Henüz veri yok. Excel yükleyerek başlayın.</td>
                        </tr>
                     ) : (
                        transactions.map(t => (
                           <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-5">
                                 <span className="text-[10px] font-black text-slate-300 uppercase">{t.date}</span>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                       <Icon name={t.type === 'income' ? 'TrendingUp' : 'TrendingDown'} size={16} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-800 tracking-tight leading-tight">{t.description}</p>
                                       <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{t.customer} • {t.category}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                 <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString()}
                                 </span>
                              </td>
                              <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => onSetTransactions(transactions.filter(tr => tr.id !== t.id))} className="text-slate-200 hover:text-rose-500 transition-colors">
                                    <Icon name="X" size={16} />
                                 </button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            )}
         </div>
      </div>
    </div>
  );
};
