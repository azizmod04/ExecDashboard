export interface ColumnMeta {
  name: string;
  type: 'numeric' | 'string';
}

export interface KpiData {
  id?: string;
  name: string;
  column_name: string;
  current_value: number;
  target_value: number;
  threshold_green?: number;
  threshold_yellow?: number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  status?: 'green' | 'yellow' | 'red' | 'pending';
}

export interface DashboardSummary {
  id: string;
  name: string;
  source_type: string;
  status: string;
  row_count: number;
  col_count: number;
  is_shared: boolean;
  created_at: string;
}

export interface DashboardFull extends DashboardSummary {
  columns: ColumnMeta[];
  data: Record<string, any>[];
  total_rows: number;
  kpis: KpiData[];
  share_id?: string;
}

export interface ShareData {
  id: string;
  dashboard_id: string;
  access_level: string;
  is_active: boolean;
  current_views: number;
  max_views: number;
  expires_at: string | null;
  created_at: string;
}

export interface AnalysisResult {
  executive_summary: string;
  key_trends: string[];
  kpi_analysis: { name: string; status: string; reason: string }[];
  risks: { title: string; severity: string; description: string }[];
  opportunities: { title: string; potential: string; action: string }[];
  anomalies: string[];
  recommendations: { priority: string; title: string; description: string }[];
}

export interface UploadResult {
  dashboard_id: string;
  name: string;
  source_type: string;
  row_count: number;
  col_count: number;
  sheets: string[];
  kpis: KpiData[];
  field_suggestions: Record<string, string[]>;
  data_quality: { total_rows: number; issues: string[]; quality_score: number };
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role: string;
}
