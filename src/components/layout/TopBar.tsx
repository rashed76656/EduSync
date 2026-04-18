import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../../hooks/useStudents';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils/cn';
import NotificationDropdown from '../shared/NotificationDropdown';

interface TopBarProps {
  onOpenMenu: () => void;
}

export default function TopBar({ onOpenMenu }: TopBarProps) {
  const navigate = useNavigate();
  const { students, fetchStudents } = useStudents();
  const { unreadCount } = useNotifications();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStudents();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
    return () => clearInterval(timer);
  }, [fetchStudents]);

  // Handle Click Outside for Notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Command+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredStudents = searchQuery.length > 1 
    ? students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.roll.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 flex h-20 flex-shrink-0 items-center gap-x-4 border-b border-white/50 bg-white/40 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
       {/* Mobile Menu Button */}
      <button 
        type="button" 
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-white/50 rounded-full transition-colors"
        onClick={onOpenMenu}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <label htmlFor="search-field" className="sr-only">
            Search students
          </label>
          <div className="relative flex w-full items-center max-w-md group">
            <Search
              className={cn(
                "absolute left-4 h-5 w-5 transition-colors duration-200",
                isSearchFocused ? "text-primary" : "text-gray-400"
              )}
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              id="search-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="block h-11 w-full rounded-full border-0 bg-white/60 backdrop-blur-sm py-0 pl-11 pr-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300/50 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm transition-all hover:bg-white/80"
              placeholder="Search by student name or roll..."
              type="search"
            />
            <div className="absolute right-3 top-2.5 flex items-center gap-1">
              {searchQuery && (
                <button 
                   onClick={() => setSearchQuery('')}
                   className="p-1 hover:bg-gray-100 rounded-full"
                >
                   <ArrowRight className="w-4 h-4 text-gray-400 rotate-45" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 px-2 font-sans text-[10px] font-bold text-gray-400 bg-gray-50/50">
                ⌘K
              </kbd>
            </div>

            {/* Global Search Results Dropdown */}
            {isSearchFocused && searchQuery.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-300">
                {filteredStudents.length > 0 ? (
                  <div className="space-y-1">
                    <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Search Results
                    </p>
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onMouseDown={() => {
                          navigate(`/students/${student.id}`);
                          setSearchQuery('');
                        }}
                        className="flex items-center w-full p-3 rounded-xl hover:bg-primary/10 group transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/20">
                          <img src="/src/assets/profile.png" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Roll: {student.roll} • {student.department}
                          </p>
                        </div>
                        <ArrowRight className="ml-auto w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">
                      No matches found for <span className="text-gray-900 italic">"{searchQuery}"</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-sm font-bold text-gray-900 font-display uppercase tracking-tight">
              {format(currentTime, 'EEEE, MMM d')}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              {format(currentTime, 'h:mm a')}
            </span>
          </div>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Notification bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              type="button" 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={cn(
                "relative p-2 text-gray-400 transition-all rounded-full",
                isNotificationsOpen ? "text-primary bg-primary/10" : "hover:text-primary hover:bg-primary/5"
              )}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-danger border-2 border-white"></span>
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <NotificationDropdown onClose={() => setIsNotificationsOpen(false)} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
