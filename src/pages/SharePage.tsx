import { useState } from 'react';
import { Share2, Copy, Trash2, Globe, Clock, Shield } from 'lucide-react';
import { useDashboards } from '../hooks/useDashboard';
import { api } from '../services/api';

export function SharePage() {
  const { dashboards } = useDashboards();
  const [selectedId, setSelectedId] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');
  const [password, setPassword] = useState('');
  const [expiryHours, setExpiryHours] = useState('72');
  const [maxViews, setMaxViews] = useState('0');
  const [allowDownload, setAllowDownload] = useState(false);
  const [watermark, setWatermark] = useState(true);
  const [shares, setShares] = useState<any[]>([]);
  const [createdLink, setCreatedLink] = useState('');

  const loadShares = async () => {
    try {
      const data = await api.shares.list();
      setShares(data);
    } catch {}
  };

  const createShare = async () => {
    if (!selectedId) return;
    try {
      const result = await api.shares.create({
        dashboard_id: selectedId,
        access_level: accessLevel,
        password: password || null,
        expires_in_hours: parseInt(expiryHours),
        max_views: parseInt(maxViews),
        allow_download: allowDownload,
        watermark,
      });
      const link = `${window.location.origin}/shared/${result.share_id}`;
      setCreatedLink(link);
      await loadShares();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteShare = async (id: string) => {
    await api.shares.delete(id);
    loadShares();
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">🔗 المشاركة الآمنة</h2>
        <p className="text-gray-500 text-sm mt-1">
          أنشئ روابط آمنة لمشاركة الداشبورد مع الأشخاص المخولين
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Create Share Form */}
        <div className="lg:col-span-3 card space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield size={16} className="text-blue-400" /> إنشاء رابط مشاركة
          </h3>

          <div>
            <label className="text-sm text-gray-400 block mb-1.5">اختر الداشبورد</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="input-field">
              <option value="">—</option>
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">صلاحية الوصول</label>
              <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} className="input-field">
                <option value="view">عرض فقط</option>
                <option value="edit">تعديل</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">صلاحية الرابط</label>
              <select value={expiryHours} onChange={(e) => setExpiryHours(e.target.value)} className="input-field">
                <option value="24">24 ساعة</option>
                <option value="72">3 أيام</option>
                <option value="168">7 أيام</option>
                <option value="720">30 يوم</option>
                <option value="0">غير محدود</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">كلمة مرور (اختياري)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="حماية إضافية" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">حد المشاهدات</label>
              <select value={maxViews} onChange={(e) => setMaxViews(e.target.value)} className="input-field">
                <option value="0">غير محدود</option>
                <option value="10">10 مشاهدات</option>
                <option value="50">50 مشاهدة</option>
                <option value="100">100 مشاهدة</option>
                <option value="500">500 مشاهدة</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} className="accent-blue-500" />
              Watermark
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} className="accent-blue-500" />
              السماح بالتحميل
            </label>
          </div>

          <button onClick={createShare} disabled={!selectedId} className="btn-primary w-full">
            <Share2 size={16} /> إنشاء رابط آمن
          </button>

          {createdLink && (
            <div className="flex items-center gap-2 bg-surface-900 rounded-lg p-3 border border-gray-800">
              <Globe size={14} className="text-kpi-green" />
              <span className="text-sm text-blue-400 flex-1 truncate" dir="ltr">{createdLink}</span>
              <button onClick={() => copyLink(createdLink)} className="text-gray-400 hover:text-white">
                <Copy size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield size={16} className="text-blue-400" /> ميزات الأمان
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { icon: '🔐', text: 'رابط مشفر وآمن' },
                { icon: '⏰', text: 'صلاحية محددة زمنياً' },
                { icon: '🔑', text: 'حماية بكلمة مرور' },
                { icon: '👁️', text: 'حد المشاهدات' },
                { icon: '💧', text: 'علامة مائية (Watermark)' },
                { icon: '🚫', text: 'التحكم في تنزيل البيانات' },
                { icon: '📋', text: 'سجل المشاهدات (Audit Log)' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-300">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-gray-400" />
              <h3 className="font-semibold text-sm">الروابط النشطة</h3>
            </div>
            {shares.length === 0 ? (
              <p className="text-sm text-gray-500">لا توجد روابط مشاركة نشطة</p>
            ) : (
              <div className="space-y-2">
                {shares.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-surface-900 rounded-lg p-2.5 border border-gray-800 text-sm">
                    <div>
                      <p className="text-gray-300">{s.id.substring(0, 12)}...</p>
                      <p className="text-xs text-gray-500">
                        {s.current_views}/{s.max_views || '∞'} مشاهدة
                        {s.expires_at && ` · ${new Date(s.expires_at).toLocaleDateString('ar-SA')}`}
                      </p>
                    </div>
                    <button onClick={() => deleteShare(s.id)} className="text-gray-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
