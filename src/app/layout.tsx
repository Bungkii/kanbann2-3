import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import ToasterProvider from "@/components/ToasterProvider";
import "./globals.css";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: "--font-ibm-plex-sans-thai",
});

export const metadata: Metadata = {
  title: "พริมทวงยิก ม.2/3",
  description: "ระบบจดงานสำหรับห้อง 2/3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${ibmPlexSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
