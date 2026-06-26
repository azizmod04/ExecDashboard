import { useState } from 'react';
import {
  LayoutDashboard, Upload, Brain, Share2, LogOut, Menu, X,
} from 'lucide-react';
import { User } from '../../types';

const NAV_ITEMS: { view: string; label: string; labelEn: string; icon: any }[] = [
  { view: 'dashboard', label: 'لوحة البيانات', labelEn: 'Dashboard', icon: LayoutDashboard },
  { view: 'upload', label: 'رفع ملف', labelEn: 'Upload', icon: Upload },
  { view: 'insights', label: 'تحليلات AI', labelEn: 'AI Insights', icon: Brain },
  { view: 'share', label: 'المشاركة', labelEn: 'Share', icon: Share2 },
];

interface LayoutProps {
  user: User;
  onLogout: () => void;
  view: string;
  onNavigate: (view: any) => void;
  children: React.ReactNode;
}

export function Layout({ user, onLogout, view, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 z-50 w-64 bg-surface-950 border-l border-gray-800
        transform transition-transform duration-200 flex flex-col
        ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ExecDashboard
              </h1>
              <p className="text-xs text-gray-500">Executive Intelligence</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => { onNavigate(item.view); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-surface-800'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-sm font-bold text-blue-400">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-gray-500">{user.role === 'admin' ? 'مدير' : 'مستخدم'}</p>
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors" title="تسجيل الخروج">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 bg-surface-900/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
              <Menu size={20} />
            </button>
            <h2 className="font-bold text-lg">
              {NAV_ITEMS.find((n) => n.view === view)?.label || 'ExecDashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">
              {user.email}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
