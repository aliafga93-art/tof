import React from 'react';
import { Settings, Compass, Save, CheckCircle2 } from 'lucide-react';
import { PrintSettings } from '../types';

export default function PrintSettingsPanel({ 
  printSettings, 
  setPrintSettings, 
  handleSaveSettings, 
  saveSuccess,
  previewScale,
  setPreviewScale
}: { 
  printSettings: PrintSettings; 
  setPrintSettings: React.Dispatch<React.SetStateAction<PrintSettings>>; 
  handleSaveSettings: () => void;
  saveSuccess: boolean;
  previewScale: number;
  setPreviewScale: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
            <div className="bg-white/80 dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-xl flex flex-col gap-6 relative sticky top-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                
                {/* Sliders and fields */}
                <div className="flex-1 w-full space-y-5">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
                    <h3 className="font-extrabold text-sm">أدوات ضبط هوامش ومواقع الطباعة والتحكم بالرؤية</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Header date note presets */}
                    <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                      <span className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 block mb-2">خيارات العرض وحجم المعاينة</span>
                      <div className="flex flex-wrap gap-4 text-xs font-bold">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={printSettings.showHeader}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, showHeader: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-slate-700 dark:text-slate-300">عرض خلفية وترويسة الاستمارة بالطباعة</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={printSettings.showDate}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, showDate: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-slate-700 dark:text-slate-300">عرض تاريخ تنظيم الورقة</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/15 px-3 py-1.5 rounded-xl border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 transition-all">
                          <input 
                            type="checkbox" 
                            checked={printSettings.showAffiliation ?? false}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, showAffiliation: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>تفعيل جهة الانتساب (محطة كهرباء الخيرات الغازية)</span>
                        </label>
                      </div>

                      {/* Preview Zoom Slider - Solves user's issue with having to zoom/scale screen */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                        <div className="flex justify-between text-[10px] font-extrabold text-slate-500">
                          <span>نسبة زووم وتكبير المعاينة بالأسفل ({Math.round(previewScale * 100)}%):</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">للرؤية دون تصغير المتصفح</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400">صغير</span>
                          <input 
                            type="range" 
                            min="0.4" 
                            max="1.3" 
                            step="0.05" 
                            value={previewScale}
                            onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-slate-400">كبير جداً</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-extrabold text-slate-400">ملاحظة إضافية تظهر أسفل الاستمارة:</span>
                        <input 
                          type="text" 
                          placeholder="مثال: يرجى تقديم العذر الفعلي خلال ٣ أيام..." 
                          value={printSettings.customNote}
                          onChange={(e) => setPrintSettings(prev => ({ ...prev, customNote: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {(printSettings.showAffiliation ?? false) && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-extrabold text-slate-400">نص جهة الانتساب:</span>
                          <input 
                            type="text" 
                            placeholder="جهة الانتساب..." 
                            value={printSettings.affiliationText ?? 'محطة كهرباء الخيرات الغازية'}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, affiliationText: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Font family selection */}
                    <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                      <span className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 block mb-2">تخصيص الخطوط والأحجام بالاستمارة</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400">نوع الخط العربي:</span>
                          <select
                            value={printSettings.fontFamily || 'Amiri'}
                            onChange={(e) => setPrintSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                          >
                            <option value="Arial">Arial (الافتراضي)</option>
                            <option value="Cairo">Cairo (خط هندسي)</option>
                            <option value="Tajawal">Tajawal (خط رسمي مريح)</option>
                            <option value="Readex Pro">Readex Pro (خط جودة حديث)</option>
                            <option value="Almarai">Almarai (خط واضح عريض)</option>
                            <option value="Amiri">Amiri (خط كلاسيكي نسخي)</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400">حجم الخط ({printSettings.fontSize ?? 15}px):</span>
                          <div className="flex items-center gap-2 pt-1.5">
                            <input
                              type="range"
                              min="10"
                              max="24"
                              step="1"
                              value={printSettings.fontSize ?? 15}
                              onChange={(e) => setPrintSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                              className="w-full accent-indigo-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Redesigned Physical Coordinates Control Panel: Open, large, and spacious with high legibility */}
                  <div className="space-y-4 p-5 bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/40 dark:from-slate-950 dark:to-slate-900 rounded-2xl border border-indigo-200/30 dark:border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <Compass className="w-5 h-5" />
                        <h4 className="text-xs font-black">لوحة ضبط الإزاحة الدقيقة وتعديل المسافات للحقول (قيم مئوية لورقة A4)</h4>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-extrabold px-3 py-1 rounded-full border border-indigo-500/20">
                        لوحة تحكم مكبرة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                      {/* Name Position */}
                      <div className="space-y-2 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block border-b border-slate-200/40 pb-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                          <span>اسم الموظف</span>
                        </span>
                        <div className="space-y-2.5 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>أعلى (Y)</span>
                              <span className="font-mono text-indigo-600 dark:text-indigo-400">{printSettings.positions?.name?.top ?? 27}%</span>
                            </div>
                            <input type="range" min="20" max="40" step="0.1" value={printSettings.positions?.name?.top ?? 27} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, name: { ...prev.positions?.name, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>يمين (X)</span>
                              <span className="font-mono text-indigo-600 dark:text-indigo-400">{printSettings.positions?.name?.right ?? 18}%</span>
                            </div>
                            <input type="range" min="10" max="50" step="0.1" value={printSettings.positions?.name?.right ?? 18} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, name: { ...prev.positions?.name, right: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                        </div>
                      </div>

                      {/* Affiliation Position */}
                      {(printSettings.showAffiliation ?? false) && (
                        <div className="space-y-2 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm animate-fadeIn">
                          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block border-b border-slate-200/40 pb-1 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
                            <span>جهة الانتساب</span>
                          </span>
                          <div className="space-y-2.5 pt-1">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                                <span>أعلى (Y)</span>
                                <span className="font-mono text-teal-600 dark:text-teal-400">{(printSettings.positions as any)?.affiliation?.top ?? 27.5}%</span>
                              </div>
                              <input type="range" min="20" max="40" step="0.1" value={(printSettings.positions as any)?.affiliation?.top ?? 27.5} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, affiliation: { ...((prev.positions as any)?.affiliation ?? { right: 18 }), top: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                                <span>يمين (X)</span>
                                <span className="font-mono text-teal-600 dark:text-teal-400">{(printSettings.positions as any)?.affiliation?.right ?? 18}%</span>
                              </div>
                              <input type="range" min="10" max="50" step="0.1" value={(printSettings.positions as any)?.affiliation?.right ?? 18} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, affiliation: { ...((prev.positions as any)?.affiliation ?? { top: 27.5 }), right: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Department Position */}
                      <div className="space-y-2 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block border-b border-slate-200/40 pb-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block"></span>
                          <span>اسم القسم</span>
                        </span>
                        <div className="space-y-2.5 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>أعلى (Y)</span>
                              <span className="font-mono text-violet-600 dark:text-violet-400">{printSettings.positions?.department?.top ?? 29.7}%</span>
                            </div>
                            <input type="range" min="20" max="40" step="0.1" value={printSettings.positions?.department?.top ?? 29.7} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, department: { ...prev.positions?.department, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>يسار (X)</span>
                              <span className="font-mono text-violet-600 dark:text-violet-400">{printSettings.positions?.department?.left ?? 15}%</span>
                            </div>
                            <input type="range" min="0" max="50" step="0.1" value={printSettings.positions?.department?.left ?? 15} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, department: { ...prev.positions?.department, left: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                        </div>
                      </div>

                      {/* Date Lateness Position */}
                      <div className="space-y-2 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block border-b border-slate-200/40 pb-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                          <span>تاريخ التأخير</span>
                        </span>
                        <div className="space-y-2.5 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>أعلى (Y)</span>
                              <span className="font-mono text-amber-600 dark:text-amber-400">{printSettings.positions?.dateLateness?.top ?? 22.5}%</span>
                            </div>
                            <input type="range" min="15" max="35" step="0.1" value={printSettings.positions?.dateLateness?.top ?? 22.5} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, dateLateness: { ...prev.positions?.dateLateness, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>يسار (X)</span>
                              <span className="font-mono text-amber-600 dark:text-amber-400">{printSettings.positions?.dateLateness?.left ?? 8}%</span>
                            </div>
                            <input type="range" min="0" max="30" step="0.1" value={printSettings.positions?.dateLateness?.left ?? 8} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, dateLateness: { ...prev.positions?.dateLateness, left: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                        </div>
                      </div>

                      {/* Time Lateness Position */}
                      <div className="space-y-2 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block border-b border-slate-200/40 pb-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                          <span>وقت البصمة</span>
                        </span>
                        <div className="space-y-2.5 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>أعلى (Y)</span>
                              <span className="font-mono text-rose-600 dark:text-rose-400">{printSettings.positions?.timeLateness?.top ?? 24.8}%</span>
                            </div>
                            <input type="range" min="15" max="35" step="0.1" value={printSettings.positions?.timeLateness?.top ?? 24.8} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, timeLateness: { ...prev.positions?.timeLateness, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>يسار (X)</span>
                              <span className="font-mono text-rose-600 dark:text-rose-400">{printSettings.positions?.timeLateness?.left ?? 8}%</span>
                            </div>
                            <input type="range" min="0" max="30" step="0.1" value={printSettings.positions?.timeLateness?.left ?? 8} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, timeLateness: { ...prev.positions?.timeLateness, left: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                        </div>
                      </div>

                      {/* Date Created Position */}
                      <div className="space-y-2 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block border-b border-slate-200/40 pb-1 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                          <span>تاريخ الموقف</span>
                        </span>
                        <div className="space-y-2.5 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>أعلى (Y)</span>
                              <span className="font-mono text-sky-600 dark:text-sky-400">{printSettings.positions?.dateCreated?.top ?? 19.2}%</span>
                            </div>
                            <input type="range" min="10" max="30" step="0.1" value={printSettings.positions?.dateCreated?.top ?? 19.2} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, dateCreated: { ...prev.positions?.dateCreated, top: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                              <span>يسار (X)</span>
                              <span className="font-mono text-sky-600 dark:text-sky-400">{printSettings.positions?.dateCreated?.left ?? 8}%</span>
                            </div>
                            <input type="range" min="0" max="30" step="0.1" value={printSettings.positions?.dateCreated?.left ?? 8} onChange={(e) => setPrintSettings(prev => ({ ...prev, positions: { ...prev.positions, dateCreated: { ...prev.positions?.dateCreated, left: parseFloat(e.target.value) } } as any }))} className="w-full accent-indigo-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* SAVE CONFIG BUTTON */}
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                  * الإزاحات هي قيم مئوية نسبية لقياس صفحة A4 القياسية.
                </p>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-800 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-600 dark:hover:text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 dark:text-white" />
                      <span>تم حفظ التفضيلات بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-indigo-400" />
                      <span>حفظ الإعدادات كافتراضية</span>
                    </>
                  )}
                </button>
              </div>
            </div>
  );
}
