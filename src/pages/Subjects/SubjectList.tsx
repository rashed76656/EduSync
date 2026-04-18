import { useState, useEffect, useMemo } from 'react';
import { Book, Search, Database, BookOpen, Layers } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useSubjects } from '../../hooks/useSubjects';
import { seedSubjectsToFirestore, clearAndSeedSubjects } from '../../utils/seedSubjects';
import type { Subject } from '../../types';
import toast from 'react-hot-toast';

export default function SubjectList() {
  const { getAllSubjects, isLoading } = useSubjects();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filters
  const [deptFilter, setDeptFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const data = await getAllSubjects();
      setSubjects(data);
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  useEffect(() => {
    loadData();
  }, [getAllSubjects]);

  const handleSeed = async () => {
    if (!window.confirm('Initialize BTEB Subject Data (Regulation 2022)? This will create over 200 records.')) return;
    
    setIsSeeding(true);
    try {
      const result = await seedSubjectsToFirestore();
      if (result.success) {
        toast.success(`Seeded ${result.count} subjects!`);
        loadData();
      } else {
        toast.error(result.message || 'Initialization failed');
      }
    } catch (error) {
      toast.error('Seeding failed');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('CRITICAL: This will delete all current subjects and re-populate from official data. Use only if data is corrupted. Proceed?')) return;
    
    setIsSeeding(true);
    try {
      const result = await clearAndSeedSubjects();
      if (result.success) {
        toast.success(`Reset complete! ${result.count} subjects synchronization successful.`);
        loadData();
      } else {
        toast.error(result.message || 'Reset failed');
      }
    } catch (error) {
      toast.error('System reset failed');
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchesDept = !deptFilter || s.departmentShort === deptFilter;
      const matchesSem = !semesterFilter || s.semester === semesterFilter;
      const matchesSearch = !searchQuery || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.includes(searchQuery);
      return matchesDept && matchesSem && matchesSearch;
    });
  }, [subjects, deptFilter, semesterFilter, searchQuery]);

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'CST': return 'indigo';
      case 'EET': return 'blue';
      case 'CET': return 'emerald';
      case 'MT': return 'amber';
      case 'ET': return 'violet';
      case 'PT': return 'cyan';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display tracking-tight">Subject Repository</h1>
          <p className="mt-1 text-sm text-gray-500">BTEB Diploma in Engineering — Regulation 2022 Curriculum.</p>
        </div>
        
        {subjects.length === 0 && !isLoading ? (
          <Button onClick={handleSeed} isLoading={isSeeding} className="gap-2 bg-indigo-600 shadow-xl shadow-indigo-200 uppercase font-bold text-[10px] tracking-widest p-6 rounded-2xl group">
            <Database className="w-5 h-5 group-hover:scale-110 transition-transform" /> Initialize System Data
          </Button>
        ) : (
          <Button variant="ghost" onClick={handleReset} isLoading={isSeeding} className="gap-2 text-danger hover:bg-danger/5 uppercase font-bold text-[10px] tracking-widest p-6 rounded-2xl">
            <Database className="w-5 h-5" /> Reset Repository
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center gap-4 bg-white/40">
           <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Book className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-900 font-mono leading-none">{subjects.length}</p>
           </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4 bg-white/40">
           <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Layers className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Departments</p>
              <p className="text-2xl font-bold text-gray-900 font-mono leading-none">6</p>
           </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4 bg-white/40">
           <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <Database className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Active Scheme</p>
              <p className="text-2xl font-bold text-gray-900 font-mono leading-none">2022</p>
           </div>
        </GlassCard>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-5 border-white/50 bg-white/40 shadow-xl shadow-primary/5">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    placeholder="Search Code or Name..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold placeholder:text-gray-300 transition-all shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Select 
                label="Filter by Department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                options={[
                    { label: 'All Departments', value: '' },
                    { label: 'CST - Computer Science', value: 'CST' },
                    { label: 'EET - Electrical', value: 'EET' },
                    { label: 'CET - Civil', value: 'CET' },
                    { label: 'MT - Mechanical', value: 'MT' },
                    { label: 'ET - Electronics', value: 'ET' },
                    { label: 'PT - Power', value: 'PT' },
                ]}
            />
            <Select 
                label="Filter by Semester"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                options={[
                    { label: 'All Semesters', value: '' },
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
         </div>
      </GlassCard>

      {/* Subjects Table */}
      <GlassCard className="overflow-hidden border-white/50 bg-white/40 shadow-xl shadow-primary/5">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-xl">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-display tracking-tight">Curriculum Inventory</h3>
            </div>
            <Badge variant="info" className="h-7 px-4 rounded-full font-bold uppercase text-[10px] tracking-widest">{filteredSubjects.length} Items</Badge>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200/50">
              <tr>
                <th className="px-6 py-5"># Code</th>
                <th className="px-6 py-5">Subject Designation</th>
                <th className="px-6 py-5">Engineering Wing</th>
                <th className="px-6 py-5 text-center">Semester</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 bg-white/10">
              {isLoading ? (
                <tr>
                   <td colSpan={4} className="p-8"><TableSkeleton /></td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState 
                      title={subjects.length === 0 ? "Repository is Empty" : "No Matches Found"}
                      description={subjects.length === 0 ? "The subject library has not been initialized yet. Click the button above to seed data." : "Refine your filters to find specific academic subjects."}
                      icon={BookOpen}
                    />
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-white/40 transition-all duration-300 group">
                    <td className="px-6 py-5">
                       <span className="text-[11px] font-bold text-gray-400 mr-2 opacity-50">{idx + 1}.</span>
                       <span className="font-mono font-bold text-primary group-hover:scale-110 transition-transform inline-block">{s.code || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-5 font-bold text-gray-800 tracking-tight">{s.name || 'Unknown Subject'}</td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-1">
                          <Badge variant={getDeptColor(s.departmentShort) as any} className="w-fit h-5 px-2 text-[9px] font-bold uppercase tracking-widest">
                            {s.departmentShort}
                          </Badge>
                          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter leading-none">{s.department}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="text-xs font-bold text-gray-600 bg-white border border-gray-100 px-3 py-1 transparent-badge shadow-sm">
                          {s.semester}
                       </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
