import React, { useState } from 'react';
import { LatenessRecord } from '../types';
import { 
  Trash2, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Building2, 
  Calendar, 
  Clock, 
  Timer, 
  AlertTriangle,
  UserPlus,
  HelpCircle,
  Search,
  Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [activeSearchLocal, setActiveSearchLocal] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const toggleRow = (id: string) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };
  
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

  // Filter local rows if searched
  const filteredLocal = records.filter(r => 
    !activeSearchLocal || 
    r.name.toLowerCase().includes(activeSearchLocal.toLowerCase()) ||
    r.department.toLowerCase().includes(activeSearchLocal.toLowerCase()) ||
    r.dateString.includes(activeSearchLocal)
  );

  return (
    <div className="relative" dir="rtl">
      {/* Background elegant gradient light/dark glow */}
      <div className="absolute -top-12 -left-12 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Table Statistics & Header Dashboard */}
        <div className="p-6 sm:p-8 border-b border-slate-200/60 dark:border-slate-800/80 bg-gradient-to-br from-slate-50 to-slate-100/40 dark:from-slate-900/90 dark:to-slate-950/40 flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="space-y-2 text-center lg:text-right w-full lg:w-auto">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2.5 justify-center lg:justify-start">
                  مراجعة وتعديل بيانات المتأخرين
                  <span className="text-[11px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-750 dark:text-indigo-300 font-black px-3 py-1 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 uppercase tracking-wider">تفاعلي بالكامل</span>
                </h2>
                <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1 max-w-xl font-bold leading-relaxed">
                  قم بتعديل أي حقل مباشرة داخل الجدول. يتم تحديث دقائق التأخير ومؤشرات الجودة فورياً وبأعلى دقة.
                </p>
              </div>
            </div>
          </div>
          
          {/* Statistics Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 w-full lg:w-auto">
            <div className="flex items-center gap-3 px-4.5 py-2.5 bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-extrabold border border-slate-250 dark:border-slate-750 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-pulse"></span>
              <span>العدد الإجمالي:</span>
              <span className="font-mono text-base font-black text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-750 px-2.5 py-0.5 rounded-xl min-w-[28px] text-center">{totalCount}</span>
            </div>
            
            <div className="flex items-center gap-3 px-4.5 py-2.5 bg-emerald-550/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-450 rounded-2xl text-xs font-extrabold border border-emerald-500/20 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>سليم وجاهز:</span>
              <span className="font-mono text-base font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-xl min-w-[28px] text-center">{successCount}</span>
            </div>
            
            {errorCount > 0 && (
              <motion.div 
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center gap-3 px-4.5 py-2.5 bg-rose-500/10 dark:bg-rose-500/15 text-rose-800 dark:text-rose-450 rounded-2xl text-xs font-extrabold border border-rose-500/20 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>بحاجة لتعديل:</span>
                <span className="font-mono text-base font-black text-rose-800 dark:text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-xl min-w-[28px] text-center">{errorCount}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Local Search and Filter Row */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4.5 h-4.5 text-indigo-500 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="تصفية سريعة بالاسم أو القسم أو التاريخ..."
              value={activeSearchLocal}
              onChange={(e) => setActiveSearchLocal(e.target.value)}
              className="w-full pr-11 pl-4 py-2.5 bg-white dark:bg-slate-950 border-2 border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/10">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>نصيحة: يتم حفظ كل التعديلات بشكل تلقائي وفوري ومستمر.</span>
          </div>
        </div>

        {/* Responsive Mobile Layout (Accordion Style) */}
        <div className="md:hidden p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
          <AnimatePresence mode="popLayout">
            {filteredLocal.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold text-sm rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                لا توجد نتائج مطابقة لبحثك في هذا الجدول.
              </motion.div>
            ) : (
              filteredLocal.map((record, index) => {
                const isExpanded = expandedRowId === record.id;
                return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={record.id} 
                  className={`rounded-2xl border transition-all duration-300 relative overflow-hidden bg-white dark:bg-slate-900 shadow-sm ${
                    record.hasError 
                      ? 'border-rose-300 dark:border-rose-950 ring-1 ring-rose-500/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/40'
                  }`}
                >
                  {/* Glowing warning element for cards with error */}
                  {record.hasError && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-600 animate-pulse"></div>
                  )}
                  
                  {/* Accordion Header */}
                  <div 
                    onClick={() => toggleRow(record.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-xs font-black text-indigo-750 dark:text-indigo-400 font-mono shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                          {record.name || 'موظف بدون اسم'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          {record.hasError ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{record.errorMsg}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>مكتمل</span>
                            </span>
                          )}
                          {record.minutesOfLateness > 0 && (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500 text-[10px] font-bold">
                              <Timer className="w-3 h-3" />
                              <span>{record.minutesOfLateness} د</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteRecord(record.id); }}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95"
                        title="حذف السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className={`p-1.5 rounded-lg text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-100 dark:bg-slate-800' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Accordion Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 dark:border-slate-800/60"
                      >
                        <div className="p-4 space-y-4">
                          {/* Name */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-black flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-indigo-500" />
                              الاسم الكامل للموظف
                            </span>
                            <input
                              type="text"
                              value={record.name}
                              onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/15 bg-slate-50 dark:bg-slate-950/50 ${
                                !record.name.trim() 
                                  ? 'border-rose-400 dark:border-rose-850 text-rose-950 dark:text-rose-100 bg-rose-50/50' 
                                  : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-950'
                              }`}
                              placeholder="أدخل اسم الموظف ثلاثي..."
                            />
                          </div>

                          {/* Department */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-black flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                              القسم / الشعبة
                            </span>
                            <input
                              type="text"
                              value={record.department}
                              onChange={(e) => handleFieldChange(record.id, 'department', e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-slate-100"
                              placeholder="أدخل اسم القسم..."
                            />
                          </div>

                          {/* Date & Time fields */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-black flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                التاريخ
                              </span>
                              <input
                                type="text"
                                value={record.dateString}
                                onChange={(e) => handleFieldChange(record.id, 'dateString', e.target.value)}
                                className={`w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950/50 text-xs font-black font-mono text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/15 ${
                                  !record.dateString.trim() 
                                    ? 'border-rose-400 dark:border-rose-850 text-rose-950 dark:text-rose-100 bg-rose-50/50' 
                                    : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-950'
                                }`}
                                placeholder="DD/MM/YYYY"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-black flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                وقت البصمة
                              </span>
                              <input
                                type="text"
                                value={record.timeString}
                                onChange={(e) => handleFieldChange(record.id, 'timeString', e.target.value)}
                                className={`w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950/50 text-xs font-black font-mono text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/15 ${
                                  record.hasError && record.errorMsg?.includes('الوقت')
                                    ? 'border-rose-400 dark:border-rose-850 text-rose-950 dark:text-rose-100 bg-rose-50/50' 
                                    : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950'
                                }`}
                                placeholder="08:05"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
        {/* Desktop Exquisite Premium Table View */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b-2 border-indigo-500 text-xs font-bold font-serif select-none shadow-md">
                <th className="p-3 w-[50px] text-center rounded-tr-3xl">ت</th>
                <th className="p-3">
                  <div className="flex items-center gap-2 justify-start">
                    <div className="p-1 bg-white/10 rounded-xl">
                      <User className="w-3.5 h-3.5 text-indigo-300" />
                    </div>
                    <span className="text-slate-100">الاسم الكامل</span>
                  </div>
                </th>
                <th className="p-3">
                  <div className="flex items-center gap-2 justify-start">
                    <div className="p-1 bg-white/10 rounded-xl">
                      <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                    </div>
                    <span className="text-slate-100">القسم / الشعبة</span>
                  </div>
                </th>
                <th className="p-3 w-[120px]">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="p-1 bg-white/10 rounded-xl">
                      <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                    </div>
                    <span className="text-slate-100">التاريخ</span>
                  </div>
                </th>
                <th className="p-3 w-[120px]">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="p-1 bg-white/10 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-indigo-300" />
                    </div>
                    <span className="text-slate-100">وقت البصمة</span>
                  </div>
                </th>
                <th className="p-3 w-[120px] text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="p-1 bg-amber-500/20 rounded-xl">
                      <Timer className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-amber-300">دقائق التأخير</span>
                  </div>
                </th>
                <th className="p-3 w-[150px]">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="p-1 bg-white/10 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-300" />
                    </div>
                    <span className="text-slate-100">حالة التدقيق</span>
                  </div>
                </th>
                <th className="p-3 w-[60px] text-center rounded-tl-3xl">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white/40 dark:bg-slate-950/10">
              <AnimatePresence mode="popLayout">
                {filteredLocal.length === 0 ? (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={8} className="p-24 text-center text-slate-500 dark:text-slate-400 font-black bg-white dark:bg-slate-900">
                      <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 shadow-inner">
                          <UserPlus className="w-9 h-9" />
                        </div>
                        <p className="text-base font-black text-slate-850 dark:text-slate-200 mt-2">لا توجد بيانات مطابقة للبحث</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                          جرب البحث بكلمة أخرى، أو قم بإضافة موظف يدوياً للبدء بملء هذا الموقف الرسمي.
                        </p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredLocal.map((record, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      key={record.id} 
                      onMouseEnter={() => setHoveredRowId(record.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className={`transition-all duration-150 border-b border-slate-100 dark:border-slate-800 ${
                        record.hasError 
                          ? 'bg-rose-500/5 dark:bg-rose-500/5 hover:bg-rose-500/10 dark:hover:bg-rose-500/10' 
                          : hoveredRowId === record.id
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/15'
                          : index % 2 === 0
                          ? 'bg-slate-50/40 dark:bg-slate-900/20 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10'
                          : 'bg-white dark:bg-slate-900/50 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10'
                      }`}
                    >
                      {/* Index */}
                      <td className="p-2.5 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold font-serif">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/40 dark:border-indigo-900/40 shadow-sm text-[11px]">
                          {index + 1}
                        </span>
                      </td>

                      {/* Name field */}
                      <td className="p-2.5">
                        <div className="relative">
                          <input
                            type="text"
                            value={record.name}
                            onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-serif tracking-tight transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:bg-white dark:focus:bg-slate-950 ${
                              !record.name.trim() 
                                ? 'border-rose-450 dark:border-rose-900 text-rose-900 dark:text-rose-100 bg-rose-50/40 font-bold' 
                                : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-50 focus:border-indigo-600 font-bold'
                            }`}
                            placeholder="مثال: وسام ناظم..."
                          />
                        </div>
                      </td>

                      {/* Department field */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={record.department}
                          onChange={(e) => handleFieldChange(record.id, 'department', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-xs font-bold font-serif transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-950 text-slate-800 dark:text-slate-100"
                          placeholder="القسم/الشعبة..."
                        />
                      </td>

                      {/* Date field */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={record.dateString}
                          onChange={(e) => handleFieldChange(record.id, 'dateString', e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-serif text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-950 ${
                            !record.dateString.trim() 
                              ? 'border-rose-450 dark:border-rose-900 bg-rose-50/40 text-rose-900' 
                              : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/60'
                          }`}
                          placeholder="DD/MM/YYYY"
                        />
                      </td>

                      {/* Time field */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={record.timeString}
                          onChange={(e) => handleFieldChange(record.id, 'timeString', e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold font-serif text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-950 ${
                            record.hasError && record.errorMsg?.includes('الوقت')
                              ? 'border-rose-450 dark:border-rose-900 bg-rose-50/40 text-rose-900' 
                              : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/60'
                          }`}
                          placeholder="08:05"
                        />
                      </td>

                      {/* Lateness calculation badge */}
                      <td className="p-2.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold font-serif border transition-all duration-300 ${
                          record.minutesOfLateness > 0 
                            ? 'bg-amber-550/10 text-amber-700 dark:text-amber-400 border-amber-500/20 shadow-sm font-bold' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/10'
                        }`}>
                          <Timer className="w-3.5 h-3.5 text-amber-550 shrink-0 animate-spin-slow" />
                          <span>{record.minutesOfLateness} دقيقة</span>
                        </span>
                      </td>

                      {/* Status & Error Display */}
                      <td className="p-2.5">
                        <div className="flex justify-center">
                          {record.hasError ? (
                            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-405 text-[11px] font-bold font-serif bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/25 shadow-sm max-w-[140px] truncate animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                              <span className="truncate">{record.errorMsg}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 text-[11px] font-bold font-serif bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>سليم ومكتمل</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions (Delete) */}
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                          title="حذف السجل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Modern Dashboard Footer Actions */}
        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/40 dark:from-slate-900/90 dark:to-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <button
            onClick={onAddRecord}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-indigo-500/15 hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة منتسب جديد يدوياً</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs text-slate-550 dark:text-slate-400 font-bold text-center md:text-right">
            <span>* يمكنك دائماً النقر والتعديل على أي خلية في الجدول، ويتم تحديث البيانات والمدة الزمنية فورياً.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

