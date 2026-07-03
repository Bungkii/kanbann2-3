import { getSystemSettings } from "@/app/settings/system/actions";
import EvaluateBossForm from "./EvaluateBossForm";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function EvaluateBossPage() {
  const settings = await getSystemSettings();
  const isEnabled = settings.boss_evaluation_enabled !== false;

  if (!isEnabled) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-lg border border-slate-100 text-center flex flex-col items-center">
          <div className="bg-rose-100 text-rose-500 p-4 rounded-full mb-6">
            <AlertCircle size={48} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">แบบประเมินปิดรับแล้ว</h1>
          <p className="text-slate-500 mb-8">ขณะนี้ระบบประเมินหัวหน้าได้ปิดรับการประเมินแล้ว ขออภัยในความไม่สะดวกครับ</p>
          <Link 
            href="/"
            className="bg-slate-800 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-900 transition-colors"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </main>
    );
  }

  return <EvaluateBossForm />;
}
