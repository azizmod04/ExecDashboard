import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';

interface Props {
  onLogin: (email: string, password: string) => Promise<any>;
  onRegister: (email: string, password: string) => Promise<any>;
}

export function LoginPage({ onLogin, onRegister }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await onRegister(email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🧠</span>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ExecDashboard
          </h1>
          <p className="text-gray-500 mt-2">Executive Decision Intelligence Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-xl font-semibold text-center mb-2">
            {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isRegister ? (
              <><UserPlus size={16} /> إنشاء حساب</>
            ) : (
              <><LogIn size={16} /> تسجيل الدخول</>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            {isRegister ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-blue-400 hover:text-blue-300"
            >
              {isRegister ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </button>
          </p>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          للمعاينة: سجل دخول بأي بريد إلكتروني (يعمل بدون قاعدة بيانات)
        </p>
      </div>
    </div>
  );
}
