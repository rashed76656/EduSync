import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, MapPin, Phone, Droplet, Calendar, Shield, CreditCard, ClipboardList, Users, GraduationCap, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import { useResults } from '../../hooks/useResults';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { cn } from '../../utils/cn';
import type { Student, AttendanceRecord, ResultRecord } from '../../types';
import { format } from 'date-fns';
import EditStudentModal from './EditStudentModal';
import profilePic from '../../assets/profile.png';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStudentById } = useStudents();
  const { getStudentAttendanceByStudent } = useAttendance();
  const { getStudentResultsByStudent } = useResults();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'results' | 'fees' | 'notes'>('overview');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setIsLoading(true);
      const [studentData, attendanceData, resultsData] = await Promise.all([
        getStudentById(id),
        getStudentAttendanceByStudent(id),
        getStudentResultsByStudent(id)
      ]);
      setStudent(studentData);
      setAttendance(attendanceData);
      setResults(resultsData);
      setIsLoading(false);
    }
    loadData();
  }, [id, getStudentById, getStudentAttendanceByStudent, getStudentResultsByStudent]);

  const refreshData = async () => {
    if (!id) return;
    const studentData = await getStudentById(id);
    setStudent(studentData);
  };

  // Calculations
  const attendanceStats = useMemo(() => {
    if (attendance.length === 0) return { percent: 0, present: 0, absent: 0, total: 0 };
    const present = attendance.filter(a => a.status === 'present').length;
    const total = attendance.length;
    return {
      percent: Math.round((present / total) * 100),
      present,
      absent: total - present,
      total
    };
  }, [attendance]);

  const gpaTrend = useMemo(() => {
    const data = [...results]
      .sort((a, b) => a.semester.localeCompare(b.semester))
      .map(r => ({
        name: r.semester,
        gradePoint: r.gradePoint
      }));
    return data;
  }, [results]);

  const latestGpa = results.length > 0 ? results[results.length - 1].gradePoint.toFixed(2) : 'N/A';

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-2">Student Not Found</h2>
        <p className="text-gray-500 mb-6">The student you are looking for does not exist or has been deleted.</p>
        <Button onClick={() => navigate('/students')} variant="secondary">Go Back to Students</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/students')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </button>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            className="gap-2 bg-white" 
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <GlassCard className="relative overflow-visible">
        <div className="h-32 bg-gradient-brand rounded-t-2xl opacity-80" />
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-4">
            <div className="flex items-end gap-5">
              <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg relative z-10">
                <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100">
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="mb-2 pb-1">
                <h1 className="text-2xl font-bold text-gray-900 font-display">{student.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded-md text-xs font-semibold">Roll: {student.roll}</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded-md text-xs font-semibold">Reg: {student.registration}</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block pb-1">
               <Badge variant={student.status === 'active' ? 'success' : student.status === 'dropped' ? 'danger' : 'warning'} className="px-3 py-1 text-sm">
                  {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
               </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <Badge variant="info">{student.department} Engineering</Badge>
            <Badge variant="default">{student.semester} Semester</Badge>
            <Badge variant="default">{student.shift} Shift</Badge>
            <Badge variant="default">Group {student.group}</Badge>
            <Badge variant="default">Session {student.session}</Badge>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-white/40 backdrop-blur-md rounded-xl border border-white/60">
        {(['overview', 'attendance', 'results', 'fees', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
              activeTab === tab 
                ? 'bg-white text-primary shadow-[0_2px_10px_rgba(0,0,0,0.05)]' 
                : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 font-display mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
              <dl className="space-y-4">
                <div className="grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">{student.phone || 'Not provided'}</dd>
                </div>
                <div className="grid grid-cols-3">
                   <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> D.O.B
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">
                    {student.dateOfBirth instanceof Date ? student.dateOfBirth.toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div className="grid grid-cols-3">
                   <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-danger" /> Blood Group
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">{student.bloodGroup || 'Not provided'}</dd>
                </div>
                <div className="grid grid-cols-3">
                   <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Address
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">{student.address || 'Not provided'}</dd>
                </div>
              </dl>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 font-display mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                Guardian Information
              </h3>
              <dl className="space-y-4">
                <div className="grid grid-cols-3 border-b border-gray-100 pb-4">
                   <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">{student.guardianName || 'Not provided'}</dd>
                </div>
                <div className="grid grid-cols-3 pt-2">
                   <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm font-medium text-gray-900 col-span-2">{student.guardianPhone || 'Not provided'}</dd>
                </div>
              </dl>
              
              <div className="mt-8 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 font-mono">
                  Profile Created: {student.createdAt instanceof Date ? student.createdAt.toLocaleDateString() : 'Unknown'}
                  <br/>
                  NID/Birth Cert: {student.nid || 'N/A'}
                </p>
              </div>
            </GlassCard>
            
             {/* Academic Preview Cards */}
             <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <GlassCard className="p-5 border-l-4 border-l-primary flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-gray-600">Attendance</span>
                  </div>
                  <div className={cn("text-2xl font-bold font-mono", 
                    attendanceStats.percent >= 85 ? "text-success" : 
                    attendanceStats.percent >= 75 ? "text-amber-500" : "text-danger"
                  )}>
                    {attendanceStats.percent}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">From {attendanceStats.total} records</p>
                </GlassCard>
                
                <GlassCard className="p-5 border-l-4 border-l-secondary flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="w-5 h-5 text-secondary" />
                    <span className="text-sm font-medium text-gray-600">Latest GPA</span>
                  </div>
                  <div className={cn("text-2xl font-bold font-mono", 
                    latestGpa !== 'N/A' && parseFloat(latestGpa) >= 3.5 ? "text-success" : 
                    latestGpa !== 'N/A' && parseFloat(latestGpa) >= 2.0 ? "text-amber-500" : "text-danger"
                  )}>
                    {latestGpa}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{results.length > 0 ? `Sem: ${results[results.length-1].semester}` : 'No results found'}</p>
                </GlassCard>
                
                <GlassCard className="p-5 border-l-4 border-l-amber-500 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-gray-600">Progress</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 font-mono">
                    {results.length > 1 ? (results[results.length-1].gradePoint >= results[results.length-2].gradePoint ? 'Up' : 'Down') : '--'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Vs previous semester</p>
                </GlassCard>
             </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 p-6 h-[400px]">
               <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-primary" /> Subject-wise Performance
               </h3>
               <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={attendance.reduce((acc, curr) => {
                    const existing = acc.find(i => i.subject === curr.subjectCode);
                    if (existing) {
                      existing.total++;
                      if (curr.status === 'present') existing.present++;
                    } else {
                      acc.push({ subject: curr.subjectCode, total: 1, present: curr.status === 'present' ? 1 : 0 });
                    }
                    return acc;
                  }, [] as any[]).map(i => ({ ...i, percent: Math.round((i.present/i.total)*100) }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                    <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                      {attendance.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366F1' : '#A855F7'} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-6">
               <h3 className="text-lg font-bold text-gray-900 mb-6">Absence Insights</h3>
               <div className="space-y-4">
                  {attendance.filter(a => a.status !== 'present').slice(0, 5).map(record => (
                    <div key={record.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{record.subjectCode}</p>
                          <p className="text-xs font-bold text-gray-700">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                       </div>
                       <Badge variant={record.status === 'absent' ? 'danger' : 'warning'}>{record.status}</Badge>
                    </div>
                  ))}
                  {attendance.filter(a => a.status !== 'present').length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                       <CheckCircle2 className="w-10 h-10 text-success opacity-20 mb-2" />
                       <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Perfect Record</p>
                    </div>
                  )}
               </div>
            </GlassCard>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <GlassCard className="p-6 h-[400px]">
               <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-secondary" /> Semester Performance Trend
               </h3>
               <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={gpaTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis domain={[0, 4]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                    <Line type="monotone" dataKey="gradePoint" stroke="#6366F1" strokeWidth={3} dot={{ r: 6, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
               </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="overflow-hidden">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Semester</th>
                      <th className="px-6 py-4">Subject Code</th>
                      <th className="px-6 py-4 text-center">Marks</th>
                      <th className="px-6 py-4 text-center">GPA</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white/30">
                    {results.sort((a,b) => b.semester.localeCompare(a.semester)).map(record => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 font-bold text-gray-900">{record.semester}</td>
                        <td className="px-6 py-4 font-mono text-primary font-bold">{record.subjectCode}</td>
                        <td className="px-6 py-4 text-center font-bold">{record.marks}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-secondary">{record.gradePoint.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                           <Badge variant={record.gradePoint >= 2.0 ? 'success' : 'danger'}>
                             {record.gradePoint >= 2.0 ? 'Pass' : 'Fail'}
                           </Badge>
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">No result records found for this student.</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </GlassCard>
          </div>
        )}

        {/* Fees Placeholder */}
         {activeTab === 'fees' && (
          <GlassCard className="h-[300px] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-amber-600">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 font-display mb-2 capitalize">Fees & Payments</h3>
            <p className="text-gray-500 max-w-md">Financial records are managed in the separate Finance Module. Performance and attendance integrations are currently the priority.</p>
          </GlassCard>
        )}

        {/* Notes Placeholder */}
        {activeTab === 'notes' && (
          <GlassCard className="h-[300px] flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">No Counseling Notes</p>
          </GlassCard>
        )}
      </div>

      <EditStudentModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={student}
        onSuccess={refreshData}
      />
    </div>
  );
}
