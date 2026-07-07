/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Settings,
  Key,
  X,
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
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  
  const [showSettings, setShowSettings] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [apiKey]);

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
  
  // Print settings
  const [printSettings, setPrintSettings] = useState(() => {
    const saved = localStorage.getItem('printSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Ignore JSON error
      }
    }
    return {
      showHeader: true,
      showDate: true,
      customNote: '',
      fontFamily: 'Arial, sans-serif',
      positions: {
        name: { top: 25.5, right: 18 },
        department: { top: 27.5, left: 15 },
        dateCreated: { top: 19.5, left: 8 },
        dateLateness: { top: 22.0, left: 8 },
        timeLateness: { top: 23.5, left: 8 }
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('printSettings', JSON.stringify(printSettings));
  }, [printSettings]);

  // Browsing state for individual form preview
  const [currentFormIndex, setCurrentFormIndex] = useState(0);

  // Print records queue (isolated during browser print window)
  const [printQueue, setPrintQueue] = useState<LatenessRecord[]>([]);

  // Feedback notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>({
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

  const showNotification = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
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

        let rawRecords = [];

        if (apiKey) {
          // Direct client-side API call for Netlify deployment & Token optimization (uses gemini-2.5-flash)
          const base64Content = base64Data.split(',')[1];
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Content } },
                  { text: "استخرج جدول 'موقف المتأخرين' من هذه الصورة بدقة. يجب إرجاع مصفوفة JSON فقط تحتوي على كائنات بالخصائص التالية: 'index' (رقم ت), 'name' (الاسم الكامل), 'department' (القسم), 'dateString' (التاريخ DD/MM/YYYY), 'timeString' (الوقت HH:MM). لا تقم بإرجاع أي نص آخر غير مصفوفة JSON صالحة." }
                ]
              }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });

          if (!response.ok) {
            const errRes = await response.json().catch(() => ({}));
            throw new Error(errRes.error?.message || 'خطأ في الاتصال بـ Gemini API الخاص بك.');
          }

          const resJson = await response.json();
          const textResponse = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!textResponse) {
            throw new Error('لم يتم إرجاع أي بيانات من الذكاء الاصطناعي.');
          }
          
          try {
             // Clean markdown json formatting if the model decided to include it despite responseMimeType
             const cleanJsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
             rawRecords = JSON.parse(cleanJsonStr);
          } catch(e) {
             throw new Error('فشل في قراءة البيانات كـ JSON. يرجى المحاولة مرة أخرى.');
          }
        } else {
          // Fallback to server-side if no local key is provided
          const response = await fetch('/api/parse-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Data, mimeType: file.type || 'image/jpeg' })
          });

          const resJson = await response.json();
          if (!response.ok || !resJson.success) {
            throw new Error(resJson.error || 'فشل استخراج البيانات من الصورة بالذكاء الاصطناعي.');
          }

          rawRecords = resJson.data || [];
        }

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
    setRecords([]);
    setCurrentFormIndex(0);
    showNotification('تم مسح جميع السجلات المتاحة.', 'info');
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
      showNotification('تنبيه: سيتم طباعة هذا السجل رغم احتوائه على أخطاء أو حقول مفقودة.', 'warning');
    }
    setPrintQueue([record]);
    showNotification('يرجى اختيار "حفظ بتنسيق PDF" أو "Save as PDF" من نافذة الطباعة.', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const printAllForms = () => {
    if (records.length === 0) {
      showNotification('لا توجد أي سجلات لطباعتها!', 'error');
      return;
    }

    const errorRecords = records.filter(r => r.hasError);
    if (errorRecords.length > 0) {
      showNotification(`تنبيه: يتم طباعة ${errorRecords.length} سجلات تحتوي على أخطاء.`, 'warning');
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
    <div className="dashboard-wrapper min-h-screen bg-[#fcfdfd] dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50/50 to-teal-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col selection:bg-emerald-200 dark:selection:bg-emerald-900 pb-16 transition-colors duration-500" dir="rtl">
      
      {/* HEADER BAR */}
      <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm border-b border-white/60 dark:border-slate-800/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white transform rotate-3">
              <Printer className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white font-sans drop-shadow-sm">
                  منظومة طباعة استمارات أعذار التأخير
                </h1>
                <span className="text-[11px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  إصدار رسمي v4
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                الشركة العامة لإنتاج الطاقة الكهربائية - الفرات الأوسط | قسم الجودة والتطوير المؤسسي
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 rounded-2xl border border-white/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-300 cursor-pointer hover:shadow-sm backdrop-blur-sm hover:-translate-y-0.5"
              title="إعدادات النظام (API Key)"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-sm hover:-translate-y-0.5 ${showInstructions ? 'border-emerald-200 bg-emerald-100/50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm' : 'border-white/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:shadow-sm'}`}
              title={showInstructions ? "إخفاء التعليمات" : "إظهار التعليمات"}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 rounded-2xl border border-white/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-300 cursor-pointer hover:shadow-sm backdrop-blur-sm hover:-translate-y-0.5"
              title="تغيير المظهر"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-5 py-3 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl border border-white/60 dark:border-slate-700/60 transition-all duration-300 cursor-pointer hover:shadow-sm backdrop-blur-sm hover:-translate-y-0.5"
              title="تنزيل ملف تجريبي لتعبئته ورفعه"
            >
              <FileDown className="w-4 h-4 text-emerald-500" />
              <span>نموذج (CSV)</span>
            </button>
            <button
              onClick={printAllForms}
              disabled={records.length === 0}
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                records.length === 0 ? 'opacity-50 pointer-events-none' : 'ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-[#fcfdfd] dark:ring-offset-slate-900'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكل دفعة واحدة ({records.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">إعدادات النظام والربط</h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    مفتاح API الخاص بـ Gemini (للنشر على Netlify)
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    من خلال إدخال المفتاح الخاص بك، سيتم معالجة الصور <strong className="text-emerald-600 dark:text-emerald-400">مباشرة من المتصفح</strong> دون الحاجة للخوادم (Backend). هذا الخيار مثالي للاستضافة الثابتة المجانية مثل Netlify. يتم استخدام النموذج <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">gemini-2.5-flash</code> الأوفر لاستهلاك التوكن ليتناسب مع الخطة المجانية.
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  حفظ وإغلاق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  ? 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200'
                  : notification.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200'
                  : notification.type === 'info'
                  ? 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200'
              }`}
            >
              <Info className={`w-5 h-5 shrink-0 ${
                notification.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 
                notification.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
                notification.type === 'info' ? 'text-blue-600 dark:text-blue-400' : 
                'text-emerald-600 dark:text-emerald-400'
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
              className={`relative rounded-3xl border-2 border-dashed p-10 text-center flex flex-col items-center justify-center transition-all duration-300 h-full min-h-[280px] group overflow-hidden ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20 scale-[1.02] shadow-inner' 
                  : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-white dark:hover:bg-slate-900 shadow-sm hover:shadow-lg backdrop-blur-sm'
              }`}
            >
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-transparent dark:from-emerald-900/10 dark:to-transparent pointer-events-none opacity-50"></div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.docx,image/*"
                className="hidden"
              />

              {isLoading ? (
                <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto relative z-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 dark:bg-emerald-600 blur-xl opacity-20 rounded-full"></div>
                    <RefreshCw className="w-14 h-14 text-emerald-500 dark:text-emerald-400 animate-spin relative z-10" />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">جاري معالجة وتدقيق الملف بالذكاء الاصطناعي...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">نستخرج البيانات ونطابق الهيكل الثابت بدقة تامة</p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mt-4 overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                    <motion.div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full flex items-center justify-center relative overflow-hidden shadow-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center mb-6 text-emerald-500 dark:text-emerald-400 group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                    <Upload className="w-10 h-10" />
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-sans mb-3 tracking-tight">
                    اسحب ملف الموقف أو صورة الجدول المطبوع هنا
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-8">
                    يدعم ملفات إكسل <strong className="text-slate-700 dark:text-slate-300">(.xlsx)</strong>، وورد <strong className="text-slate-700 dark:text-slate-300">(.docx)</strong>، أو صور الجدول المطبوع <strong className="text-slate-700 dark:text-slate-300">(PNG, JPG)</strong> ليقوم الذكاء الاصطناعي بقراءتها آلياً.
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      تصفح الملفات
                    </button>
                    
                    {records.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 dark:text-rose-400 font-bold text-sm rounded-2xl border border-rose-100 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer shadow-sm hover:shadow"
                      >
                        مسح الجدول
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Core System Instructions Guidelines */}
          {showInstructions && (
            <div className="bg-slate-900/95 text-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between border border-slate-800 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-2 text-emerald-400">
                  <HelpCircle className="w-5 h-5" />
                  <h3 className="text-sm font-bold font-sans">تعليمات ومواصفات عمود الجدول</h3>
                </div>
                
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-decimal list-inside">
                  <li>يجب أن يحتوي الملف على أعمدة: <strong className="text-white">ت، الاسم، القسم، التاريخ، وقت التأخير</strong>.</li>
                  <li>يدعم رفع <strong className="text-emerald-400">صور الجدول المطبوع/الملتقط</strong> حيث يقوم الذكاء الاصطناعي بتحليله فورياً وتعبئته.</li>
                  <li>عند وجود وقتين في خلية البصمة (مثل <span className="font-mono text-emerald-300">"08:04 08:04"</span>)، يقوم النظام تلقائياً باستخلاص القيمة الأولى فقط لتجنب الأخطاء.</li>
                  <li>يتم حساب <strong className="text-white">دقائق التأخير</strong> تلقائياً كفارق بالدقائق عن موعد الحضور الرسمي وهو الساعة <strong className="text-emerald-400">08:00 صباحاً</strong>.</li>
                  <li>يبقى قالب استمارة العذر ثابتاً ومطابقاً حرفياً للاستمارة الرسمية رقم <strong className="text-white">MOE/P3-FO-03</strong> دون تغيير.</li>
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex justify-between items-center relative z-10">
                <span className="text-[10px] text-slate-500 font-medium">الرمز: MOE/P3-FO-03 (الإصدار 4)</span>
                <button 
                  onClick={handleAutoCleanData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-xs text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/20 font-bold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>إصلاح تلقائي للأخطاء</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* TABS SELECTOR */}
        <div className="flex bg-white/60 dark:bg-slate-900/50 p-2 rounded-full shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap border border-white/60 dark:border-slate-800/50 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 px-6 py-3.5 text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 rounded-full ${
              activeTab === 'preview' 
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
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
            className={`flex-1 px-6 py-3.5 text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 rounded-full ${
              activeTab === 'individual' 
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
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
            className={`flex-1 px-6 py-3.5 text-sm font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 rounded-full ${
              activeTab === 'all-forms' 
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>عرض طباعة الكل صفحة تلو الأخرى</span>
          </button>
        </div>

        {/* SEARCH BAR (For quick queries on long lists) */}
        {activeTab === 'preview' && records.length > 0 && (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-400 dark:text-emerald-500 absolute right-4 top-3" />
              <input
                type="text"
                placeholder="ابحث عن موظف بالاسم، أو القسم، أو تاريخ التأخير..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 border border-white/60 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-200 backdrop-blur-sm"
              />
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 font-bold cursor-pointer transition-colors"
              >
                إعادة تعيين
              </button>
            )}
          </div>
        )}

        {/* PRINT SETTINGS */}
        {activeTab !== 'preview' && (
          <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-3xl border border-white/60 dark:border-slate-800 shadow-sm mb-6 flex flex-col gap-4 backdrop-blur-md">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Settings className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm">إعدادات الطباعة</h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={printSettings.showHeader}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, showHeader: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-slate-600 dark:text-slate-300">عرض الترويسة</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={printSettings.showDate}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, showDate: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-slate-600 dark:text-slate-300">عرض التاريخ</span>
                </label>

                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="ملاحظات إضافية على الاستمارة..." 
                    value={printSettings.customNote}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, customNote: e.target.value }))}
                    className="w-64 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="relative">
                  <select
                    value={printSettings.fontFamily || 'Arial, sans-serif'}
                    onChange={(e) => setPrintSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                    className="w-32 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 rounded-lg text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Arial, sans-serif">الخط الافتراضي (Arial)</option>
                    <option value="'Cairo', sans-serif">Cairo</option>
                    <option value="'Tajawal', sans-serif">Tajawal</option>
                    <option value="'Readex Pro', sans-serif">Readex Pro</option>
                    <option value="'Almarai', sans-serif">Almarai</option>
                    <option value="'Amiri', serif">Amiri</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Position Tuning */}
            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <details className="group">
                <summary className="text-xs font-bold text-slate-500 hover:text-emerald-600 cursor-pointer select-none mb-3">
                  إعدادات متقدمة (تعديل مواقع النصوص على الاستمارة)
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                  {/* Name Position */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم الموظف</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">أعلى (Y)</span>
                      <input type="range" min="20" max="40" step="0.1" value={printSettings.positions?.name?.top ?? 27} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, name: { ...prev.positions?.name, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">يمين (X)</span>
                      <input type="range" min="10" max="50" step="0.1" value={printSettings.positions?.name?.right ?? 18} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, name: { ...prev.positions?.name, right: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                  </div>

                  {/* Department Position */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">القسم</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">أعلى (Y)</span>
                      <input type="range" min="20" max="40" step="0.1" value={printSettings.positions?.department?.top ?? 29.7} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, department: { ...prev.positions?.department, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">يسار (X)</span>
                      <input type="range" min="0" max="100" step="0.1" value={printSettings.positions?.department?.left ?? 15} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, department: { ...prev.positions?.department, left: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                  </div>

                  {/* Date Lateness Position */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تاريخ التأخير</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">أعلى (Y)</span>
                      <input type="range" min="15" max="35" step="0.1" value={printSettings.positions?.dateLateness?.top ?? 22.5} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, dateLateness: { ...prev.positions?.dateLateness, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">يسار (X)</span>
                      <input type="range" min="0" max="30" step="0.1" value={printSettings.positions?.dateLateness?.left ?? 8} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, dateLateness: { ...prev.positions?.dateLateness, left: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                  </div>

                  {/* Time Lateness Position */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">وقت البصمة</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">أعلى (Y)</span>
                      <input type="range" min="15" max="35" step="0.1" value={printSettings.positions?.timeLateness?.top ?? 24.8} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, timeLateness: { ...prev.positions?.timeLateness, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">يسار (X)</span>
                      <input type="range" min="0" max="30" step="0.1" value={printSettings.positions?.timeLateness?.left ?? 8} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, timeLateness: { ...prev.positions?.timeLateness, left: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                  </div>

                  {/* Date Created Position */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تاريخ تنظيم الاستمارة</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">أعلى (Y)</span>
                      <input type="range" min="10" max="30" step="0.1" value={printSettings.positions?.dateCreated?.top ?? 19.2} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, dateCreated: { ...prev.positions?.dateCreated, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">يسار (X)</span>
                      <input type="range" min="0" max="30" step="0.1" value={printSettings.positions?.dateCreated?.left ?? 8} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, dateCreated: { ...prev.positions?.dateCreated, left: parseFloat(e.target.value) } } as any }))} className="w-full accent-emerald-500" />
                    </div>
                  </div>
                </div>
              </details>
            </div>
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
              <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-3xl border border-white/60 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setCurrentFormIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentFormIndex === 0}
                    className="p-2.5 bg-white/80 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl text-emerald-700 dark:text-slate-300 transition-colors cursor-pointer shadow-sm"
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
                    className="p-2.5 bg-white/80 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl text-emerald-700 dark:text-slate-300 transition-colors cursor-pointer shadow-sm"
                    title="الاستمارة التالية"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Show short status info of current record */}
                <div className="bg-white/60 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl text-xs font-medium border border-white/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-sm">
                  الموظف الحالي: <strong className="text-emerald-700 dark:text-emerald-300">{records[currentFormIndex]?.name || 'فارغ'}</strong> 
                  {records[currentFormIndex]?.department && ` | قسم: ${records[currentFormIndex].department}`}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => printSingleForm(records[currentFormIndex])}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-600 active:from-emerald-600 active:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة الاستمارة الحالية</span>
                  </button>
                  <button
                    onClick={printAllForms}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white/80 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 active:bg-slate-100 dark:active:bg-slate-800 text-slate-700 dark:text-slate-200 border border-white/60 dark:border-slate-600 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer hover:-translate-y-0.5"
                  >
                    <FileDown className="w-4 h-4 text-emerald-500" />
                    <span>حفظ الكل كـ PDF (دفعة واحدة)</span>
                  </button>
                </div>
              </div>

              {/* LIVE FORM BOX WITH A SCALED CONTAINER TO FIT ON MOBILE/TABLET */}
              <div className="w-full flex justify-center bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl border border-slate-300/40 dark:border-slate-700 p-2 sm:p-4 overflow-hidden">
                <div className="responsive-form-wrapper shadow-2xl border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white">
                  {records[currentFormIndex] ? (
                    <OfficialForm record={records[currentFormIndex]} printSettings={printSettings} />
                  ) : (
                    <div className="p-12 text-center text-gray-400">لا توجد سجلات لعرضها</div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* ALL FORMS (BATCH PRINTING PREVIEW) */
            <div className="space-y-6">
              <div className="bg-white/60 dark:bg-slate-900/60 p-5 rounded-3xl border border-white/60 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-4 backdrop-blur-md">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">معاينة الطباعة الجماعية لجميع المنتسبين</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">يقوم المتصفح تلقائياً بفصل كل موظف في صفحة مستقلة ذات قياس A4.</p>
                </div>
                
                <button
                  onClick={printAllForms}
                  className="flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] cursor-pointer"
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
                    <OfficialForm record={rec} printSettings={printSettings} />
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
            <OfficialForm record={rec} printSettings={printSettings} />
          </div>
        ))}
      </div>

    </div>
  );
}
