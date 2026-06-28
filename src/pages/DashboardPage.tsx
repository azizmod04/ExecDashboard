import { useEffect, useState } from 'react';
import { useDashboards, useDashboard, useAnalysis } from '../hooks/useDashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DashboardFull, AnalysisResult } from '../types';
import { Brain, AlertTriangle, TrendingUp, Target, Lightbulb, MessageCircle, Download, Share2, RefreshCw } from 'lucide-react';

interface Props {
  dashboardId: string | null;
  onSelectDashboard: (id: string) => void;
  onNavigate: (view: string, id?: string) => void;
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function DashboardPage({ dashboardId, onSelectDashboard, onNavigate }: Props) {
  const { dashboards, loading: listLoading, refresh } = useDashboards();
  const { dashboard, loading: dbLoading, refresh: refreshDb } = useDashboard(dashboardId);
  const { analyze, analyzing } = useAnalysis();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (dashboardId) {
      setAnalysis(null);
      refreshDb();
    }
  }, [dashboardId]);

  const handleAnalyze = async () => {
    if (!dashboardId) return;
    const result = await analyze(dashboardId);
    if (result) setAnalysis(result);
  };

  if (listLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboardId || dashboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <span className="text-6xl mb-4">📊</span>
        <h2 className="text-xl font-bold mb-2">مرحباً بك في لوحة القيادة التنفيذية</h2>
        <p className="text-gray-500 mb-6">ارفع ملف Excel أو PowerBI أو Tableau لبدء التحليل</p>
        <button onClick={() => onNavigate('upload')} className="btn-primary">
          رفع ملف جديد
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">اختر داشبورد من القائمة</p>
        <DashboardSelector
          dashboards={dashboards}
          selected={dashboardId}
          onSelect={onSelectDashboard}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold">{dashboard.name}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span>{dashboard.source_type === 'excel' ? '📗 Excel' : dashboard.source_type === 'powerbi' ? '📊 PowerBI' : '📈 Tableau'}</span>
            <span>·</span>
            <span>{dashboard.total_rows?.toLocaleString()} صف</span>
            <span>·</span>
            <span>{dashboard.columns?.length || 0} عمود</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshDb} className="btn-outline text-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> تحديث
          </button>
          <button onClick={() => onNavigate('share')} className="btn-outline text-sm flex items-center gap-1.5">
            <Share2 size={14} /> مشاركة
          </button>
        </div>
      </div>

      {/* Dashboard Selector */}
      <DashboardSelector
        dashboards={dashboards}
        selected={dashboardId}
        onSelect={onSelectDashboard}
      />

      {/* KPI Strip */}
      {dashboard.kpis && dashboard.kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {dashboard.kpis.map((kpi: any, i: number) => (
            <KpiCard key={kpi.id || i} kpi={kpi} />
          ))}
        </div>
      )}

      {/* Executive Summary + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main charts area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bar Chart */}
          {dashboard.data && dashboard.data.length > 0 && dashboard.columns && (
            <ChartSection data={dashboard.data} columns={dashboard.columns} />
          )}
        </div>

        {/* AI Side Panel */}
        <div className="space-y-4">
          {/* Analysis Button */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-purple-400" />
              <h3 className="font-semibold">تحليلات AI</h3>
            </div>
            {analysis ? (
              <button onClick={handleAnalyze} className="btn-outline w-full text-sm" disabled={analyzing}>
                <RefreshCw size={14} /> إعادة التحليل
              </button>
            ) : (
              <button onClick={handleAnalyze} className="btn-primary w-full text-sm" disabled={analyzing}>
                {analyzing ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التحليل...</>
                ) : (
                  <><Brain size={16} /> تحليل بالذكاء الاصطناعي</>
                )}
              </button>
            )}
          </div>

          {/* Analysis Results */}
          {analysis && (
            <>
              <ExecutiveSummaryCard analysis={analysis} />
              <RisksCard risks={analysis.risks} />
              <OpportunitiesCard opportunities={analysis.opportunities} />
            </>
          )}

          {/* AI Chat */}
          {dashboardId && (
            <AiChatCard dashboardId={dashboardId} />
          )}
        </div>
      </div>

      {/* Full Analysis Section */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendsCard trends={analysis.key_trends} />
          <KpiAnalysisCard kpis={analysis.kpi_analysis} />
          <AnomaliesCard anomalies={analysis.anomalies} />
          <RecommendationsCard recommendations={analysis.recommendations} />
        </div>
      )}
    </div>
  );
}

// ====== Sub-components ======

function DashboardSelector({ dashboards, selected, onSelect }: { dashboards: any[]; selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dashboards.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelect(d.id)}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap border transition-all ${
            d.id === selected
              ? 'border-blue-600 bg-blue-600/20 text-blue-400'
              : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
          }`}
        >
          {d.name}
        </button>
      ))}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: any }) {
  const pct = kpi.target_value > 0 ? (kpi.current_value / kpi.target_value) * 100 : 0;
  const status = kpi.status || (pct >= 90 ? 'green' : pct >= 70 ? 'yellow' : 'red');
  const colors = {
    green: { bg: 'bg-kpi-green/10', border: 'border-kpi-green/30', text: 'text-kpi-green', dot: '🟢' },
    yellow: { bg: 'bg-kpi-yellow/10', border: 'border-kpi-yellow/30', text: 'text-kpi-yellow', dot: '🟡' },
    red: { bg: 'bg-kpi-red/10', border: 'border-kpi-red/30', text: 'text-kpi-red', dot: '🔴' },
    pending: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', dot: '⚪' },
  };
  const c = colors[status as keyof typeof colors] || colors.pending;

  return (
    <div className={`card ${c.bg} ${c.border} cursor-pointer hover:scale-[1.02] transition-transform`}>
      <div className="flex items-start justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{kpi.name}</p>
        <span>{c.dot}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 ${c.text}`}>
        {kpi.current_value?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
      </p>
      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
        <span>الهدف: {kpi.target_value?.toLocaleString() || '—'}</span>
        <span className={kpi.trend === 'up' ? 'text-kpi-green' : kpi.trend === 'down' ? 'text-kpi-red' : ''}>
          {kpi.trend === 'up' ? '▲' : kpi.trend === 'down' ? '▼' : '◆'}
        </span>
      </div>
    </div>
  );
}

