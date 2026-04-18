import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon, Trash2, CalendarDays, Rocket } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useEvents } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/authStore';
import type { EventCategory } from '../../types';

export default function Events() {
  const { user } = useAuthStore();
  const { events, addEvent, deleteEvent } = useEvents();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Academic');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Calendar Logic
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days = [];

    // Padding for previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: 'prev', date: new Date(year, month - 1, prevMonthDays - i) });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: 'current', date: new Date(year, month, i) });
    }

    // Padding for next month
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
        days.push({ day: i, month: 'next', date: new Date(year, month + 1, i) });
    }

    return days;
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate);
  }, [selectedDate, events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedDate) return;

    await addEvent({
      title,
      category,
      date: selectedDate.toISOString().split('T')[0],
      time,
      location,
      description,
      createdBy: user?.uid || 'unknown'
    });

    setIsModalOpen(false);
    setTitle('');
    setCategory('Academic');
    setTime('');
    setLocation('');
    setDescription('');
  };

  const getCategoryVariant = (cat: EventCategory) => {
    switch (cat) {
      case 'Exam': return 'danger';
      case 'Holiday': return 'success';
      case 'Cultural': return 'secondary';
      case 'Academic': return 'info';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display tracking-tight">Academic Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">Coordinate exams, cultural events, and institute milestones.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xl shadow-primary/20 p-6 rounded-2xl group transition-all">
          <CalendarDays className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
          <span className="font-bold uppercase text-[10px] tracking-widest">Schedule Event</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Column */}
        <div className="lg:col-span-2">
            <GlassCard className="p-6 border-white/50 bg-white/40 shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl">
                             <CalendarIcon className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 font-display tracking-tight">
                            {monthName} <span className="text-primary font-normal">{year}</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-gray-400 hover:text-primary transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-primary transition-colors">
                            Today
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-gray-400 hover:text-primary transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-100 border-2 border-gray-100 rounded-3xl overflow-hidden shadow-inner">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="bg-gray-50 py-3.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                    {monthDays.map((cell, idx) => {
                        const dateEvents = getEventsForDate(cell.date);
                        const isSelected = selectedDate?.toDateString() === cell.date.toDateString();
                        const isToday = new Date().toDateString() === cell.date.toDateString();

                        return (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedDate(cell.date)}
                                className={`min-h-[110px] p-2 bg-white flex flex-col gap-1 transition-all cursor-pointer relative ${
                                    cell.month !== 'current' ? 'text-gray-200 bg-gray-50/30' : 'text-gray-900'
                                } ${isSelected ? 'ring-2 ring-inset ring-primary z-10 bg-primary/5' : 'hover:bg-primary/5'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-xl transition-all ${
                                        isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : isSelected ? 'bg-primary/20 text-primary' : ''
                                    }`}>
                                        {cell.day}
                                    </span>
                                    {dateEvents.length > 0 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>
                                
                                <div className="flex flex-col gap-1 mt-auto">
                                    {dateEvents.slice(0, 2).map((e) => (
                                        <div 
                                          key={e.id} 
                                          className={`text-[9px] font-bold px-1.5 py-1 rounded-lg truncate border shadow-sm ${
                                              e.category === 'Exam' ? 'bg-danger/10 text-danger border-danger/10' :
                                              e.category === 'Holiday' ? 'bg-success/10 text-success border-success/10' :
                                              e.category === 'Cultural' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                              'bg-primary/5 text-primary border-primary/10'
                                          }`}
                                        >
                                            {e.title}
                                        </div>
                                    ))}
                                    {dateEvents.length > 2 && (
                                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest pl-1 mt-0.5">
                                            + {dateEvents.length - 2} More
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>
        </div>

        {/* Dynamic Detail Side Pane */}
        <div className="space-y-6">
            <GlassCard className="p-6 border-white/50 bg-white/40 min-h-[400px] flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl tracking-tight leading-none">
                            {selectedDate?.toLocaleDateString('default', { day: 'numeric', month: 'long' })}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-1 rounded-lg border border-gray-100 inline-block">
                           Daily Schedule
                        </p>
                    </div>
                </div>

                <div className="flex-1 space-y-4 pr-1">
                    {selectedDateEvents.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10">
                             <EmptyState 
                                title="Free of Events"
                                description="No academic activities or exams are scheduled for this specific date."
                                icon={Rocket}
                             />
                        </div>
                    ) : (
                        selectedDateEvents.map(event => (
                            <div key={event.id} className="group relative p-5 bg-white/80 hover:bg-white rounded-3xl border border-white transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5">
                                <div className="flex items-center justify-between mb-4">
                                    <Badge variant={getCategoryVariant(event.category)} className="uppercase text-[9px] font-bold tracking-widest h-6 px-3">{event.category}</Badge>
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(window.confirm('Cancel this event permanently?')) deleteEvent(event.id); 
                                      }}
                                      className="p-2 text-gray-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-all hover:bg-danger/5 rounded-xl"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-4 leading-tight font-display text-lg group-hover:text-primary transition-colors">{event.title}</h4>
                                <div className="space-y-2.5">
                                    {event.time && (
                                        <div className="flex items-center gap-2.5 text-xs font-bold text-gray-500 bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                                            <div className="p-1 bg-white rounded-lg shadow-sm"><Clock className="w-3 h-3 text-primary" /></div>
                                            {event.time}
                                        </div>
                                    )}
                                    {event.location && (
                                        <div className="flex items-center gap-2.5 text-xs font-bold text-gray-500 bg-gray-50/50 p-2 rounded-xl border border-gray-100/50">
                                            <div className="p-1 bg-white rounded-lg shadow-sm"><MapPin className="w-3 h-3 text-secondary" /></div>
                                            {event.location}
                                        </div>
                                    )}
                                </div>
                                {event.description && (
                                    <p className="mt-4 text-xs text-gray-400 italic leading-relaxed border-t border-gray-50 pt-3">
                                        "{event.description}"
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>

            {/* Calendar Statistics */}
            <div className="grid grid-cols-2 gap-4">
                 <GlassCard className="p-5 flex flex-col gap-1 border-white/50 bg-white/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Academic</span>
                    <div className="text-2xl font-bold font-display text-primary">
                        {events.filter(e => e.category === 'Academic').length}
                    </div>
                 </GlassCard>
                 <GlassCard className="p-5 flex flex-col gap-1 border-white/50 bg-white/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exams</span>
                    <div className="text-2xl font-bold font-display text-danger">
                        {events.filter(e => e.category === 'Exam').length}
                    </div>
                 </GlassCard>
            </div>
        </div>
      </div>

      {/* Scheduler Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Broadcast Event">
         <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <Input 
                label="Descriptive Title" 
                placeholder="e.g. Annual Sports Day 2024" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Select 
                    label="Event Category" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    options={[
                        { label: 'Academic Routine', value: 'Academic' },
                        { label: 'Examination Board', value: 'Exam' },
                        { label: 'Official Holiday', value: 'Holiday' },
                        { label: 'Cultural / Fest', value: 'Cultural' },
                        { label: 'Personal Reminder', value: 'Personal' },
                    ]}
                />
                <Input 
                    type="time" 
                    label="Commencement Time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />
            </div>

            <Input 
                label="Physical / Digital Location" 
                placeholder="e.g. Auditorium or Google Meet" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Event Narrative</label>
                <textarea 
                  className="w-full h-28 px-4 py-4 rounded-2xl border border-gray-100 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-[13px] text-gray-800 font-medium shadow-inner"
                  placeholder="Elaborate on the activity or specific instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="flex gap-4 pt-2">
                <Button variant="secondary" className="flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest" onClick={() => setIsModalOpen(false)}>Discard</Button>
                <Button type="submit" className="flex-1 h-12 rounded-2xl shadow-xl shadow-primary/20 text-[10px] font-bold uppercase tracking-widest">Seal Calendar</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
