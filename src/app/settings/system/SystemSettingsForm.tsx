"use client";

import { useState } from "react";
import { updateSystemSetting } from "./actions";
import toast from "react-hot-toast";
import { Download } from "lucide-react";

const systemFeatures = [
  { key: "add_work_enabled", label: "ระบบจดงาน (Add Work)", description: "เปิด-ปิดหน้าสำหรับเพิ่มงานใหม่" },
  { key: "kanban_enabled", label: "ระบบกระดานงาน (Kanban)", description: "เปิด-ปิดหน้ากระดานทวงงาน" },
  { key: "summaries_enabled", label: "ระบบแจกสรุปสอบ (Summaries)", description: "เปิด-ปิดหน้าโหลดสรุปสอบ" },
  { key: "election_enabled", label: "ระบบผลเลือกตั้ง (Election)", description: "เปิด-ปิดหน้าดูผลเลือกตั้ง" },
  { key: "boss_evaluation_enabled", label: "ระบบประเมินหัวหน้า (Evaluate Boss)", description: "เปิด-ปิดหน้าประเมินหัวหน้าห้อง" },
];

export default function SystemSettingsForm({ 
  initialSettings 
}: { 
  initialSettings: Record<string, any>
}) {
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    const defaultSettings: Record<string, boolean> = {};
    systemFeatures.forEach(feature => {
      defaultSettings[feature.key] = initialSettings[feature.key] !== false; // Default to true
    });
    return defaultSettings;
  });

  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

  const handleToggle = async (key: string) => {
    const newValue = !settings[key];
    
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setSavingKeys(prev => ({ ...prev, [key]: true }));
    
    const result = await updateSystemSetting(key, newValue);
    
    setSavingKeys(prev => ({ ...prev, [key]: false }));
    if (result.success) {
      toast.success(`อัปเดตการตั้งค่าสำเร็จ!`);
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      setSettings(prev => ({ ...prev, [key]: !newValue })); // Revert
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export-boss');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'boss_evaluations.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('ส่งออกข้อมูลสำเร็จ!');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-pink-900 text-lg">รายงานผลประเมินหัวหน้า</h3>
          <p className="text-sm text-pink-700">ส่งออกข้อมูลการประเมินทั้งหมดเป็นไฟล์เอกสาร PDF</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${
            isExporting ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 hover:-translate-y-1 hover:shadow-lg'
          }`}
        >
          <Download className="w-5 h-5" />
          {isExporting ? 'กำลังสร้างไฟล์...' : 'Export PDF'}
        </button>
      </div>

      <div className="space-y-4">
      {systemFeatures.map((feature) => {
        const isEnabled = settings[feature.key];
        const isSaving = savingKeys[feature.key];

        return (
          <div key={feature.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:border-slate-200">
            <div>
              <h3 className="font-semibold text-slate-800 text-base md:text-lg">{feature.label}</h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {feature.description}
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isEnabled}
                onChange={() => handleToggle(feature.key)}
                disabled={isSaving}
              />
              <div className={`w-14 h-7 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'} ${isSaving ? 'opacity-50' : ''}`}></div>
            </label>
          </div>
        );
      })}
    </div>
    </div>
  );
}
