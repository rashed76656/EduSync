import { useState } from 'react';
import { Megaphone, Pin, Plus, Trash2, Edit3, Users, AlertCircle } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useNotices } from '../../hooks/useNotices';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import type { NoticeCategory } from '../../types';

export default function Notices() {
  const { user } = useAuthStore();
  const { notices, isLoading, addNotice, deleteNotice } = useNotices();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<NoticeCategory | 'All'>('All');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('General');
  const [targetDept, setTargetDept] = useState('All');
  const [targetSem, setTargetSem] = useState('All');
  const [isPinned, setIsPinned] = useState(false);

  const filteredNotices = notices.filter(n => 
    filterCategory === 'All' || n.category === filterCategory
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    await addNotice({
      title,
      content,
      category,
      targetDepartment: targetDept as any,
      targetSemester: targetSem as any,
      isPinned,
      createdBy: user?.uid || 'unknown'
    });

    setIsModalOpen(false);
    setTitle('');
    setContent('');
    setCategory('General');
    setTargetDept('All');
    setTargetSem('All');
    setIsPinned(false);
  };

  const getCategoryColor = (cat: NoticeCategory) => {
    switch (cat) {
      case 'Urgent': return 'danger';
      case 'Exam': return 'warning';
      case 'Holiday': return 'success';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display tracking-tight">Digital Notice Board</h1>
          <p className="mt-1 text-sm text-gray-500">Broadcast updates and institutional academic announcements.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xl shadow-primary/20 p-6 rounded-2xl group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
          <span className="font-bold uppercase text-[10px] tracking-widest">New Announcement</span>
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pb-4 pt-2">
        {(['All', 'General', 'Exam', 'Holiday', 'Urgent'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-5 py-2 rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300 ${
              filterCategory === cat
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                : 'bg-white/60 text-gray-500 hover:bg-white border border-white/50 backdrop-blur-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 rounded-3xl bg-white/40 animate-pulse border border-white/60 shadow-sm" />
          ))
        ) : filteredNotices.length === 0 ? (
          <div className="col-span-full py-16">
            <EmptyState 
                title={filterCategory === 'All' ? "Pin the First Notice" : `No ${filterCategory} Notices`}
                description={filterCategory === 'All' 
                    ? "Your digital bulletin board is empty. Start communicating with students and staff today."
                    : "No announcements found in this category. Try switching filters or create a new post."
                }
                icon={Megaphone}
                actionLabel={filterCategory === 'All' ? "Post Now" : "View All"}
                onAction={() => filterCategory === 'All' ? setIsModalOpen(true) : setFilterCategory('All')}
            />
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <GlassCard 
              key={notice.id} 
              className={`group relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 rounded-3xl ${
                notice.isPinned ? 'border-primary/40 ring-2 ring-primary/5 bg-white/70 shadow-lg shadow-primary/5' : 'bg-white/40'
              }`}
            >
              {/* Pinned Indicator Overlay */}
              {notice.isPinned && (
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-primary rotate-45 flex items-end justify-center pb-1">
                   <Pin className="w-3 h-3 text-white -rotate-45" />
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                   <div className={`p-2 rounded-xl bg-${getCategoryColor(notice.category)}/10 border border-${getCategoryColor(notice.category)}/20`}>
                        <AlertCircle className={`w-4 h-4 text-${getCategoryColor(notice.category)}`} />
                   </div>
                   <Badge variant={getCategoryColor(notice.category)} className="uppercase text-[9px] font-bold tracking-widest">{notice.category}</Badge>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors line-clamp-2 font-display leading-tight tracking-tight">
                  {notice.title}
                </h3>

                <p className="text-sm text-gray-500 mb-8 line-clamp-4 leading-relaxed whitespace-pre-wrap flex-1 italic">
                  "{notice.content}"
                </p>

                <div className="mt-auto space-y-4 pt-5 border-t border-gray-100">
                  {/* Targeting Info */}
                  <div className="px-3 py-2 bg-gray-50/50 rounded-xl border border-gray-100/50 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>Visibility Scope</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-700 uppercase tracking-tighter">
                        {notice.targetDepartment} Dept • {notice.targetSemester} Semester
                      </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                            {notice.createdBy === user?.uid ? 'M' : 'A'}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {notice.createdBy === user?.uid ? 'My Post' : 'Directorate'}
                        </span>
                     </div>
                     <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                        <button 
                          onClick={() => {
                            if(window.confirm('Delete this announcement forever?')) deleteNotice(notice.id);
                          }}
                          className="p-2 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-xl transition-all"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                          title="Edit Notice"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Post Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Institutional Broadcasting"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-1">
          <Input 
            label="Formal Title" 
            placeholder="e.g. Eid-ul-Fitr Vacation Notice" 
            required 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Announcement Category" 
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                options={[
                    { label: 'General Announcement', value: 'General' },
                    { label: 'Examination Related', value: 'Exam' },
                    { label: 'Holiday / Break', value: 'Holiday' },
                    { label: 'Urgent Alert', value: 'Urgent' },
                ]}
              />
              <div className="flex items-end h-full">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white flex-1 ring-1 ring-transparent hover:ring-primary/20">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-primary rounded-lg border-gray-300 focus:ring-primary/20 transition-all cursor-pointer" 
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                      />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Prioritize / Pin</span>
                  </label>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Select 
                 label="Audience (Dept)" 
                 value={targetDept}
                 onChange={(e) => setTargetDept(e.target.value)}
                 options={[
                     { label: 'All Departments', value: 'All' },
                     { label: 'CST', value: 'CST' },
                     { label: 'EET', value: 'EET' },
                     { label: 'CET', value: 'CET' },
                 ]}
              />
              <Select 
                 label="Audience (Semester)" 
                 value={targetSem}
                 onChange={(e) => setTargetSem(e.target.value)}
                 options={[
                     { label: 'All Semesters', value: 'All' },
                     { label: '1st Semester', value: '1st' },
                     { label: '2nd Semester', value: '2nd' },
                     { label: '3rd Semester', value: '3rd' },
                 ]}
              />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Draft Content</label>
             <textarea 
               className="w-full h-44 px-4 py-4 rounded-2xl border border-gray-100 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-[13px] text-gray-800 placeholder:text-gray-300 shadow-inner font-medium"
               placeholder="Frame your message precisely..."
               required
               value={content}
               onChange={(e) => setContent(e.target.value)}
             />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest" onClick={() => setIsModalOpen(false)}>Discard</Button>
            <Button type="submit" className="flex-1 h-12 rounded-2xl shadow-xl shadow-primary/20 text-[10px] font-bold uppercase tracking-widest">Send Broadcast</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
