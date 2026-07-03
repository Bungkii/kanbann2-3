"use client";

import { useState } from "react";
import { updateSystemSetting } from "./actions";
import toast from "react-hot-toast";

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

  return (
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
  );
}
