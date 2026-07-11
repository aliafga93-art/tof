import React from 'react';
import { LatenessRecord, PrintSettings } from '../types';

interface OfficialFormProps {
  record: LatenessRecord;
  printSettings: PrintSettings;
}

const getFontFamily = (font?: string) => {
  if (!font) return '"Amiri", serif';
  if (font.includes('Cairo')) return '"Cairo", sans-serif';
  if (font.includes('Tajawal')) return '"Tajawal", sans-serif';
  if (font.includes('Readex')) return '"Readex Pro", sans-serif';
  if (font.includes('Almarai')) return '"Almarai", sans-serif';
  if (font.includes('Amiri')) return '"Amiri", serif';
  if (font.includes('Arial')) return 'Arial, sans-serif';
  return font;
};

export default function OfficialForm({ record, printSettings }: OfficialFormProps) {
  return (
    <div 
      id={`form-${record.id}`}
      className="official-form-page relative mx-auto bg-white text-black rtl text-right select-none"
      style={{
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
        style={{ width: '100%', height: '100%' }}
      />

      {/* White overlay to hide the official header (if requested) */}
      {!printSettings?.showHeader && (
        <div className="absolute top-0 right-0 w-full h-[18%] bg-white z-[5]"></div>
      )}

      {/* حاوية النصوص المتغيرة (البيانات) */}
      <div className="absolute inset-0 z-10 font-bold text-black" style={{ fontSize: `${printSettings?.fontSize ?? 15}px`, fontFamily: getFontFamily(printSettings?.fontFamily) }}>
        
        {/* الملاحظة الإضافية (إن وجدت) */}
        {printSettings?.customNote && (
          <div className="absolute" style={{ top: '8%', right: '10%', width: '80%', textAlign: 'center', fontSize: '18px', color: '#1f2937' }}>
            {printSettings.customNote}
          </div>
        )}

        {/* اسم الموظف - من بداية السطر */}
        <div className="absolute" style={{ top: `${printSettings?.positions?.name?.top ?? 25.5}%`, right: `${printSettings?.positions?.name?.right ?? 18}%`, width: '40%', textAlign: 'right' }}>
          {record.name}
        </div>

        {/* جهة الانتساب - تحت اسم الموظف */}
        {printSettings?.showAffiliation && (
          <div className="absolute font-bold text-black" style={{ top: `${printSettings?.positions?.affiliation?.top ?? 27.5}%`, right: `${printSettings?.positions?.affiliation?.right ?? 18}%`, width: '40%', textAlign: 'right' }}>
            {printSettings.affiliationText ?? 'محطة كهرباء الخيرات الغازية'}
          </div>
        )}

        {/* القسم - من بداية السطر */}
        <div className="absolute" style={{ top: `${printSettings?.positions?.department?.top ?? 29.5}%`, left: `${printSettings?.positions?.department?.left ?? 15}%`, width: '30%', textAlign: 'right' }}>
          {record.department}
        </div>

        {/* تاريخ تنظيم الاستمارة */}
        {printSettings?.showDate && (
          <div className="absolute" style={{ top: `${printSettings?.positions?.dateCreated?.top ?? 19.5}%`, left: `${printSettings?.positions?.dateCreated?.left ?? 8}%`, width: '22%', textAlign: 'center' }}>
            <span className="text-black">{record.dateString}</span>
          </div>
        )}

        {/* تاريخ التأخير */}
        {printSettings?.showDate && (
          <div className="absolute" style={{ top: `${printSettings?.positions?.dateLateness?.top ?? 22.0}%`, left: `${printSettings?.positions?.dateLateness?.left ?? 8}%`, width: '22%', textAlign: 'center' }}>
            <span className="text-black">{record.dateString}</span>
          </div>
        )}

        {/* وقت البصمة */}
        <div className="absolute" style={{ top: `${printSettings?.positions?.timeLateness?.top ?? 23.5}%`, left: `${printSettings?.positions?.timeLateness?.left ?? 8}%`, width: '22%', textAlign: 'center' }}>
          <span className="text-black">
            {record.timeString}
          </span>
        </div>
      </div>
    </div>
  );
}
