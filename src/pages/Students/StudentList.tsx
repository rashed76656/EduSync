import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Users } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import AddStudentModal from './AddStudentModal';
import { useStudents } from '../../hooks/useStudents';
import profilePic from '../../assets/profile.png';

export default function StudentList() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { students, isLoading, fetchStudents, deleteStudent } = useStudents();
  const navigate = useNavigate();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll.includes(searchQuery) ||
        student.registration.includes(searchQuery);
      
      const matchesSemester = semesterFilter ? student.semester === semesterFilter : true;
      const matchesDept = deptFilter ? student.department === deptFilter : true;

      return matchesSearch && matchesSemester && matchesDept;
    });
  }, [students, searchQuery, semesterFilter, deptFilter]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      await deleteStudent(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Student Management</h1>
          <p className="mt-1 text-sm text-gray-500">Total: <span className="text-primary font-bold">{students.length}</span> Registered Students</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Add Student
        </Button>
      </div>

      {/* Filters Bar */}
      <GlassCard className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name, roll, or registration..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Select
            value={semesterFilter}
            onChange={(e) => { setSemesterFilter(e.target.value); setCurrentPage(1); }}
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
          <Select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
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
        </div>
      </GlassCard>

      {/* Data Table */}
      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState 
            title={students.length === 0 ? "No Students Registered" : "No Matches Found"}
            description={students.length === 0 
              ? "Start by adding your first student to the system. You can manage departments and rolls thereafter."
              : "We couldn't find any students matching your search filters. Try adjusting your query."
            }
            icon={students.length === 0 ? Users : Search}
            actionLabel={students.length === 0 ? "Add First Student" : "Clear Filters"}
            onAction={() => {
              if (students.length === 0) setIsAddModalOpen(true);
              else { setSearchQuery(''); setSemesterFilter(''); setDeptFilter(''); }
            }}
          />
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-700 font-bold border-b border-gray-100 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">Student Identity</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Class Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/30">
                {paginatedStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-primary/5 transition-colors cursor-pointer group" 
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center transition-all duration-300">
                          <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{student.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reg: {student.registration}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 font-medium">{student.roll}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="info">{student.department}</Badge>
                        <Badge variant="default">{student.semester}</Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={student.status === 'active' ? 'success' : student.status === 'dropped' ? 'danger' : 'warning'}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-2 text-gray-400 hover:text-danger hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 backdrop-blur-md">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of {filteredStudents.length}
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-[10px] uppercase font-bold tracking-widest"
              >
                Prev
              </Button>
              <div className="text-xs font-bold text-primary px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-[10px] uppercase font-bold tracking-widest"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      <AddStudentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => fetchStudents()}
      />
    </div>
  );
}
