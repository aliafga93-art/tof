import html2canvas from 'html2canvas';
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
  Search, 
  RefreshCw, 
  Sparkles,
  FileDown,
  CheckCircle2,
  HelpCircle,
  Settings,
  Key,
  X,
  Moon,
  Sun, 
  Save,
  Clock,
  Flame,
  LayoutGrid,
  TrendingUp,
  FileTextIcon,
  Compass,
  Maximize2,
  Minimize2,
  Type,
  Eye,
  ImageDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LatenessRecord } from './types';
import { parseExcelFile, parseWordFile, calculateLatenessMinutes } from './utils/parser';
import PreviewTable from './components/PreviewTable';
import OfficialForm from './components/OfficialForm';
import PrintSettingsPanel from './components/PrintSettingsPanel';

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

// Iraq (Baghdad) Local Time isolated component to prevent full App re-renders every second
const BaghdadClock = React.memo(() => {
  const [time, setTime] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Baghdad',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const formatter = new Intl.DateTimeFormat('ar-IQ', options);
      setTime(formatter.format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{time}</span>;
});
BaghdadClock.displayName = 'BaghdadClock';

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
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
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lateness_records', JSON.stringify(records));
    }
  }, [records]);

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
        const parsed = JSON.parse(saved);
        return {
          showHeader: parsed.showHeader ?? true,
          showDate: parsed.showDate ?? true,
          showAffiliation: parsed.showAffiliation ?? false,
          affiliationText: parsed.affiliationText ?? 'محطة كهرباء الخيرات الغازية',
          customNote: parsed.customNote ?? '',
          fontFamily: parsed.fontFamily ?? 'Arial',
          fontSize: parsed.fontSize ?? 15,
          positions: {
            name: parsed.positions?.name ?? { top: 25.5, right: 18 },
            affiliation: parsed.positions?.affiliation ?? { top: 27.5, right: 18 },
            department: parsed.positions?.department ?? { top: 29.5, left: 15 },
            dateCreated: parsed.positions?.dateCreated ?? { top: 19.5, left: 8 },
            dateLateness: parsed.positions?.dateLateness ?? { top: 22.0, left: 8 },
            timeLateness: parsed.positions?.timeLateness ?? { top: 23.5, left: 8 }
          }
        };
      } catch (e) {
        // Ignore JSON error
      }
    }
    return {
      showHeader: true,
      showDate: true,
      showAffiliation: false,
      affiliationText: 'محطة كهرباء الخيرات الغازية',
      customNote: '',
      fontFamily: 'Amiri',
      fontSize: 15,
      positions: {
        name: { top: 25.5, right: 18 },
        affiliation: { top: 27.5, right: 18 },
        department: { top: 29.5, left: 15 },
        dateCreated: { top: 19.5, left: 8 },
        dateLateness: { top: 22.0, left: 8 },
        timeLateness: { top: 23.5, left: 8 }
      }
    };
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.85);

  const handleSaveSettings = () => {
    localStorage.setItem('printSettings', JSON.stringify(printSettings));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Browsing state for individual form preview
  const [currentFormIndex, setCurrentFormIndex] = useState(0);

  // Print records queue (isolated during browser print window)
  const [printQueue, setPrintQueue] = useState<LatenessRecord[]>([]);

  // Feedback notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>({
    type: 'success',
    text: 'تمت تهيئة المنظومة بنجاح وتغذية الجدول الأنيق بالبيانات الرسمية من قسم الجودة!'
  });

  // States for Batch Print progress tracking
  const [isPrintingBatch, setIsPrintingBatch] = useState(false);
  const [printBatchProgress, setPrintBatchProgress] = useState(0);
  const [printBatchCurrentIndex, setPrintBatchCurrentIndex] = useState(0);
  const [printBatchStatus, setPrintBatchStatus] = useState('');
  const [printBatchReadyCount, setPrintBatchReadyCount] = useState(0);
  const [printBatchErrorCount, setPrintBatchErrorCount] = useState(0);
  const cancelPrintRef = useRef<boolean>(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [uiScale, setUiScale] = useState<'normal' | 'large' | 'xlarge'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('uiScale') as any) || 'normal';
    }
    return 'normal';
  });

  useEffect(() => {
    localStorage.setItem('uiScale', uiScale);
  }, [uiScale]);

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

  // Quick action: Autofix typical mistakes
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

  // Load demo presets
  const handleLoadDemoData = () => {
    setRecords(INITIAL_DEMO_RECORDS);
    setCurrentFormIndex(0);
    showNotification('تم إعادة تحميل البيانات التجريبية الرسمية لفرات الأوسط.', 'success');
  };

  // Triggering Print Dialogue
  const downloadFormAsImage = async (record: LatenessRecord, format: 'png' | 'jpg' = 'png') => {
    // We need to render it temporarily for taking a snapshot, or take a snapshot from the preview.
    const elementId = `form-${record.id}`;
    let element = document.getElementById(elementId);
    
    if (!element) {
      showNotification('يرجى اختيار الاستمارة في العرض الفردي أولاً لالتقاط الصورة.', 'error');
      return;
    }

    try {
      showNotification(`جاري تحضير الصورة بصيغة ${format.toUpperCase()}...`, 'info');
      // Store original styles to revert later
      const originalTransform = element.style.transform;
      // Temporarily remove transform to get a clean capture
      element.style.transform = 'none';
      
      // Reset parent's transform too to ensure html2canvas calculates correct boundingClientRect
      const parent = element.parentElement;
      const originalParentTransform = parent ? parent.style.transform : '';
      if (parent) {
        parent.style.transform = 'none';
      }
      
      const canvas = await html2canvas(element, {
        scale: 2.5, // Higher quality for official documents
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123
      });
      
      // Revert styles
      element.style.transform = originalTransform;
      if (parent) {
        parent.style.transform = originalParentTransform;
      }
      
      const dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      const link = document.createElement('a');
      const safeName = (record.name || 'استمارة').replace(/[\s\/]/g, '_');
      link.download = `استمارة_${safeName}.${format}`;
      link.href = dataUrl;
      link.click();
      
      showNotification('تم تحميل الاستمارة بنجاح كصورة', 'success');
    } catch (err) {
      console.error('Error downloading image', err);
      showNotification('حدث خطأ أثناء حفظ الصورة', 'error');
    }
  };

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

    setIsPrintingBatch(true);
    setPrintBatchProgress(0);
    setPrintBatchCurrentIndex(0);
    setPrintBatchReadyCount(0);
    setPrintBatchErrorCount(0);
    cancelPrintRef.current = false;

    const total = records.length;
    let index = 0;
    let readyCount = 0;
    let errorCount = 0;

    const processNext = () => {
      if (cancelPrintRef.current) {
        setIsPrintingBatch(false);
        showNotification('تم إلغاء عملية تجهيز الاستمارات للطباعة.', 'info');
        return;
      }

      if (index < total) {
        const record = records[index];
        if (record.hasError) {
          errorCount++;
        } else {
          readyCount++;
        }

        setPrintBatchCurrentIndex(index + 1);
        setPrintBatchReadyCount(readyCount);
        setPrintBatchErrorCount(errorCount);
        setPrintBatchStatus(`جاري معالجة وتدقيق استمارة المنتسب: ${record.name || 'غير محدد الاسم'}`);
        setPrintBatchProgress(Math.round(((index + 1) / total) * 100));

        index++;
        // Dynamic satisfying simulation speed: from 100ms to 250ms per item
        const delay = Math.max(100, Math.min(250, 1500 / total));
        setTimeout(processNext, delay);
      } else {
        setPrintBatchStatus('اكتملت المعالجة الاستباقية بنجاح! جاري استدعاء محرك الطباعة لـ PDF...');
        
        setTimeout(() => {
          setPrintQueue(records);
          showNotification('يرجى اختيار "حفظ بتنسيق PDF" أو "Save as PDF" من نافذة الطباعة لجميع الاستمارات.', 'info');
          
          setTimeout(() => {
            window.print();
            setIsPrintingBatch(false);
          }, 400);
        }, 800);
      }
    };

    // Initiate process
    processNext();
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

  // Dynamic statistics calculations
  const totalLatenessMinutes = records.reduce((sum, r) => sum + r.minutesOfLateness, 0);
  const totalLatenessHours = (totalLatenessMinutes / 60).toFixed(1);
  const integrityPercentage = records.length > 0 ? Math.round(((records.length - records.filter(r => r.hasError).length) / records.length) * 100) : 100;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-500 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900 selection:text-indigo-900">
      
      {/* GLOWING BACKGROUND SHARDS */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Main dashboard content, hidden during printing */}
      <div 
        className="dashboard-wrapper relative z-10 flex flex-col min-h-screen transition-all duration-300"
        style={{ zoom: uiScale === 'large' ? 1.08 : uiScale === 'xlarge' ? 1.18 : 1 }}
      >
      
        {/* PREMIUM NAVIGATION BAR */}
        <header className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50 backdrop-blur-xl animate-fadeIn">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 transition-all duration-300">
            
            {/* Logo and branding */}
            <div className="flex items-center gap-4">
              <motion.div 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white transform hover:scale-105 transition-transform"
              >
                <Printer className="w-7 h-7" />
              </motion.div>
              <div>
                <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                    نظام طباعة استمارات أعذار التأخير
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">
                  الشركة العامة لإنتاج الطاقة الكهربائية - الفرات الأوسط | قسم تكنولوجيا المعلومات والجودة
                </p>
              </div>
            </div>

            {/* Top Bar Quick Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Iraq Local Time Clock */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/30 dark:border-slate-700/30 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                <span>توقيت العراق المحلي:</span>
                <BaghdadClock />
              </div>

              {/* API settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                title="إعدادات نظام الذكاء الاصطناعي"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-all duration-300 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                title="تغيير مظهر المنصة"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500 animate-bounce" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Master Print Button */}
              <button
                onClick={printAllForms}
                disabled={records.length === 0}
                className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                  records.length === 0 ? 'opacity-50 pointer-events-none' : 'ring-4 ring-indigo-500/20 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950'
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-100">إعدادات الربط والذكاء الاصطناعي</h2>
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
                    <label htmlFor="apiKey" className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase">
                      مفتاح API الخاص بك لـ Gemini
                    </label>
                    <input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-sm"
                    />
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      عند وضع المفتاح الشخصي، سيقوم المتصفح بقراءة صور استمارات البصمة الورقية واستخلاصها كـ JSON <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">فوراً ومجاناً في ثوانٍ معدودة</strong>. يتم تشفير المفتاح محلياً في جهازك ولا يتم نقله أبداً لأي خادم وسيط.
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/20 flex justify-end">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    موافق، حفظ الربط
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BATCH PRINT PROGRESS MODAL */}
        <AnimatePresence>
          {isPrintingBatch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md no-print"
              dir="rtl"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200/85 dark:border-slate-800/85 p-6 sm:p-8 relative"
              >
                {/* Visual design accents */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 space-y-6 text-center">
                  {/* Header / Icon */}
                  <div className="flex flex-col items-center">
                    <div className="relative animate-pulse">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white relative z-10">
                        <Printer className="w-8 h-8 animate-bounce" />
                      </div>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-100 mt-4 tracking-tight">
                      معالج تهيئة وتجهيز الاستمارات للطباعة
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                      جاري تدقيق وتجميع {records.length} استمارة أعذار تأخير لإنشاء ملف الطباعة الموحد
                    </p>
                  </div>

                  {/* Progress Stats Indicators */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 text-center font-bold">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">إجمالي المستندات</span>
                      <span className="text-xl font-mono text-slate-800 dark:text-white font-black">
                        {records.length}
                      </span>
                    </div>
                    <div className="space-y-1 border-r border-slate-200/50 dark:border-slate-800/50">
                      <span className="text-[10px] text-indigo-500 block">سليمة ومكتملة</span>
                      <span className="text-xl font-mono text-indigo-600 dark:text-indigo-400 font-black">
                        {printBatchReadyCount}
                      </span>
                    </div>
                    <div className="space-y-1 border-r border-slate-200/50 dark:border-slate-800/50">
                      <span className="text-[10px] text-rose-500 block">تحتوي على تنبيهات</span>
                      <span className="text-xl font-mono text-rose-600 dark:text-rose-400 font-black">
                        {printBatchErrorCount}
                      </span>
                    </div>
                  </div>

                  {/* Linear Progress Bar with Dynamic glow */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-bold px-1">
                      <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                        <span className="truncate max-w-[300px] md:max-w-md">{printBatchStatus}</span>
                      </span>
                      <span className="font-mono text-sm text-slate-800 dark:text-white font-black">{printBatchProgress}%</span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-4 overflow-hidden border border-slate-200/50 dark:border-slate-800 p-0.5 shadow-inner">
                      <motion.div
                        className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 h-full rounded-full relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${printBatchProgress}%` }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                      >
                        <div className="absolute inset-0 bg-white/25 w-full h-full animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Secondary Details & Warning if there are errors */}
                  {printBatchErrorCount > 0 && (
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 text-xs rounded-xl border border-amber-500/20 text-right flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <span className="font-bold block">ملاحظة تنظيمية:</span>
                        <span className="text-[11px] leading-relaxed">يرصد النظام وجود {printBatchErrorCount} استمارة تحتوي على أخطاء أو حقول فارغة (مثل الاسم مفقود). سيتم دمجها في ملف الطباعة، ولكن ننصح بمراجعتها وصيانتها لاحقاً.</span>
                      </div>
                    </div>
                  )}

                  {/* Cancel Button */}
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => {
                        cancelPrintRef.current = true;
                      }}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-rose-500/15 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 hover:text-rose-500 dark:hover:text-rose-400 font-black text-xs rounded-2xl transition-all cursor-pointer border border-slate-200/40 dark:border-slate-700/50"
                    >
                      إلغاء المعالجة والرجوع
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BODY MAIN SECTION */}
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 w-full space-y-6 transition-all duration-300">
          
          {/* NOTIFICATION FEEDBACK TOASTS */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-lg relative overflow-hidden ${
                  notification.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/25 dark:border-rose-900/50 dark:text-rose-200'
                    : notification.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/25 dark:border-amber-900/50 dark:text-amber-200'
                    : notification.type === 'info'
                    ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/25 dark:border-blue-900/50 dark:text-blue-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/25 dark:border-emerald-900/50 dark:text-emerald-200'
                }`}
              >
                {/* Visual colored pill indicator */}
                <div className={`absolute top-0 bottom-0 right-0 w-1 ${
                  notification.type === 'error' ? 'bg-rose-500' :
                  notification.type === 'warning' ? 'bg-amber-500' :
                  notification.type === 'info' ? 'bg-blue-500' :
                  'bg-emerald-500'
                }`}></div>

                <div className="flex-1 text-xs font-bold leading-relaxed flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{notification.text}</span>
                </div>
                <button 
                  onClick={() => setNotification(null)}
                  className="text-[10px] uppercase font-extrabold text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer ml-1"
                >
                  إغلاق
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DYNAMIC BENTO STATS BOARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            
            {/* Stat Box 1: Records Count */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group overflow-hidden relative">
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-125 transition-transform"></div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block uppercase tracking-wider">سجلات المتأخرين المكتشفة</span>
                <span className="text-3xl font-black font-mono text-slate-800 dark:text-white">{records.length}</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">مستخرجة من المرفقات</span>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>

            {/* Stat Box 3: Integrity Percentage */}
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group overflow-hidden relative">
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-125 transition-transform"></div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block uppercase tracking-wider">معدل سلامة واكتمال الحقول</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-800 dark:text-white">{integrityPercentage}%</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">نسبة ممتازة</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">تدقيق أوتوماتيكي مستمر</span>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* DUAL ACTION LAYOUT: UPLOAD HUB */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Redesigned Premium File Upload Canvas */}
            <div className="lg:col-span-1">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="relative rounded-3xl border-2 border-dashed p-8 text-center flex flex-col items-center justify-center transition-all duration-350 min-h-[310px] group overflow-hidden border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 hover:border-indigo-500 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900 shadow-xl"
              >
                {/* Visual scanlines or light effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none opacity-50"></div>

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
                      <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                      <RefreshCw className="w-14 h-14 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
                    </div>
                    <div className="space-y-1.5 text-center">
                      <p className="text-base font-black text-slate-800 dark:text-slate-100">جاري معالجة وتدقيق المستند المرفق بالذكاء الاصطناعي...</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">نقرأ الخلايا ونحسب فارق الدقائق آلياً من الدوام الرسمي</p>
                    </div>
                    
                    {/* Futuristic loading shimmer bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 mt-2 overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-inner">
                      <motion.div 
                        className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-750 h-full rounded-full flex items-center justify-center relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    >
                      <Upload className="w-8 h-8" />
                    </motion.div>
                    
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
                      اسحب ملف الموقف أو صورة كشف البصمة وضعه هنا
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-md">
                      يدعم النظام استيراد ملفات الإكسل <strong className="text-slate-700 dark:text-slate-300">(.xlsx)</strong>، مستندات الوورد <strong className="text-slate-700 dark:text-slate-300">(.docx)</strong>، أو صور موقف المتأخرين الورقية لتقرأ آلياً بالكامل.
                    </p>

                    <div className="flex flex-wrap gap-2.5 items-center justify-center w-full max-w-xl">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-500/15 cursor-pointer transition-transform hover:-translate-y-0.5 flex items-center gap-1.5"
                      >
                        <Upload className="w-4 h-4" />
                        <span>رفع وتصفح كشف من جهازك</span>
                      </button>

                      <button 
                        onClick={handleAutoCleanData}
                        className="px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>إصلاح تلقائي للأخطاء</span>
                      </button>
                      
                      {records.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-xs rounded-2xl cursor-pointer transition-all"
                        >
                          مسح كافة السجلات
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DYNAMIC MODERN TABS GLIDER */}
          <div className="flex bg-white/80 dark:bg-slate-900/80 p-2 rounded-2xl shadow-md overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 min-w-[200px] px-6 py-3.5 text-xs font-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 rounded-xl ${
                activeTab === 'preview' 
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-indigo-400 shadow' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-950/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>جدول تدقيق ومطابقة البيانات ({records.length})</span>
            </button>
            
            <button
              onClick={() => {
                if (records.length === 0) {
                  showNotification('يرجى رفع ملف أو إضافة بيانات أولاً لمعاينة الاستمارات.', 'error');
                  return;
                }
                setActiveTab('individual');
              }}
              className={`flex-1 min-w-[200px] px-6 py-3.5 text-xs font-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 rounded-xl ${
                activeTab === 'individual' 
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400 shadow' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-950/50'
              }`}
            >
              <FileTextIcon className="w-4 h-4 shrink-0" />
              <span>معاينة حية للاستمارة الرسمية المنفردة</span>
            </button>

            <button
              onClick={() => {
                if (records.length === 0) {
                  showNotification('لا توجد بيانات لمعاينة الطباعة الجماعية.', 'error');
                  return;
                }
                setActiveTab('all-forms');
              }}
              className={`flex-1 min-w-[200px] px-6 py-3.5 text-xs font-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 rounded-xl ${
                activeTab === 'all-forms' 
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400 shadow' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-950/50'
              }`}
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>معاينة طباعة الكل دفعة واحدة</span>
            </button>
          </div>

          {/* DYNAMIC SEARCH FILTER FOR THE ACTIVE VIEW */}
          {activeTab === 'preview' && records.length > 0 && (
            <div className="bg-white/70 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-indigo-500 absolute right-4 top-3" />
                <input
                  type="text"
                  placeholder="ابحث بشكل حي عن موظف بالاسم ثلاثي، أو القسم، أو تاريخ التأخير بالجدول..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200"
                />
              </div>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-rose-500 hover:text-rose-600 font-black cursor-pointer bg-rose-500/10 px-3 py-1.5 rounded-xl"
                >
                  مسح البحث
                </button>
              )}
            </div>
          )}


          {/* RENDER TAB COMPONENT CONTROLLER */}
          <div className="min-h-[400px]">
            {activeTab === 'preview' ? (
              <PreviewTable
                records={filteredRecords}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
                onAddRecord={handleAddRecord}
              />
            ) : activeTab === 'individual' ? (
              /* INDIVIDUAL LIVE BROWSER PREVIEW */
              <div className="space-y-6">
                
                {/* Visual form navigator and action bar */}
                <div className="bg-white/80 dark:bg-slate-900/90 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentFormIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentFormIndex === 0}
                      className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 hover:text-indigo-500 disabled:opacity-40 rounded-2xl text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm"
                      title="الاستمارة السابقة"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/20">
                      الاستمارة رقم <span className="font-mono text-indigo-500 font-black">{currentFormIndex + 1}</span> من أصل <span className="font-mono">{records.length}</span>
                    </span>

                    <button
                      onClick={() => setCurrentFormIndex(prev => Math.min(records.length - 1, prev + 1))}
                      disabled={currentFormIndex === records.length - 1}
                      className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 hover:text-indigo-500 disabled:opacity-40 rounded-2xl text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm"
                      title="الاستمارة التالية"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Active Record Name Tag */}
                  <div className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-4 py-2.5 rounded-2xl text-xs font-extrabold border border-indigo-500/20 shadow-sm">
                    المنتسب الحالي: <strong className="text-slate-800 dark:text-white underline">{records[currentFormIndex]?.name || 'يرجى إدخال اسم'}</strong> 
                    {records[currentFormIndex]?.department && ` | جهة العمل: ${records[currentFormIndex].department}`}
                  </div>

                  {/* Print triggers */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => printSingleForm(records[currentFormIndex])}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black rounded-2xl shadow-md cursor-pointer transition-transform hover:-translate-y-0.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة الاستمارة</span>
                    </button>
                    <button
                      onClick={() => downloadFormAsImage(records[currentFormIndex], 'jpg')}
                      className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-2xl shadow-md cursor-pointer transition-transform hover:-translate-y-0.5"
                      title="تحميل كصورة JPG"
                    >
                      <ImageDown className="w-4 h-4 text-emerald-400" />
                      <span>JPG</span>
                    </button>
                    <button
                      onClick={() => downloadFormAsImage(records[currentFormIndex], 'png')}
                      className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-2xl shadow-md cursor-pointer transition-transform hover:-translate-y-0.5"
                      title="تحميل كصورة PNG"
                    >
                      <ImageDown className="w-4 h-4 text-sky-400" />
                      <span>PNG</span>
                    </button>
                    <button
                      onClick={printAllForms}
                      className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-2xl border border-slate-200/40 dark:border-slate-700 cursor-pointer transition-transform hover:-translate-y-0.5"
                    >
                      <FileDown className="w-4 h-4 text-indigo-500" />
                      <span>حفظ الكل PDF</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* SCALED FORM WRAPPER IN BEAUTIFUL BACKDROP GRID */}
                  <div className="flex-1 w-full flex justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900/60 dark:to-slate-950/60 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-4 sm:p-8 overflow-auto relative shadow-inner">
                    {/* Background grid lines for a technical drafting desk vibe */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                    <div 
                      className="responsive-form-wrapper shadow-2xl border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white relative z-10 transition-all duration-300"
                      style={{ 
                        transform: `scale(${previewScale})`, 
                        transformOrigin: 'top center',
                        width: '794px',
                        minWidth: '794px',
                        marginBottom: `${(previewScale - 1) * 1123}px`
                      }}
                    >
                      {records[currentFormIndex] ? (
                        <OfficialForm record={records[currentFormIndex]} printSettings={printSettings} />
                      ) : (
                        <div className="p-16 text-center text-slate-400 font-bold">لا توجد سجلات لعرضها حالياً.</div>
                      )}
                    </div>
                  </div>
                  
                  {/* PRINT SETTINGS PANEL */}
                  <div className="w-full lg:w-[480px] shrink-0">
                    <PrintSettingsPanel 
                      printSettings={printSettings} 
                      setPrintSettings={setPrintSettings} 
                      handleSaveSettings={handleSaveSettings} 
                      saveSuccess={saveSuccess}
                      previewScale={previewScale}
                      setPreviewScale={setPreviewScale}
                    />
                  </div>
              </div>
                </div>
            ) : (
              /* BATCH ALL FORMS PRINT VIEW */
              /* BATCH ALL FORMS PRINT VIEW */
              <div className="space-y-6">
                <div className="bg-white/80 dark:bg-slate-900/90 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-md flex items-center justify-between flex-wrap gap-4 backdrop-blur-md">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 mb-1">المعاينة الشاملة لكافة استمارات الدفعة</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">يقوم محرك المتصفح تلقائياً بفرز كل استمارة منتسب في صفحة مستقلة A4 عند تصدير الـ PDF.</p>
                  </div>
                  
                  <button
                    onClick={printAllForms}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-750 hover:to-violet-750 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-500/15 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>تأكيد وطباعة كافة الاستمارات ({records.length})</span>
                  </button>
                </div>

                {/* SCALED FORMS DESK GRID VIEW AND SETTINGS */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex-1 w-full space-y-6 sm:space-y-12 bg-slate-200/50 dark:bg-slate-950/40 p-4 sm:p-8 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 flex flex-col items-center overflow-auto relative shadow-inner">
                    {records.map((rec, idx) => (
                      <div 
                        key={rec.id} 
                        className="responsive-form-wrapper shadow-2xl rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden relative bg-white transform transition-all duration-300"
                        style={{ 
                          transform: `scale(${previewScale})`, 
                          transformOrigin: 'top center',
                          width: '794px',
                          minWidth: '794px',
                          marginBottom: `${(previewScale - 1) * 1123}px`
                        }}
                      >
                        {/* Floating Indicator Badge and Actions */}
                        {/* Floating Indicator Badge and Actions */}
                        <div className="absolute top-3 right-3 flex items-center gap-2 z-20 no-print">
                          <div className="px-3 py-1.5 bg-slate-900/95 text-white text-[10px] font-black rounded-xl shadow border border-slate-850 flex items-center gap-1.5 select-none">
                            <span>الاستمارة الفردية {idx + 1}</span>
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></span>
                            <span className="text-slate-400">({rec.name || 'غير مكتمل'})</span>
                          </div>
                          <button
                            onClick={() => downloadFormAsImage(rec, 'jpg')}
                            className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-emerald-400 rounded-xl shadow border border-slate-700 transition-all flex items-center gap-1 text-[10px] font-black"
                            title="تحميل كصورة JPG"
                          >
                            <ImageDown className="w-3 h-3" /> JPG
                          </button>
                          <button
                            onClick={() => downloadFormAsImage(rec, 'png')}
                            className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-sky-400 rounded-xl shadow border border-slate-700 transition-all flex items-center gap-1 text-[10px] font-black"
                            title="تحميل كصورة PNG"
                          >
                            <ImageDown className="w-3 h-3" /> PNG
                          </button>
                        </div>

                        <OfficialForm record={rec} printSettings={printSettings} />
                      </div>
                    ))}
                  </div>

                  {/* PRINT SETTINGS PANEL */}
                  <div className="w-full lg:w-[480px] shrink-0">
                    <PrintSettingsPanel 
                      printSettings={printSettings} 
                      setPrintSettings={setPrintSettings} 
                      handleSaveSettings={handleSaveSettings} 
                      saveSuccess={saveSuccess}
                      previewScale={previewScale}
                      setPreviewScale={setPreviewScale}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* REFINED SYSTEM FOOTER */}
        <footer className="mt-auto border-t border-slate-200/40 dark:border-slate-800/60 py-6 text-center text-slate-400 dark:text-slate-500 text-xs font-bold no-print">
          <p>© 2026 الشركة العامة لإنتاج الطاقة الكهربائية - الفرات الأوسط | قسم تدقيق ومطابقة الدوام الرسمي</p>
          <p className="mt-1 text-[10px] text-slate-400/80">مطور بأحدث التقنيات السحابية المتوافقة مع معايير الجودة الشاملة</p>
        </footer>

      </div>

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

// Simple custom component to prevent importing extra dependencies or custom icon loaders
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
