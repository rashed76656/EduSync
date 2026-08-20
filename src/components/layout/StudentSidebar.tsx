import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  GraduationCap, 
  Wallet, 
  User, 
  LogOut, 
  CircleDot,
  BookOpen
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  { name: 'My Dashboard', href: '/student', icon: LayoutDashboard },
  { name: 'My Attendance', href: '/student/attendance', icon: CheckSquare },
  { name: 'My Results', href: '/student/results', icon: GraduationCap },
  { name: 'Fees & Fines', href: '/student/fees', icon: Wallet },
  { name: 'My Profile', href: '/student/profile', icon: User },
];

export default function StudentSidebar() {
  const { user, displayName } = useAuthStore();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/40 backdrop-blur-xl border-r border-white/50 px-6 pb-4 shadow-2xl shadow-sky-500/5">
      <div className="flex h-24 shrink-0 items-center gap-3">
        <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200 ring-4 ring-white">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black text-gray-900 tracking-tighter italic uppercase">EduSync</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-50 rounded-lg border border-sky-100">
             <CircleDot className="w-1.5 h-1.5 text-sky-500 animate-pulse" />
             <span className="text-[9px] font-black text-sky-600 tracking-widest uppercase">Student Portal</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/student'}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-2xl p-3 text-xs font-bold leading-6 transition-all duration-300 ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-xl shadow-sky-200'
                          : 'text-gray-500 hover:text-sky-600 hover:bg-sky-50'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="uppercase tracking-[0.2em]">{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>

          <li className="mt-auto -mx-2 bg-gradient-to-br from-sky-50/50 to-transparent p-4 rounded-3xl border border-sky-100/50 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-sky-100 ring-2 ring-sky-50">
                <div className="w-full h-full bg-sky-100 flex items-center justify-center text-sky-600 font-black text-sm">
                  {(displayName || user?.displayName || 'S')[0].toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-tight leading-none px-1">
                  {displayName || user?.displayName || 'Student'}
                </p>
                <p className="text-[9px] text-gray-400 font-bold truncate mt-1 lowercase bg-white/50 px-1 rounded-md">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="flex w-full items-center gap-x-3 rounded-xl p-2.5 text-xs font-bold leading-6 text-sky-600 hover:bg-sky-100/50 transition-colors group"
            >
              <LogOut className="h-4 w-4 shrink-0 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
              <span className="uppercase tracking-widest text-[9px]">Sign Out</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
