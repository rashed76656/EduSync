import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { generateSecretCode } from '../../utils/secretCode';
import { useStudents } from '../../hooks/useStudents';
import { KeyRound, RefreshCw, Copy, Check, GraduationCap, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Student } from '../../types';

interface SetupPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess?: () => void;
}

export default function SetupPortalModal({ isOpen, onClose, student, onSuccess }: SetupPortalModalProps) {
  const { setupPortalAccess } = useStudents();
  const [portalEmail, setPortalEmail] = useState('');
  const [secretCode, setSecretCode] = useState(generateSecretCode());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(secretCode);
      setCodeCopied(true);
      toast.success('Secret code copied!');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyAll = async () => {
    try {
      const text = `Student Portal Credentials\n─────────────────────\nName: ${student.name}\nEmail: ${portalEmail}\nSecret Code: ${secretCode}\nPortal: EduSync Student Portal`;
      await navigator.clipboard.writeText(text);
      toast.success('All credentials copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portalEmail.trim()) {
      toast.error('Student email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(portalEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (secretCode.length < 6) {
      toast.error('Secret code must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await setupPortalAccess(
        student.id,
        student.name,
        portalEmail,
        secretCode,
        student.roll,
        student.registration,
        student.semester,
        student.department,
      );
      setSetupComplete(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPortalEmail('');
    setSecretCode(generateSecretCode());
    setSetupComplete(false);
    setCodeCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Setup Portal Access"
      className="max-w-md"
    >
      {/* Student Info Header */}
      <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 mb-6">
        <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-lg font-black text-sky-600">
          {student.name?.[0]?.toUpperCase() || '?' }
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{student.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Roll: {student.roll}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {student.department} — {student.semester} Sem
            </span>
          </div>
        </div>
      </div>

      {/* Setup Complete State */}
      {setupComplete ? (
        <div className="space-y-5 animate-in fade-in">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Portal Access Enabled!</h3>
            <p className="text-sm text-gray-500">Student can now login to the Student Portal.</p>
          </div>

          {/* Credentials Card */}
          <div className="p-5 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Login Email</p>
                <p className="text-sm font-bold text-gray-900 font-mono">{portalEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Secret Code (Password)</p>
                <p className="text-sm font-black text-sky-600 font-mono tracking-[0.3em]">{secretCode}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1 gap-2"
              onClick={handleCopyAll}
            >
              <Copy className="w-4 h-4" />
              Copy Credentials
            </Button>
            <Button 
              type="button" 
              className="flex-1" 
              onClick={handleClose}
            >
              Done
            </Button>
          </div>

          <p className="text-[10px] text-center text-gray-400 leading-relaxed">
            ⚠️ এই credentials সংরক্ষণ করুন — Secret Code হারিয়ে গেলে student login করতে পারবে না।
          </p>
        </div>
      ) : (
        /* Setup Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
            <GraduationCap className="w-5 h-5 text-sky-500 shrink-0" />
            <p className="text-[11px] text-sky-700 leading-relaxed">
              Student এর Email ও Secret Code সেটআপ করুন। এই credentials দিয়ে student নিজের dashboard এ login করতে পারবে।
            </p>
          </div>

          <Input
            label="Student Email *"
            type="email"
            placeholder="student@example.com"
            value={portalEmail}
            onChange={(e) => setPortalEmail(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Secret Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono font-bold text-gray-900 tracking-[0.3em] focus:border-sky-300 focus:ring-1 focus:ring-sky-300 outline-none transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => { setSecretCode(generateSecretCode()); setCodeCopied(false); }}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Generate new code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`p-2.5 rounded-xl border transition-all ${
                  codeCopied 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700'
                }`}
                title="Copy code"
              >
                {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
              ⓘ এই code টি student কে শেয়ার করুন — এটি তার login password হিসেবে কাজ করবে
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} className="gap-2">
              <KeyRound className="w-4 h-4" />
              Setup Portal Access
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
