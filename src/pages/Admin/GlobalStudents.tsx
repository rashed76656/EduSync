import { useState } from 'react';
import { 
  Users, 
  Search, 
  ArrowUpCircle, 
  ChevronRight,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { useGlobalStudents } from '../../hooks/useGlobalStudents';
import { bulkUpdateStudents, getNextSemester } from '../../lib/adminService';
import { logAdminAction } from '../../lib/adminLogs';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../../components/ui/Badge';
import type { Semester, Department } from '../../types';
import toast from 'react-hot-toast';

export default function GlobalStudents() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    department: 'All' as Department | 'All',
    semester: 'All' as Semester | 'All',
    status: 'All',
    searchQuery: ''
  });

  const { students, isLoading } = useGlobalStudents(filters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev: string[]) => 
      prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
    );
  };

  const handleBulkPromote = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Promote ${selectedIds.length} students to their next semester?`)) return;

    setIsProcessing(true);
    try {
      // Group students by their target destination to reduce operations
      const promotionGroups: Record<string, { ids: string[], updates: any }> = {};

      selectedIds.forEach(id => {
        const student = students.find(s => s.id === id);
        if (!student) return;

        const next = getNextSemester(student.semester);
        const finalStatus = student.semester === '8th' ? 'inactive' : next.status;
        const finalSemester = next.semester;
        
        // Grouping key: semester_status_alumni
        const key = `${finalSemester}_${finalStatus}_${student.semester === '8th'}`;
        if (!promotionGroups[key]) {
          promotionGroups[key] = { 
            ids: [], 
            updates: { 
              semester: finalSemester, 
              status: finalStatus, 
              isAlumni: student.semester === '8th' 
            } 
          };
        }
        promotionGroups[key].ids.push(id);
      });

      // Execute updates per group
      let totalCount = 0;
      for (const key in promotionGroups) {
        const group = promotionGroups[key];
        await bulkUpdateStudents(group.ids, group.updates);
        totalCount += group.ids.length;
      }

      await logAdminAction({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'BULK_PROMOTION',
        details: `Successfully promoted ${totalCount} students.`
      });

      toast.success(`Advancement Complete: ${totalCount} students promoted!`);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Promotion sequence failed. Check permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsAlumni = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await bulkUpdateStudents(selectedIds, { status: 'inactive', isAlumni: true });
      toast.success(`${selectedIds.length} students joined the Alumni network.`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Failed to transition to Alumni status.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 font-display tracking-tight uppercase italic">
            Global <span className="text-rose-600">Registry</span>
          </h1>
          <p className="mt-1 text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">
            Centralized oversight of all {students.length} registered students.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <GlassCard className="p-1 pr-4 flex items-center gap-3 bg-white/50 border-gray-100">
              <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                 <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-900 uppercase leading-none">Admin Authority</p>
                 <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase">Read/Write Enabled</p>
              </div>
           </GlassCard>
        </div>
      </div>

      {/* Control Bar */}
      <GlassCard className="p-4 border-white/50 bg-white/40 shadow-xl shadow-primary/5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative col-span-1 lg:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full h-12 bg-white/60 border-0 rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 transition-all shadow-sm"
              value={filters.searchQuery}
              onChange={(e) => setFilters((f: any) => ({ ...f, searchQuery: e.target.value }))}
            />
          </div>
          
          <div className="flex gap-4">
            <select 
               className="flex-1 h-12 bg-white/60 border-0 rounded-2xl px-4 text-xs font-bold text-gray-500 uppercase tracking-widest focus:ring-2 focus:ring-rose-500 shadow-sm"
               value={filters.department}
               onChange={(e) => setFilters((f: any) => ({ ...f, department: e.target.value as any }))}
            >
               <option value="All">All Tech</option>
               <option value="CST">Computer</option>
               <option value="CIVIL">Civil</option>
               <option value="EET">Electrical</option>
            </select>
            
            <select 
               className="flex-1 h-12 bg-white/60 border-0 rounded-2xl px-4 text-xs font-bold text-gray-500 uppercase tracking-widest focus:ring-2 focus:ring-rose-500 shadow-sm"
               value={filters.semester}
               onChange={(e) => setFilters((f: any) => ({ ...f, semester: e.target.value as any }))}
            >
               <option value="All">All Sem</option>
               {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => (
                 <option key={s} value={s}>{s} Sem</option>
               ))}
            </select>
          </div>

          <div className="flex gap-2 lg:col-span-2">
             <Button 
                onClick={handleBulkPromote}
                disabled={selectedIds.length === 0 || isProcessing}
                className="flex-1 bg-gray-900 gap-2 h-12 rounded-2xl uppercase font-black text-[9px] tracking-widest shadow-xl shadow-gray-200"
             >
                <ArrowUpCircle className="w-4 h-4" /> Promote ({selectedIds.length})
             </Button>
             <Button 
                onClick={handleMarkAsAlumni}
                disabled={selectedIds.length === 0 || isProcessing}
                className="flex-1 bg-rose-600 gap-2 h-12 rounded-2xl uppercase font-black text-[9px] tracking-widest shadow-xl shadow-rose-200"
             >
                <GraduationCap className="w-4 h-4" /> Move to Alumni
             </Button>
          </div>
        </div>
      </GlassCard>

      {/* Main Table */}
      <GlassCard className="overflow-hidden border-white/50 bg-white/40 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input 
                    type="checkbox"
                    className="rounded-md border-gray-300 text-rose-600 focus:ring-rose-500"
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(students.map(s => s.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Identify</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Academic Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Synchronizing Records...</p>
                   </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                         <Users className="w-8 h-8 text-rose-200" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">No signals found in this frequency.</p>
                      <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Adjust filters or search parameters.</p>
                   </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-rose-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="rounded-md border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-rose-50 group-hover:scale-110 transition-transform overflow-hidden">
                            <img src="/src/assets/profile.png" className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900 group-hover:text-rose-600 transition-colors">{student.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Roll: {student.roll}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-600">{student.department} Technology</span>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">{student.semester} SEM</Badge>
                           <span className="text-[9px] font-bold text-gray-400 uppercase">{student.session}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <Badge variant={student.status === 'active' ? 'success' : 'warning'} className="uppercase text-[9px] font-black tracking-widest">
                          {student.status}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm">
                          <ChevronRight className="w-5 h-5" />
                       </button>
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
