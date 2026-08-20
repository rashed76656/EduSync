import { useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAccountManager } from '../../hooks/useAccountManager';
import { 
  LayoutDashboard, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountDashboard() {
  const { fees, notifications, isLoading, fetchFees, fetchNotifications } = useAccountManager();

  useEffect(() => {
    fetchFees();
    fetchNotifications();
  }, [fetchFees, fetchNotifications]);

  const stats = useMemo(() => {
    const confirmedFees = fees.filter(f => f.paymentStatus === 'confirmed');
    const totalCollected = confirmedFees.reduce((sum, f) => sum + f.amount, 0);
    const unpaidFees = fees.filter(f => f.paymentStatus === 'unpaid');
    const totalDue = unpaidFees.reduce((sum, f) => sum + f.amount, 0);
    
    return {
      totalCollected,
      totalDue,
      pendingCount: notifications.length,
      confirmedCount: confirmedFees.length
    };
  }, [fees, notifications]);

  if (isLoading && fees.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-emerald-600" />
          Account Overview
        </h1>
        <p className="text-gray-500 mt-1 font-medium italic">Fee payment management and financial oversight.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outstanding Due</span>
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono">৳ {stats.totalDue}</p>
        </GlassCard>

        <GlassCard className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Review</span>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{stats.pendingCount}</p>
        </GlassCard>

        <GlassCard className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confirmed Total</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{stats.confirmedCount}</p>
        </GlassCard>

        <GlassCard className="p-5 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-indigo-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Collected</span>
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono">৳ {stats.totalCollected}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Notifications List */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Urgent Reviews</span>
            <Link to="/account/fees" className="text-emerald-600 hover:underline flex items-center gap-1 text-[10px]">View All <ArrowRight className="w-3 h-3" /></Link>
          </h2>
          <div className="space-y-3">
            {notifications.slice(0, 5).map(notif => (
              <div key={notif.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xs font-black text-emerald-600 shadow-sm border border-emerald-50">
                    {notif.studentName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{notif.studentName}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Roll: {notif.studentRoll} • {notif.department}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-black text-gray-900 font-mono">৳ {notif.amount}</p>
                   <p className="text-[9px] text-amber-600 font-bold uppercase">Pending</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 italic">
                <CheckCircle2 className="w-10 h-10 opacity-10 mb-2" />
                <p className="text-sm">No pending payment reviews</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Collection Trend Placeholder */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Collection Stats
          </h2>
          <div className="space-y-4">
             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Active Fee Records</span>
                </div>
                <span className="text-xl font-black text-emerald-900 font-mono">{fees.length}</span>
             </div>
             
             <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center">
                <TrendingUp className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Financial Charts</p>
                <p className="text-[10px] text-gray-400 mt-1">Detailed department-wise analytics coming in Phase 4 reports.</p>
             </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
