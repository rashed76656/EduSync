import { useEffect, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useStudentPortal } from '../../hooks/useStudentPortal';
import { GraduationCap, TrendingUp, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Badge } from '../../components/ui/Badge';

export default function StudentResults() {
  const { results, isLoading, fetchPortalData } = useStudentPortal();

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  const semesterGpa = useMemo(() => {
    const semData: Record<string, { totalPoints: number; count: number }> = {};
    
    results.forEach(record => {
      if (!semData[record.semester]) {
        semData[record.semester] = { totalPoints: 0, count: 0 };
      }
      semData[record.semester].totalPoints += record.gradePoint;
      semData[record.semester].count++;
    });

    const data = Object.entries(semData).map(([name, d]) => ({
      name,
      gpa: Number((d.totalPoints / d.count).toFixed(2))
    })).sort((a, b) => a.name.localeCompare(b.name));

    return data;
  }, [results]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-indigo-600" />
          Academic Results
        </h1>
        <p className="text-gray-500 mt-1 font-medium italic">Your exam performance and GPA tracking.</p>
      </div>

      {semesterGpa.length > 0 && (
        <GlassCard className="p-6 h-[350px]">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> GPA Trend Across Semesters
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={semesterGpa}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis domain={[0, 4]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              <Line 
                type="monotone" 
                dataKey="gpa" 
                stroke="#6366F1" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {semesterGpa.map(sem => (
          <GlassCard key={sem.name} className="p-5 border-t-4 border-t-indigo-500">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Semester</p>
                 <h4 className="text-xl font-black text-gray-900">{sem.name}</h4>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average GPA</p>
                 <p className="text-2xl font-black text-indigo-600 font-mono">{sem.gpa}</p>
               </div>
             </div>
             
             <div className="space-y-2 mt-4">
               {results.filter(r => r.semester === sem.name).map(record => (
                 <div key={record.id} className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-xl border border-gray-100">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-indigo-500 border border-indigo-50">
                       {record.subjectCode}
                     </div>
                     <span className="text-xs font-bold text-gray-700">{record.subject}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className="text-xs font-mono font-black text-gray-900">{record.gradePoint.toFixed(2)}</span>
                     <Badge variant={record.gradePoint >= 2.0 ? 'success' : 'danger'} className="text-[10px] px-1.5 py-0.5">
                       {record.grade}
                     </Badge>
                   </div>
                 </div>
               ))}
             </div>
          </GlassCard>
        ))}
        {results.length === 0 && (
          <GlassCard className="md:col-span-2 lg:col-span-3 p-12 flex flex-col items-center justify-center text-center">
            <Award className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest italic">No academic results recorded yet</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
