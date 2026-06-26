import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { InsightsPage } from './pages/InsightsPage';
import { SharePage } from './pages/SharePage';

type View = 'dashboard' | 'upload' | 'insights' | 'share';

export default function App() {
  const { user, loading, login, register, logout } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }

  const navigate = (v: string, dashboardId?: string) => {
    if (v === 'dashboard' || v === 'upload' || v === 'insights' || v === 'share') {
      setView(v);
    }
    if (dashboardId) setActiveDashboardId(dashboardId);
  };

  return (
    <Layout user={user} onLogout={logout} view={view} onNavigate={navigate}>
      {view === 'dashboard' && (
        <DashboardPage
          dashboardId={activeDashboardId}
          onSelectDashboard={(id) => setActiveDashboardId(id)}
          onNavigate={navigate}
        />
      )}
      {view === 'upload' && (
        <UploadPage
          onDashboardCreated={(id) => navigate('dashboard', id)}
        />
      )}
      {view === 'insights' && (
        <InsightsPage />
      )}
      {view === 'share' && (
        <SharePage />
      )}
    </Layout>
  );
}
