import { useState, useMemo } from 'react';
import { Search, Save, GraduationCap, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { SubjectSelector } from '../../components/shared/SubjectSelector';
import { useStudents } from '../../hooks/useStudents';
import { useResults } from '../../hooks/useResults';
import { calculateGrade } from '../../lib/grading';
import { useAuthStore } from '../../store/authStore';
import type { ResultRecord } from '../../types';
import toast from 'react-hot-toast';

export default function Results() {
  const { user } = useAuthStore();
  const { students, fetchStudents, isLoading: isStudentsLoading } = useStudents();
  const { fetchResults, saveBatchResults, isLoading: isResultsLoading } = useResults();

  // Filters state
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [examType, setExamType] = useState<'Midterm' | 'Final' | 'ClassTest' | ''>('');

  // Active view state
  const [isClassLoaded, setIsClassLoaded] = useState(false);
  const [resultsState, setResultsState] = useState<Record<string, { marks: number | ''; grade: string; gradePoint: number }>>({});

  const handleLoadClass = async () => {
    if (!semester || !department || !subjectCode || !examType) {
      toast.error('Please complete the exam session criteria');
      return;
    }
    
    // First fetch students to get the full class list
    await fetchStudents();
    
    // Then fetch existing results for this criteria
    const records = await fetchResults(semester, department, subjectCode, examType);
    
    // Filter students locally first to ensure we know who needs initialization
    const classStudents = students.filter(
      s => s.semester === semester && s.department === department && s.status === 'active'
    );

    // Initialize state for EVERY student in the class
    const initState: typeof resultsState = {};
    
    // If we have students, pre-populate state
    // We use a separate loop to ensure even students without existing records are ready in state
    classStudents.forEach(student => {
       const existing = records[student.id];
       initState[student.id] = {
         marks: existing ? existing.marks : '',
         grade: existing ? existing.grade : '-',
         gradePoint: existing ? existing.gradePoint : 0
       };
    });

    setResultsState(initState);
    setIsClassLoaded(true);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(
      s => s.semester === semester && 
           s.department === department && 
           s.status === 'active'
    );
  }, [students, semester, department]);

  const handleMarksChange = (studentId: string, value: string) => {
    const numericValue = value === '' ? '' : parseFloat(value);
    
    if (numericValue !== '' && (numericValue < 0 || numericValue > 100)) {
       return;
    }
    
    let grade = '';
    let gradePoint = 0;

    if (numericValue !== '') {
      const g = calculateGrade(numericValue as number);
      grade = g.grade;
      gradePoint = g.gradePoint;
    }

    setResultsState(prev => ({
      ...prev,
      [studentId]: { marks: numericValue, grade, gradePoint }
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    const recordsToSave: Omit<ResultRecord, 'id' | 'teacherId'>[] = filteredStudents
      .filter(s => resultsState[s.id] && resultsState[s.id].marks !== '')
      .map(s => ({
        studentId: s.id,
        semester: s.semester,
        department: s.department,
        subject,
        subjectCode,
        examType: examType as 'Midterm' | 'Final' | 'ClassTest',
        marks: resultsState[s.id].marks as number,
        grade: resultsState[s.id].grade,
        gradePoint: resultsState[s.id].gradePoint,
        recordedBy: user.uid,
        createdAt: new Date()
      }));

    if (recordsToSave.length > 0) {
      const success = await saveBatchResults(recordsToSave);
      if (success) {
        // Option highlighting that changes are saved
        setIsClassLoaded(true); 
      }
    } else {
      toast.error('No changes to sync. Enter at least one mark.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display tracking-tight">Result Processing</h1>
          <p className="mt-1 text-sm text-gray-500">Centralized hub for mark entry and institutional grading.</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Grading Engine</span>
                <span className="text-xs font-bold text-success uppercase leading-tight">Polytechnic Standard</span>
            </div>
            <div className="p-2 bg-success/10 rounded-xl text-success border border-success/20 shadow-sm">
                <Award className="w-5 h-5" />
            </div>
        </div>
      </div>

      {/* Selector Card */}
      <GlassCard className="p-5 border-primary/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
          <SubjectSelector 
            label="Exam Subject"
            department={department}
            semester={semester}
            value={subjectCode}
            onChange={(code, name) => {
              setSubjectCode(code);
              setSubject(name);
            }}
          />
          <Select
            label="Assessment Type"
            value={examType}
            onChange={(e) => setExamType(e.target.value as any)}
            options={[
              { label: 'Select Type', value: '' },
              { label: 'Midterm', value: 'Midterm' },
              { label: 'Final', value: 'Final' },
              { label: 'Class Test', value: 'ClassTest' },
            ]}
          />
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={handleLoadClass} isLoading={isStudentsLoading || isResultsLoading} className="gap-2 shadow-lg shadow-primary/20">
            <Search className="w-4 h-4" /> Load Assessment List
          </Button>
        </div>
      </GlassCard>

      {/* Main Content Area */}
      {!isClassLoaded ? (
         <div className="py-12">
            <EmptyState 
                title="Assessment Criteria Not Loaded"
                description="Select the semester, department, and exam category to start entering student marks."
                icon={GraduationCap}
            />
         </div>
      ) : (
        <GlassCard className="overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
           {isResultsLoading || isStudentsLoading ? (
            <div className="p-8">
              <TableSkeleton />
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 backdrop-blur-sm">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 font-display italic tracking-wide">
                    {examType}: <span className="font-mono text-primary not-italic">{subjectCode}</span> — {subject}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Batch Size: <span className="text-primary">{filteredStudents.length} Students</span></p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button onClick={handleSubmit} isLoading={isResultsLoading} className="gap-2 shadow-xl shadow-primary/20 uppercase text-[10px] font-bold tracking-widest p-6">
                    <Save className="w-5 h-5" /> Sync Gradebook
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto min-h-[350px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Roll Number</th>
                      <th className="px-6 py-4">Full Name</th>
                      <th className="px-6 py-4 w-40">Obtained Marks (100)</th>
                      <th className="px-6 py-4 text-center">Letter Grade</th>
                      <th className="px-6 py-4 text-center">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white/30 backdrop-blur-sm">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                           <EmptyState 
                                title="No Students Found"
                                description="We couldn't find any active students in the specified department/semester."
                                icon={AlertTriangle}
                           />
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const state = resultsState[student.id] || { marks: '', grade: '-', gradePoint: 0 };
                        return (
                          <tr key={student.id} className="hover:bg-primary/5 transition-all duration-300">
                            <td className="px-6 py-4 font-mono text-gray-800 font-bold tracking-tighter">{student.roll}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden transition-all">
                                        <img src="/src/assets/profile.png" alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{student.name}</p>
                                </div>
                            </td>
                            
                            <td className="px-6 py-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="---"
                                value={state.marks}
                                onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-transparent focus:border-primary/50 bg-white shadow-inner rounded-xl focus:outline-none text-center font-mono font-bold text-primary transition-all text-lg"
                              />
                            </td>
                            
                            <td className="px-6 py-4 text-center">
                              {state.grade !== '-' ? (
                                <Badge variant={state.grade === 'F' ? 'danger' : state.grade.startsWith('A') ? 'success' : 'info'} className="w-12 h-8 justify-center font-bold text-md shadow-sm border-2">
                                  {state.grade}
                                </Badge>
                              ) : (
                                <span className="text-gray-200 font-mono italic">pending</span>
                              )}
                            </td>
                            
                            <td className="px-6 py-4 text-center font-mono font-bold text-gray-900">
                              {state.grade !== '-' ? state.gradePoint.toFixed(2) : '--'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 backdrop-blur-md flex items-center justify-between">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Note: Decimal points are automatically rounded for standard CGPA calculation.
                     </p>
                     <div className="flex items-center gap-1.5 text-success">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Database Validation Active</span>
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
