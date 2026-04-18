import { useEffect, useMemo, useState } from 'react';
import { Users, CheckCircle, Calendar, GraduationCap, Wallet, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { useStudents } from '../hooks/useStudents';
import { useAttendance } from '../hooks/useAttendance';
import { useFees } from '../hooks/useFees';
import { useEvents } from '../hooks/useEvents';
import { useNotices } from '../hooks/useNotices';
import type { AttendanceRecord, FeeTransaction } from '../types';

const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, branding } = useAuthStore();
  const { students, fetchStudents } = useStudents();
  const { fetchAllAttendance, fetchAttendanceRange } = useAttendance();
  const { fetchAllFees } = useFees();
  const { events } = useEvents();
  const { notices } = useNotices();

  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [allFees, setAllFees] = useState<FeeTransaction[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      // Parallel fetch with limits for dashboard speed
      const [, , rangeAttendance, feesData] = await Promise.all([
        fetchStudents(10),
        fetchAllAttendance(10),
        fetchAttendanceRange(startDate),
        fetchAllFees(10)
      ]);
      
      setAllAttendance(rangeAttendance); // For the chart
      setAllFees(feesData); // For stats and activity
    }
    loadDashboardData();
  }, [fetchStudents, fetchAllAttendance, fetchAttendanceRange, fetchAllFees]);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const presentToday = allAttendance.filter(a => a.date === todayStr && a.status === 'present').length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyFees = allFees.filter(f => {
      const d = new Date(f.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, f) => sum + f.amount, 0);

    const upcomingExams = events.filter(e => {
       const eventDate = new Date(e.date);
       return e.category === 'Exam' && eventDate >= new Date();
    }).length;

    return [
      { name: 'My Students', value: students.length.toString(), icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: '-' },
      { name: 'Present Today', value: presentToday.toString(), icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', trend: '-' },
      { name: 'My Collections (Mo)', value: `৳ ${monthlyFees}`, icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: '-' },
      { name: 'Upcoming Exams', value: upcomingExams.toString(), icon: Calendar, color: 'text-secondary', bg: 'bg-secondary/10', trend: '-' },
    ];
  }, [students, allAttendance, allFees, events]);

  const attendanceData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const dayRecords = allAttendance.filter(a => a.date === date);
      const total = dayRecords.length;
      const present = dayRecords.filter(a => a.status === 'present').length;
      const percent = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return { name: dayName, percent };
    });
  }, [allAttendance]);

  const deptData = useMemo(() => {
    const counts = students.reduce((acc, student) => {
      acc[student.department] = (acc[student.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const timeline = useMemo(() => {
    const activities: any[] = [];

    // Latest 5 Students
    students.slice(0, 5).forEach(s => {
      activities.push({
        id: `s-${s.id}`,
        content: `New student added:`,
        target: `${s.name} (${s.roll})`,
        teacher: 'You',
        date: new Date(s.createdAt as any).toLocaleDateString(),
        rawDate: new Date(s.createdAt as any)
      });
    });

    // Latest 5 Attendance
    allAttendance.slice(0, 5).forEach(a => {
      activities.push({
        id: `a-${a.id}`,
        content: `Attendance marked for`,
        target: `${a.subject} (${a.semester})`,
        teacher: 'You',
        date: a.date,
        rawDate: new Date(a.date)
      });
    });

    // Latest 5 Fees
    allFees.slice(0, 5).forEach(f => {
       activities.push({
          id: `f-${f.id}`,
          content: `Fee payment recorded for`,
          target: `৳ ${f.amount} (${f.purpose})`,
          teacher: 'You',
          date: f.date,
          rawDate: new Date(f.date)
       });
    });

    return activities.sort((a, b) => b.rawDate - a.rawDate).slice(0, 8);
  }, [students, allAttendance, allFees]);

  const urgentNotice = useMemo(() => {
    return notices.find(n => n.category === 'Urgent' || n.category === 'Exam') || (notices.length > 0 ? notices[0] : null);
  }, [notices]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Welcome Back, {user?.displayName || 'Teacher'}!</h1>
          <p className="mt-1 text-sm text-gray-500">Here's what's happening at {branding?.name || 'your institute'} today.</p>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold text-primary">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-xs text-gray-400">System Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <GlassCard key={item.name} className="p-6 hover:translate-y-[-4px] transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900 font-display">{item.value}</p>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${item.bg}`}>
                <item.icon className={`w-8 h-8 ${item.color}`} strokeWidth={1.5} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-gray-900 font-display">Attendance Overview (Last 7 Days)</h2>
              <Badge variant="info">Average: {attendanceData.length > 0 ? Math.round(attendanceData.reduce((s, d) => s + d.percent, 0) / attendanceData.length) : 0}%</Badge>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="percent" fill="url(#colorUv)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 font-display">Department Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {deptData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Quick Actions Panel */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 font-display">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => navigate('/students')} className="h-24 flex-col gap-2 text-xs font-bold uppercase tracking-wider bg-white hover:bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  Students
                </Button>
                <Button variant="secondary" onClick={() => navigate('/attendance')} className="h-24 flex-col gap-2 text-xs font-bold uppercase tracking-wider bg-white hover:bg-white shadow-sm hover:shadow-md transition-all">
                   <div className="p-2 rounded-xl bg-success/10 text-success">
                      <CheckCircle className="w-5 h-5" />
                   </div>
                  Attendance
                </Button>
                <Button variant="secondary" onClick={() => navigate('/results')} className="h-24 flex-col gap-2 text-xs font-bold uppercase tracking-wider bg-white hover:bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  Results
                </Button>
                <Button variant="secondary" onClick={() => navigate('/fees')} className="h-24 flex-col gap-2 text-xs font-bold uppercase tracking-wider bg-white hover:bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  Fees
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity Mini Feed */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 font-display">Recent Activity</h2>
            <div className="flow-root">
              {timeline.length > 0 ? (
                <ul role="list" className="-mb-8">
                  {timeline.map((event, eventIdx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {eventIdx !== timeline.length - 1 ? (
                          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-100" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-white border border-gray-100 flex items-center justify-center ring-4 ring-white shadow-sm">
                              <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                            <div>
                              <p className="text-sm text-gray-700 leading-snug">
                                {event.content} <span className="font-bold text-gray-900">{event.target}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{event.teacher}</span>
                              </div>
                            </div>
                            <div className="whitespace-nowrap text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {event.date}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4 border border-white">
                    <Clock className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Activity starting to sync...</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Quick Notice Widget */}
          <GlassCard className="p-6 bg-gradient-to-br from-white/80 to-indigo-50/50 border-primary/20">
             <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 font-display">Institute Notice</h2>
              <Badge variant="danger" className="animate-pulse">Live</Badge>
             </div>
             {urgentNotice ? (
                <div className="space-y-4">
                  <div className="border-l-4 border-danger pl-4">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{urgentNotice.title}</h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                      {urgentNotice.content}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/notices')} className="w-full text-primary hover:bg-white text-xs font-bold uppercase tracking-widest">
                    Open Notice Board
                  </Button>
                </div>
             ) : (
                <div className="py-8 text-center bg-white/40 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-medium">No urgent notices posted today.</p>
                </div>
             )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant = 'info', className = '' }: any) {
  const styles: any = {
    info: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    danger: 'bg-red-50 text-red-600 border-red-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
