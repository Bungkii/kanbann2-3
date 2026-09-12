"use client";

import { useState } from "react";
import { updateSystemSetting } from "./actions";
import toast from "react-hot-toast";
import { Download, Image, Link, X, Plus, GripVertical, ExternalLink, AlertTriangle, Eye, EyeOff, Calendar, Clock, Sparkles } from "lucide-react";
import MaintenanceScreen, { getTodayThaiDateText, formatThaiDate, formatMaintenanceDateRange } from "@/components/MaintenanceScreen";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const systemFeatures = [
  { key: "maintenance_mode_enabled", label: "โหมดปิดปรับปรุงระบบ (Maintenance Mode)", description: "บล็อคการเข้าใช้งานเว็บทั้งหมด (ต้องเข้า Database เพื่อเปิดใหม่)" },
  { key: "add_work_enabled", label: "ระบบจดงาน (Add Work)", description: "เปิด-ปิดหน้าสำหรับเพิ่มงานใหม่" },
  { key: "kanban_enabled", label: "ระบบกระดานงาน (Kanban)", description: "เปิด-ปิดหน้ากระดานทวงงาน" },
  { key: "summaries_enabled", label: "ระบบแจกสรุปสอบ (Summaries)", description: "เปิด-ปิดหน้าโหลดสรุปสอบ" },
  { key: "election_enabled", label: "ระบบผลเลือกตั้ง (Election)", description: "เปิด-ปิดหน้าดูผลเลือกตั้ง" },
  { key: "boss_evaluation_enabled", label: "ระบบประเมินหัวหน้า (Evaluate Boss)", description: "เปิด-ปิดหน้าประเมินหัวหน้าห้อง" },
  { key: "announcement_enabled", label: "ประกาศบนเว็บ (Announcement)", description: "แสดงแถบประกาศด้านบนของเว็บ" },
];

interface PopupImage {
  image_url: string;
  link_url: string;
}

