import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/ToastProvider';
import { GoogleGenAI, Type } from "@google/genai";

interface LeadCenterProps {
  leads: Lead[];
  onSetLeads: (leads: Lead[]) => void;
}

interface GeneratedEmail {
  subject: string;
  body: string;
  leadId: string;
}

export const LeadCenter: React.FC<LeadCenterProps> = ({ leads, onSetLeads }) => {
  const { addToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [previewEmail, setPreviewEmail] = useState<GeneratedEmail | null>(null);

  const campaigns = [
    { id: 'tech', name: 'Teknoloji Ofisleri', query: 'Türkiye genelindeki büyük yazılım ve teknoloji şirketleri', icon: 'Cpu' },
    { id: 'edu', name: 'Özel Okul & Kolejler', query: 'Türkiye genelindeki özel okul zincirleri ve kolejler merkezi', icon: 'GraduationCap' },
    { id: 'gym', name: 'Spor Salonu Zincirleri', query: 'Türkiye genelindeki kurumsal spor salonu ve fitness merkezleri', icon: 'Dumbbell' },
    { id: 'health', name: 'Özel Hastaneler', query: 'Türkiye genelindeki büyük özel hastane grupları ve klinikler', icon: 'Activity' },
  ];

  const runNationwideScan = async (campaign: typeof campaigns[0]) => {
    setActiveCampaign(campaign.id);
    setIsScanning(true);
    addToast(`${campaign.name} için Türkiye geneli tarama başlatıldı...`, 'info');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Türkiye genelinde (81 il) ${campaign.query} hakkında kahve tüketimi çok yüksek olabilecek gerçek ve kurumsal şirketleri bul. 
        Sonuçları şu JSON formatında getir: name, website, sector, city, estimated_employees.
        Önemli: Gerçek şirketler ve çalışan sayısı yüksek olanları önceliklendir.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                website: { type: Type.STRING },
                sector: { type: Type.STRING },
                city: { type: Type.STRING },
                estimated_employees: { type: Type.NUMBER }
              },
              required: ["name", "website", "city"]
            }
          }
        },
      });

      const foundData = JSON.parse(response.text || "[]");
      
      const mappedLeads: Lead[] = foundData.map((l: any) => {
        const monthlyKg = l.estimated_employees ? Math.ceil(l.estimated_employees * 0.5) : 10;
        return {
          id: Math.random().toString(36).substr(2, 9),
          companyName: l.name,
          category: `${l.sector} (${l.city})`,
          contactPerson: 'Satın Alma / İdari İşler Müdürü',
          email: `info@${l.website.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}`,
          website: l.website,
          status: 'new',
          relevanceScore: 85 + Math.floor(Math.random() * 15),
          notes: `Türkiye geneli otomatik tarama: ${l.city} lokasyonu.`,
          suggestedPackage: {
            packageName: 'Ventus Kurumsal Premium',
            monthlyKg: monthlyKg,
            price: monthlyKg * 950 
          }
        };
      });

      onSetLeads([...mappedLeads, ...leads]);
      addToast(`Tebrikler! ${mappedLeads.length} yeni kurumsal müşteri bulundu.`, 'success');

    } catch (err) {
      console.error(err);
      addToast('Tarama başarısız oldu. Lütfen tekrar deneyin.', 'error');
    } finally {
      setIsScanning(false);
      setActiveCampaign(null);
    }
  };

  const generateProposal = async (lead: Lead) => {
    setIsGenerating(lead.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Sen Ventus Roast Kurumsal Satış Robotusun. 
      Şirket: ${lead.companyName}
      Sektör/Şehir: ${lead.category}
      Tedarik Önerisi: ${lead.suggestedPackage?.monthlyKg} KG / Aylık
      Fiyat: ${lead.suggestedPackage?.price} TL (Tüm Türkiye'ye ücretsiz kargo dahil)
      
      Bu kuruma, Ventus Roast'un taze kavrum ve ücretsiz kargo avantajlarını anlatan, 
      kurumun bulunduğu şehirdeki çalışanların motivasyonunu artıracak profesyonel bir B2B teklif maili yaz.
      İlk satır: "Konu: [Çarpıcı Başlık]" olsun.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const fullText = response.text || '';
      const lines = fullText.split('\n');
      const subject = lines[0].replace('Konu:', '').trim();
      const body = lines.slice(1).join('\n').trim();

      setPreviewEmail({ subject, body, leadId: lead.id });
      addToast('AI Teklifi Hazır!', 'info');
    } catch (err) {
      addToast('Hata oluştu.', 'error');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="slate-gradient p-10 md:p-14 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg">
              <Icon name="Zap" size={24} className="text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-emerald-300">Auto-Pilot v2.0</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tighter">
            Türkiye Geneli <br/>
            <span className="text-amber-500 italic underline decoration-amber-500/30">Müşteri Avı</span> Başlatın.
          </h2>
          <p className="text-slate-300 font-medium max-w-xl text-lg mb-10 leading-relaxed">
            AI destekli tarayıcımızla sektörünüzdeki en iyi kurumsal müşterileri saniyeler içinde bulun ve teklif gönderin.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {campaigns.map((camp) => (
              <button
                key={camp.id}
                onClick={() => runNationwideScan(camp)}
                disabled={isScanning}
                className={`group relative p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 text-center ${
                  activeCampaign === camp.id 
                    ? 'bg-amber-600 border-amber-400 scale-95 shadow-inner' 
                    : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 hover:border-amber-600'
                } disabled:opacity-50`}
              >
                <div className={`p-4 rounded-2xl transition-all ${activeCampaign === camp.id ? 'bg-white text-amber-700 shadow-xl' : 'bg-slate-700 text-slate-300 group-hover:bg-amber-500 group-hover:text-white'}`}>
                  <Icon name={camp.icon as any} size={28} />
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-white">{camp.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-2 font-bold group-hover:text-slate-200 uppercase">Taramayı Başlat</p>
                </div>
                {activeCampaign === camp.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-3xl backdrop-blur-sm">
                    <Icon name="Loader2" className="animate-spin text-white" size={32} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <Icon name="List" size={16} className="text-amber-600" />
              Potansiyel Müşteriler ({leads.length})
            </h3>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
               <span className="text-[10px] font-black text-emerald-600 uppercase">Canlı AI Veritabanı</span>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="premium-card p-32 text-center border-dashed border-4 border-slate-200 bg-white shadow-none">
              <Icon name="Globe" size={64} className="mx-auto mb-6 text-slate-200" />
              <h4 className="text-xl font-black text-slate-300 uppercase tracking-widest">Henüz Av Başlatılmadı</h4>
              <p className="text-slate-400 text-sm mt-2">Kategorilerden birini seçerek Türkiye'deki şirketleri bulmaya başlayın.</p>
            </div>
          ) : (
            leads.map(lead => (
              <div key={lead.id} className="premium-card p-8 group relative overflow-hidden hover:shadow-2xl border-2 border-transparent hover:border-amber-500/50 transition-all bg-white">
                <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                  <div className="flex gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-700 transition-all shadow-inner border border-slate-100">
                        <Icon name="Building2" size={32} />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white">
                        %{lead.relevanceScore}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        {lead.companyName}
                        {lead.website && (
                          <a href={lead.website} target="_blank" className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-100 transition-all">
                            <Icon name="ExternalLink" size={16} />
                          </a>
                        )}
                      </h4>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter mt-1">{lead.category}</p>
                      
                      <div className="mt-6 flex flex-wrap items-center gap-4">
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black uppercase border border-emerald-100 flex items-center gap-2">
                           <Icon name="Package" size={14} /> {lead.suggestedPackage?.monthlyKg}KG / Ay Önerisi
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tighter">₺{lead.suggestedPackage?.price.toLocaleString()} <span className="text-xs font-bold text-slate-400 uppercase">/ Aylık</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-col gap-3 justify-center min-w-[180px]">
                    <button 
                      onClick={() => generateProposal(lead)}
                      disabled={isGenerating === lead.id}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 shadow-xl hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest"
                    >
                       <Icon name={isGenerating === lead.id ? "Loader2" : "Sparkles"} className={isGenerating === lead.id ? "animate-spin" : ""} size={16} />
                       AI TEKLİF ÜRET
                    </button>
                    <div className="flex gap-2 w-full">
                      <select 
                        value={lead.status}
                        onChange={(e) => {
                          onSetLeads(leads.map(l => l.id === lead.id ? { ...l, status: e.target.value as any, lastContactDate: new Date().toISOString() } : l));
                        }}
                        className="flex-1 px-4 py-3 bg-slate-100 border-none rounded-2xl text-[10px] font-black uppercase text-slate-600 outline-none focus:text-slate-900 focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="new">BEKLEMEDE</option>
                        <option value="emailed">TEKLİF EDİLDİ</option>
                        <option value="responded">GERİ DÖNÜŞ</option>
                      </select>
                      <button onClick={() => onSetLeads(leads.filter(l => l.id !== lead.id))} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
                        <Icon name="Trash2" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="premium-card p-8 bg-slate-900 text-white relative overflow-hidden shadow-2xl">
             <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-amber-500 mb-8">Performans Metrikleri</h4>
             <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-6xl font-black text-white">{leads.filter(l => l.status !== 'new').length}</p>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mt-2 tracking-widest">Gönderilen Teklifler</p>
                   </div>
                   <div className="p-4 bg-amber-500/10 rounded-2xl">
                      <Icon name="Send" size={32} className="text-amber-500" />
                   </div>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span>Pipeline Doluluk Oranı</span>
                      <span className="text-amber-500">%{leads.length > 0 ? (leads.filter(l => l.status !== 'new').length / leads.length * 100).toFixed(0) : 0}</span>
                   </div>
                   <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5">
                      <div className="bg-amber-500 h-full transition-all duration-1000" style={{width: `${leads.length > 0 ? (leads.filter(l => l.status !== 'new').length / leads.length * 100) : 0}%`}}></div>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="premium-card p-8 bg-amber-50 border-amber-200">
             <h4 className="font-black text-amber-900 text-xs uppercase mb-4 flex items-center gap-2">
                <Icon name="Target" className="text-amber-700" size={18} /> Avcı İpucu
             </h4>
             <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                Kurumsal şirketlere Salı ve Perşembe sabahları saat 10:00 - 11:30 arası gönderilen tekliflerin açılma oranı diğer saatlere göre %45 daha yüksektir. 
             </p>
          </div>
        </div>
      </div>

      {previewEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="slate-gradient p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black flex items-center gap-4 uppercase tracking-tighter italic">
                   AI Teklif Taslağı
                </h3>
                <p className="text-amber-400 text-xs font-black uppercase tracking-widest mt-1">Sektörel olarak optimize edildi</p>
              </div>
              <button onClick={() => setPreviewEmail(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                <Icon name="X" size={24} />
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-8 bg-slate-50">
              <div className="space-y-4">
                <div className="px-8 py-6 bg-white border-2 border-slate-200 rounded-[2rem] shadow-sm space-y-6">
                  <div className="pb-4 border-b border-slate-100 font-black text-xl text-slate-800 italic">
                     {previewEmail.subject}
                  </div>
                  <div className="text-sm text-slate-700 leading-[1.7] font-medium whitespace-pre-wrap">
                     {previewEmail.body}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border-t flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => {
                  const lead = leads.find(l => l.id === previewEmail.leadId);
                  window.location.href = `mailto:${lead?.email}?subject=${encodeURIComponent(previewEmail.subject)}&body=${encodeURIComponent(previewEmail.body)}`;
                  setPreviewEmail(null);
                  addToast('Teklif mail istemcisine aktarıldı!', 'success');
                }}
                className="flex-1 py-5 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-3"
              >
                <Icon name="Mail" size={18} /> TEKLİFİ GÖNDER
              </button>
              <button 
                onClick={() => {
                   navigator.clipboard.writeText(`Konu: ${previewEmail.subject}\n\n${previewEmail.body}`);
                   addToast('Metin kopyalandı!', 'info');
                }}
                className="px-10 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
              >
                <Icon name="Copy" size={18} /> KOPYALA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};