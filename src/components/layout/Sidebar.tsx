import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  GraduationCap, 
  Wallet, 
  FileBox, 
  BellRing, 
  CalendarDays,
  Settings,
  LogOut,
  X,
  BookOpen
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { Logo } from '../ui/Logo';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Attendance', href: '/attendance', icon: CheckSquare },
  { name: 'Results', href: '/results', icon: GraduationCap },
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
  { name: 'Fees & Fines', href: '/fees', icon: Wallet },
  { name: 'Reports', href: '/reports', icon: FileBox },
  { name: 'Notices', href: '/notices', icon: BellRing },
  { name: 'Events', href: '/events', icon: CalendarDays },
];

interface SidebarProps {
  onClose?: () => void;
  className?: string;
}

export default function Sidebar({ onClose, className }: SidebarProps) {
  const { user, branding } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className={cn("lg:flex lg:flex-shrink-0 h-full", className)}>
      <div className="glass-panel w-[260px] flex flex-col h-full z-20">
        {/* Header / Logo */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-white/50 bg-white/30 backdrop-blur-md">
          {branding?.logoUrl ? (
             <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <Logo className="w-8 h-8" />
          )}
          <span className="font-display font-bold text-xl text-gray-900 tracking-tight truncate">
            {branding?.shortName || branding?.name || 'EduSync'}
          </span>
          {onClose && (
            <button onClick={onClose} className="lg:hidden ml-auto p-2 text-gray-500 hover:text-gray-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Profile Mini */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
              <img 
                src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher"} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.displayName || 'Teacher'}
              </p>
              <p className="text-xs text-secondary truncate">
                Faculty Member
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary hover:bg-primary/15'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/20 space-y-1">
          <NavLink
             to="/settings"
             className={({ isActive }) =>
               cn(
                 'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all',
                 isActive
                   ? 'bg-primary/10 text-primary'
                   : 'text-gray-600 hover:bg-gray-100'
               )
             }
          >
             <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
             Settings
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-danger hover:bg-danger/10 transition-all"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
