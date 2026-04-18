import { useState, useEffect } from 'react';
import { BookOpen, Search, ChevronDown } from 'lucide-react';
import { useSubjects } from '../../hooks/useSubjects';
import { GlassCard } from '../ui/GlassCard';
import type { Subject } from '../../types';
import { cn } from '../../utils/cn';

interface SubjectSelectorProps {
  department: string;
  semester: string;
  value: string;
  onChange: (subjectCode: string, subjectName: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function SubjectSelector({ 
  department, 
  semester, 
  value, 
  onChange, 
  disabled,
  className,
  label = "Select Subject"
}: SubjectSelectorProps) {
  const { fetchSubjects, isLoading } = useSubjects();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (department && semester) {
      const loadSubjects = async () => {
        const data = await fetchSubjects({ department, semester });
        setSubjects(data);
      };
      loadSubjects();
    } else {
      setSubjects([]);
    }
  }, [department, semester, fetchSubjects]);

  const filteredSubjects = subjects.filter(s => 
    (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.code || '').includes(searchQuery)
  );

  const selectedSubject = subjects.find(s => s.code === value);

  return (
    <div className={cn("space-y-1.5 relative", className)}>
      {label && (
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        disabled={disabled || !department || !semester}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 bg-white/50 border rounded-xl text-sm font-medium transition-all text-left",
          disabled || !department || !semester ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-100" : "hover:border-primary/50 border-white/50 shadow-sm",
          isOpen ? "ring-2 ring-primary/20 border-primary/50" : "border-gray-100"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <BookOpen className="w-4 h-4 text-primary shrink-0" />
          <span className={cn("truncate font-bold", !selectedSubject ? "text-gray-300" : "text-gray-700 font-mono")}>
            {selectedSubject ? `${selectedSubject.code} — ${selectedSubject.name || 'Unknown Name'}` : "Search or select subject..."}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full lg:w-[320px] lg:right-0 mt-2 animate-in fade-in zoom-in-95 duration-200">
          <GlassCard className="overflow-hidden border-primary/20 shadow-2xl shadow-primary/10 max-h-[300px] flex flex-col bg-white">
            <div className="p-2 border-b border-gray-100 bg-white/60">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-tight"
                  placeholder="Filter by code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto py-2">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <div className="h-8 bg-gray-100 animate-pulse rounded-lg" />
                  <div className="h-8 bg-gray-100 animate-pulse rounded-lg" />
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No subjects found</p>
                </div>
              ) : (
                filteredSubjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onChange(s.code, s.name);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left hover:bg-primary/5 transition-colors flex flex-col gap-0.5",
                      value === s.code && "bg-primary/5 ring-1 ring-inset ring-primary/10"
                    )}
                  >
                    <span className="text-[10px] font-bold text-primary font-mono leading-none">{s.code || 'N/A'}</span>
                    <span className="text-xs font-bold text-gray-700 leading-tight">{s.name || 'Unknown Subject'}</span>
                  </button>
                ))
              )}
            </div>
            
            <div className="p-2 bg-gray-50/50 border-t border-gray-100 text-center">
                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.2em]">BTEB Regulation 2022</span>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Backdrop for closing */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
