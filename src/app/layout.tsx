import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import ToasterProvider from "@/components/ToasterProvider";
import Footer from "@/components/Footer";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import "./globals.css";
import { getSystemSettings } from "@/app/settings/system/actions";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: "--font-ibm-plex-sans-thai",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kanbann.bungkii.vercel.app'), // Use your actual URL here
  title: {
    default: "พริมทวงยิก ม.2/3 | ระบบกระดานจัดการงานออนไลน์",
    template: "%s | พริมทวงยิก ม.2/3"
  },
  description: "ระบบจดงาน จัดการเวรทำความสะอาด และกระดานแจ้งเตือนสำหรับนักเรียนห้อง 2/3 พร้อมระบบส่งข้อความบอทเตือนความจำอัตโนมัติ",
  keywords: ["กระดานงาน", "จดงานนักเรียน", "Kanban board", "ม.2/3", "ระบบเตือนงาน", "บอททวงงาน"],
  authors: [{ name: "Bungkii" }],
  creator: "Bungkii",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://kanbann.bungkii.vercel.app",
    title: "พริมทวงยิก ม.2/3 | ระบบกระดานจัดการงานออนไลน์",
    description: "ระบบจดงาน จัดการเวรทำความสะอาด และกระดานแจ้งเตือนสำหรับนักเรียนห้อง 2/3",
    siteName: "พริมทวงยิก ม.2/3"
  },
  twitter: {
    card: "summary_large_image",
    title: "พริมทวงยิก ม.2/3 | ระบบกระดานจัดการงานออนไลน์",
    description: "ระบบจดงาน จัดการเวรทำความสะอาด และกระดานแจ้งเตือนสำหรับนักเรียนห้อง 2/3"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { Analytics } from "@vercel/analytics/next";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSystemSettings();
  const maintenanceMode = settings.maintenance_mode_enabled === true;
  const announcementEnabled = settings.announcement_enabled === true;
  const announcementText = settings.announcement_text || "";

  return (
    <html lang="th" className={`${ibmPlexSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {maintenanceMode ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
            <div className="text-center max-w-lg bg-slate-800 p-12 rounded-3xl border border-slate-700 shadow-2xl">
               <div className="bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
               </div>
               <h1 className="text-3xl font-bold mb-4 text-white">ปิดปรับปรุงระบบชั่วคราว</h1>
               <p className="text-slate-400 text-base leading-relaxed">
                 ระบบพริมจ๋ากำลังอยู่ระหว่างการปรับปรุง ขออภัยในความไม่สะดวก กรุณากลับมาใช้งานใหม่ในภายหลัง
               </p>
            </div>
          </div>
        ) : (
          <>
            {announcementEnabled && announcementText && (
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 px-4 shadow-md text-sm sm:text-base font-medium flex items-center justify-center gap-2.5 relative z-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-200 shrink-0"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span className="truncate max-w-full text-center">{announcementText}</span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
            <ToasterProvider />
            <AnnouncementPopup />
          </>
        )}
        <Analytics />
      </body>
    </html>
  );
}
