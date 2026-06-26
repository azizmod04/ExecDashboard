import { useState } from 'react';
import { useDashboards, useAnalysis } from '../hooks/useDashboard';
import { DashboardFull, AnalysisResult } from '../types';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, MessageCircle, RefreshCw, Download } from 'lucide-react';

export function InsightsPage() {
  const { dashboards } = useDashboards();
  const { analyze, analyzing } = useAnalysis();
  const [selectedId, setSelectedId] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedId) return;
    const result = await analyze(selectedId);
    if (result) setAnalysis(result);
  };

  const handleAsk = async () => {
    if (!question.trim() || !selectedId || chatLoading) return;
    const q = question.trim();
    setQuestion('');
    setChatLoading(true);
    setChat((prev) => [...prev, { q, a: '...' }]);

    try {
      const res = await fetch('/api/insights/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ dashboard_id: selectedId, question: q, lang: 'ar' }),
      });
      const data = await res.json();
      setChat((prev) => prev.map((c, i) => (i === prev.length - 1 ? { ...c, a: data.answer } : c)));
    } catch {
      setChat((prev) => prev.map((c, i) => (i === prev.length - 1 ? { ...c, a: 'حدث خطأ في التحليل' } : c)));
    }
    setChatLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">🧠 تحليلات الذكاء الاصطناعي</h2>
        <p className="text-gray-500 text-sm mt-1">
          خمس طبقات من التحليل: التنظيف، اكتشاف الأخطاء، الشذوذ، ربط KPIs، توصيات تنفيذية
        </p>
      </div>

      {/* Selector + Analyze */}
      <div className="card flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="input-field sm:flex-1"
        >
          <option value="">اختر داشبورد للتحليل</option>
          {dashboards.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button onClick={handleAnalyze} disabled={!selectedId || analyzing} className="btn-primary flex items-center gap-2">
          {analyzing ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التحليل...</>
          ) : (
            <><Brain size={16} /> تحليل شامل</>
          )}
        </button>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-blue-400" />
              <h3 className="font-semibold">📋 الملخص التنفيذي</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{analysis.executive_summary}</p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" /> 📈 الاتجاهات
              </h3>
              <ul className="space-y-2">
                {analysis.key_trends?.map((t, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target size={16} className="text-kpi-yellow" /> 🎯 تحليل KPIs
              </h3>
              <div className="space-y-3">
                {analysis.kpi_analysis?.map((k, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span>{k.status === 'green' ? '🟢' : k.status === 'yellow' ? '🟡' : '🔴'}</span>
                    <div>
                      <p className="text-gray-200">{k.name}</p>
                      <p className="text-gray-500 text-xs">{k.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-kpi-red" /> ⚠️ المخاطر
              </h3>
              <div className="space-y-2">
                {analysis.risks?.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      r.severity === 'high' ? 'bg-kpi-red' : r.severity === 'medium' ? 'bg-kpi-yellow' : 'bg-gray-500'
                    }`} />
                    <div>
                      <p className="text-gray-200 font-medium">{r.title}</p>
                      <p className="text-gray-500 text-xs">{r.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-kpi-green" /> 💡 الفرص
              </h3>
              <div className="space-y-3">
                {analysis.opportunities?.map((o, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-gray-200 font-medium">{o.title}</p>
                    <p className="text-gray-500 text-xs">{o.action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3">⚠️ الحالات الشاذة</h3>
              <ul className="space-y-2">
                {analysis.anomalies?.map((a, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3">💡 التوصيات</h3>
              <div className="space-y-2">
                {analysis.recommendations?.map((r, i) => (
                  <div key={i} className="bg-surface-900 rounded-lg p-3 border border-gray-800">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      r.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      r.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {r.priority === 'high' ? 'عالي' : r.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </span>
                    <p className="text-sm text-gray-200 mt-1">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Chat */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageCircle size={16} className="text-blue-400" /> 💬 اسأل عن البيانات
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
              {chat.map((c, i) => (
                <div key={i} className="space-y-2">
                  <div className="text-sm bg-blue-600/20 text-blue-300 p-3 rounded-lg mr-8">
                    <span className="text-xs text-blue-500 block mb-1">سؤال:</span>
                    {c.q}
                  </div>
                  <div className="text-sm bg-surface-900 text-gray-300 p-3 rounded-lg ml-8">
                    <span className="text-xs text-gray-500 block mb-1">إجابة:</span>
                    {c.a}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="مثال: لماذا انخفضت المبيعات في الربع الثاني؟"
                className="input-field flex-1"
              />
              <button onClick={handleAsk} disabled={!question.trim() || !selectedId || chatLoading} className="btn-primary">
                {chatLoading ? '...' : 'إرسال'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!analysis && !analyzing && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">🧠</span>
          <h3 className="text-lg font-semibold mb-2">التحليل الذكي بانتظارك</h3>
          <p className="text-gray-500">اختر داشبورد واضغط "تحليل شامل" للحصول على رؤى تنفيذية</p>
        </div>
      )}
    </div>
  );
}
