import React from 'react';
import { LatenessRecord } from '../types';

interface PrintSettings {
  showHeader: boolean;
  showDate: boolean;
  customNote: string;
}

interface OfficialFormProps {
  record: LatenessRecord;
  printSettings: PrintSettings;
}

export default function OfficialForm({ record, printSettings }: OfficialFormProps) {
  return (
    <div 
      id={`form-${record.id}`}
      className="official-form-page relative mx-auto bg-white text-black rtl text-right select-none"
      style={{
        width: '210mm',
        height: '297mm', // Fixed height for A4
        boxSizing: 'border-box',
        pageBreakAfter: 'always',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* 
        صورة الخلفية: يرجى رفع صورة الاستمارة الأصلية إلى مجلد public 
        وتسميتها "form-bg.jpg" أو تعديل المسار أدناه ليطابق اسم الصورة المرفوعة 
      */}
      <img 
        src="/form-bg.jpg" 
        alt="Form Background"
        className="absolute inset-0 w-full h-full object-fill z-0 print:object-fill"
        style={{ width: '210mm', height: '297mm' }}
      />

      {/* White overlay to hide the official header (if requested) */}
      {!printSettings?.showHeader && (
        <div className="absolute top-0 right-0 w-full h-[18%] bg-white z-[5]"></div>
      )}

      {/* حاوية النصوص المتغيرة (البيانات) */}
      <div className="absolute inset-0 z-10 font-bold text-black" style={{ fontSize: '15px' }}>
        
        {/* الملاحظة الإضافية (إن وجدت) */}
        {printSettings?.customNote && (
          <div className="absolute" style={{ top: '8%', right: '10%', width: '80%', textAlign: 'center', fontSize: '18px', color: '#1f2937' }}>
            {printSettings.customNote}
          </div>
        )}

        {/* اسم الموظف - من بداية السطر */}
        <div className="absolute" style={{ top: '27%', right: '18%', width: '40%', textAlign: 'right' }}>
          {record.name}
        </div>

        {/* القسم - من بداية السطر */}
        <div className="absolute" style={{ top: '29.7%', right: '35%', width: '30%', textAlign: 'right' }}>
          {record.department}
        </div>

        {/* تاريخ تنظيم الاستمارة */}
        {printSettings?.showDate && (
          <div className="absolute" style={{ top: '19.2%', left: '8%', width: '22%', textAlign: 'center' }}>
            <span className="font-mono text-black">{record.dateString}</span>
          </div>
        )}

        {/* تاريخ التأخير */}
        {printSettings?.showDate && (
          <div className="absolute" style={{ top: '22.5%', left: '8%', width: '22%', textAlign: 'center' }}>
            <span className="font-mono text-black">{record.dateString}</span>
          </div>
        )}

        {/* وقت البصمة */}
        <div className="absolute" style={{ top: '24.8%', left: '8%', width: '22%', textAlign: 'center' }}>
          <span className="font-mono text-black">
            {record.timeString}
          </span>
        </div>

      </div>
    </div>
  );
}