function parsePopupImages(raw: any): PopupImage[] {
  try {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export default function SystemSettingsForm({
  initialSettings,
}: {
  initialSettings: Record<string, any>;
}) {
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    const d: Record<string, boolean> = {};
    systemFeatures.forEach((f) => {
      d[f.key] = initialSettings[f.key] !== false;
    });
    return d;
  });

  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [announcementText, setAnnouncementText] = useState(initialSettings.announcement_text || "");
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Maintenance screen customizations
  const [maintenanceTitle, setMaintenanceTitle] = useState(initialSettings.maintenance_title || "ปิดปรับปรุงระบบชั่วคราว");
  const [maintenanceDate, setMaintenanceDate] = useState(() => initialSettings.maintenance_date || getTodayThaiDateText());
  const [maintenanceStartDatePicker, setMaintenanceStartDatePicker] = useState<string>(() => toIsoDate(new Date()));
  const [maintenanceEndDatePicker, setMaintenanceEndDatePicker] = useState<string>('');
  const [maintenanceTime, setMaintenanceTime] = useState(initialSettings.maintenance_time || "เวลา 20.00 น. ถึง เวลา 00.00 น.");
  const [maintenanceNotice, setMaintenanceNotice] = useState(initialSettings.maintenance_notice || "ท่านจะไม่สามารถใช้งานแอปพลิเคชันได้ในเวลาดังกล่าว ขออภัยในความไม่สะดวก");
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [showMaintenancePreview, setShowMaintenancePreview] = useState(false);

  const handleDateRangeChange = (start: string, end: string) => {
    setMaintenanceStartDatePicker(start);
    setMaintenanceEndDatePicker(end);
    if (!start) {
      setMaintenanceDate(getTodayThaiDateText());
      return;
    }
    const formatted = formatMaintenanceDateRange(start, end || undefined);
    setMaintenanceDate(formatted);
  };

  const handleQuickPreset = (daysOffset: number) => {
    const today = new Date();
    const startStr = toIsoDate(today);
    if (daysOffset === 0) {
      handleDateRangeChange(startStr, '');
    } else {
      const endD = new Date(today);
      endD.setDate(endD.getDate() + daysOffset);
      handleDateRangeChange(startStr, toIsoDate(endD));
    }
  };

  // Popup images (array)
  const [popupImages, setPopupImages] = useState<PopupImage[]>(() => {
    const parsed = parsePopupImages(initialSettings.popup_images);
    // backward compat: migrate old single popup_image_url
    if (parsed.length === 0 && initialSettings.popup_image_url) {
      return [{ image_url: initialSettings.popup_image_url, link_url: initialSettings.popup_link_url || "" }];
    }
    return parsed.length > 0 ? parsed : [{ image_url: "", link_url: "" }];
  });
  const [isSavingPopup, setIsSavingPopup] = useState(false);

  // ---- Feature toggles ----
  const handleToggle = async (key: string) => {
    const newValue = !settings[key];
    if (key === "maintenance_mode_enabled" && newValue) {
      if (!confirm("คำเตือน: หากคุณเปิดโหมดนี้ คุณจะถูกบล็อคออกจากเว็บด้วย และต้องเข้าไปแก้ใน Database เท่านั้น ยืนยันหรือไม่?")) return;
    }
    setSettings((p) => ({ ...p, [key]: newValue }));
    setSavingKeys((p) => ({ ...p, [key]: true }));
    const result = await updateSystemSetting(key, newValue);
    setSavingKeys((p) => ({ ...p, [key]: false }));
    if (result.success) toast.success("อัปเดตการตั้งค่าสำเร็จ!");
    else {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
      setSettings((p) => ({ ...p, [key]: !newValue }));
    }
  };

  // ---- Announcement ----
  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    const result = await updateSystemSetting("announcement_text", announcementText);
    setIsSavingAnnouncement(false);
    if (result.success) toast.success("บันทึกข้อความประกาศสำเร็จ!");
    else toast.error("เกิดข้อผิดพลาดในการบันทึก");
  };

  // ---- Maintenance Settings ----
  const handleSaveMaintenance = async () => {
    setIsSavingMaintenance(true);
    const results = await Promise.all([
      updateSystemSetting("maintenance_title", maintenanceTitle),
      updateSystemSetting("maintenance_date", maintenanceDate),
      updateSystemSetting("maintenance_time", maintenanceTime),
      updateSystemSetting("maintenance_notice", maintenanceNotice),
    ]);
    setIsSavingMaintenance(false);
    const hasError = results.some((r) => !r.success);
    if (!hasError) toast.success("บันทึกข้อมูลหน้าปิดปรับปรุงระบบสำเร็จ!");
    else toast.error("เกิดข้อผิดพลาดในการบันทึกบางรายการ");
  };

  // ---- Popup Images ----
  const updatePopupField = (idx: number, field: keyof PopupImage, value: string) => {
    setPopupImages((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addPopupImage = () => {
    setPopupImages((prev) => [...prev, { image_url: "", link_url: "" }]);
  };

  const removePopupImage = (idx: number) => {
    setPopupImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSavePopup = async () => {
    const clean = popupImages.filter((p) => p.image_url.trim() !== "");
    setIsSavingPopup(true);
    const result = await updateSystemSetting("popup_images", clean);
    setIsSavingPopup(false);
    if (result.success) {
      toast.success(`บันทึก Popup ${clean.length} รูปสำเร็จ!`);
      // sync state to only valid entries (keep empties for UX)
    } else {
      toast.error("เกิดข้อผิดพลาดในการบันทึก Popup");
    }
  };

  // ---- Export ----
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/export-boss");
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "boss_evaluations.pdf";
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success("ส่งออกข้อมูลสำเร็จ!");
    } catch (error: any) { toast.error(`เกิดข้อผิดพลาด: ${error.message}`); }
    finally { setIsExporting(false); }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/export-boss-csv");
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "boss_evaluations.csv";
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success("ส่งออกข้อมูล CSV สำเร็จ!");
    } catch (error: any) { toast.error(`เกิดข้อผิดพลาด: ${error.message}`); }
    finally { setIsExporting(false); }
  };

  return (
    <div className="space-y-6">

      {/* Export */}
      <div className="bg-pink-50 p-6 rounded-2xl border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-pink-900 text-lg">รายงานผลประเมินหัวหน้า</h3>
          <p className="text-sm text-pink-700">ส่งออกข้อมูลการประเมินทั้งหมด</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExportCsv} disabled={isExporting}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${isExporting ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-lg"}`}>
            <Download className="w-5 h-5" />{isExporting ? "กำลังสร้าง..." : "Export CSV"}
          </button>
          <button onClick={handleExport} disabled={isExporting}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${isExporting ? "bg-pink-400 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700 hover:-translate-y-1 hover:shadow-lg"}`}>
            <Download className="w-5 h-5" />{isExporting ? "กำลังสร้าง..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4">
        {systemFeatures.map((feature) => {
          const isEnabled = settings[feature.key];
          const isSaving = savingKeys[feature.key];
          const isMaintenance = feature.key === "maintenance_mode_enabled";
          return (
            <div key={feature.key} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors hover:border-slate-300 ${isMaintenance ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}>
              <div>
                <h3 className={`font-semibold text-base md:text-lg ${isMaintenance ? "text-red-700" : "text-slate-800"}`}>{feature.label}</h3>
                <p className={`text-xs md:text-sm mt-1 ${isMaintenance ? "text-red-500 font-medium" : "text-slate-500"}`}>{feature.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={() => handleToggle(feature.key)} disabled={isSaving} />
                <div className={`w-14 h-7 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${isEnabled ? (isMaintenance ? "bg-red-500" : "bg-emerald-500") : "bg-slate-300"} ${isSaving ? "opacity-50" : ""}`}></div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Announcement */}
      {settings.announcement_enabled && (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-indigo-900 text-lg">ข้อความประกาศบนเว็บไซต์</h3>
            <p className="text-sm text-indigo-700">จะแสดงเป็นแถบด้านบนสุดของทุกหน้าเว็บ</p>
          </div>
          <div className="flex gap-2">
            <input type="text" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="เช่น พรุ่งนี้หยุดเรียน 1 วัน..."
              className="flex-1 px-4 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={handleSaveAnnouncement} disabled={isSavingAnnouncement}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {isSavingAnnouncement ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Maintenance Screen Settings */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col gap-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 text-amber-400 p-2.5 rounded-xl border border-amber-500/30">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">ตั้งค่าหน้าปิดปรับปรุงระบบ (Maintenance Screen)</h3>
              <p className="text-sm text-slate-400">ข้อความและกำหนดเวลาที่จะแสดงเมื่อเปิดโหมด Maintenance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMaintenancePreview(!showMaintenancePreview)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors self-start sm:self-auto"
          >
            {showMaintenancePreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showMaintenancePreview ? "ซ่อนตัวอย่าง" : "ดูตัวอย่างหน้าจริง"}
          </button>
        </div>

        {/* Live Preview Modal / Embed */}
        {showMaintenancePreview && (
          <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>● ● ● ตัวอย่างหน้าเว็บเมื่อปิดปรับปรุง</span>
              <span className="text-amber-400 font-semibold">PREVIEW MODE</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <MaintenanceScreen
                title={maintenanceTitle}
                dateText={maintenanceDate}
                timeText={maintenanceTime}
                noticeText={maintenanceNotice}
              />
            </div>
          </div>
        )}

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              หัวข้อหลัก (Title)
            </label>
            <input
              type="text"
              value={maintenanceTitle}
              onChange={(e) => setMaintenanceTitle(e.target.value)}
              placeholder="ปิดปรับปรุงระบบชั่วคราว"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar size={13} className="text-amber-400" /> วันที่ปรับปรุง (Date)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickPreset(0)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(1)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  วันนี้-พรุ่งนี้
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <span className="block text-[10px] text-slate-400 mb-0.5">วันเริ่มต้น:</span>
                <input
                  type="date"
                  value={maintenanceStartDatePicker}
                  onChange={(e) => handleDateRangeChange(e.target.value, maintenanceEndDatePicker)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <span className="text-slate-500 text-xs self-end pb-2">ถึง</span>
              <div className="flex-1">
                <span className="block text-[10px] text-slate-400 mb-0.5">วันสิ้นสุด (ถ้ามี):</span>
                <input
                  type="date"
                  value={maintenanceEndDatePicker}
                  onChange={(e) => handleDateRangeChange(maintenanceStartDatePicker, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <input
              type="text"
              value={maintenanceDate}
              onChange={(e) => setMaintenanceDate(e.target.value)}
              placeholder="เช่น วันที่ 12 ก.ย. 2568 หรือ วันที่ 12 ก.ย. 2568 ถึง วันที่ 13 ก.ย. 2568"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
            />
            <p className="text-[11px] text-slate-400">
              * ข้อความจะจัดรูปแบบภาษาไทยอัตโนมัติ และสามารถแก้ไขข้อความเองได้
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-400" /> ช่วงเวลาปรับปรุง (Time)
            </label>
            <input
              type="text"
              value={maintenanceTime}
              onChange={(e) => setMaintenanceTime(e.target.value)}
              placeholder="เช่น เวลา 9.00 น. ถึง เวลา 18.00 น."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ข้อความแจ้งเตือนท้ายหน้า (Notice)
            </label>
            <input
              type="text"
              value={maintenanceNotice}
              onChange={(e) => setMaintenanceNotice(e.target.value)}
              placeholder="ท่านจะไม่สามารถใช้งานแอปพลิเคชันได้ในเวลาดังกล่าว ขออภัยในความไม่สะดวก"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>

        {/* Save Maintenance Settings */}
        <button
          type="button"
          onClick={handleSaveMaintenance}
          disabled={isSavingMaintenance}
          className="self-start bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-7 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isSavingMaintenance ? "กำลังบันทึก..." : "บันทึกข้อความปรับปรุงระบบ"}
        </button>
      </div>

      {/* Popup Images (multi) */}
      <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-100 text-violet-600 p-2 rounded-full">
              <Image size={20} />
            </div>
            <div>
              <h3 className="font-bold text-violet-900 text-lg">รูป Popup เมื่อเข้าเว็บ</h3>
              <p className="text-sm text-violet-600">เพิ่มได้หลายรูป — ถ้าว่างทั้งหมดจะดึงจากไฟล์ใน server แทน</p>
            </div>
          </div>
          <span className="bg-violet-200 text-violet-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {popupImages.filter(p => p.image_url).length} รูป
          </span>
        </div>

        {/* Image list */}
        <div className="flex flex-col gap-4">
          {popupImages.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-violet-200 overflow-hidden shadow-sm">
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 border-b border-violet-100">
                <span className="text-sm font-bold text-violet-700 flex items-center gap-2">
                  <GripVertical size={14} className="text-violet-400" />
                  รูปที่ {idx + 1}
                </span>
                {popupImages.length > 1 && (
                  <button onClick={() => removePopupImage(idx)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="p-4 flex flex-col gap-3">
                {/* Preview */}
                {item.image_url && (
                  <div className="rounded-xl overflow-hidden border border-violet-100 bg-slate-900 max-h-40">
                    <img src={item.image_url} alt={`Preview ${idx + 1}`}
                      className="w-full h-40 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}

                {/* Image URL */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 mb-1.5">
                    <Image size={12} /> URL รูปภาพ
                  </label>
                  <input type="url" value={item.image_url}
                    onChange={(e) => updatePopupField(idx, "image_url", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white text-sm" />
                </div>

                {/* Link URL */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 mb-1.5">
                    <ExternalLink size={12} /> ลิ้งค์เมื่อกดรูป <span className="font-normal text-violet-400">(ไม่บังคับ)</span>
                  </label>
                  <input type="url" value={item.link_url}
                    onChange={(e) => updatePopupField(idx, "link_url", e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-xl border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add button */}
        <button onClick={addPopupImage}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-violet-300 text-violet-500 font-semibold hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all text-sm">
          <Plus size={16} /> เพิ่มรูป
        </button>

        {/* Save */}
        <button onClick={handleSavePopup} disabled={isSavingPopup}
          className="self-start bg-violet-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:translate-y-0">
          {isSavingPopup ? "กำลังบันทึก..." : `บันทึก Popup (${popupImages.filter(p => p.image_url).length} รูป)`}
        </button>
      </div>

    </div>
  );
}
