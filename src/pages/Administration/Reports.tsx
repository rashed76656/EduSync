import { useState, useMemo, useRef } from 'react';
import { FileText, Users, CheckSquare, GraduationCap, DollarSign, Search, Printer, FileSpreadsheet, TrendingUp, UserSearch, MapPin } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import { useResults } from '../../hooks/useResults';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend } from 'recharts';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';


type ReportType = 'students' | 'attendance' | 'results' | 'fees' | 'transcripts';

export default function Reports() {
  const { branding } = useAuthStore();
  const { students, isLoading: isStudentsLoading, fetchStudents } = useStudents();
  const { fetchAllAttendance } = useAttendance();
  const { getStudentResultsByStudent } = useResults();
  
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  const [filters, setFilters] = useState({
    semester: 'All',
    department: 'All'
  });

  const handleReportSelect = async (type: ReportType) => {
    setActiveReport(type);
    if (type === 'students' && students.length === 0) {
      await fetchStudents();
    }
    if (type === 'attendance') {
      const data = await fetchAllAttendance();
      setAttendanceData(data);
    }
    if (type === 'results') {
      // For general analytics, we might need a more global fetch, 
      // but for now we'll fetch based on filters if needed.
      if (students.length === 0) await fetchStudents();
    }
    if (type === 'transcripts' && students.length === 0) {
      await fetchStudents();
    }
  };

  const filteredData = useMemo(() => {
    if (activeReport === 'students') {
      return students.filter(s => 
        (filters.semester === 'All' || s.semester === filters.semester) &&
        (filters.department === 'All' || s.department === filters.department)
      );
    }
    return [];
  }, [students, filters, activeReport]);

  const handleExportImage = async () => {
    if (!transcriptRef.current || !selectedStudentTranscript) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(transcriptRef.current, {
        scale: 2, // High quality
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Transcript_${selectedStudentTranscript.roll}_${selectedStudentTranscript.name.replace(/\s+/g, '_')}.png`;
      link.href = image;
      link.click();
      toast.success('Transcript image downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate image');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = Object.keys(filteredData[0]).filter(k => k !== 'id' && k !== 'createdAt');
    const csvRows = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => JSON.stringify((row as any)[header] || '')).join(',')
      )
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportCards = [
    { id: 'students', title: 'Student Roster', desc: 'Full student list with enrollment details', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'attendance', title: 'Attendance Analytics', desc: 'Daily trends and subject-wise logs', icon: CheckSquare, color: 'text-success', bg: 'bg-success/10' },
    { id: 'results', title: 'Result Distribution', desc: 'Performance charts and Pass/Fail ratios', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'transcripts', title: 'Transcript Generator', desc: 'Generate official student academic records', icon: UserSearch, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { id: 'fees', title: 'Fee summaries', desc: 'Collection history and due summaries', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' }
  ];

  // Analytics Aggregation
  const attendanceAnalytics = useMemo(() => {
    if (activeReport !== 'attendance' || attendanceData.length === 0) return null;
    
    // Day of week stats
    const dayStats = attendanceData.reduce((acc, curr) => {
      const day = format(new Date(curr.date), 'EEEE');
      if (!acc[day]) acc[day] = { name: day, total: 0, present: 0 };
      acc[day].total++;
      if (curr.status === 'present') acc[day].present++;
      return acc;
    }, {} as any);

    // Subject stats
    const subjectStats = attendanceData.reduce((acc, curr) => {
      if (!acc[curr.subjectCode]) acc[curr.subjectCode] = { name: curr.subjectCode, total: 0, present: 0 };
      acc[curr.subjectCode].total++;
      if (curr.status === 'present') acc[curr.subjectCode].present++;
      return acc;
    }, {} as any);

    const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return {
      daily: orderedDays.map(d => dayStats[d] ? { ...dayStats[d], percent: Math.round((dayStats[d].present/dayStats[d].total)*100) } : { name: d, percent: 0 }),
      subjects: Object.values(subjectStats).map((s: any) => ({ ...s, percent: Math.round((s.present/s.total)*100) }))
    };
  }, [attendanceData, activeReport]);

  const selectedStudentTranscript = useMemo(() => {
     if (activeReport !== 'transcripts' || !selectedStudentId) return null;
     return students.find(s => s.id === selectedStudentId);
  }, [selectedStudentId, students, activeReport]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Generate, preview, and export academic and financial datasets.</p>
        </div>
      </div>

      {!activeReport ? (
        /* Report Selection Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
          {reportCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleReportSelect(card.id as ReportType)}
              className="group text-left"
            >
              <GlassCard className="p-6 h-full border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                   <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{card.desc}</p>
                <div className="flex items-center text-xs font-bold text-primary uppercase tracking-wider gap-2">
                   Generate Report <FileText className="w-3.5 h-3.5" />
                </div>
              </GlassCard>
            </button>
          ))}
        </div>
      ) : (
        /* Active Report View */
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          {/* Back & Export Bar */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveReport(null)}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              ← Back to Reports
            </button>
            <div className="flex gap-3">
               <Button variant="secondary" className="gap-2 bg-white" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" /> {activeReport === 'transcripts' ? 'Generate PDF' : 'Print PDF'}
               </Button>
               {activeReport === 'transcripts' && selectedStudentId && (
                 <Button onClick={handleExportImage} isLoading={isExporting} className="gap-2 bg-indigo-600 shadow-indigo-100">
                    <FileText className="w-4 h-4" /> Download Image
                 </Button>
               )}
               {activeReport !== 'transcripts' && (
                 <Button className="gap-2 shadow-lg" onClick={exportToCSV}>
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                 </Button>
               )}
            </div>
          </div>

          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 print:hidden">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${reportCards.find(c => c.id === activeReport)?.bg}`}>
                     {activeReport && <FileText className={`w-6 h-6 ${reportCards.find(c => c.id === activeReport)?.color}`} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-display capitalize">{activeReport} Analysis</h2>
                    <p className="text-sm text-gray-500">
                      {activeReport === 'transcripts' ? 'Select a student to generate their academic transcript' : `Institutional oversight and performance tracking.`}
                    </p>
                  </div>
               </div>

               {activeReport === 'transcripts' ? (
                 <div className="w-full md:w-64">
                    <Select 
                      label="Select Student"
                      value={selectedStudentId}
                      onChange={async (e) => {
                        const id = e.target.value;
                        setSelectedStudentId(id);
                        if (id) {
                          const res = await getStudentResultsByStudent(id);
                          setStudentResults(res);
                        } else {
                          setStudentResults([]);
                        }
                      }}
                      options={[
                        { label: 'Select Student...', value: '' },
                        ...students.map(s => ({ label: `${s.roll} - ${s.name}`, value: s.id }))
                      ]}
                    />
                 </div>
               ) : (
                 <div className="flex flex-wrap gap-4 items-end">
                    <Select 
                      label="Semester" 
                      value={filters.semester}
                      onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                      options={[
                          { label: 'All Semesters', value: 'All' },
                          { label: '1st', value: '1st' }, { label: '2nd', value: '2nd' },
                          { label: '3rd', value: '3rd' }, { label: '4th', value: '4th' },
                          { label: '5th', value: '5th' }, { label: '6th', value: '6th' },
                          { label: '7th', value: '7th' }, { label: '8th', value: '8th' },
                      ]}
                    />
                    <Select 
                      label="Department" 
                      value={filters.department}
                      onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                      options={[
                          { label: 'All Departments', value: 'All' },
                          { label: 'CST', value: 'CST' }, { label: 'EET', value: 'EET' },
                          { label: 'CET', value: 'CET' }, { label: 'MT', value: 'MT' },
                          { label: 'ET', value: 'ET' }, { label: 'PT', value: 'PT' },
                      ]}
                    />
                 </div>
               )}
            </div>

            {/* Attendance Dashboard */}
            {activeReport === 'attendance' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="h-[300px]">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Weekly Attendance Trend (%)
                      </h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={attendanceAnalytics?.daily}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="percent" fill="#10B981" radius={[4, 4, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="h-[300px]">
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Subject-wise Performance</h3>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceAnalytics?.subjects} layout="vertical">
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                           <XAxis type="number" domain={[0, 100]} hide />
                           <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} width={80} />
                           <Tooltip cursor={{ fill: 'transparent' }} />
                           <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
                              {attendanceAnalytics?.subjects.map((_entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366F1' : '#A855F7'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
                
                <div className="pt-8 border-t border-gray-100">
                   <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Attendance Logs</h3>
                   <div className="overflow-x-auto rounded-xl border border-gray-100">
                     <table className="w-full text-left text-xs uppercase tracking-tight font-bold">
                        <thead className="bg-gray-50 text-gray-400">
                           <tr>
                              <th className="px-6 py-3 text-center">Date</th>
                              <th className="px-6 py-3">Subject</th>
                              <th className="px-6 py-3">Student Name</th>
                              <th className="px-6 py-3 text-center">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {attendanceData.slice(0, 10).map(rec => (
                             <tr key={rec.id} className="hover:bg-gray-50/50">
                               <td className="px-6 py-3 text-center">{rec.date}</td>
                               <td className="px-6 py-3 text-primary">{rec.subjectCode}</td>
                               <td className="px-6 py-3 text-gray-700">{students.find(s => s.id === rec.studentId)?.name || 'Loading...'}</td>
                               <td className="px-6 py-3 text-center">
                                  <Badge variant={rec.status === 'present' ? 'success' : 'danger'}>{rec.status}</Badge>
                               </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}

            {/* Results Dashboard */}
            {activeReport === 'results' && (
              <div className="space-y-8">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[350px]">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Subject GPA Distribution</h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={attendanceAnalytics?.subjects /* Using same list of subjects for labels */}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                             <YAxis domain={[0, 4]} axisLine={false} tickLine={false} />
                             <Tooltip />
                             <Line type="monotone" dataKey="gpa" stroke="#6366F1" strokeWidth={3} />
                         </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Pass vs Fail Ratio</h3>
                       <div className="h-[250px] relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie 
                                  data={[{ name: 'Pass', value: 85 }, { name: 'Fail', value: 15 }]} 
                                  innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                >
                                   <Cell fill="#10B981" />
                                   <Cell fill="#EF4444" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                             </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                             <span className="text-3xl font-bold text-gray-900">85%</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase">Success Rate</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Transcript Generator */}
            {activeReport === 'transcripts' && (
              <div className={cn("mt-4 transition-all", !selectedStudentId && "opacity-20 pointer-events-none")}>
                 {selectedStudentTranscript ? (
                    <div ref={transcriptRef} className="print:m-0 print:p-0 min-h-[600px] border-2 border-gray-100 rounded-3xl p-10 bg-white relative overflow-hidden">
                       {/* Watermark/Logo */}
                       <div className="absolute top-10 right-10 opacity-5 grayscale">
                          <GraduationCap className="w-32 h-32" />
                       </div>

                       {/* Heading */}
                       <div className="text-center mb-10 border-b-2 border-primary/10 pb-10">
                          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-white overflow-hidden shadow-lg border-2 border-white">
                             {branding?.logoUrl ? (
                               <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
                             ) : (
                               <GraduationCap className="w-8 h-8" />
                             )}
                          </div>
                          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
                            {branding?.name || 'EduSync Official Transcript'}
                          </h1>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">BTEB Regulation 2022 Curriculum</p>
                          {branding?.address && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                               <MapPin className="w-2.5 h-2.5" /> {branding.address}
                            </p>
                          )}
                       </div>

                       {/* Personal Details */}
                       <div className="grid grid-cols-2 gap-10 mb-10">
                          <div className="space-y-4">
                             <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Name</p>
                                <p className="text-xl font-bold text-gray-900 uppercase tracking-tight">{selectedStudentTranscript.name}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Roll Number</p>
                                   <p className="text-lg font-mono font-bold text-gray-800">{selectedStudentTranscript.roll}</p>
                                </div>
                                <div>
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reg Number</p>
                                   <p className="text-lg font-mono font-bold text-gray-800">{selectedStudentTranscript.registration}</p>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-4 text-right">
                             <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Engineering Wing</p>
                                <p className="text-xl font-bold text-primary">{selectedStudentTranscript.department}</p>
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Session</p>
                                <p className="text-lg font-bold text-gray-800 italic">{selectedStudentTranscript.session}</p>
                             </div>
                          </div>
                       </div>

                       {/* Academic Snapshot */}
                       <div className="bg-gray-50 rounded-2xl p-6 grid grid-cols-3 gap-6 mb-10 border border-gray-100">
                          <div className="text-center border-r border-gray-200">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cumulative GPA</p>
                             <p className="text-3xl font-black text-gray-900">
                                {studentResults.length > 0 
                                  ? (studentResults.reduce((acc, curr) => acc + curr.gradePoint, 0) / studentResults.length).toFixed(2)
                                  : '0.00'
                                }
                             </p>
                          </div>
                          <div className="text-center border-r border-gray-200">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subjects Completed</p>
                             <p className="text-3xl font-black text-gray-900">{studentResults.length}</p>
                          </div>
                          <div className="text-center">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Result Status</p>
                             <p className={cn("text-2xl font-black uppercase", 
                                studentResults.some(r => r.grade === 'F') ? "text-danger" : "text-success"
                              )}>
                                {studentResults.length === 0 ? 'Pending' : studentResults.some(r => r.grade === 'F') ? 'Fail' : 'Passed'}
                             </p>
                          </div>
                       </div>

                       {studentResults.length > 0 ? (
                          <div className="overflow-hidden border border-gray-100 rounded-xl">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                  <th className="px-6 py-3 font-bold text-gray-900 uppercase text-[10px]">Subject</th>
                                  <th className="px-6 py-3 font-bold text-gray-900 uppercase text-[10px] text-center">Marks</th>
                                  <th className="px-6 py-3 font-bold text-gray-900 uppercase text-[10px] text-center">Grade</th>
                                  <th className="px-6 py-3 font-bold text-gray-900 uppercase text-[10px] text-center">GP</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {studentResults.map((res) => (
                                  <tr key={res.id}>
                                    <td className="px-6 py-4">
                                      <p className="font-bold text-gray-900">{res.subject}</p>
                                      <p className="text-[10px] font-mono text-gray-400">{res.subjectCode} • {res.examType}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono font-bold">{res.marks}</td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={cn("font-bold", res.grade === 'F' ? "text-danger" : "text-gray-900")}>{res.grade}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono font-bold">
                                      {res.gradePoint.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center p-10 border-2 border-dashed border-gray-100 rounded-2xl">
                             <p className="text-sm font-bold text-gray-400 italic">No academic results have been published for this session yet.</p>
                          </div>
                        )}

                       {/* Signature Area */}
                       <div className="mt-20 flex justify-between items-end px-4">
                          <div className="text-center border-t border-gray-900 pt-4 w-48">
                             <p className="text-[10px] font-bold uppercase tracking-widest">Controller of Exams</p>
                          </div>
                          <div className="text-center border-t border-gray-900 pt-4 w-48">
                             <p className="text-[10px] font-bold uppercase tracking-widest">
                                {branding?.principalName || "Principal's Signature"}
                             </p>
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="py-20 text-center text-gray-400">
                       <UserSearch className="w-12 h-12 mx-auto mb-4 opacity-20" />
                       <p className="font-bold uppercase tracking-widest text-xs">Awaiting Student Selection</p>
                    </div>
                 )}
              </div>
            )}

            {/* Default Roster View */}
            {activeReport === 'students' && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white/50 backdrop-blur-sm shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Roll</th>
                              <th className="px-6 py-4">Department</th>
                              <th className="px-6 py-4">Semester</th>
                              <th className="px-6 py-4 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {isStudentsLoading ? (
                               Array.from({ length: 5 }).map((_, i) => (
                                  <tr key={i} className="animate-pulse">
                                      <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-gray-100 rounded shadow-inner" /></td>
                                  </tr>
                               ))
                          ) : filteredData.length > 0 ? (
                              filteredData.map((s) => (
                                  <tr key={s.id} className="hover:bg-white/80 transition-colors">
                                      <td className="px-6 py-4 font-semibold text-gray-900">{s.name}</td>
                                      <td className="px-6 py-4 font-mono text-gray-600 font-bold">{s.roll}</td>
                                      <td className="px-6 py-4 uppercase font-bold text-[11px] text-gray-500">{s.department}</td>
                                      <td className="px-6 py-4 font-bold">{s.semester}</td>
                                      <td className="px-6 py-4 text-center">
                                          <Badge variant={s.status === 'active' ? 'success' : 'danger'}>{s.status}</Badge>
                                      </td>
                                  </tr>
                              ))
                          ) : (
                              <tr>
                                  <td colSpan={5} className="py-20 text-center text-gray-400">
                                     <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                     <p className="font-bold uppercase tracking-widest text-[10px]">No records match your filters.</p>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
