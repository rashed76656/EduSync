import { useState, useEffect, useMemo } from 'react';
import { Search, Wallet, User, FileText, CheckCircle, Receipt, ArrowRight, CreditCard } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useStudents } from '../../hooks/useStudents';
import { useFees } from '../../hooks/useFees';
import { useAuthStore } from '../../store/authStore';
import type { Student, FeeTransaction } from '../../types';
import profilePic from '../../assets/profile.png';

export default function Fees() {
  const { user } = useAuthStore();
  const { students, fetchStudents } = useStudents();
  const { fetchStudentFees, recordFee, isLoading: isFeesLoading } = useFees();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);

  // Fee Form State
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mobile Banking' | 'Bank'>('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const loadStudentData = async (student: Student) => {
    setSelectedStudent(student);
    const history = await fetchStudentFees(student.id);
    setTransactions(history);
  };

  const searchedStudent = useMemo(() => {
    if (!searchQuery) return null;
    return students.find(s => s.roll === searchQuery || s.registration === searchQuery) || null;
  }, [students, searchQuery]);

  const handleSearch = () => {
    if (searchedStudent) {
      loadStudentData(searchedStudent);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !amount || !purpose) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const successId = await recordFee({
      studentId: selectedStudent.id,
      amount: numAmount,
      purpose,
      paymentMethod,
      date,
      recordedBy: user?.uid || 'unknown'
    });

    if (successId) {
      const history = await fetchStudentFees(selectedStudent.id);
      setTransactions(history);
      setAmount('');
      setPurpose('');
      setPaymentMethod('Cash');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display tracking-tight">Fee Administration</h1>
          <p className="mt-1 text-sm text-gray-500">Manage institutional collections and student financial history.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm">
            <Receipt className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest leading-none">Accounts Desk</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Entry Panel */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-5 border-primary/10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Identify Student
            </h2>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  placeholder="Roll or Reg Number..."
                  className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold placeholder:text-gray-300 transition-all font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} className="px-3 shrink-0 rounded-xl shadow-md">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
            
            {searchQuery && !searchedStudent && (
              <p className="text-[10px] font-bold text-danger uppercase tracking-widest mt-2 px-1 italic">No active ledger found</p>
            )}
            
            {searchedStudent && selectedStudent?.id !== searchedStudent.id && (
              <div className="mt-6 p-4 bg-white/60 border border-white rounded-2xl flex justify-between items-center animate-in fade-in zoom-in-95 shadow-sm">
                <div>
                  <p className="font-bold text-gray-900 leading-none">{searchedStudent.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{searchedStudent.department} • {searchedStudent.semester}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => loadStudentData(searchedStudent)} className="text-[10px] font-bold uppercase tracking-widest h-8 px-4 rounded-lg bg-primary/10 text-primary border-transparent hover:bg-primary hover:text-white transition-all">
                  Open File
                </Button>
              </div>
            )}
          </GlassCard>

          {selectedStudent && (
            <GlassCard className="p-5 animate-in fade-in slide-in-from-left-6 bg-gradient-to-br from-white/80 to-indigo-50/30 border-primary/10">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                New Transaction
              </h2>
              
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">৳</span>
                        <input
                            type="number"
                            min="0"
                            required
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-mono font-bold text-gray-900 shadow-inner"
                        />
                    </div>
                </div>
                
                <Select
                  label="Payment Purpose"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  options={[
                    { label: 'Select purpose...', value: '' },
                    { label: 'Semester Fee', value: 'Semester Fee' },
                    { label: 'Admission Fee', value: 'Admission Fee' },
                    { label: 'Exam Fee', value: 'Exam Fee' },
                    { label: 'Fines / Dues', value: 'Fines' },
                    { label: 'Others', value: 'Other' },
                  ]}
                />
                
                <Select
                  label="Payment Method"
                  required
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  options={[
                    { label: 'Cash Payment', value: 'Cash' },
                    { label: 'Mobile (bKash/Nagad)', value: 'Mobile Banking' },
                    { label: 'Direct Bank Deposit', value: 'Bank' },
                  ]}
                />

                <Input
                  label="Transaction Date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />

                <Button type="submit" className="w-full h-12 gap-2 shadow-xl shadow-primary/20 uppercase font-bold tracking-widest text-[10px] mt-2 group" isLoading={isFeesLoading}>
                  <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" /> Post to Ledger
                </Button>
              </form>
            </GlassCard>
          )}
        </div>

        {/* Right Column - Statements */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
              {/* Student Header */}
              <GlassCard className="p-6 relative overflow-hidden bg-white/60">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-xl">
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 font-display tracking-tight">{selectedStudent.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-100 px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">ID: {selectedStudent.roll}</span>
                        <Badge variant="info" className="h-6 uppercase font-bold text-[9px] tracking-widest">{selectedStudent.department}</Badge>
                        <Badge variant="default" className="h-6 uppercase font-bold text-[9px] tracking-widest">Sem: {selectedStudent.semester}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 border border-white rounded-2xl p-4 px-6 text-right shadow-sm ring-1 ring-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Aggregated Balance</p>
                    <p className="text-3xl font-bold text-gray-900 font-mono tracking-tighter">
                      ৳ {transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* History Table */}
              <GlassCard className="overflow-hidden border-white/50 bg-white/40">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/40 backdrop-blur-sm">
                   <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-xl">
                            <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 font-display tracking-wide">Transaction Statement</h3>
                   </div>
                  <Badge variant="info" className="h-7 px-4 rounded-full font-bold uppercase text-[10px] tracking-widest">{transactions.length} Payments</Badge>
                </div>
                
                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50/30 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-5">Date</th>
                        <th className="px-6 py-5">Description</th>
                        <th className="px-6 py-5">Method</th>
                        <th className="px-6 py-5 text-right">Credit Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white/20">
                      {isFeesLoading && transactions.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="p-8"><TableSkeleton /></td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                             <EmptyState 
                                title="Empty Statements"
                                description="This student ledger has no recorded transactions yet. New records will appear here after posting."
                                icon={CreditCard}
                             />
                          </td>
                        </tr>
                      ) : (
                        transactions.map(t => (
                          <tr key={t.id} className="hover:bg-primary/5 transition-all duration-300">
                            <td className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-tighter">{t.date}</td>
                            <td className="px-6 py-5 font-bold text-gray-900 tracking-tight">{t.purpose}</td>
                            <td className="px-6 py-5">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                                {t.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right font-mono font-bold text-gray-900 text-base">
                              ৳ {t.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {transactions.length > 0 && (
                    <div className="p-5 border-t border-gray-100 bg-white/40 flex justify-between items-center italic">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End of statement</span>
                         <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Verified Ledger</span>
                    </div>
                )}
              </GlassCard>

            </div>
          ) : (
            <div className="h-full min-h-[500px]">
                <EmptyState 
                    title="Student Ledger Not Selected"
                    description="Search for a student using their roll number to access their payment history and record new transactions."
                    icon={User}
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
