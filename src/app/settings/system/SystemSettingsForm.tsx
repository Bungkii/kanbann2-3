"use client";

import { useState } from "react";
import { updateSystemSetting } from "./actions";
import toast from "react-hot-toast";

export default function SystemSettingsForm({ 
  initialBossEvalEnabled 
}: { 
  initialBossEvalEnabled: boolean 
}) {
  const [bossEvalEnabled, setBossEvalEnabled] = useState(initialBossEvalEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async () => {
    const newValue = !bossEvalEnabled;
    setBossEvalEnabled(newValue);
    setIsSaving(true);
    
    const result = await updateSystemSetting('boss_evaluation_enabled', newValue);
    
    setIsSaving(false);
    if (result.success) {
      toast.success(`อัปเดตการตั้งค่าสำเร็จ! (${newValue ? 'เปิด' : 'ปิด'}แบบประเมินหัวหน้าแล้ว)`);
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      setBossEvalEnabled(!newValue); // Revert
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">เปิด-ปิด ระบบประเมินหัวหน้า</h3>
          <p className="text-sm text-slate-500">
            หากปิด ผู้ใช้ทั่วไปจะไม่สามารถเข้าหน้าประเมินได้
          </p>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={bossEvalEnabled}
            onChange={handleToggle}
            disabled={isSaving}
          />
          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
    </div>
  );
}
