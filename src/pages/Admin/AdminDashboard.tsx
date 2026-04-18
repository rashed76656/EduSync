import { useState } from 'react';
import { Users, UserCheck, UserX, UserPlus, ShieldAlert, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { useAdminStats } from '../../hooks/useAdminStats';
import { useAuthStore } from '../../store/authStore';
import { seedInstituteSubjects } from '../../lib/adminService';
import { logAdminAction } from '../../lib/adminLogs';
import { BTEB_SUBJECTS } from '../../utils/btebSubjectData';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
} from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { stats, logs, isLoading } = useAdminStats();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedCurriculum = async () => {
    if (!window.confirm('This will seed the global subject database with BTEB Regulation 2022 data. Continue?')) return;
    
    setIsSeeding(true);
    try {
      const result = await seedInstituteSubjects(BTEB_SUBJECTS);
      
      await logAdminAction({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'SEED_CURRICULUM',
        details: `Seeded ${result.count} subjects into the global database.`
      });

      toast.success(`System successfully seeded with ${result.count} subjects!`);
    } catch (err) {
      toast.error('Curriculum seeding failed. Check logs.');
    } finally {
      setIsSeeding(false);
    }
  };

  const cards = stats ? [
    { title: 'Total Teachers', count: stats.teachers.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Active Faculty', count: stats.teachers.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Suspended', count: stats.teachers.blocked, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Registered Students', count: stats.students.total, icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-50' },
  ] : [];

  if (isLoading || !stats) {
    return (
      <div className="space-y-8 animate-pulse text-center py-20">
         <div className="w-16 h-16 bg-rose-100 rounded-full mx-auto mb-4 animate-bounce" />
         <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Synchronizing Institute Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-rose-600" />
            Admin Intelligence
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Global oversight of Rangpur Polytechnic Institute operations.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Live Updates</span>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <GlassCard key={card.title} className="p-6 border-white/50 hover:scale-[1.02] transition-transform duration-300 shadow-xl shadow-rose-500/5">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} shadow-inner`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{card.title}</p>
                <h3 className="text-3xl font-black text-gray-900 tabular-nums leading-tight">{card.count}</h3>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Department Distribution */}
         <GlassCard className="p-8 lg:col-span-2 border-white/50 min-h-[400px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-rose-500" />
                Department Enrollment
              </h3>
           </div>
           
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.students.byDept}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#fff1f2' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(225, 29, 72, 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#e11d48" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
           </div>
         </GlassCard>

         {/* Right Column: Actions & Logs */}
         <div className="space-y-8">
            {/* Quick Actions */}
            <GlassCard className="p-8 border-rose-100 bg-rose-50/30 shadow-xl shadow-rose-500/5">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Privileged Actions
                </h3>
                <div className="space-y-3">
                   <Button 
                     onClick={handleSeedCurriculum}
                     disabled={isSeeding}
                     className="w-full justify-start gap-4 px-4 py-4 h-auto bg-white hover:bg-rose-50 text-gray-900 border border-rose-100 shadow-sm rounded-2xl group transition-all"
                   >
                     <div className="p-2 bg-rose-100 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                        <UserPlus className="w-4 h-4" />
                     </div>
                     <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-tight leading-none">Seed Curricula</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">Initialize BTEB Regulations</p>
                     </div>
                   </Button>
                </div>
            </GlassCard>

            {/* Audit Feed */}
            <GlassCard className="p-8 border-white/50">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                     <Activity className="w-4 h-4 text-rose-500" />
                     System Audit Log
                   </h3>
                </div>
                
                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   {logs.length === 0 ? (
                     <p className="text-xs text-center text-gray-400 py-10">No recent activity logged.</p>
                   ) : (
                     logs.map((log) => (
                      <div key={log.id} className="relative pl-6 border-l-2 border-rose-100 pb-1">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-rose-500" />
                        <p className="text-xs font-black text-gray-900 leading-tight">{log.details}</p>
                        <div className="flex flex-col mt-1">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{log.adminEmail}</p>
                          <p className="text-[9px] text-rose-400 font-bold">{formatDistanceToNow(log.timestamp?.toDate() || new Date(), { addSuffix: true })}</p>
                        </div>
                      </div>
                     ))
                   )}
                </div>
            </GlassCard>
         </div>
      </div>

      {/* Security Banner */}
      <GlassCard className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-2xl relative overflow-hidden group">
         <div className="absolute right-0 top-0 w-64 h-64 bg-rose-600/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-rose-600/20 transition-colors duration-700" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
               <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-3 flex items-center gap-3">
                 <ShieldAlert className="w-8 h-8 text-rose-500" />
                 Zero-Trust Defense Protocol
               </h3>
               <p className="text-gray-300 text-sm leading-relaxed">
                 Administrative oversight is active across all faculty clusters. Account blocking instantly revokes all active session tokens and encrypts access to sensitive data packets.
               </p>
            </div>
            <div className="flex gap-4">
               <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-2xl font-black text-rose-500 leading-none">100%</p>
                  <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-gray-400">Threat Invalidation</p>
               </div>
               <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-2xl font-black text-emerald-500 leading-none">24/7</p>
                  <p className="text-[9px] font-black uppercase tracking-widest mt-2 text-gray-400">Signal Monitoring</p>
               </div>
            </div>
         </div>
      </GlassCard>
    </div>
  );
}