function ChartSection({ data, columns }: { data: any[]; columns: any[] }) {
  const numericCols = columns.filter((c) => c.type === 'numeric').slice(0, 3);
  const labelCol = columns.find((c) => c.type === 'string') || columns[0];
  const chartData = data.slice(0, 15);

  if (numericCols.length === 0) return null;

  // Aggregate if too many items
  const aggregated = chartData.map((row, i) => {
    const item: any = { name: row[labelCol.name]?.toString().substring(0, 15) || `#${i + 1}` };
    numericCols.forEach((col) => {
      item[col.name] = parseFloat(row[col.name]) || 0;
    });
    return item;
  });

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">📈 تحليل البيانات</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aggregated}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            {numericCols.map((col, i) => (
              <Bar key={col.name} dataKey={col.name} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ExecutiveSummaryCard({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-blue-400" />
        <h3 className="font-semibold text-sm">الملخص التنفيذي</h3>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{analysis.executive_summary}</p>
    </div>
  );
}

function RisksCard({ risks }: { risks: AnalysisResult['risks'] }) {
  if (!risks?.length) return null;
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-kpi-red" />
        <h3 className="font-semibold text-sm">⚠️ المخاطر</h3>
      </div>
      <div className="space-y-2">
        {risks.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
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
  );
}

function OpportunitiesCard({ opportunities }: { opportunities: AnalysisResult['opportunities'] }) {
  if (!opportunities?.length) return null;
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={16} className="text-kpi-green" />
        <h3 className="font-semibold text-sm">💡 الفرص</h3>
      </div>
      <div className="space-y-2">
        {opportunities.map((o, i) => (
          <div key={i} className="text-sm">
            <p className="text-gray-200 font-medium">{o.title}</p>
            <p className="text-gray-500 text-xs">{o.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendsCard({ trends }: { trends: string[] }) {
  if (!trends?.length) return null;
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-blue-400" />
        <h3 className="font-semibold">📈 الاتجاهات الرئيسية</h3>
      </div>
      <ul className="space-y-2">
        {trends.map((t, i) => (
          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KpiAnalysisCard({ kpis }: { kpis: AnalysisResult['kpi_analysis'] }) {
  if (!kpis?.length) return null;
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-kpi-yellow" />
        <h3 className="font-semibold">🎯 تحليل KPIs</h3>
      </div>
      <div className="space-y-3">
        {kpis.map((k, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span>{k.status === 'green' ? '🟢' : k.status === 'yellow' ? '🟡' : k.status === 'red' ? '🔴' : '⚪'}</span>
            <div className="flex-1">
              <p className="text-gray-200">{k.name}</p>
              <p className="text-gray-500 text-xs">{k.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomaliesCard({ anomalies }: { anomalies: string[] }) {
  if (!anomalies?.length) return null;
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-kpi-red" />
        <h3 className="font-semibold">⚠️ الحالات الشاذة</h3>
      </div>
      <ul className="space-y-2">
        {anomalies.map((a, i) => (
          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationsCard({ recommendations }: { recommendations: AnalysisResult['recommendations'] }) {
  if (!recommendations?.length) return null;
  return (
    <div className="card lg:col-span-2">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={16} className="text-kpi-green" />
        <h3 className="font-semibold">💡 التوصيات الاستراتيجية</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((r, i) => (
          <div key={i} className="bg-surface-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                r.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                r.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {r.priority === 'high' ? 'عالي' : r.priority === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
              <p className="font-medium text-sm">{r.title}</p>
            </div>
            <p className="text-xs text-gray-500">{r.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiChatCard({ dashboardId }: { dashboardId: string }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { analyze } = useAnalysis();

  const ask = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/insights/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ dashboard_id: dashboardId, question: q, lang: 'ar' }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'عذراً، حدث خطأ في التحليل. تحقق من إعدادات AI.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={16} className="text-blue-400" />
        <h3 className="font-semibold text-sm">💬 اسأل AI</h3>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">
            اسأل عن البيانات: "لماذا انخفضت المبيعات؟" أو "قارن الربع الثاني بالعام الماضي"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm p-2.5 rounded-lg ${
            m.role === 'user'
              ? 'bg-blue-600/20 text-blue-300 mr-4'
              : 'bg-surface-900 text-gray-300 ml-4'
          }`}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
            <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            جاري التحليل...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="اسأل عن بياناتك..."
          className="input-field text-sm flex-1"
        />
        <button onClick={ask} disabled={loading || !question.trim()} className="btn-primary text-sm px-4">
          إرسال
        </button>
      </div>
    </div>
  );
}
