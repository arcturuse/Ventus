
import React, { useState } from 'react';
import { Settings, ShippingRate } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/ToastProvider';

/**
 * Updated interface to accept shipping rate props passed from App.tsx
 */
interface SettingsViewProps {
  settings: Settings;
  onSetSettings: (s: Settings) => void;
  shippingRates: ShippingRate[];
  onSetShippingRates: (rates: ShippingRate[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  settings, 
  onSetSettings,
  shippingRates,
  onSetShippingRates
}) => {
  const { addToast } = useToast();
  const [localSettings, setLocalSettings] = useState(settings);
  const [fbConfig, setFbConfig] = useState(settings.firebaseConfig ? JSON.stringify(settings.firebaseConfig, null, 2) : '');

  const save = () => {
    try {
      const updated = { ...localSettings };
      if (fbConfig.trim()) {
        updated.firebaseConfig = JSON.parse(fbConfig);
      }
      onSetSettings(updated);
      addToast('Tüm ayarlar başarıyla kaydedildi!', 'success');
      if (fbConfig.trim() && !settings.firebaseConfig) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e) {
      addToast('Firebase Config formatı hatalı!', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <section className="premium-card p-10 bg-slate-900 text-white border-none shadow-2xl overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-2xl font-black uppercase italic flex items-center gap-3">
            <Icon name="Cloud" className="text-amber-500" /> Bulut Bağlantısı (Firebase)
          </h3>
          <p className="text-slate-400 text-xs mt-2 mb-6 font-medium">Cihazlar arası anlık senkronizasyon için config kodunu buraya yapıştırın.</p>
          <textarea 
            value={fbConfig}
            onChange={e => setFbConfig(e.target.value)}
            className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 font-mono text-[11px] text-emerald-400 outline-none focus:border-amber-500"
            placeholder='{ "apiKey": "...", ... }'
          />
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
      </section>

      <section className="premium-card p-10 bg-white">
        <h3 className="text-xl font-black text-slate-800 uppercase italic mb-6 flex items-center gap-3">
          <Icon name="ShoppingBag" className="text-emerald-600" /> Shopify Entegrasyonu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mağaza URL (myshopify.com)</label>
            <input 
              type="text" 
              value={localSettings.shopifyConfig?.shopUrl || ''}
              onChange={e => setLocalSettings({...localSettings, shopifyConfig: {...(localSettings.shopifyConfig || {accessToken:''}), shopUrl: e.target.value}})}
              className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold"
              placeholder="https://magaza-adi.myshopify.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Access Token</label>
            <input 
              type="password" 
              value={localSettings.shopifyConfig?.accessToken || ''}
              onChange={e => setLocalSettings({...localSettings, shopifyConfig: {...(localSettings.shopifyConfig || {shopUrl:''}), accessToken: e.target.value}})}
              className="w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold"
              placeholder="shpat_..."
            />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-4 italic">Not: Tarayıcı CORS engeli nedeniyle bağlantı kurulamazsa Shopify panelinden sipariş CSV'si indirip "Siparişler" kısmından manuel yükleyebilirsiniz.</p>
      </section>

      <section className="premium-card p-10 bg-white">
        <h3 className="text-xl font-black text-slate-800 uppercase italic mb-6 flex items-center gap-3">
          <Icon name="Target" className="text-rose-600" /> Hedefler ve Maliyetler
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aylık Ciro Hedefi (₺)</label>
            <input type="number" value={localSettings.monthlyTarget} onChange={e => setLocalSettings({...localSettings, monthlyTarget: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paket Başı Sarf (₺)</label>
            <input type="number" value={localSettings.costPerPack} onChange={e => setLocalSettings({...localSettings, costPerPack: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xl" />
          </div>
        </div>
      </section>

      <button onClick={save} className="w-full py-8 coffee-gradient text-white rounded-[2.5rem] font-black shadow-2xl hover:scale-[1.02] transition-all uppercase tracking-widest">
        Tüm Değişiklikleri Kaydet
      </button>
    </div>
  );
};
