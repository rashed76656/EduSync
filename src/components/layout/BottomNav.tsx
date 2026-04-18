import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const mobileNav = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Attendance', href: '/attendance', icon: CheckSquare },
  { name: 'Account', href: '/settings', icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-6 pt-2">
      <div className="mx-auto max-w-md">
        <div className="glass-panel flex items-center justify-around py-2.5 px-2 shadow-2xl shadow-primary/20 ring-1 ring-white/50 bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/50">
          {mobileNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 p-2 transition-all duration-300 rounded-2xl min-w-[64px]',
                  isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'p-2 rounded-xl transition-all duration-300 relative',
                    isActive ? 'bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : ''
                  )}>
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white animate-pulse" />
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-widest',
                    isActive ? 'opacity-100' : 'opacity-0 scale-75'
                  )}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
