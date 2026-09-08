import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'พริมทวงยิก ม.2/3',
    short_name: 'พริมทวงยิก',
    description: 'ระบบจดงาน กระดานงาน ตารางสอน และระบบนักเรียน ม.2/3',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#7C3AED',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity'],
    lang: 'th',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon-192.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'กระดานงาน',
        short_name: 'Kanban',
        description: 'ดูงานทั้งหมดในห้อง',
        url: '/kanban',
        icons: [{ src: '/icons/icon-192.jpg', sizes: '192x192' }],
      },
      {
        name: 'จดงานใหม่',
        short_name: 'จดงาน',
        description: 'เพิ่มงานใหม่',
        url: '/add',
        icons: [{ src: '/icons/icon-192.jpg', sizes: '192x192' }],
      },
      {
        name: 'ตารางสอน',
        short_name: 'ตาราง',
        description: 'ตารางเรียนห้อง ม.2/3',
        url: '/schedule',
        icons: [{ src: '/icons/icon-192.jpg', sizes: '192x192' }],
      },
    ],
    screenshots: [],
  }
}
