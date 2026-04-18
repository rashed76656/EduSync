import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import TopBar from './TopBar.tsx';
import BottomNav from './BottomNav.tsx';
import GlobalBroadcastBanner from '../shared/GlobalBroadcastBanner';
import { cn } from '../../utils/cn';

export default function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#F3E8FF]">
      {/* Background Decoratives */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-secondary/5 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <Sidebar 
        onClose={() => setIsSidebarOpen(false)} 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 bg-white",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )} 
      />
      
      <div className="flex flex-col flex-1 w-full overflow-hidden relative z-10 pb-[80px] lg:pb-0">
        <GlobalBroadcastBanner />
        <TopBar onOpenMenu={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
