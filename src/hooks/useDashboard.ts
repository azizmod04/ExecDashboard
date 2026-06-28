import { useState, useEffect, useCallback } from 'react';
import { DashboardSummary, DashboardFull, AnalysisResult } from '../types';
import { api } from '../services/api';

export function useDashboards() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const all: any[] = [];
    // Get local dashboards
    const local = JSON.parse(localStorage.getItem('local_dashboards') || '[]');
    all.push(...local.map((d: any) => ({ ...d, is_local: true })));
    // Try API
    try {
      const data = await api.dashboards.list();
      all.push(...data.map((d: any) => ({ ...d, is_local: false })));
    } catch { /* API not available */ }
    setDashboards(all);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { dashboards, loading, refresh: fetch };
}

export function useDashboard(id: string | null) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    // Check local first
    const local = JSON.parse(localStorage.getItem('local_dashboards') || '[]');
    const found = local.find((d: any) => d.id === id);
    if (found) {
      setDashboard({
        id: found.id,
        name: found.name,
        source_type: found.source_type,
        status: 'ready',
        total_rows: found.row_count,
        columns: found._localColumns || [],
        data: (found._localData || []).slice(0, 100),
        kpis: found.kpis || [],
        is_shared: false,
        is_local: true,
      });
    } else {
      try {
        const data = await api.dashboards.get(id);
        setDashboard(data);
      } catch { setDashboard(null); }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { dashboard, loading, refresh: fetch };
}

export function useAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = useCallback(async (dashboardId: string, lang = 'ar'): Promise<AnalysisResult | null> => {
    setAnalyzing(true);
    try {
      const result = await api.insights.analyze(dashboardId, lang);
      return result as AnalysisResult;
    } catch { return null; }
    finally { setAnalyzing(false); }
  }, []);

  return { analyze, analyzing };
}
