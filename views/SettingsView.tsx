
import React, { useState } from 'react';
import { Settings, ShippingRate } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/ToastProvider';

interface SettingsViewProps {
  settings: Settings;
  onSetSettings: (s: Settings) => void;
  shippingRates: ShippingRate[];
  onSetShippingRates: (r: ShippingRate[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSetSettings, shippingRates, onSetShippingRates }) => {
  const { addToast } = useToast();
  const [localSettings, setLocalSettings] = useState(settings);

  const saveSettings = () => {
    onSetSettings(localSettings);
    addToast('Ayarlar başarıyla güncellendi.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <section className="premium-card p-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] shadow-sm">
            <Icon name="CreditCard" size={24} />
          </div>
          <div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Finansal Parametreler</h3>
             <p className="text-xs text-slate-400 font-medium">Shopier kesintileri ve paketleme maliyetleri.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Shopier Komisyon Oranı (%)</label>
            <div className="relative">
              <input type="number" step="0.1" value={localSettings.commissionRate} onChange={e => setLocalSettings({...localSettings, commissionRate: parseFloat(e.target.value)})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-2xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="absolute right-6 top-6 text-slate-300 font-black">%</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Paketleme & Sarf Maliyeti (₺)</label>
            <div className="relative">
              <input type="number" value={localSettings.costPerPack} onChange={e => setLocalSettings({...localSettings, costPerPack: parseFloat(e.target.value)})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-2xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="absolute right-6 top-6 text-slate-300 font-black">₺</span>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-card p-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-[1.5rem] shadow-sm">
            <Icon name="Target" size={24} />
          </div>
          <div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Satış Hedefleri</h3>
             <p className="text-xs text-slate-400 font-medium">Panel özet ekranındaki hedefleriniz.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Aylık Ciro Hedefi (₺)</label>
            <input type="number" value={localSettings.monthlyTarget} onChange={e => setLocalSettings({...localSettings, monthlyTarget: parseFloat(e.target.value)})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-xl text-slate-800" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Aylık KG Hedefi</label>
            <input type="number" value={localSettings.monthlyKgTarget} onChange={e => setLocalSettings({...localSettings, monthlyKgTarget: parseFloat(e.target.value)})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-xl text-slate-800" />
          </div>
        </div>
      </section>

      <button onClick={saveSettings} className="w-full py-8 coffee-gradient text-white rounded-[3rem] font-black shadow-2xl hover:scale-[1.01] transition-all uppercase tracking-widest text-sm">Ayarları Güncelle ve Kaydet</button>
    </div>
  );
};
