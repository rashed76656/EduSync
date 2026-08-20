import { useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAccountManager } from '../../hooks/useAccountManager';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, TrendingUp, Download, PieChart as PieIcon, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function AccountReports() {
  const { fees, isLoading, fetchFees } = useAccountManager();

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const departmentStats = useMemo(() => {
    const stats: Record<string, { collected: number; due: number }> = {};
    fees.forEach(fee => {
      if (!stats[fee.department]) {
        stats[fee.department] = { collected: 0, due: 0 };
      }
      if (fee.paymentStatus === 'confirmed') {
        stats[fee.department].collected += fee.amount;
      } else {
        stats[fee.department].due += fee.amount;
      }
    });
    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [fees]);

  const collectionMix = useMemo(() => {
    const totalCollected = fees.filter(f => f.paymentStatus === 'confirmed').reduce((s, f) => s + f.amount, 0);
    const totalDue = fees.filter(f => f.paymentStatus !== 'confirmed').reduce((s, f) => s + f.amount, 0);
    return [
      { name: 'Collected', value: totalCollected, color: '#10b981' },
      { name: 'Remaining Due', value: totalDue, color: '#ef4444' }
    ];
  }, [fees]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-600" />
            Financial Reports
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Departmental collection analytics and balance reports.</p>
        </div>
        <Button variant="secondary" className="gap-2 h-11 px-6 rounded-xl border-emerald-100 text-emerald-700">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Mix */}
        <GlassCard className="p-6">
           <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieIcon className="w-4 h-4" /> Overall Collection Mix
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={collectionMix}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {collectionMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
             {collectionMix.map(item => (
               <div key={item.name} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.name}</span>
               </div>
             ))}
          </div>
        </GlassCard>

        {/* Department Breakdown */}
        <GlassCard className="lg:col-span-2 p-6">
           <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Collection by Department
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="collected" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
                <Bar dataKey="due" stackId="a" fill="#fee2e2" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Summary Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-emerald-50/20">
           <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Department-wise Summary
          </h3>
        </div>
        <table className="w-full text-left text-sm">
           <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
             <tr>
               <th className="px-8 py-4">Department</th>
               <th className="px-8 py-4 text-right">Target Amount</th>
               <th className="px-8 py-4 text-right">Collected</th>
               <th className="px-8 py-4 text-right">Outstanding</th>
               <th className="px-8 py-4 text-center">Efficiency</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-50">
             {departmentStats.map(stat => {
               const target = stat.collected + stat.due;
               const efficiency = target > 0 ? Math.round((stat.collected / target) * 100) : 0;
               return (
                 <tr key={stat.name} className="hover:bg-gray-50/30 transition-colors">
                   <td className="px-8 py-4 font-black text-gray-900">{stat.name} Engineering</td>
                   <td className="px-8 py-4 text-right font-mono text-gray-600">৳ {target}</td>
                   <td className="px-8 py-4 text-right font-mono text-emerald-600 font-bold">৳ {stat.collected}</td>
                   <td className="px-8 py-4 text-right font-mono text-red-500">৳ {stat.due}</td>
                   <td className="px-8 py-4 text-center">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100">
                        {efficiency}%
                      </div>
                   </td>
                 </tr>
               );
             })}
           </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
