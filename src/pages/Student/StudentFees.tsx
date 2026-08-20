import { useEffect, useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useStudentPortal } from '../../hooks/useStudentPortal';
import { Wallet, AlertCircle, CheckCircle2, Clock, Send, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import PaymentProofModal from './PaymentProofModal';

const normalizeDateString = (date: any): string => {
  if (!date) return '--';
  if (typeof date === 'string') return date;
  if (date.toDate) return date.toDate().toISOString().split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '--';
};

export default function StudentFees() {
  const { studentId } = useAuthStore();
  const { fees, isLoading, fetchPortalData } = useStudentPortal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);

  useEffect(() => {
    if (studentId) {
      fetchPortalData();
    }
  }, [studentId, fetchPortalData]);

  const summary = useMemo(() => {
    const totalDue = fees.filter(f => f.paymentStatus === 'unpaid').reduce((sum, f) => sum + f.amount, 0);
    const pending = fees.filter(f => f.paymentStatus === 'proof_submitted').reduce((sum, f) => sum + f.amount, 0);
    const paid = fees.filter(f => f.paymentStatus === 'confirmed').reduce((sum, f) => sum + f.amount, 0);
    return { totalDue, pending, paid };
  }, [fees]);

  const handlePayClick = (fee: any) => {
    setSelectedFee(fee);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
          <Wallet className="w-8 h-8 text-sky-600" />
          Fees & Payments
        </h1>
        <p className="text-gray-500 mt-1 font-medium italic">Track your dues and submit payment information.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5 border-l-4 border-l-red-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unpaid Balance</p>
          <p className="text-2xl font-black text-red-600 font-mono">৳ {summary.totalDue}</p>
        </GlassCard>
        <GlassCard className="p-5 border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Awaiting Review</p>
          <p className="text-2xl font-black text-amber-600 font-mono">৳ {summary.pending}</p>
        </GlassCard>
        <GlassCard className="p-5 border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confirmed Paid</p>
          <p className="text-2xl font-black text-emerald-600 font-mono">৳ {summary.paid}</p>
        </GlassCard>
      </div>

      {/* Fees List */}
      <div className="space-y-4">
        {fees.map(fee => (
          <GlassCard key={fee.id} className="p-0 overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
              {/* Left: Status Icon */}
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                fee.paymentStatus === 'confirmed' ? "bg-emerald-50 text-emerald-500" :
                fee.paymentStatus === 'proof_submitted' ? "bg-amber-50 text-amber-500" :
                fee.paymentStatus === 'rejected' ? "bg-red-50 text-red-500" :
                "bg-gray-50 text-gray-400"
              )}>
                {fee.paymentStatus === 'confirmed' ? <CheckCircle2 className="w-7 h-7" /> :
                 fee.paymentStatus === 'proof_submitted' ? <Clock className="w-7 h-7" /> :
                 fee.paymentStatus === 'rejected' ? <ShieldAlert className="w-7 h-7" /> :
                 <AlertCircle className="w-7 h-7" />}
              </div>

              {/* Middle: Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-black text-gray-900 truncate uppercase tracking-tight">{fee.description}</h3>
                  <div className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                    fee.paymentStatus === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                    fee.paymentStatus === 'proof_submitted' ? "bg-amber-100 text-amber-700" :
                    fee.paymentStatus === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-500"
                  )}>
                    {(fee.paymentStatus || 'unpaid').replace('_', ' ')}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 font-medium italic">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Due: {normalizeDateString(fee.dueDate)}</span>
                  <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Type: {fee.type || 'fee'}</span>
                </div>
              </div>

              {/* Right: Amount & Action */}
              <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">৳ {fee.amount}</p>
                </div>
                
                {fee.paymentStatus === 'unpaid' && (
                  <Button 
                    size="sm" 
                    className="gap-2 bg-sky-600 hover:bg-sky-700 h-10 px-6 rounded-xl"
                    onClick={() => handlePayClick(fee)}
                  >
                    <Send className="w-4 h-4" />
                    Submit Proof
                  </Button>
                )}
                {fee.paymentStatus === 'proof_submitted' && (
                  <div className="text-[10px] font-bold text-amber-600 italic bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    Awaiting Verification...
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Note */}
            {fee.paymentStatus === 'rejected' && fee.rejectedReason && (
              <div className="bg-red-50 p-4 border-t border-red-100 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">
                  <span className="font-bold uppercase tracking-widest mr-2">Rejected:</span>
                  {fee.rejectedReason}
                </p>
              </div>
            )}
          </GlassCard>
        ))}

        {fees.length === 0 && (
          <GlassCard className="p-16 flex flex-col items-center justify-center text-center">
            <Wallet className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest italic">No fee records assigned to you yet</p>
          </GlassCard>
        )}
      </div>

      {selectedFee && (
        <PaymentProofModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fee={selectedFee}
          onSuccess={fetchPortalData}
        />
      )}
    </div>
  );
}
