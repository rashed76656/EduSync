import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import { cn } from '../../utils/cn';
import { Menu } from 'lucide-react';

export default function StudentAppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#F0F9FF] via-[#F8FAFC] to-[#E0F2FE]">
      {/* Background Decoratives */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
        <StudentSidebar />
      </div>
      
      <div className="flex flex-col flex-1 w-full overflow-hidden relative z-10">
        {/* Minimal top bar for student (no global search) */}
        <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-white/50 bg-white/40 backdrop-blur-xl px-4 shadow-sm sm:px-6 lg:px-8">
          <button 
            type="button" 
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-white/50 rounded-full transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />
          <div className="flex flex-1 items-center justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-full border border-sky-100">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">Student Portal</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
