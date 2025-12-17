
import React, { useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Icon } from '../components/Icons';
import { Transaction, TransactionType } from '../types';

interface DashboardProps {
  stats: any;
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, transactions }) => {
  const chartData = useMemo(() => {
    const daily: Record<string, any> = {};
    const last30Days = [...Array(15)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(5, 10);
    }).reverse();

    last30Days.forEach(date => daily[date] = { date, income: 0, expense: 0 });

    transactions.forEach(t => {
      const date = t.date.slice(5, 10);
      if (daily[date]) {
        if (t.type === TransactionType.INCOME) daily[date].income += t.amount;
        else daily[date].expense += t.amount;
      }
    });
    return Object.values(daily);
  }, [transactions]);

  const pieData = [
    { name: 'Brüt Gelir', value: stats.income, color: '#10b981' },
    { name: 'Giderler', value: stats.expenses, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6 bg-gradient-to-br from-amber-900 to-amber-950 text-white overflow-hidden relative group">
          <div className="relative z-10">
            <p className="text-amber-200/60 text-[10px] font-black uppercase tracking-widest mb-1">Net Kâr</p>
            <h3 className="text-4xl font-black italic">₺{stats.net.toLocaleString('tr-TR')}</h3>
            <p className="text-amber-200/40 text-[9px] mt-2 font-bold uppercase tracking-tighter">Kesintiler ve Sarf Düştü</p>
          </div>
          <Icon name="Coins" size={100} className="absolute -right-6 -bottom-6 text-white/5 rotate-12 group-hover:rotate-0 transition-all duration-700" />
        </div>

        <div className="premium-card p-6 border-l-4 border-amber-500">
          <div className="flex justify-between items-start">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Satılan Kahve</p>
             <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Icon name="Scale" size={18} /></div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.weight.toFixed(1)} <span className="text-sm font-medium text-slate-400">KG</span></h3>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
             <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{width: `${Math.min((stats.weight/100)*100, 100)}%`}}></div>
          </div>
        </div>

        <div className="premium-card p-6 border-l-4 border-emerald-500">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Toplam Ciro</p>
          <h3 className="text-3xl font-black text-slate-800">₺{stats.income.toLocaleString('tr-TR')}</h3>
          <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold mt-2">
            <Icon name="TrendingUp" size={12} /> Shopier + B2B
          </div>
        </div>

        <div className="premium-card p-6 border-l-4 border-rose-500">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Toplam Gider</p>
          <h3 className="text-3xl font-black text-slate-800">₺{stats.expenses.toLocaleString('tr-TR')}</h3>
          <div className="flex items-center gap-1 text-rose-500 text-[10px] font-bold mt-2">
            <Icon name="TrendingDown" size={12} /> Komisyon + Kargo + Sarf
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card p-6 lg:col-span-2">
          <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <Icon name="Activity" className="text-amber-600" size={16} /> Satış Trendi (15 Gün)
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px', fontSize: '10px'}} 
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-6">
          <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <Icon name="PieChart" className="text-amber-600" size={16} /> Gelir Dağılımı
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={10} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', fontSize: '10px'}} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
