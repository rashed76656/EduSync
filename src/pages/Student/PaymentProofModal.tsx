import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useStudentPortal } from '../../hooks/useStudentPortal';
import { KeyRound, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { FeeRecord } from '../../types';

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee: FeeRecord;
  onSuccess?: () => void;
}

export default function PaymentProofModal({ isOpen, onClose, fee, onSuccess }: PaymentProofModalProps) {
  const { submitPaymentProof } = useStudentPortal();
  const [proofType, setProofType] = useState<'trx_id' | 'receipt_image'>('trx_id');
  const [trxId, setTrxId] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (proofType === 'trx_id' && !trxId.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await submitPaymentProof(fee, trxId, proofNote);
      if (ok && onSuccess) onSuccess();
      onClose();
    } catch (error) {
      // toast in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Payment Proof"
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* Fee Summary */}
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Purpose</p>
              <h4 className="text-sm font-bold text-gray-900">{fee.description}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Amount</p>
              <p className="text-lg font-black text-gray-900 font-mono">৳ {fee.amount}</p>
            </div>
          </div>
        </div>

        {/* Proof Type Toggle */}
        <div className="flex p-1 bg-gray-100/50 rounded-xl">
          <button
            onClick={() => setProofType('trx_id')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              proofType === 'trx_id' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Transaction ID
          </button>
          <button
            onClick={() => setProofType('receipt_image')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              proofType === 'receipt_image' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-400'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image Receipt
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {proofType === 'trx_id' ? (
            <Input
              label="Transaction ID (TrxID) *"
              placeholder="e.g. AM89K2L9X"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              required
            />
          ) : (
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center bg-gray-50/50">
              <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 font-medium">Image upload coming soon</p>
              <p className="text-[10px] text-gray-400 mt-1">Please use TrxID for now</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (Optional)</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-sky-300 focus:ring-1 focus:ring-sky-300 outline-none transition-all resize-none h-24"
              placeholder="Any message for the account manager..."
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
              আপনার তথ্য সঠিক কিনা যাচাই করুন। ভুল তথ্য দিলে পেমেন্ট রিজেক্ট হতে পারে।
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              className="flex-1 bg-sky-600 hover:bg-sky-700" 
              isLoading={isSubmitting}
              disabled={proofType === 'receipt_image' || (proofType === 'trx_id' && !trxId.trim())}
            >
              Submit Proof ✓
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
