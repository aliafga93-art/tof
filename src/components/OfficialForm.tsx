import React from 'react';
import { LatenessRecord } from '../types';

interface OfficialFormProps {
  record: LatenessRecord;
}

export default function OfficialForm({ record }: OfficialFormProps) {
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

      {/* حاوية النصوص المتغيرة (البيانات) */}
      <div className="absolute inset-0 z-10 font-bold text-black" style={{ fontSize: '15px' }}>
        
        {/* اسم الموظف - من بداية السطر */}
        <div className="absolute" style={{ top: '27%', right: '18%', width: '40%', textAlign: 'right' }}>
          {record.name}
        </div>

        {/* القسم - من بداية السطر */}
        <div className="absolute" style={{ top: '29.7%', right: '35%', width: '30%', textAlign: 'right' }}>
          {record.department}
        </div>

        {/* تاريخ تنظيم الاستمارة */}
        <div className="absolute" style={{ top: '19.2%', left: '8%', width: '22%', textAlign: 'center' }}>
          <span className="font-mono text-black">{record.dateString}</span>
        </div>

        {/* تاريخ التأخير */}
        <div className="absolute" style={{ top: '22.5%', left: '8%', width: '22%', textAlign: 'center' }}>
          <span className="font-mono text-black">{record.dateString}</span>
        </div>

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

