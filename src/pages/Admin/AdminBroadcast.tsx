import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Send, Clock, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { logAdminAction } from '../../lib/adminLogs';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminBroadcast() {
  const { user } = useAuthStore();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    content: '',
    category: 'General'
  });

  const fetchBroadcasts = async () => {
    try {
      const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setBroadcasts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error('Failed to load transmission history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.title || !newBroadcast.content) return;

    setIsSubmitting(true);
    try {
      const bRef = await addDoc(collection(db, 'broadcasts'), {
        ...newBroadcast,
        adminId: user?.uid,
        createdAt: serverTimestamp()
      });

      await logAdminAction({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'POST_BROADCAST',
        targetId: bRef.id,
        targetName: newBroadcast.title,
        details: `Posted [${newBroadcast.category}] broadcast: ${newBroadcast.title}`
      });

      toast.success('Transmission active and broadcasting');
      setNewBroadcast({ title: '', content: '', category: 'General' });
      fetchBroadcasts();
    } catch (err) {
      toast.error('Signal transmission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteDoc(doc(db, 'broadcasts', id));
      await logAdminAction({
        adminUid: user?.uid || '',
        adminEmail: user?.email || '',
        action: 'DELETE_BROADCAST',
        targetId: id,
        targetName: title,
        details: `Deleted broadcast: ${title}`
      });
      toast.success('Frequency cleared');
      fetchBroadcasts();
    } catch (err) {
      toast.error('Failed to terminate signal');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-rose-600" />
            Global Transmission
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Post urgent institute-wide broadcasts to all faculty dashboards.</p>
        </div>
        
        <div className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-200">
           <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
           <span className="text-xs font-black uppercase tracking-widest">Signal: Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Post Panel */}
        <div className="lg:col-span-1">
          <GlassCard className="p-8 border-rose-100 shadow-2xl shadow-rose-500/5 sticky top-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-500" />
              New Broadcast
            </h3>

            <form onSubmit={handlePost} className="space-y-5">
              <Select 
                label="Signal Priority"
                value={newBroadcast.category}
                onChange={(e) => setNewBroadcast(p => ({ ...p, category: e.target.value }))}
                options={[
                  { label: 'General Announcement', value: 'General' },
                  { label: 'Urgent Alert', value: 'Urgent' },
                  { label: 'Success Story', value: 'Success' },
                ]}
              />

              <Input 
                label="Headline"
                placeholder="Brief summary sentence"
                required
                value={newBroadcast.title}
                onChange={(e) => setNewBroadcast(p => ({ ...p, title: e.target.value }))}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Content</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-50 text-sm font-medium transition-all"
                  placeholder="Details of the broadcast..."
                  value={newBroadcast.content}
                  onChange={(e) => setNewBroadcast(p => ({ ...p, content: e.target.value }))}
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
        <div className="lg:col-span-2">
          <GlassCard className="p-8 border-white min-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                 <Clock className="w-4 h-4 text-rose-500" />
                 Transmission Log
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{broadcasts.length} Sent</span>
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
                  <p className="text-xs text-gray-400 mt-2">No broadasts have been transmitted recently.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {broadcasts.map((b) => (
                    <div key={b.id} className="group relative overflow-hidden p-6 rounded-3xl bg-white border border-gray-100 hover:border-rose-200 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/5">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                b.category === 'Urgent' ? 'bg-rose-50 text-rose-600' : 
                                b.category === 'Success' ? 'bg-emerald-50 text-emerald-600' : 
                                'bg-indigo-50 text-indigo-600'
                              }`}>
                                {b.category}
                              </span>
                              <h4 className="font-black text-gray-900 text-sm tracking-tight">{b.title}</h4>
                           </div>
                           <button 
                             onClick={() => handleDelete(b.id, b.title)}
                             className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-normal mb-4">{b.content}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                           <Clock className="w-3 h-3" />
                           {b.createdAt ? formatDistanceToNow(b.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
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
                    Signals transmitted via this terminal are forced into the main marquee of all active faculty members. Use the "Urgent" priority only for institute emergencies or critical deadines.
                  </p>
               </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
