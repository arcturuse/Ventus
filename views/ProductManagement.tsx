
import React, { useState, useRef } from 'react';
import { ProductCost } from '../types';
import { Icon as LucideIcon } from '../components/Icons';
import { useToast } from '../components/ToastProvider';

interface ProductManagementProps {
  costs: ProductCost[];
  onSetCosts: (c: ProductCost[]) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ costs, onSetCosts }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  const filteredCosts = costs.filter(c => c.key.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleUpdate = (key: string, field: string, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = costs.map(c => c.key === key ? { ...c, [field]: num } : c);
    onSetCosts(updated);
  };

  const extractWeightFromName = (name: string): number => {
    // Türkçe karakterleri ve boşlukları normalize et
    const lower = name.toLowerCase()
      .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');

    // 1 KG varyasyonları
    if (lower.includes('1 kg') || lower.includes('1kg') || lower.includes('1000 gr') || lower.includes('1000gr')) return 1;
    
    // 500 Gram varyasyonları
    if (lower.includes('500 gr') || lower.includes('500gr') || lower.includes('500 g') || lower.includes('0.5 kg')) return 0.5;
    
    // 250 Gram varyasyonları
    if (lower.includes('250 gr') || lower.includes('250gr') || lower.includes('250 g') || lower.includes('0.25 kg')) return 0.25;
    
    // Regex ile yakalamaya çalış (örn: 200 gr, 100 gram)
    const match = lower.match(/(\d+)\s*(gr|g|gram|kg)/);
    if (match) {
      let val = parseFloat(match[1]);
      // Eğer birim kg ise direkt dön, değilse 1000'e böl
      return match[2].includes('k') ? val : val / 1000;
    }
    
    return 0.25; // Varsayılan (En sık kullanılan)
  };

  const handleProductListUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        let newProductsCount = 0;
        const currentCosts = [...costs];

        // Mevcut ürünlerin isimlerini set yapalım
        const existingKeys = new Set(currentCosts.map(c => c.key));

        data.forEach(row => {
          // Shopier ürün listesinde genelde "Ürün Adı" veya "Name" sütunu olur.
          // Varyasyonları da kontrol et (Seçenekler)
          const productName = row["Ürün Adı"] || row["Name"] || row["Title"];
          const variant = row["Seçenekler"] || row["Varyasyon"] || "";
          
          // Ürün adı + Varyant (Varsa) şeklinde unique key oluştur
          // Örn: Ethiopia Sidamo - 250 gr
          const fullKey = variant ? `${productName} - ${variant}` : productName;

          if (fullKey && !existingKeys.has(fullKey)) {
            const estimatedWeight = extractWeightFromName(fullKey);
            
            currentCosts.push({
              key: fullKey,
              wholesalePricePerKg: 0, // Kullanıcı manuel girecek
              weight: estimatedWeight, // İsimden tahmin edildi
              stock: row["Stok Adedi"] || 0
            });
            existingKeys.add(fullKey);
            newProductsCount++;
          }
        });

        if (newProductsCount > 0) {
          onSetCosts(currentCosts);
          addToast(`${newProductsCount} yeni ürün/varyasyon eklendi!`, 'success');
        } else {
          addToast('Yeni ürün bulunamadı veya liste zaten güncel.', 'info');
        }

      } catch (err) {
        console.error(err);
        addToast('Excel dosyası okunamadı. Formatı kontrol edin.', 'error');
      } finally {
        setProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="coffee-gradient p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <LucideIcon name="Tag" size={32} /> Tedarik Maliyetleri
          </h2>
          <p className="text-amber-100/80 font-medium">Shopier'deki 250g, 500g ve 1kg ürünlerinizin toptan alış maliyetlerini girin.</p>
        </div>
        <div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="px-6 py-4 bg-white text-amber-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-amber-50 hover:scale-105 transition-all flex items-center gap-2"
          >
            <LucideIcon name={processing ? "Loader2" : "FileSpreadsheet"} className={processing ? "animate-spin" : ""} size={18} />
            {processing ? "İşleniyor..." : "Ürün Listesi Yükle (Excel)"}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleProductListUpload} className="hidden" accept=".xlsx,.xls,.csv" />
        </div>
      </div>

      <div className="premium-card p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <LucideIcon name="Search" className="absolute left-4 top-3.5 text-slate-400" size={18} />
           <input type="text" placeholder="Ürünlerde ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">
          Toplam: {costs.length} Varyant
        </div>
      </div>

      <div className="premium-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün / Varyant Adı</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Paket (KG)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Toptan Alış (₺/KG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-20 text-center text-slate-400 italic flex flex-col items-center gap-4">
                    <LucideIcon name="Inbox" size={48} className="opacity-20" />
                    <span>Listede ürün yok. Shopier ürün listesi Excel'ini yükleyerek başlayın.</span>
                  </td>
                </tr>
              ) : (
                filteredCosts.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.key}</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="relative w-24 mx-auto">
                         <input type="number" step="0.01" value={item.weight} onChange={e => handleUpdate(item.key, 'weight', e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-center font-bold text-slate-600 focus:ring-2 focus:ring-amber-500 outline-none" />
                         <span className="absolute right-8 top-2.5 text-[10px] text-slate-300 pointer-events-none">KG</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="relative inline-block w-32">
                          <input type="number" value={item.wholesalePricePerKg || ''} onChange={e => handleUpdate(item.key, 'wholesalePricePerKg', e.target.value)} className="w-full text-right p-3 pr-8 border border-emerald-100 rounded-xl font-black text-emerald-700 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-emerald-700/30" placeholder="0" />
                          <span className="absolute right-3 top-3.5 text-emerald-600 font-bold text-xs">₺</span>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
