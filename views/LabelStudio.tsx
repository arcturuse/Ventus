
import React, { useState, useMemo, useRef } from 'react';
import { Icon } from '../components/Icons';
import { useToast } from '../components/ToastProvider';
import { LabelDesign, Transaction, TransactionType } from '../types';

interface LabelStudioProps {
  labels: LabelDesign[];
  onSetLabels: (labels: LabelDesign[]) => void;
  transactions: Transaction[];
  onSetTransactions: (transactions: Transaction[]) => void;
}

export const LabelStudio: React.FC<LabelStudioProps> = ({ labels, onSetLabels, transactions, onSetTransactions }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', keyword: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Sadece bugünün veya bekleyen siparişleri göster (isPrinted kontrolü ile)
  const pendingOrders = useMemo(() => {
    return transactions.filter(t => t.type === TransactionType.INCOME);
  }, [transactions]);

  // Baskı sırasını oluştur (Eşleşmelerle birlikte)
  const printQueue = useMemo(() => {
    return pendingOrders.map(order => {
      const matchedLabel = labels.find(l => 
        order.description.toLowerCase().includes(l.matchKeyword.toLowerCase()) ||
        order.category.toLowerCase().includes(l.matchKeyword.toLowerCase())
      );
      return { ...order, matchedLabel };
    });
  }, [pendingOrders, labels]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === printQueue.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(printQueue.map(q => q.id)));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const labelId = Math.random().toString(36).substr(2, 9);
      onSetLabels([...labels, { 
        id: labelId, 
        name: newLabel.name || file.name, 
        imageUrl: base64String, 
        matchKeyword: newLabel.keyword 
      }]);
      setNewLabel({ name: '', keyword: '' });
      setShowUploader(false);
      addToast('Tasarım eklendi!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      addToast('Lütfen yazdırılacak siparişleri seçin.', 'info');
      return;
    }
    
    // İşaretleme: Yazdırıldı olarak kaydet
    const updated = transactions.map(t => 
      selectedIds.has(t.id) ? { ...t, isPrinted: true } : t
    );
    onSetTransactions(updated);
    
    setTimeout(() => window.print(), 100);
  };

  const itemsToPrint = printQueue.filter(q => selectedIds.has(q.id) && q.matchedLabel);

  return (
    <div className="space-y-8 pb-20 no-print">
      <div className="coffee-gradient p-10 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">Ventus Label Studio</h2>
          <p className="text-amber-200/60 font-medium text-sm">Siparişleriniz için otomatik etiket dizilimi ve toplu baskı istasyonu.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button onClick={() => setShowUploader(true)} className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2">
            <Icon name="Plus" size={18} /> TASARIM YÜKLE
          </button>
          <button 
            onClick={handlePrint}
            className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-amber-400 transition-all flex items-center gap-2"
          >
            <Icon name="Printer" size={20} /> SEÇİLİLERİ YAZDIR ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Kütüphanedeki Tasarımlar ({labels.length})</h3>
          <div className="grid grid-cols-1 gap-4">
            {labels.map(label => (
              <div key={label.id} className="premium-card p-4 flex gap-4 items-center group">
                <img src={label.imageUrl} className="w-16 h-16 object-cover rounded-xl shadow-inner border" />
                <div className="flex-1">
                  <p className="font-black text-slate-800 text-xs uppercase">{label.name}</p>
                  <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase">Anahtar: {label.matchKeyword}</p>
                </div>
                <button onClick={() => onSetLabels(labels.filter(l => l.id !== label.id))} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baskı Bekleyen Siparişler</h3>
            <button onClick={selectAll} className="text-[10px] font-black text-amber-600 uppercase hover:underline">
              {selectedIds.size === printQueue.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
          </div>

          <div className="premium-card overflow-hidden">
             <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100">
                   {printQueue.map((item) => (
                      <tr key={item.id} className={`group hover:bg-slate-50 transition-colors ${selectedIds.has(item.id) ? 'bg-amber-50/50' : ''}`}>
                         <td className="px-6 py-4 w-10">
                            <button 
                              onClick={() => toggleSelect(item.id)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                selectedIds.has(item.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'
                              }`}
                            >
                              {selectedIds.has(item.id) && <Icon name="Check" size={14} />}
                            </button>
                         </td>
                         <td className="px-6 py-4">
                            <p className={`font-black text-sm uppercase ${item.isPrinted ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{item.customer}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{item.description}</p>
                         </td>
                         <td className="px-6 py-4">
                            {item.matchedLabel ? (
                               <div className="flex items-center gap-2">
                                  <img src={item.matchedLabel.imageUrl} className="w-8 h-8 rounded border shadow-sm" />
                                  <span className="text-[10px] font-bold text-slate-600 uppercase">{item.matchedLabel.name}</span>
                               </div>
                            ) : (
                               <span className="text-[9px] font-black text-rose-400 bg-rose-50 px-2 py-1 rounded">EŞLEŞME YOK</span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                            {item.isPrinted ? (
                              <div className="flex items-center justify-end gap-1 text-emerald-500">
                                <Icon name="CheckCircle" size={14} />
                                <span className="text-[9px] font-black uppercase">BASILDI</span>
                              </div>
                            ) : (
                              <span className="text-[9px] font-black text-slate-400 uppercase">BEKLİYOR</span>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>

      {showUploader && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Etiket Tasarımı Yükle</h3>
            <div className="space-y-4">
               <input type="text" placeholder="Tasarım Adı" value={newLabel.name} onChange={e => setNewLabel({...newLabel, name: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" />
               <input type="text" placeholder="Eşleşecek Kelime (Örn: Colombia)" value={newLabel.keyword} onChange={e => setNewLabel({...newLabel, keyword: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-amber-600" />
               <div onClick={() => fileInputRef.current?.click()} className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center cursor-pointer hover:border-amber-500 transition-all">
                  <Icon name="Upload" size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400 uppercase">Görsel Seç</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
               </div>
            </div>
            <button onClick={() => setShowUploader(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">KAPAT</button>
          </div>
        </div>
      )}

      {/* PRINT LAYOUT */}
      <div className="hidden print-only fixed inset-0 bg-white z-[9999] p-8">
         <div className="grid grid-cols-2 gap-8">
            {itemsToPrint.map((item, idx) => (
              <div key={idx} className="w-[10cm] h-[10cm] border border-slate-200 relative p-4 flex flex-col items-center justify-center break-inside-avoid">
                 <img src={item.matchedLabel?.imageUrl} className="w-full h-full object-contain" />
                 <div className="absolute bottom-4 left-4 right-4 text-center bg-white/90 p-2 border-t">
                    <p className="text-[10px] font-black text-slate-900 uppercase">{item.customer}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">KAVRUM: {new Date().toLocaleDateString('tr-TR')} | ORDER #{item.orderId}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
