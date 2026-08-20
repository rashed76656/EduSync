import { useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/authStore';
import { useStudentPortal } from '../../hooks/useStudentPortal';
import { 
  CheckSquare, 
  GraduationCap, 
  Wallet, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const normalizeDateString = (date: any): string => {
  if (!date) return '--';
  if (typeof date === 'string') return date;
  if (date.toDate) return date.toDate().toISOString().split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '--';
};

export default function StudentDashboard() {
  const { studentId, roll, semester, department: authDept, displayName } = useAuthStore();
  const { studentData, attendance, results, fees, isLoading, fetchPortalData } = useStudentPortal();

  // Fallback data from auth store (mirrored during provisioning)
  const displayDept = studentData?.department || authDept || '--';
  const displayRoll = studentData?.roll || roll || '--';
  const displaySem = studentData?.semester || semester || '--';

  useEffect(() => {
    if (studentId) {
      fetchPortalData();
    }
  }, [studentId, fetchPortalData]);

  const stats = useMemo(() => {
    // Attendance %
    const totalAtt = attendance.length;
    const presentAtt = attendance.filter(a => a.status === 'present').length;
    const attPercent = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    // Fees Due
    const pendingFees = fees.filter(f => f.paymentStatus === 'unpaid');
    const totalDue = pendingFees.reduce((sum, f) => sum + f.amount, 0);

    // Latest GPA
    const latestResult = results[0];
    const gpa = latestResult ? latestResult.gradePoint.toFixed(2) : '--';

    return { attPercent, totalDue, gpa, pendingCount: pendingFees.length };
  }, [attendance, results, fees]);

  if (isLoading && !studentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Student Info Card */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center text-2xl font-black text-sky-600 shadow-lg border-2 border-white">
              {(displayName || 'S')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{displayName || 'Student'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{displayDept} Engineering</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Roll: {displayRoll}</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{displaySem} Semester</span>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
            studentData?.examEligible 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}>
            {studentData?.examEligible ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-xs font-black uppercase tracking-widest">
              {studentData?.examEligible ? 'Exam Eligible' : 'Ineligible'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/student/attendance">
          <GlassCard className="p-5 border-l-4 border-l-sky-500 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <CheckSquare className="w-5 h-5 text-sky-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendance</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-mono">{stats.attPercent}%</p>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Overall Rate</p>
          </GlassCard>
        </Link>

        <Link to="/student/fees">
          <GlassCard className="p-5 border-l-4 border-l-red-500 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="w-5 h-5 text-red-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fee Due</span>
            </div>
            <p className="text-3xl font-black text-red-600 font-mono">৳ {stats.totalDue}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{stats.pendingCount} Pending</p>
          </GlassCard>
        </Link>

        <Link to="/student/results">
          <GlassCard className="p-5 border-l-4 border-l-indigo-500 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last GPA</span>
            </div>
            <p className="text-3xl font-black text-indigo-600 font-mono">{stats.gpa}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Grade Point</p>
          </GlassCard>
        </Link>

        <GlassCard className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
          </div>
          <p className="text-3xl font-black text-gray-900 font-mono">{studentData?.status || '--'}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Academic State</p>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Recent Attendance</span>
            <Link to="/student/attendance" className="text-sky-600 hover:underline flex items-center gap-1 text-[10px]">View All <ArrowRight className="w-3 h-3" /></Link>
          </h2>
          <div className="space-y-3">
            {attendance.slice(0, 5).map(record => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-700">{record.subjectCode}</p>
                  <p className="text-[10px] text-gray-400">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {record.status}
                </div>
              </div>
            ))}
            {attendance.length === 0 && <p className="text-center py-8 text-sm text-gray-400 italic">No attendance records found</p>}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Fee Status</span>
            <Link to="/student/fees" className="text-sky-600 hover:underline flex items-center gap-1 text-[10px]">Make Payment <ArrowRight className="w-3 h-3" /></Link>
          </h2>
          <div className="space-y-3">
            {fees.slice(0, 5).map(fee => (
              <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-700">{(fee.type || 'fee').toUpperCase()}</p>
                  <p className="text-[10px] text-gray-400">Due: {normalizeDateString(fee.dueDate)}</p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  fee.paymentStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  fee.paymentStatus === 'proof_submitted' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {(fee.paymentStatus || 'unpaid').replace('_', ' ')}
                </div>
              </div>
            ))}
            {fees.length === 0 && <p className="text-center py-8 text-sm text-gray-400 italic">No fee records found</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
