import { 
  TrendingUp, 
  Wallet, 
  CreditCard,
  Target,
  BarChart,
  Calendar,
  Layers,
  Search
} from 'lucide-react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { GlassCard } from '../../components/ui/GlassCard';
import { useGlobalFinance } from '../../hooks/useGlobalFinance';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';

const COLORS = ['#e11d48', '#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AdminFinance() {
  const { transactions, stats, isLoading } = useGlobalFinance();

  const metrics = [
    { title: 'Gross Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Monthly Target', value: '৳500,000', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Total Collections', value: transactions.length.toString(), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Avg per Student', value: '৳4,500', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 font-display tracking-tight uppercase italic">
          Financial <span className="text-emerald-600">Intelligence</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">
          Institute-wide revenue stream analysis and auditing.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <GlassCard key={m.title} className="p-6 border-white/50 bg-white/40 shadow-xl shadow-primary/5 hover:scale-105 transition-transform">
             <div className="flex items-center gap-4">
               <div className={`p-3 rounded-2xl ${m.bg} ${m.color}`}>
                 <m.icon className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.title}</p>
                  <p className="text-xl font-black text-gray-900 mt-0.5">{m.value}</p>
               </div>
             </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Charts Selection */}
         <GlassCard className="p-8 lg:col-span-2 border-white/50 bg-white/40 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                 <BarChart className="w-4 h-4 text-emerald-500" />
                 Collections by Purpose
               </h3>
               <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                  <Calendar className="w-3 h-3" /> All Time
               </div>
            </div>

            <div className="h-[350px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                   <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={stats.byPurpose}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f0fdf4' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                       {stats.byPurpose.map((_, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </div>
         </GlassCard>

         {/* Recent Ledger */}
         <GlassCard className="p-8 border-white/50 bg-white/40 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                 <CreditCard className="w-4 h-4 text-emerald-500" />
                 Audit Ledger
               </h3>
               <button className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors">
                  <Search className="w-4 h-4" />
               </button>
            </div>

            <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
               {stats.recentTransactions.length === 0 ? (
                 <p className="text-xs text-center text-gray-400 py-10">No transactions recorded.</p>
               ) : (
                 stats.recentTransactions.map((t) => (
                   <div key={t.id} className="flex items-center gap-4 group p-2 hover:bg-emerald-50/50 rounded-2xl transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-emerald-50 shrink-0 group-hover:scale-110 transition-transform">
                         <span className="text-xs font-black text-emerald-600">৳</span>
                      </div>
                      <div className="min-w-0 flex-1">
                         <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{t.purpose}</p>
                         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {format(t.createdAt ? (t.createdAt as any).toDate() : new Date(), 'MMM d, h:mm a')}
                         </p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-emerald-600">+{t.amount}</p>
                         <Badge variant="secondary" className="text-[8px] font-black uppercase mt-1 px-1">{t.paymentMethod}</Badge>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
               <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Growth Factor</p>
                  <p className="text-lg font-black text-emerald-900">+12.5% this week</p>
               </div>
            </div>
         </GlassCard>
      </div>
    </div>
  );
}
