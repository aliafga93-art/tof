import React from 'react';
import { LatenessRecord } from '../types';
import { Trash2, AlertCircle, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { calculateLatenessMinutes, parseTimeString } from '../utils/parser';

interface PreviewTableProps {
  records: LatenessRecord[];
  onUpdateRecord: (id: string, updated: Partial<LatenessRecord>) => void;
  onDeleteRecord: (id: string) => void;
  onAddRecord: () => void;
}

export default function PreviewTable({
  records,
  onUpdateRecord,
  onDeleteRecord,
  onAddRecord,
}: PreviewTableProps) {
  
  const handleFieldChange = (id: string, field: keyof LatenessRecord, val: any) => {
    const updated: Partial<LatenessRecord> = { [field]: val };
    
    if (field === 'timeString') {
      const cleanedTime = parseTimeString(val);
      updated.timeString = cleanedTime;
      updated.minutesOfLateness = calculateLatenessMinutes(cleanedTime);
    }
    
    // Recalculate errors on change
    if (field === 'name') {
      updated.hasError = !val.trim();
      updated.errorMsg = !val.trim() ? 'الاسم مفقود' : '';
    } else if (field === 'dateString') {
      updated.hasError = !val.trim();
      updated.errorMsg = !val.trim() ? 'التاريخ مفقود' : '';
    } else if (field === 'timeString') {
      const cleaned = parseTimeString(val);
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const isInvalid = !cleaned || !timeRegex.test(cleaned);
      updated.hasError = isInvalid;
      updated.errorMsg = isInvalid ? `تنسيق الوقت غير صالح` : '';
    }

    onUpdateRecord(id, updated);
  };

  const totalCount = records.length;
  const errorCount = records.filter(r => r.hasError).length;
  const successCount = totalCount - errorCount;

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/60 dark:border-slate-800 shadow-sm overflow-hidden" dir="rtl">
      {/* Table Statistics Header */}
      <div className="p-5 border-b border-white/60 dark:border-slate-800 bg-gradient-to-r from-emerald-50/50 to-emerald-50/50 dark:from-slate-800 dark:to-slate-900 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">
            مراجعة وتعديل بيانات المتأخرين قبل الطباعة
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold shadow-sm">
            <span>الكل:</span>
            <span className="font-mono text-sm">{totalCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full text-xs font-semibold shadow-sm border border-teal-100 dark:border-teal-900/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>سليم:</span>
            <span className="font-mono text-sm">{successCount}</span>
          </div>
          {errorCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-xs font-semibold animate-pulse shadow-sm border border-rose-100 dark:border-rose-900/50">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>يحتاج مراجعة:</span>
              <span className="font-mono text-sm">{errorCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 font-medium text-sm">
            لا توجد بيانات حالياً. يرجى رفع ملف إكسل أو وورد، أو صورة جدول.
          </div>
        ) : (
          records.map((record, index) => (
            <div key={record.id} className={`p-4 space-y-3 ${record.hasError ? 'bg-rose-50/20 dark:bg-rose-900/10' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-sm font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                  {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  {record.hasError ? (
                    <div className="flex items-center gap-1 text-rose-700 text-[10px] font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{record.errorMsg}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>سليم</span>
                    </div>
                  )}
                  <button
                    onClick={() => onDeleteRecord(record.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1 block">الاسم الكامل</label>
                <input
                  type="text"
                  value={record.name}
                  onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-transparent ${
                    !record.name.trim() 
                      ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100' 
                      : 'border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 focus:border-emerald-500'
                  }`}
                  placeholder="أدخل اسم الموظف..."
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1 block">القسم / الشعبة</label>
                <input
                  type="text"
                  value={record.department}
                  onChange={(e) => handleFieldChange(record.id, 'department', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-transparent text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 dark:text-slate-200"
                  placeholder="الإدارة، المخازن..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1 block">التاريخ</label>
                  <input
                    type="text"
                    value={record.dateString}
                    onChange={(e) => handleFieldChange(record.id, 'dateString', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-transparent text-sm font-mono text-center transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      !record.dateString.trim() 
                        ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100' 
                        : 'border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 focus:border-emerald-500'
                    }`}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1 flex justify-between">
                    <span>الوقت</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{record.minutesOfLateness > 0 ? `${record.minutesOfLateness} د تأخير` : ''}</span>
                  </label>
                  <input
                    type="text"
                    value={record.timeString}
                    onChange={(e) => handleFieldChange(record.id, 'timeString', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-transparent text-sm font-mono text-center transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      record.hasError && record.errorMsg?.includes('الوقت')
                        ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100' 
                        : 'border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 focus:border-emerald-500'
                    }`}
                    placeholder="08:05"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View Container */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full min-w-[900px] text-right border-collapse">
          <thead>
            <tr className="bg-white/50 dark:bg-slate-800/50 border-b border-white/60 dark:border-slate-800 text-emerald-700 dark:text-emerald-300 text-sm font-bold tracking-wider">
              <th className="p-4 w-[60px] text-center">ت</th>
              <th className="p-4">الاسم الكامل للموظف</th>
              <th className="p-4">القسم / الشعبة</th>
              <th className="p-4 w-[160px]">تاريخ التأخير</th>
              <th className="p-4 w-[160px]">وقت البصمة (HH:MM)</th>
              <th className="p-4 w-[140px] text-center">دقائق التأخير</th>
              <th className="p-4 w-[160px]">الحالة والتنبيهات</th>
              <th className="p-4 w-[80px] text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60 dark:divide-slate-800/50">
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
                  لا توجد بيانات حالياً. يرجى رفع ملف إكسل أو وورد، أو إضافة موظف يدوياً للبدء.
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr 
                  key={record.id} 
                  className={`transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80 group ${record.hasError ? 'bg-rose-50/30 dark:bg-rose-900/10' : 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm'}`}
                >
                  {/* index */}
                  <td className="p-3 text-center font-mono text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {index + 1}
                  </td>

                  {/* Name field */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={record.name}
                      onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-0 ${
                        !record.name.trim() 
                          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100' 
                          : 'border-transparent bg-transparent hover:bg-white/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900'
                      }`}
                      placeholder="أدخل اسم الموظف..."
                    />
                  </td>

                  {/* Department field */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={record.department}
                      onChange={(e) => handleFieldChange(record.id, 'department', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-transparent bg-transparent hover:bg-white/60 dark:hover:bg-slate-800 text-sm transition-all focus:outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200"
                      placeholder="الإدارة المالية..."
                    />
                  </td>

                  {/* Date field */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={record.dateString}
                      onChange={(e) => handleFieldChange(record.id, 'dateString', e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm font-mono text-center transition-all focus:outline-none focus:ring-0 ${
                        !record.dateString.trim() 
                          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100' 
                          : 'border-transparent bg-transparent hover:bg-white/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900'
                      }`}
                      placeholder="DD/MM/YYYY"
                    />
                  </td>

                  {/* Time field */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={record.timeString}
                      onChange={(e) => handleFieldChange(record.id, 'timeString', e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm font-mono text-center transition-all focus:outline-none focus:ring-0 ${
                        record.hasError && record.errorMsg?.includes('الوقت')
                          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100' 
                          : 'border-transparent bg-transparent hover:bg-white/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900'
                      }`}
                      placeholder="08:05"
                    />
                  </td>

                  {/* Lateness calculation */}
                  <td className="p-2 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold font-mono shadow-sm transition-colors ${
                      record.minutesOfLateness > 0 
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/50' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                    }`}>
                      {record.minutesOfLateness} دقيقة
                    </span>
                  </td>

                  {/* Status & Error Display */}
                  <td className="p-2">
                    {record.hasError ? (
                      <div className="flex items-center justify-center gap-1.5 text-rose-700 dark:text-rose-400 text-xs font-semibold bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1.5 rounded-md border border-rose-100 dark:border-rose-900/50 shadow-sm w-full transition-colors">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[120px]">{record.errorMsg}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-md border border-emerald-100 dark:border-emerald-900/50 w-full shadow-sm transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>سليم وجاهز</span>
                      </div>
                    )}
                  </td>

                  {/* Actions (Delete) */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      title="حذف السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Record Footer Action */}
      <div className="p-4 bg-white/40 dark:bg-slate-800/30 border-t border-white/60 dark:border-slate-800 flex justify-between items-center backdrop-blur-sm">
        <button
          onClick={onAddRecord}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف يدوياً</span>
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          * تصفية وقت البصمة وتأريخ تنظيم الاستمارة تلقائي لكل موظف.
        </p>
      </div>
    </div>
  );
}
