
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

  // Hazır Kampanya Tanımları
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
        // Çalışan sayısına göre paket tahmini
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
            price: monthlyKg * 950 // Kargo dahil kurumsal fiyatlandırma
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
      {/* Auto-Pilot Header */}
      <div className="slate-gradient p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-900/40">
              <Icon name="Zap" size={24} className="text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-emerald-400">Ventus Auto-Pilot v2.0</span>
          </div>
          <h2 className="text-5xl font-black mb-6 leading-none tracking-tighter">
            Türkiye'nin Her Yerine <br/>
            <span className="text-amber-500 italic">Tek Tıkla</span> Satış Yapın.
          </h2>
          <p className="text-slate-300 font-medium max-w-xl text-lg mb-10 leading-relaxed">
            Hedef kitlenizi kendiniz yazmayın. Aşağıdaki kurumsal kategorilerden birini seçin, AI tüm Türkiye'yi tarasın ve size hazır müşteriler getirsin.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {campaigns.map((camp) => (
              <button
                key={camp.id}
                onClick={() => runNationwideScan(camp)}
                disabled={isScanning}
                className={`group relative p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 text-center ${
                  activeCampaign === camp.id 
                    ? 'bg-amber-500 border-amber-400 scale-95' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                } disabled:opacity-50`}
              >
                <div className={`p-4 rounded-2xl transition-colors ${activeCampaign === camp.id ? 'bg-white text-amber-600' : 'bg-white/10 text-white group-hover:bg-amber-500'}`}>
                  <Icon name={camp.icon as any} size={28} />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-widest">{camp.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold group-hover:text-slate-200 uppercase">Tüm Türkiye'yi Tara</p>
                </div>
                {activeCampaign === camp.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl backdrop-blur-sm">
                    <Icon name="Loader2" className="animate-spin text-white" size={32} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
      </div>

      {/* Leads List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-6">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-[0.2em]">Otomatik Bulunan Fırsatlar ({leads.length})</h3>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase">AI Hunter Canlı</span>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="premium-card p-32 text-center border-dashed border-4 border-slate-100 bg-slate-50/30">
              <Icon name="Globe" size={64} className="mx-auto mb-6 text-slate-200" />
              <h4 className="text-xl font-black text-slate-300 uppercase tracking-widest">Türkiye Taraması Bekleniyor</h4>
              <p className="text-slate-400 text-sm mt-2">Yukarıdaki kategorilerden birine tıklayarak başlayın.</p>
            </div>
          ) : (
            leads.map(lead => (
              <div key={lead.id} className="premium-card p-8 group relative overflow-hidden hover:shadow-2xl hover:border-amber-400 transition-all">
                <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                  <div className="flex gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors shadow-inner">
                        <Icon name="Building2" size={32} />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white">
                        %{lead.relevanceScore}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        {lead.companyName}
                        {lead.website && (
                          <a href={lead.website} target="_blank" className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-amber-600 hover:bg-amber-50 transition-all">
                            <Icon name="ExternalLink" size={16} />
                          </a>
                        )}
                      </h4>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter mt-1">{lead.category}</p>
                      
                      <div className="mt-6 flex flex-wrap items-center gap-4">
                        <div className="px-4 py-2 bg-amber-50 text-amber-800 rounded-2xl text-xs font-black uppercase border border-amber-100 flex items-center gap-2">
                           <Icon name="Package" size={14} /> {lead.suggestedPackage?.monthlyKg}KG Paket Önerisi
                        </div>
                        <span className="text-xl font-black text-slate-800 tracking-tighter">₺{lead.suggestedPackage?.price.toLocaleString()} <span className="text-xs font-bold text-slate-400 uppercase">/ Ay</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-col gap-3 justify-center">
                    <button 
                      onClick={() => generateProposal(lead)}
                      disabled={isGenerating === lead.id}
                      className="px-8 py-4 coffee-gradient text-white rounded-3xl text-sm font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 transition-all"
                    >
                       <Icon name={isGenerating === lead.id ? "Loader2" : "FileCheck"} className={isGenerating === lead.id ? "animate-spin" : ""} size={20} />
                       TEKLİF & PDF ÜRET
                    </button>
                    <div className="flex gap-2">
                      <select 
                        value={lead.status}
                        onChange={(e) => {
                          onSetLeads(leads.map(l => l.id === lead.id ? { ...l, status: e.target.value as any, lastContactDate: new Date().toISOString() } : l));
                        }}
                        className="flex-1 px-4 py-3 bg-slate-50 border rounded-2xl text-[10px] font-black uppercase text-slate-500 outline-none focus:text-slate-800 focus:bg-white transition-all"
                      >
                        <option value="new">YENİ</option>
                        <option value="emailed">TEKLİF GİTTİ</option>
                        <option value="responded">CEVAP ALINDI</option>
                      </select>
                      <button onClick={() => onSetLeads(leads.filter(l => l.id !== lead.id))} className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                        <Icon name="Trash2" size={20} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Visual accent */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rotate-45 translate-x-20 -translate-y-20 group-hover:bg-amber-50 transition-colors"></div>
              </div>
            ))
          )}
        </div>

        {/* Outreach Stats */}
        <div className="space-y-6">
          <div className="premium-card p-10 bg-slate-900 text-white relative overflow-hidden">
             <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-amber-500 mb-6">Türkiye Satış Ağı</h4>
             <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-5xl font-black">{leads.filter(l => l.status !== 'new').length}</p>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mt-2">Gönderilen Teklifler</p>
                   </div>
                   <Icon name="Send" size={48} className="text-amber-500/20" />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase">
                      <span>Kuyruk Verimliliği</span>
                      <span className="text-amber-500">%{leads.length > 0 ? (leads.filter(l => l.status !== 'new').length / leads.length * 100).toFixed(0) : 0}</span>
                   </div>
                   <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full transition-all duration-1000" style={{width: `${leads.length > 0 ? (leads.filter(l => l.status !== 'new').length / leads.length * 100) : 0}%`}}></div>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl"></div>
          </div>

          <div className="premium-card p-8 border-t-8 border-amber-900">
             <h4 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Icon name="Lightbulb" className="text-amber-600" size={18} /> Satış Tavsiyesi
             </h4>
             <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Özel okul ve kolejler, sabah saatlerinde yüksek tüketim yapar. AI tarafından üretilen tekliflerde "Öğretmenler Odası Premium Deneyimi" vurgusunu kullanmanız dönüşümü %30 artıracaktır.
             </p>
          </div>
        </div>
      </div>

      {/* Proposal Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="coffee-gradient p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black flex items-center gap-4 uppercase tracking-tighter">
                   <Icon name="Sparkles" size={32} /> Kurumsal Satış Paketi
                </h3>
                <p className="text-amber-200/60 text-xs font-black uppercase tracking-[0.3em] mt-2">Otomatik Hazırlanan Profesyonel Teklif</p>
              </div>
              <button onClick={() => setPreviewEmail(null)} className="p-4 hover:bg-white/10 rounded-full transition-all">
                <Icon name="X" size={32} />
              </button>
            </div>
            
            <div className="p-12 overflow-y-auto space-y-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Email Taslağı</label>
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                      <Icon name="Check" size={12} /> Sektörel Dil Optimize Edildi
                   </div>
                </div>
                <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] shadow-inner space-y-6">
                  <div className="pb-4 border-b border-slate-200 font-black text-xl text-slate-800">
                     {previewEmail.subject}
                  </div>
                  <div className="text-base text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                     {previewEmail.body}
                  </div>
                </div>
              </div>

              <div className="premium-card p-8 bg-slate-900 text-white flex items-center justify-between border-none shadow-xl">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-rose-500/20 text-rose-400 rounded-2xl">
                       <Icon name="FileText" size={32} />
                    </div>
                    <div>
                       <p className="font-black text-lg uppercase tracking-tight">Teklif_Dökümü_v2.pdf</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Görsel Sunum & Fiyat Listesi Eklendi</p>
                    </div>
                 </div>
                 <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black transition-all border border-white/10">ÖNİZLE</button>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => {
                  const lead = leads.find(l => l.id === previewEmail.leadId);
                  window.location.href = `mailto:${lead?.email}?subject=${encodeURIComponent(previewEmail.subject)}&body=${encodeURIComponent(previewEmail.body)}`;
                  setPreviewEmail(null);
                  addToast('Teklif mail istemcisine aktarıldı!', 'success');
                }}
                className="flex-1 py-6 coffee-gradient text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                <Icon name="Mail" size={20} /> Teklifi Gönder
              </button>
              <button 
                onClick={() => {
                   navigator.clipboard.writeText(`Konu: ${previewEmail.subject}\n\n${previewEmail.body}`);
                   addToast('Metin kopyalandı!', 'info');
                }}
                className="px-12 py-6 bg-white border-2 border-slate-200 text-slate-600 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-4"
              >
                <Icon name="Copy" size={20} /> Kopyala
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
