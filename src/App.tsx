/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Upload, 
  Trash2, 
  Info, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Search, 
  RefreshCw, 
  Sparkles,
  FileDown,
  CheckCircle,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LatenessRecord } from './types';
import { parseExcelFile, parseWordFile, calculateLatenessMinutes } from './utils/parser';
import PreviewTable from './components/PreviewTable';
import OfficialForm from './components/OfficialForm';

// Initial pre-populated data from the user's example image to showcase the app directly!
const INITIAL_DEMO_RECORDS: LatenessRecord[] = [
  {
    id: 'demo-1',
    index: 1,
    name: 'وسام ناظم عبدالهادي',
    department: 'رؤساء الاقسام',
    dateString: '06/07/2026',
    timeString: '08:05',
    minutesOfLateness: 5,
    hasError: false
  },
  {
    id: 'demo-2',
    index: 2,
    name: 'حميد عبد علي',
    department: 'الادارة',
    dateString: '06/07/2026',
    timeString: '08:03',
    minutesOfLateness: 3,
    hasError: false
  },
  {
    id: 'demo-3',
    index: 3,
    name: 'اشرف عبد النبي',
    department: 'الادارة',
    dateString: '06/07/2026',
    timeString: '08:11',
    minutesOfLateness: 11,
    hasError: false
  },
  {
    id: 'demo-4',
    index: 4,
    name: 'حسين عباس جواد',
    department: 'سلامة',
    dateString: '06/07/2026',
    timeString: '08:04',
    minutesOfLateness: 4,
    hasError: false
  },
  {
    id: 'demo-11',
    index: 11,
    name: 'زهراء حسين نعمة',
    department: 'م. ق. ذ',
    dateString: '06/07/2026',
    timeString: '08:48',
    minutesOfLateness: 48,
    hasError: false
  }
];

