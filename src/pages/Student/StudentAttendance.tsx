import { useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useStudentPortal } from '../../hooks/useStudentPortal';
import { CheckSquare, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { cn } from '../../utils/cn';

export default function StudentAttendance() {
  const { attendance, isLoading, fetchPortalData } = useStudentPortal();

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  const subjectStats = useMemo(() => {
    const stats: Record<string, { total: number; present: number; name: string }> = {};
    
    attendance.forEach(record => {
      if (!stats[record.subjectCode]) {
        stats[record.subjectCode] = { total: 0, present: 0, name: record.subject };
      }
      stats[record.subjectCode].total++;
      if (record.status === 'present') {
        stats[record.subjectCode].present++;
      }
    });

    return Object.entries(stats).map(([code, data]) => ({
      code,
      name: data.name,
      percent: Math.round((data.present / data.total) * 100),
      present: data.present,
      total: data.total
    }));
  }, [attendance]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-sky-600" />
          My Attendance
        </h1>
        <p className="text-gray-500 mt-1 font-medium italic">Subject-wise breakdown and attendance history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <GlassCard className="lg:col-span-2 p-6">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Attendance Percentage by Subject
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'rgba(2, 132, 199, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                  {subjectStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0284c7' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Summary */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Subject Summary
          </h3>
          <div className="space-y-4">
            {subjectStats.map(stat => (
              <div key={stat.code} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-700">{stat.code}</span>
                  <span className={cn("font-black", 
                    stat.percent >= 85 ? "text-emerald-600" : 
                    stat.percent >= 75 ? "text-amber-600" : "text-red-600"
                  )}>{stat.percent}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", 
                      stat.percent >= 85 ? "bg-emerald-500" : 
                      stat.percent >= 75 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">{stat.present} present out of {stat.total} classes</p>
              </div>
            ))}
            {subjectStats.length === 0 && <p className="text-center py-8 text-sm text-gray-400 italic">No subject data available</p>}
          </div>
        </GlassCard>
      </div>

      {/* History Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Attendance History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Subject Code</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white/30">
              {attendance.map(record => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 font-medium text-gray-600">{record.subject}</td>
                  <td className="px-6 py-4 font-mono text-sky-600 font-bold">{record.subjectCode}</td>
                  <td className="px-6 py-4 text-center">
                    <div className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      record.status === 'present' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      record.status === 'absent' ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {record.status}
                    </div>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
