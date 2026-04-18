import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Lock, 
  Unlock, 
  Trash2, 
  ShieldAlert,
  Calendar,
  Mail,
  Building2,
  Phone as PhoneIcon,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { createTeacherAccount, deleteTeacherData } from '../../lib/adminService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { TeacherProfile } from '../../types';

export default function AdminTeachers() {
  const { user: adminUser } = useAuthStore();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Modals state
  const [modals, setModals] = useState({
    add: false,
    view: false,
    block: false,
    delete: false
  });
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);

  // Form states
  const [newTeacher, setNewTeacher] = useState({
    displayName: '',
    email: '',
    password: '',
    department: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const snapshot = await getDocs(q);
      setTeachers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    } catch (err) {
      toast.error('Failed to fetch faculty roster');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchQuery, statusFilter]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    
    setIsSubmitting(true);
    try {
      await createTeacherAccount({
        ...newTeacher,
        adminUid: adminUser.uid
      });
      toast.success('Teacher account provisioned successfully!');
      setModals(prev => ({ ...prev, add: false }));
      setNewTeacher({ displayName: '', email: '', password: '', department: '', phone: '' });
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || 'Provisioning sequence failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTeacher) return;
    
    setIsSubmitting(true);
    try {
      const newStatus = selectedTeacher.status === 'active' ? 'blocked' : 'active';
      const teacherRef = doc(db, 'users', selectedTeacher.uid);
      await updateDoc(teacherRef, {
        status: newStatus,
        blockedAt: newStatus === 'blocked' ? serverTimestamp() : null,
        blockedReason: newStatus === 'blocked' ? blockReason : '',
        updatedAt: serverTimestamp()
      });

      toast.success(`Teacher account ${newStatus === 'active' ? 'reactivated' : 'suspended'}`);
      setModals(prev => ({ ...prev, block: false }));
      setBlockReason('');
      fetchTeachers();
    } catch (err) {
      toast.error('Failed to update account status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher || deleteConfirmationName !== selectedTeacher.displayName) return;

    setIsSubmitting(true);
    try {
      await deleteTeacherData(selectedTeacher.uid);
      toast.success('Teacher data packet purged successfully');
      setModals(prev => ({ ...prev, delete: false }));
      setDeleteConfirmationName('');
      fetchTeachers();
    } catch (err) {
      toast.error('Purge sequence interrupted');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
             <Users className="w-8 h-8 text-rose-600" />
             Faculty Roster
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Command and control hub for teacher accounts.</p>
        </div>
        <Button 
          onClick={() => setModals(prev => ({ ...prev, add: true }))}
          className="bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200 h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] gap-2"
        >
          <Plus className="w-5 h-5" /> Provision Teacher
        </Button>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 border-white/50 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search by name, email or department..."
            className="w-full bg-white/50 border border-transparent focus:border-rose-100 focus:bg-white rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-gray-900 transition-all outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter className="w-4 h-4 text-gray-400" />
           <Select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value as any)}
             options={[
               { value: 'all', label: 'All Statuses' },
               { value: 'active', label: 'Active Faculty' },
               { value: 'blocked', label: 'Suspended Accounts' }
             ]}
             className="w-48 bg-white/50 border-none shadow-sm"
           />
        </div>
      </GlassCard>

      {/* Teacher Table */}
      <GlassCard className="overflow-hidden border-white/50 shadow-2xl shadow-rose-500/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-rose-50/50 border-b border-rose-100 italic">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-rose-900 uppercase tracking-widest">Faculty Member</th>
                <th className="px-8 py-5 text-[10px] font-black text-rose-900 uppercase tracking-widest">Department</th>
                <th className="px-8 py-5 text-[10px] font-black text-rose-900 uppercase tracking-widest text-center">Security Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-rose-900 uppercase tracking-widest">Onboarded</th>
                <th className="px-8 py-5 text-[10px] font-black text-rose-900 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white/30 backdrop-blur-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-4 bg-gray-100 rounded shadow-inner" /></td>
                  </tr>
                ))
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.uid} className="hover:bg-rose-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-lg font-black text-rose-600 ring-2 ring-rose-50 overflow-hidden">
                           {teacher.photoURL ? (
                             <img src={teacher.photoURL} alt={teacher.displayName} className="w-full h-full object-cover" />
                           ) : teacher.displayName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-none">{teacher.displayName}</p>
                          <p className="text-xs text-gray-400 font-bold mt-1.5 lowercase flex items-center gap-1">
                             <Mail className="w-3 h-3" /> {teacher.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-xs font-black text-gray-600 uppercase tracking-tighter">
                          {teacher.department || '—'}
                       </p>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <Badge variant={teacher.status === 'active' ? 'success' : 'danger'} className="uppercase font-black text-[9px] tracking-widest h-6 px-3 shadow-sm border-white">
                         {teacher.status}
                       </Badge>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                         {teacher.joinedAt ? format((teacher.joinedAt as any).toDate(), 'MMM dd, yyyy') : '—'}
                       </p>
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                       <button 
                         onClick={() => { setSelectedTeacher(teacher); setModals(m => ({ ...m, view: true })) }}
                         className="p-2.5 bg-white text-gray-400 hover:text-rose-600 hover:shadow-lg hover:shadow-rose-100 rounded-xl transition-all border border-gray-100"
                        >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => { setSelectedTeacher(teacher); setModals(m => ({ ...m, block: true })) }}
                         className={`p-2.5 bg-white rounded-xl transition-all border border-gray-100 hover:shadow-lg ${
                            teacher.status === 'active' 
                              ? 'text-amber-500 hover:text-amber-600 hover:shadow-amber-100' 
                              : 'text-emerald-500 hover:text-emerald-600 hover:shadow-emerald-100'
                         }`}
                        >
                         {teacher.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                       </button>
                       <button 
                         onClick={() => { setSelectedTeacher(teacher); setModals(m => ({ ...m, delete: true })) }}
                         className="p-2.5 bg-white text-gray-400 hover:text-rose-600 hover:shadow-lg hover:shadow-rose-100 rounded-xl transition-all border border-gray-100"
                        >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-[10px]">No faculty members found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* MODAL: ADD TEACHER */}
      <Modal 
        isOpen={modals.add} 
        onClose={() => setModals(m => ({ ...m, add: false }))} 
        title="Provision New Teacher Account"
        className="max-w-xl"
      >
        <form onSubmit={handleAddTeacher} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Full Name" 
              placeholder="Official Title & Name"
              required
              value={newTeacher.displayName}
              onChange={(e) => setNewTeacher(p => ({ ...p, displayName: e.target.value }))}
            />
            <Input 
              label="Email Address" 
              type="email"
              placeholder="faculty@rangpurpolytechnic.edu.bd"
              required
              value={newTeacher.email}
              onChange={(e) => setNewTeacher(p => ({ ...p, email: e.target.value }))}
            />
            <Input 
              label="Secure Password" 
              type="password"
              placeholder="Min 8 characters"
              required
              value={newTeacher.password}
              onChange={(e) => setNewTeacher(p => ({ ...p, password: e.target.value }))}
            />
            <Input 
              label="Institutional Unit" 
              placeholder="e.g. Computer Science"
              value={newTeacher.department}
              onChange={(e) => setNewTeacher(p => ({ ...p, department: e.target.value }))}
            />
            <div className="md:col-span-2">
               <Input 
                 label="Mobile Contact" 
                 placeholder="+880 1XXX XXXXXX"
                 value={newTeacher.phone}
                 onChange={(e) => setNewTeacher(p => ({ ...p, phone: e.target.value }))}
               />
            </div>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
             <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
             <p className="text-[10px] font-bold text-amber-900 leading-snug">
               Note: This account will be created instantly using a secondary authentication instance. The teacher can sign in immediately using their email and the provided password.
             </p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
             <Button variant="ghost" type="button" onClick={() => setModals(m => ({ ...m, add: false }))} className="uppercase font-black text-[10px] tracking-widest">Abort</Button>
             <Button type="submit" isLoading={isSubmitting} className="bg-rose-600 hover:bg-rose-700 h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-200">Grant Credentials</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW DETAILS */}
      <Modal 
        isOpen={modals.view} 
        onClose={() => setModals(m => ({ ...m, view: false }))} 
        title="Faculty Member Profile"
        className="max-w-md"
      >
        {selectedTeacher && (
           <div className="space-y-8 pb-4">
              <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl border border-gray-100 flex items-center justify-center text-3xl font-black text-rose-600 ring-4 ring-rose-50 overflow-hidden mb-4">
                    {selectedTeacher.photoURL ? (
                      <img src={selectedTeacher.photoURL} className="w-full h-full object-cover" />
                    ) : selectedTeacher.displayName[0]}
                 </div>
                 <h3 className="text-xl font-black text-gray-900 leading-none tracking-tight">{selectedTeacher.displayName}</h3>
                 <p className="text-xs font-bold text-gray-400 mt-2 lowercase">{selectedTeacher.email}</p>
                 <Badge variant={selectedTeacher.status === 'active' ? 'success' : 'danger'} className="mt-4 uppercase font-black text-[9px] tracking-widest px-3 border-white">
                   {selectedTeacher.status}
                 </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                 <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Institutional Unit</p>
                       <p className="text-xs font-bold text-gray-900">{selectedTeacher.department || 'Not Assigned'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mobile Contact</p>
                       <p className="text-xs font-bold text-gray-900">{selectedTeacher.phone || 'No Data'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Onboarding Date</p>
                       <p className="text-xs font-bold text-gray-900">{selectedTeacher.joinedAt ? format((selectedTeacher.joinedAt as any).toDate(), 'MMMM dd, yyyy') : '—'}</p>
                    </div>
                 </div>
              </div>

              <div className="flex justify-end pt-4">
                 <Button onClick={() => setModals(m => ({ ...m, view: false }))} className="font-black h-11 px-8 rounded-xl uppercase text-[10px] tracking-widest">Dismiss</Button>
              </div>
           </div>
        )}
      </Modal>

      {/* MODAL: BLOCK/UNBLOCK */}
      <Modal 
        isOpen={modals.block} 
        onClose={() => setModals(m => ({ ...m, block: false }))} 
        title={selectedTeacher?.status === 'active' ? 'Account Suspension' : 'Account Reactivation'}
        className="max-w-md"
      >
        <div className="space-y-6">
           <div className={`p-6 rounded-3xl border ${selectedTeacher?.status === 'active' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex gap-4">
                 <ShieldAlert className={`w-8 h-8 shrink-0 ${selectedTeacher?.status === 'active' ? 'text-rose-600' : 'text-emerald-600'}`} />
                 <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase">Warning Sequence</h3>
                    <p className="text-xs font-medium text-gray-600 mt-1 leading-relaxed">
                       {selectedTeacher?.status === 'active' 
                        ? `Suspending ${selectedTeacher.displayName} will immediately invalidate their current data session and block future access.` 
                        : `Reactivating ${selectedTeacher?.displayName} will restore full access to their student data and administrative features.`}
                    </p>
                 </div>
              </div>
           </div>

           {selectedTeacher?.status === 'active' && (
             <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Suspension (Optional)</p>
                <textarea 
                  className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-900 outline-none focus:border-rose-200 transition-all min-h-[100px]"
                  placeholder="Enter administrative notation..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
             </div>
           )}

           <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={() => setModals(m => ({ ...m, block: false }))} className="uppercase font-black text-[10px] tracking-widest">Cancel</Button>
              <Button 
                onClick={handleToggleStatus} 
                isLoading={isSubmitting}
                className={`h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest ${
                  selectedTeacher?.status === 'active' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {selectedTeacher?.status === 'active' ? 'Execute Suspension' : 'Confirm Reactivation'}
              </Button>
           </div>
        </div>
      </Modal>

      {/* MODAL: DELETE */}
      <Modal 
        isOpen={modals.delete} 
        onClose={() => setModals(m => ({ ...m, delete: false }))} 
        title="Account Purge Confirmation"
        className="max-w-md"
      >
        <div className="space-y-6">
           <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100">
              <div className="flex gap-4">
                 <Trash2 className="w-8 h-8 text-rose-600 shrink-0" />
                 <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">Critical Action Detected</h3>
                    <p className="text-xs font-medium text-gray-600 mt-2 leading-relaxed">
                       You are about to permanently purge <span className="font-black text-gray-900">{selectedTeacher?.displayName}</span> and <span className="font-black text-rose-600">ALL associated records</span> (Students, Results, Attendance, Fees). This action is irreversible.
                    </p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <p className="text-[10px] font-black font-italic text-gray-400 uppercase tracking-widest ml-1">Type name to confirm deletion sequence:</p>
              <Input 
                placeholder={selectedTeacher?.displayName}
                value={deleteConfirmationName}
                onChange={(e) => setDeleteConfirmationName(e.target.value)}
              />
           </div>

           <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={() => setModals(m => ({ ...m, delete: false }))} className="uppercase font-black text-[10px] tracking-widest">Cancel</Button>
              <Button 
                onClick={handleDeleteTeacher} 
                isLoading={isSubmitting}
                disabled={deleteConfirmationName !== selectedTeacher?.displayName}
                className="bg-rose-600 hover:bg-rose-700 h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-200 disabled:opacity-50 disabled:grayscale transition-all"
              >
                Execute Purge
              </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