export default function App() {
  const [records, setRecords] = useState<LatenessRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lateness_records');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved records from localStorage:", e);
        }
      }
    }
    return INITIAL_DEMO_RECORDS;
  });
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lateness_records', JSON.stringify(records));
    }
  }, [records]);

  const [showInstructions, setShowInstructions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'individual' | 'all-forms'>('preview');
  
  // Browsing state for individual form preview
  const [currentFormIndex, setCurrentFormIndex] = useState(0);

  // Print records queue (isolated during browser print window)
  const [printQueue, setPrintQueue] = useState<LatenessRecord[]>([]);

  // Feedback notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>({
    type: 'info',
    text: 'مرحباً بك! تم ملء الجدول ببيانات تجريبية من صورة استمارة المتأخرين الأصلية لتجربة التطبيق فوراً.'
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ text, type });
    // Auto clear after 6 seconds
    setTimeout(() => {
      setNotification(prev => prev?.text === text ? null : prev);
    }, 6000);
  };

  // Upload/Parse file handlers
  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          return prev;
        }
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 500);

    try {
      let parsed: LatenessRecord[] = [];

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        parsed = parseExcelFile(arrayBuffer);
        showNotification(`تم استخراج ${parsed.length} سجل من ملف الإكسل بنجاح!`, 'success');
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        parsed = await parseWordFile(arrayBuffer);
        showNotification(`تم استخراج ${parsed.length} سجل من مستند الوورد بنجاح!`, 'success');
      } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
        // Read image as base64 data URL
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;

        // Query the server-side Gemini OCR parser
        const response = await fetch('/api/parse-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, mimeType: file.type || 'image/jpeg' })
        });

        const resJson = await response.json();
        if (!response.ok || !resJson.success) {
          throw new Error(resJson.error || 'فشل استخراج البيانات من الصورة بالذكاء الاصطناعي.');
        }

        const rawRecords = resJson.data || [];
        parsed = rawRecords.map((item: any, idx: number) => {
          const name = String(item.name || '').trim();
          const department = String(item.department || '').trim();
          const dateString = String(item.dateString || '').trim();
          const timeString = String(item.timeString || '').trim();
          
          const minutesOfLateness = calculateLatenessMinutes(timeString);
          
          let hasError = false;
          let errorMsg = '';
          if (!name) {
            hasError = true;
            errorMsg = 'الاسم مفقود';
          } else if (!dateString) {
            hasError = true;
            errorMsg = 'التاريخ مفقود';
          } else if (!timeString) {
            hasError = true;
            errorMsg = 'الوقت مفقود';
          }

          return {
            id: Math.random().toString(36).substring(2, 9),
            index: item.index || (idx + 1),
            name,
            department,
            dateString,
            timeString,
            minutesOfLateness,
            hasError,
            errorMsg
          };
        });

        showNotification(`تم استخراج ${parsed.length} سجل من الصورة باستخدام الذكاء الاصطناعي بنجاح!`, 'success');
      } else {
        showNotification('تنسيق ملف غير مدعوم. يرجى رفع ملف إكسل (.xlsx)، وورد (.docx)، أو صورة جدول.', 'error');
        clearInterval(progressInterval);
        setIsLoading(false);
        setProgress(0);
        return;
      }

      if (parsed.length === 0) {
        showNotification('لم يتم العثور على أي صفوف بيانات صالحة في الملف المرفوع.', 'error');
      } else {
        setRecords(parsed);
        setCurrentFormIndex(0);
        setActiveTab('preview');
      }
    } catch (error: any) {
      console.error(error);
      let errMsg = error.message || 'تأكد من هيكل الجدول المعتمد.';
      if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
        errMsg = 'النظام الذكي يواجه ضغطاً كبيراً حالياً، يرجى المحاولة مرة أخرى بعد قليل.';
      }
      showNotification(`خطأ أثناء معالجة الملف: ${errMsg}`, 'error');
    } finally {
      setProgress(100);
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Record management handlers
  const handleUpdateRecord = (id: string, updated: Partial<LatenessRecord>) => {
    setRecords(prev => prev.map(rec => rec.id === id ? { ...rec, ...updated } : rec));
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => {
      const filtered = prev.filter(rec => rec.id !== id);
      // Adjust current browsing index if out of bounds
      if (currentFormIndex >= filtered.length && filtered.length > 0) {
        setCurrentFormIndex(filtered.length - 1);
      }
      return filtered;
    });
    showNotification('تم حذف السجل المحدد.', 'info');
  };

  const handleAddRecord = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    const newRec: LatenessRecord = {
      id: Math.random().toString(36).substring(2, 9),
      index: records.length + 1,
      name: '',
      department: '',
      dateString: dateStr,
      timeString: '08:01',
      minutesOfLateness: 1,
      hasError: true,
      errorMsg: 'يرجى إكمال اسم الموظف'
    };

    setRecords(prev => [...prev, newRec]);
    showNotification('تمت إضافة سجل فارغ جديد. يمكنك تعبئة الحقول الآن.', 'success');
  };

  const handleClearAll = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف جميع السجلات والبدء من جديد؟')) {
      setRecords([]);
      setCurrentFormIndex(0);
      showNotification('تم مسح جميع السجلات المتاحة.', 'info');
    }
  };

  // Quick action: Autofix typical mistakes or remove duplicates
  const handleAutoCleanData = () => {
    let fixCount = 0;
    const cleaned = records.map(rec => {
      let changed = false;
      const updates: Partial<LatenessRecord> = {};

      // Auto-fill empty dates if possible
      if (!rec.dateString && records.find(r => r.dateString)) {
        updates.dateString = records.find(r => r.dateString)!.dateString;
        changed = true;
      }

      // Check if we can parse invalid times
      if (rec.hasError && rec.errorMsg?.includes('الوقت')) {
        const numbersOnly = rec.timeString.replace(/[^\d]/g, '');
        if (numbersOnly.length === 4) {
          const hh = numbersOnly.substring(0, 2);
          const mm = numbersOnly.substring(2, 4);
          updates.timeString = `${hh}:${mm}`;
          updates.minutesOfLateness = calculateLatenessMinutes(`${hh}:${mm}`);
          updates.hasError = false;
          updates.errorMsg = '';
          changed = true;
        }
      }

      if (changed) {
        fixCount++;
        return { ...rec, ...updates };
      }
      return rec;
    });

    if (fixCount > 0) {
      setRecords(cleaned);
      showNotification(`تم تصحيح وصيانة ${fixCount} سجلات تلقائياً!`, 'success');
    } else {
      showNotification('لم يتم العثور على أخطاء بسيطة قابلة للإصلاح التلقائي.', 'info');
    }
  };

  // Triggering Print Dialogue
  const printSingleForm = (record: LatenessRecord) => {
    if (record.hasError) {
      if (!window.confirm('هذا السجل يحتوي على أخطاء لم يتم تصحيحها بعد. هل ترغب بطباعته على أي حال؟')) {
        return;
      }
    }
    setPrintQueue([record]);
    showNotification('يرجى اختيار "حفظ بتنسيق PDF" أو "Save as PDF" من نافذة الطباعة.', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const printAllForms = () => {
    const errorRecords = records.filter(r => r.hasError);
    if (errorRecords.length > 0) {
      if (!window.confirm(`تنبيه: هناك ${errorRecords.length} سجلات تحتوي على أخطاء في الصياغة أو حقول مفقودة. هل تود طباعة جميع السجلات على أي حال؟`)) {
        return;
      }
    }
    
    if (records.length === 0) {
      showNotification('لا توجد أي سجلات لطباعتها!', 'error');
      return;
    }

    setPrintQueue(records);
    showNotification('يرجى اختيار "حفظ بتنسيق PDF" أو "Save as PDF" من نافذة الطباعة لجميع الاستمارات.', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Filter records based on search query
  const filteredRecords = records.filter(rec => 
    rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.dateString.includes(searchQuery)
  );

  // Sample data template exporter
  const downloadSampleCSV = () => {
    const headers = 'ت,الاسم,القسم,التاريخ,وقت التأخير عن الدوام الرسمي\n';
    const sampleRows = [
      '1,وسام ناظم عبدالهادي,رؤساء الاقسام,06/07/2026,08:05',
      '2,حميد عبد علي,الادارة,06/07/2026,08:03',
      '3,اشرف عبد النبي,الادارة,06/07/2026,08:11 08:11',
      '4,حسين عباس جواد,سلامة,06/07/2026,08:04'
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'موقف_المتأخرين_نموذج.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('تم تنزيل النموذج الاسترشادي المتوافق.', 'success');
  };

  return (
    <div className="dashboard-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col selection:bg-indigo-100 pb-16 transition-colors duration-300" dir="rtl">
      
      {/* HEADER BAR */}
      <header className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-xl border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(129,140,248,0.15),rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/90 backdrop-blur-sm flex items-center justify-center shadow-inner border border-indigo-500/50">
              <Printer className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                  منظومة طباعة استمارات أعذار التأخير
                </h1>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-200 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  إصدار رسمي v4
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 font-medium opacity-90">
                الشركة العامة لإنتاج الطاقة الكهربائية - الفرات الأوسط | قسم الجودة والتطوير المؤسسي
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${showInstructions ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm' : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:shadow-md'}`}
              title={showInstructions ? "إخفاء التعليمات" : "إظهار التعليمات"}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-750 text-slate-300 transition-all duration-200 cursor-pointer hover:shadow-md"
              title="تغيير المظهر"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-750 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition-all duration-200 cursor-pointer hover:shadow-md"
              title="تنزيل ملف تجريبي لتعبئته ورفعه"
            >
              <FileDown className="w-4 h-4 text-indigo-400" />
              <span>نموذج (CSV)</span>
            </button>
            <button
              onClick={printAllForms}
              disabled={records.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                records.length === 0 ? 'opacity-50 pointer-events-none' : 'ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-slate-900'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكل دفعة واحدة ({records.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full space-y-6">
        
        {/* NOTIFICATIONS BAR */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
                notification.type === 'error'
                  ? 'bg-rose-50 border-rose-100 text-rose-800'
                  : notification.type === 'info'
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-800'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-800'
              }`}
            >
              <Info className={`w-5 h-5 shrink-0 ${
                notification.type === 'error' ? 'text-rose-600' : notification.type === 'info' ? 'text-indigo-600' : 'text-emerald-600'
              }`} />
              <div className="text-sm font-medium flex-1">
                {notification.text}
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-xs underline hover:no-underline font-bold opacity-80 cursor-pointer ml-1"
              >
                إغلاق
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP LAYOUT: FILE UPLOAD DRAG-AND-DROP */}
        <div className={`grid grid-cols-1 ${showInstructions ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
          
          {/* File Upload Zone */}
          <div className={showInstructions ? 'lg:col-span-2' : 'lg:col-span-1'}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed p-10 text-center flex flex-col items-center justify-center transition-all duration-300 h-full min-h-[260px] group ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20 scale-[1.02] shadow-inner' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow-md'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.docx,image/*"
                className="hidden"
              />

              {isLoading ? (
                <div className="flex flex-col items-center space-y-5 w-full max-w-md mx-auto">
                  <RefreshCw className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  <div className="space-y-1 text-center">
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">جاري معالجة وتدقيق الملف بالذكاء الاصطناعي...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">نستخرج البيانات ونطابق الهيكل الثابت بدقة تامة</p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 mt-4 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                    <motion.div 
                      className="bg-indigo-600 h-full rounded-full flex items-center justify-center relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                      {progress > 5 && (
                        <span className="text-[10px] text-white font-bold relative z-10 drop-shadow-sm">{progress}%</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans mb-2">
                    اسحب ملف الموقف أو صورة الجدول المطبوع هنا
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
                    يدعم ملفات إكسل <strong className="text-slate-700 dark:text-slate-300">(.xlsx)</strong>، وورد <strong className="text-slate-700 dark:text-slate-300">(.docx)</strong>، أو صور الجدول المطبوع <strong className="text-slate-700 dark:text-slate-300">(PNG, JPG)</strong> ليقوم الذكاء الاصطناعي بقراءتها آلياً.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ring-2 ring-indigo-500/20 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                    >
                      تصفح الملفات
                    </button>
                    
                    {records.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="px-5 py-2.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-bold text-sm rounded-xl border border-rose-200 dark:border-rose-800/50 transition-all cursor-pointer"
                      >
                        مسح الجدول
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Core System Instructions Guidelines */}
          {showInstructions && (
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="text-sm font-bold font-sans">تعليمات ومواصفات عمود الجدول</h3>
                </div>
                
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-decimal list-inside">
                  <li>يجب أن يحتوي الملف على أعمدة: <strong className="text-white">ت، الاسم، القسم، التاريخ، وقت التأخير</strong>.</li>
                  <li>يدعم رفع <strong className="text-indigo-400">صور الجدول المطبوع/الملتقط</strong> حيث يقوم الذكاء الاصطناعي بتحليله فورياً وتعبئته.</li>
                  <li>عند وجود وقتين في خلية البصمة (مثل <span className="font-mono text-indigo-300">"08:04 08:04"</span>)، يقوم النظام تلقائياً باستخلاص القيمة الأولى فقط لتجنب الأخطاء.</li>
                  <li>يتم حساب <strong className="text-white">دقائق التأخير</strong> تلقائياً كفارق بالدقائق عن موعد الحضور الرسمي وهو الساعة <strong className="text-indigo-400">08:00 صباحاً</strong>.</li>
                  <li>يبقى قالب استمارة العذر ثابتاً ومطابقاً حرفياً للاستمارة الرسمية رقم <strong className="text-white">MOE/P3-FO-03</strong> دون تغيير.</li>
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium">الرمز: MOE/P3-FO-03 (الإصدار 4)</span>
                <button 
                  onClick={handleAutoCleanData}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>إصلاح تلقائي للأخطاء</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-2 pt-2 rounded-t-2xl shadow-sm overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'preview' 
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-t-lg' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-lg'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>جدول معاينة البيانات وتصحيحها ({records.length})</span>
          </button>
          
          <button
            onClick={() => {
              if (records.length === 0) {
                showNotification('يرجى رفع ملف أو إضافة بيانات أولاً لمعاينة الاستمارات.', 'error');
                return;
              }
              setActiveTab('individual');
            }}
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'individual' 
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-t-lg' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-lg'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>معاينة حية للاستمارات الفردية</span>
          </button>

          <button
            onClick={() => {
              if (records.length === 0) {
                showNotification('لا توجد بيانات لمعاينة الطباعة الجماعية.', 'error');
                return;
              }
              setActiveTab('all-forms');
            }}
            className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2.5 ${
              activeTab === 'all-forms' 
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-t-lg' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-lg'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>عرض طباعة الكل صفحة تلو الأخرى</span>
          </button>
        </div>

        {/* SEARCH BAR (For quick queries on long lists) */}
        {activeTab === 'preview' && records.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث عن موظف بالاسم، أو القسم، أو تاريخ التأخير..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-slate-700 bg-transparent rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
              />
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-bold cursor-pointer"
              >
                إعادة تعيين
              </button>
            )}
          </div>
        )}

        {/* RENDER ACTIVE TAB */}
        <div className="min-h-[400px]">
          {activeTab === 'preview' ? (
            <PreviewTable
              records={filteredRecords}
              onUpdateRecord={handleUpdateRecord}
              onDeleteRecord={handleDeleteRecord}
              onAddRecord={handleAddRecord}
            />
          ) : activeTab === 'individual' ? (
            /* Live Individual Form Preview and controls */
            <div className="space-y-6">
              
              {/* Controls layout */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setCurrentFormIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentFormIndex === 0}
                    className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title="الاستمارة السابقة"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    استمارة الموظف {currentFormIndex + 1} من أصل {records.length}
                  </span>

                  <button
                    onClick={() => setCurrentFormIndex(prev => Math.min(records.length - 1, prev + 1))}
                    disabled={currentFormIndex === records.length - 1}
                    className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title="الاستمارة التالية"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Show short status info of current record */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-medium border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  الموظف الحالي: <strong className="text-slate-900 dark:text-slate-100">{records[currentFormIndex]?.name || 'فارغ'}</strong> 
                  {records[currentFormIndex]?.department && ` | قسم: ${records[currentFormIndex].department}`}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => printSingleForm(records[currentFormIndex])}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة الاستمارة الحالية</span>
                  </button>
                  <button
                    onClick={printAllForms}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 active:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>حفظ الكل كـ PDF (دفعة واحدة)</span>
                  </button>
                </div>
              </div>

              {/* LIVE FORM BOX WITH A SCALED CONTAINER TO FIT ON MOBILE/TABLET */}
              <div className="w-full flex justify-center bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl border border-slate-300/40 dark:border-slate-700 p-2 sm:p-4 overflow-hidden">
                <div className="responsive-form-wrapper shadow-2xl border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white">
                  {records[currentFormIndex] ? (
                    <OfficialForm record={records[currentFormIndex]} />
                  ) : (
                    <div className="p-12 text-center text-gray-400">لا توجد سجلات لعرضها</div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* ALL FORMS (BATCH PRINTING PREVIEW) */
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">معاينة الطباعة الجماعية لجميع المنتسبين</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">يقوم المتصفح تلقائياً بفصل كل موظف في صفحة مستقلة ذات قياس A4.</p>
                </div>
                
                <button
                  onClick={printAllForms}
                  className="flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>تأكيد وحفظ الكل كـ PDF دفعة واحدة</span>
                </button>
              </div>

              {/* RENDER ALL FORMS STACKED */}
              <div className="space-y-6 sm:space-y-12 bg-slate-100 dark:bg-slate-800/30 p-2 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center overflow-hidden">
                {records.map((rec, idx) => (
                  <div key={rec.id} className="responsive-form-wrapper shadow-xl rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden relative bg-white">
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-full z-20 no-print">
                      صفحة {idx + 1} ({rec.name || 'فارغ'})
                    </div>
                    <OfficialForm record={rec} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* DETACHED PRINT-ONLY ZONE (HIDES COMPLETELY IN WEB PORTAL, VISIBLE DURING PRINT) */}
      <div id="print-root">
        {printQueue.map((rec) => (
          <div key={rec.id}>
            <OfficialForm record={rec} />
          </div>
        ))}
      </div>

    </div>
  );
}
