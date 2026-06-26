import { useState, useEffect, useCallback } from 'react';
import { DashboardSummary, DashboardFull, AnalysisResult } from '../types';
import { api } from '../services/api';

export function useDashboards() {
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.dashboards.list();
      setDashboards(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { dashboards, loading, refresh: fetch };
}

export function useDashboard(id: string | null) {
  const [dashboard, setDashboard] = useState<DashboardFull | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.dashboards.get(id);
      setDashboard(data);
    } catch { setDashboard(null); }
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
