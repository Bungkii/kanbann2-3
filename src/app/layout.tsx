import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import ToasterProvider from "@/components/ToasterProvider";
import Footer from "@/components/Footer";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${ibmPlexSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
        <ToasterProvider />
        <AnnouncementPopup />
        <Analytics />
      </body>
    </html>
  );
}
