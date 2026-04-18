import { useState, useMemo } from 'react';
import { Users, Search, Save, Calendar, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { SubjectSelector } from '../../components/shared/SubjectSelector';

import { useStudents } from '../../hooks/useStudents';
import { useAttendance } from '../../hooks/useAttendance';
import { useAuthStore } from '../../store/authStore';
import type { AttendanceStatus, AttendanceRecord } from '../../types';
import toast from 'react-hot-toast';

export default function Attendance() {
  const { user } = useAuthStore();
  const { students, fetchStudents, isLoading: isStudentsLoading } = useStudents();
  const { fetchAttendance, saveBatchAttendance, isLoading: isAttendanceLoading } = useAttendance();

  // Filters state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [shift, setShift] = useState('');
  const [group, setGroup] = useState('');
  const [subject, setSubject] = useState(''); // Name
  const [subjectCode, setSubjectCode] = useState(''); // Added Code

  // Active view state
  const [isClassLoaded, setIsClassLoaded] = useState(false);
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});

  const handleLoadClass = async () => {
    if (!semester || !department || !shift || !group || !subjectCode) {
      toast.error('Please fill all selection fields mapping the class schedule');
      return;
    }
    await fetchStudents();
    const records = await fetchAttendance(date, semester, department, shift, group, subjectCode);
    
    // Initialize state
    const initState: Record<string, AttendanceStatus> = {};
    Object.keys(records).forEach(studentId => {
      initState[studentId] = records[studentId].status;
    });
    setAttendanceState(initState);
    setIsClassLoaded(true);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(
      s => s.semester === semester && 
           s.department === department && 
           s.shift === shift && 
           s.group === group &&
           s.status === 'active'
    );
  }, [students, semester, department, shift, group]);

  const handleMarkAll = (status: AttendanceStatus) => {
    const newState = { ...attendanceState };
    filteredStudents.forEach(s => {
      newState[s.id] = status;
    });
    setAttendanceState(newState);
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (Object.keys(attendanceState).length !== filteredStudents.length) {
      if (!window.confirm("Some students don't have attendance marked. Submit anyway?")) {
        return;
      }
    }

    const recordsToSave: Omit<AttendanceRecord, 'id' | 'createdAt' | 'teacherId'>[] = filteredStudents
      .filter(s => attendanceState[s.id])
      .map(s => ({
        date,
        studentId: s.id,
        semester: s.semester,
        department: s.department,
        shift: s.shift,
        group: s.group,
        subject,
        subjectCode,
        status: attendanceState[s.id],
        recordedBy: user?.uid || 'unknown',
        createdAt: new Date()
      }));

    if (recordsToSave.length > 0) {
      await saveBatchAttendance(recordsToSave);
    } else {
      toast.error('No attendance data points to save');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display tracking-tight">Daily Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">Record and synchronize daily attendance logs for class sessions.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 p-2 px-3 bg-white/50 rounded-2xl border border-white shadow-sm backdrop-blur-md">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-gray-900">{new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Selector Card */}
      <GlassCard className="p-5 border-primary/10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <Input 
            type="date" 
            label="Attendance Date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          <Select
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            options={[
              { label: 'Select Semester', value: '' },
              { label: '1st Semester', value: '1st' },
              { label: '2nd Semester', value: '2nd' },
              { label: '3rd Semester', value: '3rd' },
              { label: '4th Semester', value: '4th' },
              { label: '5th Semester', value: '5th' },
              { label: '6th Semester', value: '6th' },
              { label: '7th Semester', value: '7th' },
              { label: '8th Semester', value: '8th' },
            ]}
          />
          <Select
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[
              { label: 'Select Dept', value: '' },
              { label: 'CST - Computer Science', value: 'CST' },
              { label: 'EET - Electrical', value: 'EET' },
              { label: 'CET - Civil', value: 'CET' },
              { label: 'MT - Mechanical', value: 'MT' },
              { label: 'ET - Electronics', value: 'ET' },
              { label: 'PT - Power', value: 'PT' },
            ]}
          />
          <Select
            label="Shift"
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            options={[
              { label: 'Select Shift', value: '' },
              { label: 'Morning', value: 'Morning' },
              { label: 'Day', value: 'Day' },
            ]}
          />
          <Select
            label="Group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            options={[
              { label: 'Select Group', value: '' },
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
              { label: 'C', value: 'C' },
            ]}
          />
          <SubjectSelector 
            label="Class Subject"
            department={department}
            semester={semester}
            value={subjectCode}
            onChange={(code, name) => {
              setSubjectCode(code);
              setSubject(name);
            }}
          />
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={handleLoadClass} isLoading={isStudentsLoading || isAttendanceLoading} className="gap-2 shadow-lg shadow-primary/20">
            <Search className="w-4 h-4" /> Load Students
          </Button>
        </div>
      </GlassCard>

      {/* Main Content Area */}
      {!isClassLoaded ? (
         <div className="py-12">
            <EmptyState 
                title="Class Records Not Loaded"
                description="Use the selection bar above to specify a class, date, and subject to begin marking attendance."
                icon={Search}
            />
         </div>
      ) : (
        <GlassCard className="overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
           {isStudentsLoading || isAttendanceLoading ? (
            <div className="p-8">
              <TableSkeleton />
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 backdrop-blur-sm">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 font-display">Log Class Attendance</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Topic/Subject: <span className="text-primary">{subject}</span></p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={() => handleMarkAll('present')} className="text-success border-success/20 hover:bg-success/5 font-bold uppercase text-[10px] tracking-widest">
                    Mark All Present
                  </Button>
                  <Button onClick={handleSubmit} isLoading={isAttendanceLoading} className="gap-2 shadow-xl shadow-primary/20 uppercase text-[10px] font-bold tracking-widest">
                    <Save className="w-4 h-4" /> Save Records
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Serial / Roll</th>
                      <th className="px-6 py-4">Student Identity</th>
                      <th className="px-6 py-4 text-center">Present</th>
                      <th className="px-6 py-4 text-center">Absent</th>
                      <th className="px-6 py-4 text-center">Late Entry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white/30 backdrop-blur-sm">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                           <EmptyState 
                                title="No Students Found"
                                description="No active students found matching your selected criteria. Please check department and shift settings."
                                icon={Users}
                           />
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <tr key={student.id} className="hover:bg-primary/5 transition-all duration-300">
                          <td className="px-6 py-4 font-mono text-gray-500 text-xs translate-y-0.5">{idx + 1}. <span className="font-bold text-gray-700">{student.roll}</span></td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden">
                                      <img src="/src/assets/profile.png" alt="Profile" className="w-full h-full object-cover" />
                                  </div>
                                  <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{student.name}</p>
                              </div>
                          </td>
                          
                          <td className="px-6 py-4 text-center">
                            <label className="inline-flex items-center justify-center w-full cursor-pointer">
                              <input 
                                type="radio" 
                                name={`att-${student.id}`} 
                                value="present"
                                checked={attendanceState[student.id] === 'present'}
                                onChange={() => setStudentStatus(student.id, 'present')}
                                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500/20 transition-all checked:bg-indigo-600"
                              />
                            </label>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <label className="inline-flex items-center justify-center w-full cursor-pointer">
                              <input 
                                type="radio" 
                                name={`att-${student.id}`} 
                                value="absent"
                                checked={attendanceState[student.id] === 'absent'}
                                onChange={() => setStudentStatus(student.id, 'absent')}
                                className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500/20 transition-all checked:bg-red-600"
                              />
                            </label>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <label className="inline-flex items-center justify-center w-full cursor-pointer">
                              <input 
                                type="radio" 
                                name={`att-${student.id}`} 
                                value="late"
                                checked={attendanceState[student.id] === 'late'}
                                onChange={() => setStudentStatus(student.id, 'late')}
                                className="w-5 h-5 text-amber-500 border-gray-300 focus:ring-amber-500/20 transition-all checked:bg-amber-500"
                              />
                            </label>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 backdrop-blur-md flex items-center justify-between">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Current Status: <span className="text-primary">{Object.keys(attendanceState).length} marked</span> / {filteredStudents.length} total
                     </p>
                     <div className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Sync System Ready</span>
                     </div>
                </div>
              )}
            </>
          )}
        </GlassCard>
      )}
    </div>
  );
}
