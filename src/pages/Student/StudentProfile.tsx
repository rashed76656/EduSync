import { useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/authStore';
import { useStudentPortal } from '../../hooks/useStudentPortal';
import { User, Mail, BookOpen, Shield, Phone, MapPin, Calendar, Droplet, Hash, Fingerprint, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

const normalizeDateString = (date: any): string => {
  if (!date) return '--';
  if (typeof date === 'string') return date;
  if (date.toDate) return date.toDate().toISOString().split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '--';
};

export default function StudentProfile() {
  const { user, displayName, studentId } = useAuthStore();
  const { studentData, isLoading, fetchPortalData } = useStudentPortal();

  useEffect(() => {
    if (studentId) {
      fetchPortalData();
    }
  }, [studentId, fetchPortalData]);

  if (isLoading && !studentData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
          <User className="w-8 h-8 text-sky-600" />
          My Profile
        </h1>
        <p className="text-gray-500 mt-1 font-medium italic">Your personal and academic record.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <GlassCard className="p-8 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-3xl bg-sky-100 flex items-center justify-center text-5xl font-black text-sky-600 shadow-2xl ring-4 ring-white mb-6">
            {(displayName || 'S')[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{displayName || 'Student'}</h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Student Portal Access</p>
          
          <div className="mt-8 w-full space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
              <Mail className="w-4 h-4 text-sky-600" />
              <div className="text-left">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Login Email</p>
                <p className="text-xs font-bold text-gray-700">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
              <Shield className="w-4 h-4 text-sky-600" />
              <div className="text-left">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Account Status</p>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Active & Verified</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Info Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Info */}
          <GlassCard className="p-6">
             <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<Hash />} label="Roll Number" value={studentData?.roll} />
              <InfoItem icon={<Fingerprint />} label="Registration No" value={studentData?.registration} />
              <InfoItem icon={<BookOpen />} label="Department" value={studentData?.department ? studentData.department + " Engineering" : '--'} />
              <InfoItem icon={<Calendar />} label="Current Semester" value={studentData?.semester ? studentData.semester + " Semester" : '--'} />
              <InfoItem icon={<Clock />} label="Shift & Group" value={studentData?.shift ? `${studentData.shift} / Group ${studentData.group}` : '--'} />
              <InfoItem icon={<Calendar />} label="Academic Session" value={studentData?.session} />
            </div>
          </GlassCard>

          {/* Personal Info */}
          <GlassCard className="p-6">
             <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<Calendar />} label="Date of Birth" value={normalizeDateString(studentData?.dateOfBirth)} />
              <InfoItem icon={<Phone />} label="Phone Number" value={studentData?.phone || 'Not provided'} />
              <InfoItem icon={<Droplet />} label="Blood Group" value={studentData?.bloodGroup || 'Not provided'} />
              <InfoItem icon={<User />} label="Guardian" value={studentData?.guardianName} />
              <InfoItem icon={<MapPin />} label="Address" value={studentData?.address} className="md:col-span-2" />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, className }: { icon: any, label: string, value?: string, className?: string }) {
  return (
    <div className={cn("p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-start gap-3", className)}>
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-sky-500 shrink-0 border border-sky-50">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value || '--'}</p>
      </div>
    </div>
  );
}
