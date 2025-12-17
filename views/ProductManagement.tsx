
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

  const filteredCosts = costs.filter(c => c.key.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleUpdate = (key: string, field: string, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = costs.map(c => c.key === key ? { ...c, [field]: num } : c);
    onSetCosts(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="coffee-gradient p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <LucideIcon name="Tag" size={32} /> Tedarik Maliyetleri
          </h2>
          <p className="text-amber-100/80 font-medium">Kafeye ödeyeceğiniz toptan birim fiyatları (KG bazlı) buradan yönetin.</p>
        </div>
      </div>

      <div className="premium-card p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <LucideIcon name="Search" className="absolute left-4 top-3.5 text-slate-400" size={18} />
           <input type="text" placeholder="Ürün ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
      </div>

      <div className="premium-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün / Varyant</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Paket Gramaj (KG)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Toptan KG Fiyatı (₺)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-20 text-center text-slate-400 italic">Henüz ürün eklenmemiş. Shopier Excel yükleyince burası otomatik dolar.</td>
                </tr>
              ) : (
                filteredCosts.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.key}</p>
                    </td>
                    <td className="px-6 py-4">
                       <input type="number" step="0.01" value={item.wholesalePricePerKg ? item.weight : (item.weight || 0.25)} onChange={e => handleUpdate(item.key, 'weight', e.target.value)} className="w-24 mx-auto block p-2 border border-slate-200 rounded-xl text-center font-bold text-slate-600 focus:ring-2 focus:ring-amber-500 outline-none" />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <input type="number" value={item.wholesalePricePerKg || 0} onChange={e => handleUpdate(item.key, 'wholesalePricePerKg', e.target.value)} className="w-32 text-right p-3 border border-emerald-100 rounded-xl font-black text-emerald-700 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0" />
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
