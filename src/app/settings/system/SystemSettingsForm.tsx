"use client";

import { useState } from "react";
import { updateSystemSetting } from "./actions";
import toast from "react-hot-toast";
import { Download, Image, Link, X } from "lucide-react";

const systemFeatures = [
  { key: "maintenance_mode_enabled", label: "โหมดปิดปรับปรุงระบบ (Maintenance Mode)", description: "บล็อคการเข้าใช้งานเว็บทั้งหมด (ต้องเข้า Database เพื่อเปิดใหม่)" },
  { key: "add_work_enabled", label: "ระบบจดงาน (Add Work)", description: "เปิด-ปิดหน้าสำหรับเพิ่มงานใหม่" },
  { key: "kanban_enabled", label: "ระบบกระดานงาน (Kanban)", description: "เปิด-ปิดหน้ากระดานทวงงาน" },
  { key: "summaries_enabled", label: "ระบบแจกสรุปสอบ (Summaries)", description: "เปิด-ปิดหน้าโหลดสรุปสอบ" },
  { key: "election_enabled", label: "ระบบผลเลือกตั้ง (Election)", description: "เปิด-ปิดหน้าดูผลเลือกตั้ง" },
  { key: "boss_evaluation_enabled", label: "ระบบประเมินหัวหน้า (Evaluate Boss)", description: "เปิด-ปิดหน้าประเมินหัวหน้าห้อง" },
  { key: "announcement_enabled", label: "ประกาศบนเว็บ (Announcement)", description: "แสดงแถบประกาศด้านบนของเว็บ" },
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
  const [announcementText, setAnnouncementText] = useState(initialSettings.announcement_text || '');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Popup image settings
  const [popupImageUrl, setPopupImageUrl] = useState(initialSettings.popup_image_url || '');
  const [popupLinkUrl, setPopupLinkUrl] = useState(initialSettings.popup_link_url || '');
  const [isSavingPopup, setIsSavingPopup] = useState(false);

  const handleToggle = async (key: string) => {
    const newValue = !settings[key];
    
    if (key === 'maintenance_mode_enabled' && newValue) {
      if (!confirm('คำเตือน: หากคุณเปิดโหมดนี้ คุณจะถูกบล็อคออกจากเว็บด้วย และต้องเข้าไปแก้ใน Database เท่านั้น ยืนยันหรือไม่?')) {
        return;
      }
    }

    setSettings(prev => ({ ...prev, [key]: newValue }));
    setSavingKeys(prev => ({ ...prev, [key]: true }));
    
    const result = await updateSystemSetting(key, newValue);
    
    setSavingKeys(prev => ({ ...prev, [key]: false }));
    if (result.success) {
      toast.success(`อัปเดตการตั้งค่าสำเร็จ!`);
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      setSettings(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    const result = await updateSystemSetting('announcement_text', announcementText);
    setIsSavingAnnouncement(false);
    if (result.success) {
      toast.success('บันทึกข้อความประกาศสำเร็จ!');
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleSavePopup = async () => {
    setIsSavingPopup(true);
    const [r1, r2] = await Promise.all([
      updateSystemSetting('popup_image_url', popupImageUrl.trim()),
      updateSystemSetting('popup_link_url', popupLinkUrl.trim()),
    ]);
    setIsSavingPopup(false);
    if (r1.success && r2.success) {
      toast.success('บันทึก Popup สำเร็จ!');
    } else {
      toast.error('เกิดข้อผิดพลาดในการบันทึก Popup');
    }
  };

  const handleClearPopup = async () => {
    if (!confirm('ต้องการลบรูป Popup ออกจากเว็บใช่ไหม?')) return;
    setIsSavingPopup(true);
    await Promise.all([
      updateSystemSetting('popup_image_url', ''),
      updateSystemSetting('popup_link_url', ''),
    ]);
    setPopupImageUrl('');
    setPopupLinkUrl('');
    setIsSavingPopup(false);
    toast.success('ลบ Popup สำเร็จ!');
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export-boss');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }
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
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export-boss-csv');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'boss_evaluations.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('ส่งออกข้อมูล CSV สำเร็จ!');
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Export Boss Evaluations */}
      <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-pink-900 text-lg">รายงานผลประเมินหัวหน้า</h3>
          <p className="text-sm text-pink-700">ส่งออกข้อมูลการประเมินทั้งหมด</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${
              isExporting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-lg'
            }`}
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'กำลังสร้าง...' : 'Export CSV'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${
              isExporting ? 'bg-pink-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 hover:-translate-y-1 hover:shadow-lg'
            }`}
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'กำลังสร้าง...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4">
        {systemFeatures.map((feature) => {
          const isEnabled = settings[feature.key];
          const isSaving = savingKeys[feature.key];
          const isMaintenance = feature.key === 'maintenance_mode_enabled';

          return (
            <div key={feature.key} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors hover:border-slate-300 ${isMaintenance ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <h3 className={`font-semibold text-base md:text-lg ${isMaintenance ? 'text-red-700' : 'text-slate-800'}`}>{feature.label}</h3>
                <p className={`text-xs md:text-sm mt-1 ${isMaintenance ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
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
                <div className={`w-14 h-7 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${isEnabled ? (isMaintenance ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-300'} ${isSaving ? 'opacity-50' : ''}`}></div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Announcement Text */}
      {settings.announcement_enabled && (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-indigo-900 text-lg">ข้อความประกาศบนเว็บไซต์</h3>
            <p className="text-sm text-indigo-700">จะแสดงเป็นแถบด้านบนสุดของทุกหน้าเว็บ</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="เช่น พรุ่งนี้หยุดเรียน 1 วัน..."
              className="flex-1 px-4 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSaveAnnouncement}
              disabled={isSavingAnnouncement}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSavingAnnouncement ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      )}

      {/* Popup Image Settings */}
      <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="bg-violet-100 text-violet-600 p-2 rounded-full">
            <Image size={20} />
          </div>
          <div>
            <h3 className="font-bold text-violet-900 text-lg">รูป Popup เมื่อเข้าเว็บ</h3>
            <p className="text-sm text-violet-600">ใส่ URL รูปภาพที่ต้องการแสดง — ถ้าว่างจะไม่มี Popup</p>
          </div>
        </div>

        {/* Preview */}
        {popupImageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-violet-200 bg-slate-900 max-h-48">
            <img 
              src={popupImageUrl} 
              alt="Preview" 
              className="w-full h-48 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <button
              onClick={handleClearPopup}
              disabled={isSavingPopup}
              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
              title="ลบรูป"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Image URL input */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-violet-800">
            <Image size={14} />
            URL รูปภาพ
          </label>
          <input 
            type="url" 
            value={popupImageUrl}
            onChange={(e) => setPopupImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2.5 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white text-sm"
          />
        </div>

        {/* Link URL input */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-violet-800">
            <Link size={14} />
            ลิ้งค์เมื่อกดรูป <span className="font-normal text-violet-500">(ไม่บังคับ)</span>
          </label>
          <input 
            type="url" 
            value={popupLinkUrl}
            onChange={(e) => setPopupLinkUrl(e.target.value)}
            placeholder="https://example.com หรือเว้นว่างถ้าไม่ต้องการ"
            className="w-full px-4 py-2.5 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white text-sm"
          />
        </div>

        <button
          onClick={handleSavePopup}
          disabled={isSavingPopup}
          className="self-start bg-violet-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:translate-y-0"
        >
          {isSavingPopup ? 'กำลังบันทึก...' : 'บันทึก Popup'}
        </button>
      </div>

    </div>
  );
}
