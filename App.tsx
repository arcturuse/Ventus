
import React, { useState, useEffect, useMemo } from 'react';
import { ToastProvider, useToast } from './components/ToastProvider';
import { Icon } from './components/Icons';
import { Transaction, TransactionType, ProductCost, ShippingRate, Settings, Lead, LabelDesign } from './types';
import { storage } from './services/storage';
import { Dashboard } from './views/Dashboard';
import { TransactionList } from './views/TransactionList';
import { ProductManagement } from './views/ProductManagement';
import { B2BGenerator } from './views/B2BGenerator';
import { GrowthCenter } from './views/GrowthCenter';
import { LeadCenter } from './views/LeadCenter';
import { SettingsView } from './views/SettingsView';
import { IntelligenceHub } from './views/IntelligenceHub';
import { LabelStudio } from './views/LabelStudio';
import { GenericSkeleton } from './components/Skeleton';

const AppContent: React.FC = () => {
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.load('transactions', []));
  const [productCosts, setProductCosts] = useState<ProductCost[]>(() => storage.load('productCosts', []));
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>(() => storage.load('shippingRates', []));
  const [leads, setLeads] = useState<Lead[]>(() => storage.load('leads', []));
  const [labels, setLabels] = useState<LabelDesign[]>(() => storage.load('labels', []));
  const [settings, setSettings] = useState<Settings>(() => storage.load('settings', {
    commissionRate: 4.99,
    fixedFee: 0.49,
    costPerPack: 15, // Kutu + Etiket + Bant vs.
    costPerKgDefault: 450,
    monthlyTarget: 100000,
    monthlyKgTarget: 100,
    targetMargin: 25,
    quoteSettings: {
      showTax: true,
      showTerms: true,
      businessName: 'Ventus Roast Co.',
      logoUrl: '',
      footerNote: 'Taze kavrum süreci onay sonrası 48 saattir.',
      showTotalWeight: true
    }
  }));

  useEffect(() => {
    storage.save('transactions', transactions);
    storage.save('productCosts', productCosts);
    storage.save('shippingRates', shippingRates);
    storage.save('settings', settings);
    storage.save('leads', leads);
    storage.save('labels', labels);
  }, [transactions, productCosts, shippingRates, settings, leads, labels]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [view]);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalWeight = 0;
    let estimatedCoffeeCost = 0;
    let estimatedPackagingCost = 0;

    transactions.forEach(t => {
      if (t.type === TransactionType.INCOME) {
        totalIncome += t.amount;
        totalWeight += t.weight;
        
        // Ürün adını description'dan çekip maliyeti bulalım
        const prodName = t.description.split(' x')[0].trim();
        const costInfo = productCosts.find(pc => pc.key.includes(prodName));
        
        // Kafeye ödenen toptan fiyat
        const unitCost = costInfo?.wholesalePricePerKg || settings.costPerKgDefault;
        estimatedCoffeeCost += (t.weight * unitCost);
        
        // Paketleme maliyeti
        estimatedPackagingCost += settings.costPerPack;
      } else {
        totalExpense += t.amount;
      }
    });

    const finalExpenses = totalExpense + estimatedCoffeeCost + estimatedPackagingCost;

    return { 
      income: totalIncome, 
      expenses: finalExpenses, 
      net: totalIncome - finalExpenses, 
      weight: totalWeight 
    };
  }, [transactions, productCosts, settings]);

  const NavItem = ({ name, icon, label }: { name: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        if (view !== name) {
          setLoading(true);
          setView(name);
        }
      }}
      className={`flex flex-col md:flex-row items-center gap-2 px-4 py-3 rounded-2xl transition-all ${
        view === name 
          ? 'bg-amber-900 text-white shadow-xl scale-105 md:scale-100' 
          : 'text-amber-100/60 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon name={icon} size={20} />
      <span className="text-[10px] md:text-sm font-bold">{label}</span>
    </button>
  );

  const renderViewContent = () => {
    if (loading) return <GenericSkeleton />;
    switch (view) {
      case 'dashboard': return <Dashboard stats={stats} transactions={transactions} />;
      case 'transactions': return <TransactionList transactions={transactions} onSetTransactions={setTransactions} productCosts={productCosts} shippingRates={shippingRates} settings={settings} />;
      case 'products': return <ProductManagement costs={productCosts} onSetCosts={setProductCosts} />;
      case 'labels': return <LabelStudio labels={labels} onSetLabels={setLabels} transactions={transactions} onSetTransactions={setTransactions} />;
      case 'b2b': return <B2BGenerator settings={settings} onSetSettings={setSettings} shippingRates={shippingRates} />;
      case 'leads': return <LeadCenter leads={leads} onSetLeads={setLeads} />;
      case 'growth': return <GrowthCenter transactions={transactions} settings={settings} />;
      case 'intel': return <IntelligenceHub productCosts={productCosts} transactions={transactions} />;
      case 'settings': return <SettingsView settings={settings} onSetSettings={setSettings} shippingRates={shippingRates} onSetShippingRates={setShippingRates} />;
      default: return <Dashboard stats={stats} transactions={transactions} />;
    }
  };

  return (
    <div className="min-h-screen md:pl-64 flex flex-col no-print">
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 coffee-gradient flex-col p-6 z-50 shadow-2xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md"><Icon name="Coffee" className="text-amber-400" size={24} /></div>
          <h1 className="text-lg font-black text-white leading-tight tracking-tighter uppercase italic">VENTUS<br/><span className="text-[10px] text-amber-200/50 uppercase font-black tracking-[0.2em] not-italic">PRO ROAST</span></h1>
        </div>
        <nav className="flex flex-col gap-3 overflow-y-auto max-h-[80vh] pr-2">
          <NavItem name="dashboard" icon="LayoutDashboard" label="Panel" />
          <NavItem name="transactions" icon="ShoppingBag" label="Siparişler" />
          <NavItem name="intel" icon="BrainCircuit" label="Tedarik Zekası" />
          <NavItem name="labels" icon="Printer" label="Etiket Stüdyosu" />
          <NavItem name="products" icon="Tag" label="Maliyetler" />
          <NavItem name="b2b" icon="Briefcase" label="Toptan Satış" />
          <NavItem name="leads" icon="Target" label="Lead Hunter" />
          <NavItem name="growth" icon="Rocket" label="Büyüme" />
          <NavItem name="settings" icon="Settings" label="Ayarlar" />
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 coffee-gradient z-50 px-2 py-4 safe-bottom flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <NavItem name="dashboard" icon="LayoutDashboard" label="Özet" />
        <NavItem name="transactions" icon="ShoppingBag" label="Satış" />
        <NavItem name="intel" icon="BrainCircuit" label="Tedarik" />
        <NavItem name="labels" icon="Printer" label="Etiket" />
        <NavItem name="settings" icon="Settings" label="Ayar" />
      </nav>

      <main className="flex-1 p-4 md:p-10 animate-fade-in max-w-7xl mx-auto w-full mb-28 md:mb-0">
        <header className="flex justify-between items-center mb-10">
           <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                {view === 'transactions' ? 'Shopier Excel İşleme' : 
                 view === 'intel' ? 'Kafeden Tedarik' : 
                 view === 'products' ? 'Toptan Alış Fiyatları' : view}
              </h2>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
           </div>
        </header>
        {renderViewContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => (<ToastProvider><AppContent /></ToastProvider>);
export default App;
