import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  FileText, 
  Settings, 
  LogOut, 
  CircleDot,
  BadgeDollarSign
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  { name: 'Overview', href: '/account', icon: LayoutDashboard },
  { name: 'Fee Payments', href: '/account/fees', icon: Wallet },
  { name: 'Reports', href: '/account/reports', icon: FileText },
  { name: 'Settings', href: '/account/settings', icon: Settings },
];

export default function AccountManagerSidebar() {
  const { user } = useAuthStore();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/40 backdrop-blur-xl border-r border-white/50 px-6 pb-4 shadow-2xl shadow-emerald-500/5">
      <div className="flex h-24 shrink-0 items-center gap-3">
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 ring-4 ring-white">
          <BadgeDollarSign className="w-7 h-7 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black text-gray-900 tracking-tighter italic uppercase">EduSync</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-100">
             <CircleDot className="w-1.5 h-1.5 text-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-emerald-600 tracking-widest uppercase">Accounts</span>
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
                    end={item.href === '/account'}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-2xl p-3 text-xs font-bold leading-6 transition-all duration-300 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200'
                          : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
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

          <li className="mt-auto -mx-2 bg-gradient-to-br from-emerald-50/50 to-transparent p-4 rounded-3xl border border-emerald-100/50 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-emerald-100 ring-2 ring-emerald-50">
                <img 
                  src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                  alt="Account Manager" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-tight leading-none px-1">
                  {user?.displayName || 'Account Manager'}
                </p>
                <p className="text-[9px] text-gray-400 font-bold truncate mt-1 lowercase bg-white/50 px-1 rounded-md">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="flex w-full items-center gap-x-3 rounded-xl p-2.5 text-xs font-bold leading-6 text-emerald-600 hover:bg-emerald-100/50 transition-colors group"
            >
              <LogOut className="h-4 w-4 shrink-0 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
              <span className="uppercase tracking-widest text-[9px]">Terminate Session</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
