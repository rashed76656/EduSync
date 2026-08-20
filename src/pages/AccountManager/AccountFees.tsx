import { useEffect, useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAccountManager } from '../../hooks/useAccountManager';
import { Wallet, Clock, KeyRound, Search, Check, X, ShieldX } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const normalizeDateString = (date: any): string => {
  if (!date) return '--';
  if (typeof date === 'string') return date;
  if (date.toDate) return date.toDate().toISOString().split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '--';
};

export default function AccountFees() {
  const { fees, notifications, fetchFees, fetchNotifications, reviewPayment } = useAccountManager();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'proof_submitted' | 'confirmed' | 'rejected'>('all');
  const [rejectReason, setRejectReason] = useState('');
  const [isReviewing, setIsReviewing] = useState<string | null>(null);

  useEffect(() => {
    fetchFees();
    fetchNotifications();
  }, [fetchFees, fetchNotifications]);

  const filteredFees = fees.filter(fee => {
    const matchesSearch = (fee.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (fee.studentRoll || '').includes(searchTerm) ||
                          (fee.trxId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || fee.paymentStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const handleReview = async (notifId: string, feeId: string, status: 'confirmed' | 'rejected') => {
    if (status === 'rejected' && !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsReviewing(notifId);
    try {
      await reviewPayment(notifId, feeId, status, status === 'rejected' ? rejectReason : undefined);
      setRejectReason('');
    } catch (error) {
      // toast in hook
    } finally {
      setIsReviewing(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
          <Wallet className="w-8 h-8 text-emerald-600" />
          Fee Management
        </h1>
        <p className="text-gray-500 mt-1 font-medium italic">Review payment proofs and manage fee records.</p>
      </div>

      {/* Payment Notifications Review Section */}
      {notifications.length > 0 && (
        <div className="space-y-4">
           <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
             <Clock className="w-4 h-4" /> Pending Payment Verifications ({notifications.length})
           </h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {notifications.map(notif => (
               <GlassCard key={notif.id} className="p-0 overflow-hidden border-amber-200 bg-amber-50/10">
                 <div className="p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-lg font-black text-emerald-600 border border-emerald-50 shrink-0">
                      {notif.studentName?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 truncate">{notif.studentName}</h4>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Roll: {notif.studentRoll} • {notif.department} • {notif.semester}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900 font-mono">৳ {notif.amount}</p>
                          <p className="text-[9px] text-gray-400 font-bold">{normalizeDateString(notif.submittedAt)}</p>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-white/60 rounded-xl border border-white/80 space-y-2">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TrxID:</span>
                          <span className="text-xs font-mono font-bold text-sky-600">{notif.trxId || '--'}</span>
                        </div>
                        {notif.proofNote && (
                          <p className="text-[11px] text-gray-600 font-medium italic">"{notif.proofNote}"</p>
                        )}
                      </div>

                      <div className="mt-5 space-y-3">
                         <div className="flex gap-2">
                            <Input 
                              placeholder="Reason if rejecting..." 
                              className="h-9 text-xs rounded-xl flex-1 bg-white"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-9 px-3 text-red-600 hover:bg-red-50 border-red-100"
                              onClick={() => handleReview(notif.id, notif.feeId, 'rejected')}
                              isLoading={isReviewing === notif.id}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-xl"
                              onClick={() => handleReview(notif.id, notif.feeId, 'confirmed')}
                              isLoading={isReviewing === notif.id}
                            >
                              <Check className="w-4 h-4" />
                              Confirm
                            </Button>
                         </div>
                      </div>
                    </div>
                 </div>
               </GlassCard>
             ))}
           </div>
        </div>
      )}

      {/* Full Fees Database */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40">
           <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
             <Wallet className="w-4 h-4" /> Transaction Registry
           </div>
           
           <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search roll, name, trxid..." 
                  className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none w-64 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="proof_submitted">Pending Proof</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Fee Description</th>
                <th className="px-6 py-4 text-center">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verified By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white/30">
              {filteredFees.map(fee => (
                <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-white transition-colors">
                        {fee.studentName?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{fee.studentName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Roll: {fee.studentRoll}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-xs font-bold text-gray-700 uppercase tracking-tight">{fee.description}</p>
                     <p className="text-[10px] text-gray-400 italic">Type: {fee.type}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-black text-gray-900">
                    ৳ {fee.amount}
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      fee.paymentStatus === 'confirmed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      fee.paymentStatus === 'proof_submitted' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      fee.paymentStatus === 'rejected' ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-gray-50 text-gray-500 border-gray-100"
                    )}>
                      {(fee.paymentStatus || 'unpaid').replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {fee.paymentStatus === 'confirmed' ? (
                       <div className="flex items-center gap-2">
                         <ShieldX className="w-3.5 h-3.5 text-emerald-500" />
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Manager</span>
                       </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredFees.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400 font-medium flex flex-col items-center">
                    <Search className="w-10 h-10 opacity-10 mb-2" />
                    No records matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
