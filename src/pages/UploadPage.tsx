import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, FileBarChart, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { UploadResult } from '../types';

interface Props {
  onDashboardCreated: (id: string) => void;
}

export function UploadPage({ onDashboardCreated }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const supported = ['.xlsx', '.xls', '.csv', '.pbix', '.twb', '.twbx'];

    if (!supported.includes(ext)) {
      setError(`الصيغة ${ext} غير مدعومة. الصيغ المدعومة: ${supported.join(', ')}`);
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.upload.file(file);
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    }
    setUploading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">رفع ملف للتحليل</h2>
        <p className="text-gray-500 text-sm mt-1">
          يدعم Excel (.xlsx, .xls, .csv) و PowerBI (.pbix) و Tableau (.twb, .twbx)
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-gray-700 hover:border-gray-600 bg-surface-800'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.pbix,.twb,.twbx"
          className="hidden"
          onChange={handleInputChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={48} className="text-blue-400 animate-spin" />
            <p className="text-gray-400">جاري تحليل الملف...</p>
            <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={48} className="text-gray-500" />
            <h3 className="font-semibold text-lg">اسحب وأفلت الملف هنا</h3>
            <p className="text-gray-500">أو اضغط لاختيار ملف</p>
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <FileSpreadsheet size={14} /> Excel
              </span>
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <FileBarChart size={14} /> PowerBI
              </span>
              <span className="text-xs text-gray-600 flex items-center gap-1">
                <FileText size={14} /> Tableau
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card space-y-4 slide-in">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-kpi-green" />
            <div>
              <p className="font-semibold">✅ تم التحليل بنجاح</p>
              <p className="text-sm text-gray-500">{result.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="النوع" value={result.source_type === 'excel' ? 'Excel' : result.source_type === 'powerbi' ? 'PowerBI' : 'Tableau'} />
            <Stat label="الصفوف" value={result.row_count.toLocaleString()} />
            <Stat label="الأعمدة" value={result.col_count.toString()} />
            <Stat label="الورقات" value={result.sheets.length.toString()} />
          </div>

          {result.sheets.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">الأوراق المكتشفة:</p>
              <div className="flex flex-wrap gap-2">
                {result.sheets.map((s) => (
                  <span key={s} className="text-xs bg-surface-900 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-800">
                    📋 {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.data_quality && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">جودة البيانات:</span>
              <span className={`font-medium ${
                result.data_quality.quality_score >= 80 ? 'text-kpi-green' :
                result.data_quality.quality_score >= 50 ? 'text-kpi-yellow' : 'text-kpi-red'
              }`}>
                {result.data_quality.quality_score}%
              </span>
              {result.data_quality.issues.length > 0 && (
                <span className="text-gray-500 text-xs">
                  ({result.data_quality.issues.length} ملاحظة)
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => onDashboardCreated(result.dashboard_id)}
            className="btn-primary w-full"
          >
            🚀 فتح الداشبورد
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-900 rounded-lg p-3 border border-gray-800 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
