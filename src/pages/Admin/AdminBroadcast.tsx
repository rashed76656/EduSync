import { useState } from 'react';
import { Megaphone, Plus, Trash2, Send, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuthStore } from '../../store/authStore';
import { useBroadcasts } from '../../hooks/useBroadcasts';
import { logAdminAction } from '../../lib/adminLogs';
import { formatDistanceToNow } from 'date-fns';
import { DEPARTMENTS, SEMESTERS } from '../../utils/btebSubjectData';

const TARGET_ROLES = [
  { label: 'All Users', value: 'all' },
  { label: 'Students Only', value: 'student' },
  { label: 'Teachers Only', value: 'teacher' },
  { label: 'Account Managers Only', value: 'account_manager' },
];

export default function AdminBroadcast() {
  const { user } = useAuthStore();
  const { broadcasts, isLoading, postBroadcast, removeBroadcast } = useBroadcasts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'General' as 'General' | 'Urgent' | 'Success',
    targetRole: 'all' as any,
    targetDepartment: 'all',
    targetSemester: 'all',
    expiresAt: ''
  });

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return;

    setIsSubmitting(true);
    try {
      const expiryDate = formData.expiresAt ? new Date(formData.expiresAt) : undefined;
      
      const successId = await postBroadcast({
        title: formData.title,
        message: formData.message,
        category: formData.category,
        targetRole: formData.targetRole,
        targetDepartment: formData.targetDepartment,
        targetSemester: formData.targetSemester,
        expiresAt: expiryDate
      }, user?.displayName || user?.email || 'Admin', user?.uid || '');

      if (successId) {
        await logAdminAction({
          adminUid: user?.uid || '',
          adminEmail: user?.email || '',
          action: 'POST_BROADCAST',
          targetId: successId,
          targetName: formData.title,
          details: `Posted broadcast to ${formData.targetRole}: ${formData.title}`
        });

        setFormData({
          title: '',
          message: '',
          category: 'General',
          targetRole: 'all',
          targetDepartment: 'all',
          targetSemester: 'all',
          expiresAt: ''
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm('Terminate this transmission?')) return;
    await removeBroadcast(id);
    await logAdminAction({
      adminUid: user?.uid || '',
      adminEmail: user?.email || '',
      action: 'DELETE_BROADCAST',
      targetId: id,
      targetName: title,
      details: `Deleted broadcast: ${title}`
    });
  };

  const normalizeDate = (date: any): Date => {
    if (!date) return new Date();
    if (date.toDate) return date.toDate();
    return new Date(date);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-rose-600" />
            Global Transmission
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Post targeted institute-wide broadcasts to specific roles and departments.</p>
        </div>
        
        <div className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-200">
           <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
           <span className="text-xs font-black uppercase tracking-widest">Signal: Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Post Panel */}
        <div className="lg:col-span-5">
          <GlassCard className="p-8 border-rose-100 shadow-2xl shadow-rose-500/5">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-500" />
              New Broadcast
            </h3>

            <form onSubmit={handlePost} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Target Role"
                  value={formData.targetRole}
                  onChange={(e) => setFormData(p => ({ ...p, targetRole: e.target.value }))}
                  options={TARGET_ROLES}
                />
                <Select 
                  label="Department"
                  value={formData.targetDepartment}
                  onChange={(e) => setFormData(p => ({ ...p, targetDepartment: e.target.value }))}
                  options={[{ label: 'All Departments', value: 'all' }, ...DEPARTMENTS]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Semester"
                  value={formData.targetSemester}
                  onChange={(e) => setFormData(p => ({ ...p, targetSemester: e.target.value }))}
                  options={[{ label: 'All Semesters', value: 'all' }, ...SEMESTERS.map((s: string) => ({ label: s, value: s }))]}
                />
                <Select 
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData(p => ({ ...p, category: e.target.value as 'General' | 'Urgent' | 'Success' }))}
                  options={[
                    { label: 'General', value: 'General' },
                    { label: 'Urgent', value: 'Urgent' },
                    { label: 'Success', value: 'Success' },
                  ]}
                />
              </div>

              <Input 
                  type="date"
                  label="Expiry Date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(p => ({ ...p, expiresAt: e.target.value }))}
              />

              <Input 
                label="Headline"
                placeholder="Brief summary sentence"
                required
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Content</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-50 text-sm font-medium transition-all"
                  placeholder="Details of the broadcast..."
                  value={formData.message}
                  onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200 rounded-2xl gap-3 font-black uppercase text-xs tracking-widest group"
                isLoading={isSubmitting}
              >
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Transmit Signal
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* History Panel */}
        <div className="lg:col-span-7">
          <GlassCard className="p-8 border-white min-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                 <Clock className="w-4 h-4 text-rose-500" />
                 Transmission Log
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{broadcasts.length} Active</span>
            </div>

            {isLoading ? (
               <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse" />)}
               </div>
            ) : broadcasts.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4">
                    <Megaphone className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase">Silence on Waves</h4>
                  <p className="text-xs text-gray-400 mt-2">No active transmissions detected.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {broadcasts.map((b) => (
                    <div key={b.id} className="group relative overflow-hidden p-6 rounded-3xl bg-white border border-gray-100 hover:border-rose-200 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/5">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100">
                                {b.targetRole}
                              </span>
                              {b.targetDepartment !== 'all' && (
                                <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 text-[9px] font-black uppercase tracking-widest border border-gray-100">
                                  {b.targetDepartment}
                                </span>
                              )}
                              <h4 className="font-black text-gray-900 text-sm tracking-tight ml-1">{b.title}</h4>
                           </div>
                           <button 
                             onClick={() => handleDelete(b.id, b.title)}
                             className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-normal mb-4">{b.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                             <div className="flex items-center gap-1">
                               <Clock className="w-3 h-3" />
                               {b.postedAt ? formatDistanceToNow(normalizeDate(b.postedAt), { addSuffix: true }) : 'Just now'}
                             </div>
                             {b.expiresAt && (
                               <div className="flex items-center gap-1 text-amber-500">
                                 <Calendar className="w-3 h-3" />
                                 Expires: {new Date(normalizeDate(b.expiresAt)).toLocaleDateString()}
                               </div>
                             )}
                          </div>
                          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
                            By {b.postedByName}
                          </div>
                        </div>
                    </div>
                  ))}
               </div>
            )}

            <div className="mt-8 p-6 rounded-3xl bg-amber-50 border border-amber-100 flex gap-4">
               <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
               <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase">Broadcasting Protocol</h4>
                  <p className="text-[10px] text-amber-700 leading-relaxed mt-1">
                    Signals transmitted via this terminal are pushed to the target roles immediately. Targeted department and semester filters allow for precision messaging.
                  </p>
               </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
