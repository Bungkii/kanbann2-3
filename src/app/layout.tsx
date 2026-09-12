import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL('https://primjaa.bungkii.app'),
  title: {
    default: "พริมจ๋า ม.2/3 | ระบบกระดานจัดการงานและการบ้านออนไลน์",
    template: "%s | พริมจ๋า ม.2/3"
  },
  description: "ระบบกระดานงาน การบ้าน ตารางเรียน สรุปสอบ และเงินห้อง สำหรับนักเรียนและผู้ปกครองห้อง ม.2/3 (พริมจ๋า / พริมทวงยิก)",
  keywords: [
    "พริมจ๋า",
    "พริมจ๋า ม.2/3",
    "ห้อง 3",
    "ม.2/3",
    "พริมทวงยิก",
    "พริมทวงยิก ม.2/3",
    "กระดานการบ้าน ม.2/3",
    "ระบบการบ้านห้อง ม.2/3",
    "ตารางเรียน ม.2/3",
    "สรุปสอบ ม.2/3",
    "kanbann2-3",
    "primjaa",
    "primjaa.bungkii.app",
    "kanbann.bungkii.app"
  ],
  authors: [{ name: "Bungkii", url: "https://bungkii.app" }],
  creator: "Bungkii",
  publisher: "Primjaa & Kanbann ม.2/3",
  alternates: {
    canonical: 'https://primjaa.bungkii.app',
    languages: {
      'th-TH': 'https://primjaa.bungkii.app',
    },
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://primjaa.bungkii.app",
    title: "พริมจ๋า ม.2/3 | ระบบกระดานจัดการงานและการบ้านออนไลน์",
    description: "ระบบกระดานงาน การบ้าน ตารางเรียน สรุปสอบ และเงินห้อง สำหรับนักเรียนและผู้ปกครองห้อง ม.2/3 (พริมจ๋า / พริมทวงยิก)",
    siteName: "พริมจ๋า ม.2/3",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "โลโก้พริมจ๋า ม.2/3",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "พริมจ๋า ม.2/3 | ระบบกระดานจัดการงานและการบ้านออนไลน์",
    description: "ระบบกระดานงาน การบ้าน ตารางเรียน สรุปสอบ และเงินห้อง สำหรับนักเรียนและผู้ปกครองห้อง ม.2/3",
    images: ["/logo.png"],
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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'พริมจ๋า ม.2/3',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/logo.png',
    apple: '/icons/icon-192.jpg',
  },
};

export function generateViewport(): Viewport {
  return {
    themeColor: '#7C3AED',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    userScalable: false,
    colorScheme: 'light',
  };
}

import MaintenanceScreen from "@/components/MaintenanceScreen";
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
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Apple PWA */}
        <link rel="apple-touch-icon" href="/icons/icon-192.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="พริมจ๋า ม.2/3" />
        {/* MS Tile */}
        <meta name="msapplication-TileColor" content="#7C3AED" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* JSON-LD Structured Data for Google Rich Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "พริมจ๋า ม.2/3",
              "alternateName": ["พริมจ๋า", "พริมทวงยิก ม.2/3", "Kanbann ม.2/3"],
              "url": "https://primjaa.bungkii.app",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "All",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "description": "ระบบจัดการห้องเรียน การบ้าน ตารางเรียน สรุปสอบ และเงินห้อง สำหรับนักเรียนและผู้ปกครองห้อง ม.2/3",
              "author": {
                "@type": "Person",
                "name": "Bungkii",
                "url": "https://bungkii.app"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "THB"
              }
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {maintenanceMode ? (
          <MaintenanceScreen
            title={settings.maintenance_title || "ปิดปรับปรุงระบบชั่วคราว"}
            dateText={settings.maintenance_date || "วันที่ 19 ก.ย. 2567"}
            timeText={settings.maintenance_time || "เวลา 9.00 น. ถึง เวลา 18.00 น."}
            noticeText={settings.maintenance_notice || "ท่านจะไม่สามารถใช้งานแอปพลิเคชันได้ในเวลาดังกล่าว ขออภัยในความไม่สะดวก"}
          />
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
